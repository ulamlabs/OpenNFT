from pyteal import *

from nft_market.contracts.assets.clear import clear
from nft_market.contracts.assets.escrow import escrow
from nft_market.contracts.assets.proxy import proxy
from nft_market.contracts.assets.manager import ManagerContract


def get_clear_teal():
    return compileTeal(clear(), Mode.Application)


def get_escrow_teal(app_id: int, usdc_id: int, nft_id: int):
    return compileTeal(
        escrow(
            app_id,
            usdc_id,
            nft_id,
        ),
        Mode.Signature,
    )


def get_proxy_teal(proxy_id):
    return compileTeal(proxy(proxy_id), Mode.Signature)


def get_manager_teal():
    return compileTeal(ManagerContract().get_contract(), Mode.Application)
