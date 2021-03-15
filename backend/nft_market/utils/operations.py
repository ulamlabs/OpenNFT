import base64
from datetime import datetime
from sqlite3.dbapi2 import IntegrityError

from django.db import transaction
from django.db.models import Q
from nft_market.api.models import Operation, Asset
from nft_market.services import algorand
from nft_market.utils.constants import (
    ASK_PRICE,
    BID_PRICE,
    SET_PRICE,
    BID,
    BUY_NOW,
    OWNER,
    SELL_NOW,
)
from nft_market.utils.transactions import decode_state


class InvalidOperation(Exception):
    pass


class NotFoundError(Exception):
    pass


def is_valid_bid(operation):
    is_valid = True
    has_future_bids = Operation.objects.filter(
        asset=operation.asset,
        sender=operation.sender,
        op_type__in=[Operation.OperationType.BID, Operation.OperationType.BUY_NOW],
        block_number__gt=operation.block_number,
        is_executed=True,
    ).exists()
    if has_future_bids:
        is_valid = False
    has_sold = Operation.objects.filter(
        asset=operation.asset,
        account=operation.sender,
        op_type=Operation.OperationType.SELL_NOW,
        block_number__gt=operation.block_number,
        is_executed=True,
    ).exists()
    if has_sold:
        is_valid = False
    return is_valid


def handle_operation(operation, tx):
    if operation.op_type == Operation.OperationType.ASK:
        validate_and_save_ask_op(tx, operation)
    elif operation.op_type == Operation.OperationType.BID:
        validate_and_save_bid_op(tx, operation)
    elif operation.op_type == Operation.OperationType.BUY_NOW:
        validate_and_save_buy_now_op(tx, operation)
    elif operation.op_type == Operation.OperationType.SELL_NOW:
        validate_and_save_sell_now_op(tx, operation)


def validate_and_save_ask_op(tx, operation):
    validate_ask_op(tx)

    global_state_delta = decode_state(tx["global-state-delta"])
    ask_price = global_state_delta[ASK_PRICE]

    save_ask_op(ask_price, operation, tx)


def validate_and_save_bid_op(tx, operation):
    validate_bid_op(tx)

    local_state_delta = tx["local-state-delta"]
    local_state_delta = next(
        filter(
            lambda x: x["address"] == tx["sender"],
            local_state_delta,
        )
    )
    local_state_delta = decode_state(local_state_delta["delta"])
    bid_price = local_state_delta[BID_PRICE]

    save_bid_op(bid_price, operation, tx)


def validate_and_save_buy_now_op(tx, operation):
    validate_buy_now_op(tx)
    save_buy_now_op(operation, tx)


def validate_and_save_sell_now_op(tx, operation):
    validate_sell_now_op(tx)
    save_sell_now_op(operation, tx)


def validate_ask_op(tx):
    if "application-transaction" not in tx:
        raise InvalidOperation()
    app_tx = tx["application-transaction"]
    app_args = app_tx["application-args"]
    correct_arg = base64.b64encode(SET_PRICE.encode("utf-8")).decode("utf-8")
    if not app_args or app_args[0] != correct_arg:
        raise InvalidOperation()


@transaction.atomic()
def save_ask_op(ask_price, operation, tx):
    operation.op_type = Operation.OperationType.ASK
    operation.value = ask_price
    operation = update_op_tx_data(operation, tx)

    is_valid = not Operation.objects.filter(
        asset=operation.asset,
        op_type__in=[
            Operation.OperationType.BUY_NOW,
            Operation.OperationType.ASK,
            Operation.OperationType.SELL_NOW,
        ],
        block_number__gt=tx["confirmed-round"],
        is_executed=True,
    ).exists()
    operation.is_valid = is_valid

    save_operation(operation)
    invalidate_prev_ops(
        asset=operation.asset,
        confirmed_round=tx["confirmed-round"],
        op_type=Operation.OperationType.ASK,
        sender=tx["sender"],
    )


def validate_bid_op(tx):
    if "application-transaction" not in tx:
        raise InvalidOperation()
    app_tx = tx["application-transaction"]
    app_args = app_tx["application-args"]
    correct_arg = base64.b64encode(BID.encode("utf-8")).decode("utf-8")
    if not app_args or app_args[0] != correct_arg:
        raise InvalidOperation()


@transaction.atomic()
def save_bid_op(bid_price, operation, tx):
    operation.op_type = Operation.OperationType.BID
    operation.value = bid_price
    update_op_tx_data(operation, tx)
    # It's more important to invalidate bids than other operations
    operation.is_valid = is_valid_bid(operation)
    save_operation(operation)
    invalidate_prev_ops(
        asset=operation.asset,
        confirmed_round=tx["confirmed-round"],
        op_type=Operation.OperationType.BID,
        sender=tx["sender"],
    )


