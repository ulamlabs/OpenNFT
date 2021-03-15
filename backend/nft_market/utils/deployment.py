import base64

from algosdk import encoding
from nft_market.utils.constants import CONFIGURE, NFT_ID, CREATOR
from nft_market.utils.transactions import decode_state
from rest_framework import serializers

from nft_market.services import algorand
from nft_market.utils.authorization import is_authorized


class AppConfiguration:
    @staticmethod
    def find_and_validate(app_id, tx_id):
        found_txs = algorand.indexer.search_transactions(
            application_id=app_id,
            txid=tx_id,
        )
        length = len(found_txs["transactions"])
        if length < 1:
            raise serializers.ValidationError(
                {"message": "Transaction not found", "retry": True},
            )
        tx = found_txs["transactions"][length - 1]
        if "application-transaction" not in tx:
            raise serializers.ValidationError({"message": "Invalid transaction type"})
        app_tx = tx["application-transaction"]
        correct_args = [base64.b64encode(CONFIGURE.encode("utf-8")).decode("utf-8")]
        if app_tx["application-args"] != correct_args:
            raise serializers.ValidationError({"message": "Invalid transaction"})
        if not is_authorized(tx["sender"]):
            raise serializers.ValidationError(
                {"message": "Unauthorized"},
            )
        return app_tx


class AssetCreation:
    @staticmethod
    def find_and_validate(asset_id):
        found_txs = algorand.indexer.search_asset_transactions(
            asset_id=asset_id,
            txn_type="acfg",
        )
        length = len(found_txs["transactions"])
        if length < 1:
            raise serializers.ValidationError(
                {"message": "Transaction not found", "retry": True},
            )
        tx = found_txs["transactions"][length - 1]
        if "asset-config-transaction" not in tx:
            raise serializers.ValidationError(
                {"message": "Invalid transaction type"},
            )
        asset_config = tx["asset-config-transaction"]["params"]
        if not is_authorized(asset_config["creator"]):
            raise serializers.ValidationError(
                {"message": "Unauthorized"},
            )
        return asset_config


class ContractDeployment:
    @classmethod
    def find_and_validate(cls, tx_id, app_id):
        payment_tx = cls._find_and_validate_payment_tx(tx_id=tx_id)
        app_tx, nft_id, creator_addr = cls._find_and_validate_app_creation_tx(
            app_id=app_id
        )
        if payment_tx["sender"] != creator_addr:
            raise serializers.ValidationError({"message": "Unauthorized"})
        return nft_id

    @staticmethod
    def _find_and_validate_payment_tx(tx_id):
        found_payment_txs = algorand.indexer.search_transactions(txid=tx_id)
        length = len(found_payment_txs["transactions"])
        if length < 1:
            raise serializers.ValidationError(
                {"message": "Transaction not found", "retry": True},
            )
        tx = found_payment_txs["transactions"][length - 1]
        if "payment-transaction" not in tx:
            raise serializers.ValidationError({"message": "Invalid transaction type"})

        return tx

    @staticmethod
    def _find_and_validate_app_creation_tx(app_id):
        found_app_txs = algorand.indexer.search_transactions(application_id=app_id)
        length = len(found_app_txs["transactions"])
        if length < 1:
            raise serializers.ValidationError(
                {"message": "Transaction not found", "retry": True},
            )
        tx = found_app_txs["transactions"][length - 1]
        if "application-transaction" not in tx:
            raise serializers.ValidationError({"message": "Invalid transaction type"})
        app_tx = tx["application-transaction"]
        global_state_delta = decode_state(tx["global-state-delta"])
        nft_id = global_state_delta[NFT_ID]
        creator_addr = encoding.encode_address(global_state_delta[CREATOR])

        if not is_authorized(creator_addr):
            raise serializers.ValidationError({"message": "Unauthorized"})
        return app_tx, nft_id, creator_addr
