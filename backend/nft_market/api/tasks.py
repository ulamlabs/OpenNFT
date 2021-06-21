import base64
from datetime import timedelta

from celery import Task, Celery, group, chord
from celery.utils.log import get_task_logger
from django.db import transaction
from django.utils import timezone

from nft_market.api.models import Asset, Operation
from nft_market.services import algorand
from nft_market.utils.operations import (
    is_valid_bid,
    handle_operation,
    invalidate_operation,
    validate_and_save_op,
)
from nft_market.utils.constants import (
    SET_PRICE,
    BID,
    BUY_NOW,
    SELL_NOW,
)
from nft_market.utils.operations import InvalidOperation
from nft_market.utils.transactions import is_non_zero_asset_tx
from nft_market.celery import app

app = Celery("api")
logger = get_task_logger(__name__)


@app.task()
def send_operation_tx(operation_pk):
    operation = Operation.objects.get(pk=operation_pk, is_pending=True)
    try:
        tx_id = algorand.algod.send_raw_transaction(base64.b64encode(operation.blob))
        operation.tx_id = tx_id
        operation.save()
        handle_op.apply_async(countdown=5, args=[operation_pk, tx_id])
    except Exception as exc:
        logger.exception(exc)
        invalidate_operation(operation)


class HandleOp(Task):
    autoretry_for = (Exception,)
    retry_kwargs = {"max_retries": 6}
    retry_backoff = True
    retry_jitter = True

    def __init__(self):
        pass

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        operation = Operation.objects.get(pk=args[0], is_pending=True)
        invalidate_operation(operation)


@app.task(base=HandleOp)
def handle_op(operation_pk, tx_id):
    return validate_and_save_op(operation_pk, tx_id)


@app.task()
def index_all(asset_pk):
    if not should_index_now(asset_pk):
        return
    # Extra failsafe if something goes wrong in case of bids
    validate_highest_bid.delay(asset_pk)
    index_operations.delay(asset_pk)
    index_holder.apply_async(countdown=5, args=[asset_pk])


@app.task()
def validate_highest_bid(asset_pk):
    highest_bid = (
        Operation.objects.filter(
            op_type=Operation.OperationType.BID,
            asset__pk=asset_pk,
            is_valid=True,
            is_executed=True,
            value__gt=0,
        )
        .order_by("-value")
        .first()
    )
    if not highest_bid:
        return
    is_valid = is_valid_bid(highest_bid)
    if not is_valid:
        highest_bid.is_valid = False
        highest_bid.save(update_fields=["is_valid"])
        validate_highest_bid.delay(asset_pk)


@app.task()
def index_operations(asset_pk, update_timestamp=False, params=None):
    if update_timestamp:
        should_index_now(asset_pk)
    asset = Asset.objects.get(pk=asset_pk)
    app_id = asset.application_id
    last_round = asset.last_round
    if not params:
        params = dict(
            min_round=last_round,
            application_id=app_id,
            limit=5,
            txn_type="appl",
        )
    response = algorand.explorer.search_transactions(**params)
    txs = response["transactions"]
    if len(txs) == 0:
        return

    last_tx = txs[-1]
    last_round = last_tx["confirmed-round"]

    chord(
        group(index_operation.s(asset.pk, tx) for tx in txs),
    )(finish_indexing_operations.s(asset_pk, last_round, response.get("next-token")))


@app.task()
def finish_indexing_operations(results, asset_pk, last_round, next_token=None):
    logger.info(f"Finished indexing {len(results)} operations")
    asset = Asset.objects.get(pk=asset_pk)
    asset.last_round = last_round
    asset.save(update_fields=["last_round"])
    if next_token:
        app_id = asset.application_id
        params = dict(
            min_round=last_round,
            application_id=app_id,
            limit=5,
            txn_type="appl",
        )
        params["next_page"] = next_token
        index_operations.apply_async(
            countdown=10,
            args=[asset.pk],
            kwargs={"update_timestamp": True, "params": params},
        )


