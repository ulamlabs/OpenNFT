from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient
from django.conf import settings

headers = {"X-API-Key": settings.PURESTAKE_API_KEY}
algod = AlgodClient(settings.PURESTAKE_API_KEY, settings.PURESTAKE_ALGOD_URL, headers)
indexer = IndexerClient(
    settings.PURESTAKE_API_KEY, settings.PURESTAKE_INDEXER_URL, headers
)