def validate_buy_now_op(tx):
    if "application-transaction" not in tx:
        raise InvalidOperation()
    app_tx = tx["application-transaction"]
    app_args = app_tx["application-args"]
    correct_arg = base64.b64encode(BUY_NOW.encode("utf-8")).decode("utf-8")
    if not app_args or app_args[0] != correct_arg:
        raise InvalidOperation()
    global_state_delta = decode_state(tx["global-state-delta"])
    ask_price = global_state_delta[ASK_PRICE]
    owner = global_state_delta[OWNER]
    if ask_price != 0:
        raise InvalidOperation()
    if owner != b"\x00" * 32:
        raise InvalidOperation()


@transaction.atomic()
def save_buy_now_op(operation, tx):
    previous_ask_op = Operation.objects.filter(
        Q(block_number__lt=tx["confirmed-round"]) | Q(block_number=None),
        op_type=Operation.OperationType.ASK,
        is_valid=True,
        is_executed=True,
        asset=operation.asset,
    ).last()
    operation.op_type = Operation.OperationType.BUY_NOW
    operation.value = previous_ask_op.value if previous_ask_op else 0
    operation = update_op_tx_data(operation, tx)
    save_operation(operation)
    invalidate_prev_ops(
        asset=operation.asset,
        confirmed_round=tx["confirmed-round"],
        op_type=Operation.OperationType.BID,
        sender=tx["sender"],
    )
    invalidate_prev_ops(
        asset=operation.asset,
        op_type=Operation.OperationType.ASK,
        confirmed_round=tx["confirmed-round"],
    )


def validate_sell_now_op(tx):
    if "application-transaction" not in tx:
        raise InvalidOperation()
    app_tx = tx["application-transaction"]
    app_args = app_tx["application-args"]
    correct_arg = base64.b64encode(SELL_NOW.encode("utf-8")).decode("utf-8")
    if not app_args or app_args[0] != correct_arg:
        raise InvalidOperation()


@transaction.atomic()
def save_sell_now_op(operation, tx):
    app_tx = tx["application-transaction"]
    buyers_bid_op = Operation.objects.filter(
        Q(block_number__lt=tx["confirmed-round"]) | Q(block_number=None),
        op_type=Operation.OperationType.BID,
        sender=app_tx["accounts"][0],
        is_valid=True,
        is_executed=True,
        asset=operation.asset,
    ).last()
    operation.op_type = Operation.OperationType.SELL_NOW
    operation.value = buyers_bid_op.value if buyers_bid_op else 0
    operation.account = app_tx["accounts"][0]
    operation = update_op_tx_data(operation, tx)
    save_operation(operation)
    invalidate_prev_ops(
        asset=operation.asset,
        sender=tx["sender"],
        confirmed_round=tx["confirmed-round"],
        op_type=Operation.OperationType.ASK,
    )
    invalidate_prev_ops(
        asset=operation.asset,
        sender=app_tx["accounts"][0],
        confirmed_round=tx["confirmed-round"],
        op_type=Operation.OperationType.BID,
    )


def invalidate_prev_ops(asset, confirmed_round, op_type, sender=None):
    ops = Operation.objects.filter(
        Q(block_number__lt=confirmed_round) | Q(block_number=None),
        sender=sender,
        is_valid=True,
        is_executed=True,
        asset=asset,
        op_type=op_type,
    )
    if sender:
        ops.filter(sender=sender)
    ops.update(is_valid=False)


def save_operation(operation):
    try:
        operation.save()
    except IntegrityError as exc:
        if "unique constraint" in exc.message:
            handle_duplicate(operation)
        else:
            raise exc


def update_op_tx_data(operation, tx):
    operation.tx_id = tx["id"]
    operation.sender = tx["sender"]
    operation.is_pending = False
    operation.is_valid = True
    operation.is_executed = True
    operation.block_number = tx["confirmed-round"]
    operation.block_time = datetime.fromtimestamp(tx["round-time"])
    return operation


def handle_duplicate(operation):
    other_operation = Operation.objects.filter(tx_id=operation.tx_id).first()
    if not other_operation:
        operation.save()
        return
    if not other_operation.is_pending and not other_operation.is_valid:
        other_operation.delete()
        operation.save()
    elif hasattr("operation", "indexer") and operation.indexer:
        operation.delete()
    else:
        other_operation.delete()
        operation.save()


def invalidate_operation(operation):
    operation.blob = None
    operation.is_valid = False
    operation.is_pending = False
    operation.is_executed = False
    operation.save()


def validate_and_save_op(operation_pk, tx_id):
    operation = Operation.objects.get(pk=operation_pk, is_pending=True)
    found_txs = algorand.indexer.search_transactions(
        txid=tx_id,
        limit=1,
    )
    length = len(found_txs["transactions"])
    if length < 1:
        raise NotFoundError()
    tx = found_txs["transactions"][0]
    if "application-transaction" not in tx:
        raise InvalidOperation()
    app_tx = tx["application-transaction"]
    asset = Asset.objects.filter(application_id=app_tx["application-id"]).first()
    operation.asset = asset
    operation.save()
    if not asset:
        raise NotFoundError()
    handle_operation(operation, tx)