@app.task()
def index_operation(asset_pk, tx):
    asset = Asset.objects.get(pk=asset_pk)
    if "application-transaction" not in tx:
        logger.info(f"Unknown transaction: {tx['id']}, asset_pk: {asset_pk}")
        return
    app_tx = tx["application-transaction"]
    app_args = app_tx["application-args"]
    if len(app_args) == 0:
        logger.info(f"Transaction without arguments: {tx['id']}, asset_pk: {asset_pk}")
        return

    first_arg = app_args[0]
    if first_arg == base64.b64encode(SET_PRICE.encode("utf-8")).decode("utf-8"):
        operation_type = Operation.OperationType.ASK
    elif first_arg == base64.b64encode(BID.encode("utf-8")).decode("utf-8"):
        operation_type = Operation.OperationType.BID
    elif first_arg == base64.b64encode(BUY_NOW.encode("utf-8")).decode("utf-8"):
        operation_type = Operation.OperationType.BUY_NOW
    elif first_arg == base64.b64encode(SELL_NOW.encode("utf-8")).decode("utf-8"):
        operation_type = Operation.OperationType.SELL_NOW
    else:
        logger.info(f"Unrecognized transaction argument: {first_arg}")
        return

    existing_operation = Operation.objects.filter(
        asset=asset,
        tx_id=tx["id"],
    ).first()
    if existing_operation:
        if existing_operation.is_pending or existing_operation.is_valid:
            logger.info(
                f"Already indexed transaction: {tx['id']}, asset_pk: {asset_pk}, op_pk: {existing_operation.pk}"
            )
            return
        operation = existing_operation
    else:
        operation = Operation.objects.create(
            asset=asset,
            tx_id=tx["id"],
            is_pending=True,
            is_valid=True,
            sender=tx["sender"],
            block_number=tx["confirmed-round"],
            op_type=operation_type,
        )
    try:
        operation._indexer = True
        handle_operation(operation, tx)
        logger.info(f"Saved transaction: {tx['id']}, op_pk: {operation.pk}")
    except InvalidOperation:
        # If it's an invalid operation exception then we can safely move on.
        # Otherwise, let's reraise the exception
        invalidate_operation(operation)
    except Exception as exc:
        invalidate_operation(operation)
        raise exc


@app.task()
def index_holder(asset_pk, prev_tx=None, params=None):
    if params:
        should_index_now(asset_pk)
    asset = Asset.objects.get(pk=asset_pk)
    if not params:
        last_operation = Operation.objects.filter(
            op_type__in=[
                Operation.OperationType.SELL_NOW,
                Operation.OperationType.SELL_NOW,
            ],
            asset=asset,
            is_valid=True,
            is_executed=True,
        ).first()

        min_round = 0

        if last_operation and last_operation.block_number:
            min_round = last_operation.block_number
        params = dict(
            min_round=min_round,
            asset_id=asset.asset_id,
            limit=5,
            txn_type="axfer",
            min_amount=0,
        )
    response = algorand.explorer.search_transactions(**params)
    txs = response["transactions"]

    txs = list(filter(is_non_zero_asset_tx, txs))
    last_non_zero_tx = prev_tx
    if len(txs):
        last_non_zero_tx = txs[-1]

    if "next-token" in response:
        params["next_page"] = response["next-token"]
        index_holder.apply_async(
            countdown=10,
            args=[asset.pk],
            kwargs={
                "params": params,
                "prev_tx": last_non_zero_tx,
            },
        )
    elif last_non_zero_tx:
        asset_tx = last_non_zero_tx["asset-transfer-transaction"]
        receiver = asset_tx["receiver"]
        asset.holding_address = receiver
        asset.save(update_fields=["holding_address"])


def should_index_now(asset_pk):
    with transaction.atomic():
        asset = Asset.objects.select_for_update().get(pk=asset_pk)

        last_check = asset.last_check

        now = timezone.now()
        if last_check:
            time_diff = now - last_check
            if time_diff < timedelta(minutes=5):
                return False

        asset.last_check = timezone.now()
        asset.save(update_fields=["last_check"])
    return True
