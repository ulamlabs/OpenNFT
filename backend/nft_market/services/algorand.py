import base64

import requests
from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient
from django.conf import settings

PURESTAKE_ALGOD_URL = (
    "https://testnet-algorand.api.purestake.io/ps2"
    if settings.USE_TESTNET
    else "https://mainnet-algorand.api.purestake.io/ps2"
)
PURESTAKE_INDEXER_URL = (
    "https://testnet-algorand.api.purestake.io/idx2"
    if settings.USE_TESTNET
    else "https://testnet-algorand.api.purestake.io/idx2"
)
# We're using AlgoExplorer to look for transactions because it is more reliable than the official Algorand's indexer
TXS_URL = (
    "https://testnet.algoexplorerapi.io/idx2/v2/transactions"
    if settings.USE_TESTNET
    else "https://algoexplorerapi.io/idx2/v2/transactions"
)

headers = {"X-API-Key": settings.PURESTAKE_API_KEY}
algod = AlgodClient(settings.PURESTAKE_API_KEY, PURESTAKE_ALGOD_URL, headers)
indexer = IndexerClient(settings.PURESTAKE_API_KEY, PURESTAKE_INDEXER_URL, headers)


class Explorer:
    def search_transactions(
        self,
        limit=None,
        next_page=None,
        note_prefix=None,
        txn_type=None,
        sig_type=None,
        txid=None,
        min_round=None,
        max_round=None,
        asset_id=None,
        start_time=None,
        end_time=None,
        min_amount=None,
        max_amount=None,
        address=None,
        address_role=None,
        exclude_close_to=False,
        application_id=None,
        rekey_to=False,
    ):
        query = dict()
        if limit:
            query["limit"] = limit
        if next_page:
            query["next"] = next_page
        if note_prefix:
            query["note-prefix"] = base64.b64encode(note_prefix).decode()
        if txn_type:
            query["tx-type"] = txn_type
        if sig_type:
            query["sig-type"] = sig_type
        if txid:
            query["txid"] = txid
        if min_round:
            query["min-round"] = min_round
        if max_round:
            query["max-round"] = max_round
        if asset_id:
            query["asset-id"] = asset_id
        if end_time:
            query["before-time"] = end_time
        if start_time:
            query["after-time"] = start_time
        if min_amount:
            query["currency-greater-than"] = min_amount
        if max_amount:
            query["currency-less-than"] = max_amount
        if address:
            query["address"] = address
        if address_role:
            query["address-role"] = address_role
        if exclude_close_to:
            query["exclude-close-to"] = "true"
        if application_id:
            query["application-id"] = application_id
        if rekey_to:
            query["rekey-to"] = "true"
        r = requests.get(
            TXS_URL,
            params=query,
            headers={
                "content-type": "application/json",
            },
        )
        return r.json()


explorer = Explorer()
