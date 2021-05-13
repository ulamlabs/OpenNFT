import sys
from enum import Enum

from pyteal import *

if __name__ == "__main__":
    from helpers.state import GlobalState, LocalState
    from helpers.parse import parse_args
else:
    from .helpers.state import GlobalState, LocalState
    from .helpers.parse import parse_args


class ManagerContract:
    def __init__(self):
        self.usdc_id = GlobalState("U")
        self.nft_id = GlobalState("N")
        self.escrow_address = GlobalState("E")
        self.ask_price = GlobalState("A")
        self.bids_amount = GlobalState("B")
        self.owner_address = GlobalState("O")
        self.creator_address = GlobalState("C")
        self.bid_price = LocalState("B")

    def on_register(self):
        return Seq(
            [
                # Set default values for user
                self.bid_price.put(Int(0)),
                Return(Int(1)),
            ]
        )

    def on_bid(self):
        is_valid_tx = ScratchSlot()
        prev_bid = ScratchSlot()
        return Seq(
            [
                prev_bid.store(self.bid_price.get()),
                # Increase bid_price
                If(
                    Global.group_size() == Int(2),
                    Seq(
                        [
                            Assert(
                                And(
                                    Gtxn[1].asset_receiver()
                                    == self.escrow_address.get(),
                                    Gtxn[1].sender() == Gtxn[0].sender(),
                                    Gtxn[1].type_enum() == TxnType.AssetTransfer,
                                    Gtxn[1].xfer_asset() == self.usdc_id.get(),
                                )
                            ),
                            self.bid_price.put(
                                self.bid_price.get() + Gtxn[1].asset_amount()
                            ),
                            is_valid_tx.store(Int(1)),
                        ]
                    ),
                ),
                # Decrease bid_price
                If(
                    Global.group_size() == Int(3),
                    Seq(
                        [
                            Assert(
                                And(
                                    Gtxn[2].sender() == self.escrow_address.get(),
                                    # Gtxn[2].asset_receiver() == Gtxn[0].sender(),
                                    # Gtxn[2].type_enum() == TxnType.AssetTransfer,
                                    # Gtxn[2].xfer_asset() == Int(usdc_id),
                                    # Cover fee
                                    Gtxn[1].receiver() == self.escrow_address.get(),
                                    # Gtxn[1].type_enum() == TxnType.Payment,
                                    # Gtxn[1].sender() == Gtxn[0].sender(),
                                    # Gtxn[1].amount() >= Gtxn[1].fee(),
                                    Gtxn[2].asset_amount() != Int(0),
                                )
                            ),
                            self.bid_price.put(
                                self.bid_price.get() - Gtxn[2].asset_amount(),
                            ),
                            is_valid_tx.store(Int(1)),
                        ]
                    ),
                ),
                Assert(
                    is_valid_tx.load(TealType.uint64) == Int(1),
                ),
                If(
                    And(
                        self.bid_price.get() != Int(0),
                        prev_bid.load(TealType.uint64) == Int(0),
                    ),
                    Seq([self.bids_amount.put(self.bids_amount.get() + Int(1))]),
                ),
                If(
                    And(
                        self.bid_price.get() == Int(0),
                        prev_bid.load(TealType.uint64) != Int(0),
                    ),
                    Seq([self.bids_amount.put(self.bids_amount.get() - Int(1))]),
                ),
                Return(Int(1)),
            ]
        )

    def on_set_price(self):
        return Seq(
            [
                # Deposit NFT on first call of set_price
                If(
                    Global.group_size() == Int(2),
                    Seq(
                        [
                            Assert(
                                And(
                                    self.owner_address.get() == Global.zero_address(),
                                    self.ask_price.get() == Int(0),
                                    Gtxn[1].asset_receiver()
                                    == self.escrow_address.get(),
                                    Gtxn[1].type_enum() == TxnType.AssetTransfer,
                                    Gtxn[1].xfer_asset() == self.nft_id.get(),
                                    Gtxn[1].asset_amount() == Int(1),
                                    Gtxn[1].sender() == Gtxn[0].sender(),
                                )
                            ),
                            self.owner_address.put(Txn.sender()),
                        ]
                    ),
                ),
                Assert(
                    And(
                        Btoi(Txn.application_args[1]) != self.ask_price.get(),
                        self.owner_address.get() == Txn.sender(),
                    )
                ),
                self.ask_price.put(Btoi(Txn.application_args[1])),
                If(
                    Global.group_size() == Int(3),
                    Seq(
                        [
                            Assert(Gtxn[2].sender() == self.escrow_address.get()),
                            self.owner_address.put(Global.zero_address()),
                            Return(Int(1)),
                        ]
                    ),
                ),
                Assert(self.ask_price.get() != Int(0)),
                Return(Int(1)),
            ]
        )

    def on_buy_now(self):
        return Seq(
            [
                # Ensure that ask_price and owner_address are not cleared
                Assert(
                    And(
                        self.ask_price.get() != Int(0),
                        self.owner_address.get() != Global.zero_address(),
                    )
                ),
                # Reset bid offer
                If(
                    self.bid_price.get() != Int(0),
                    Seq([self.bids_amount.put(self.bids_amount.get() - Int(1))]),
                ),
                # Increase bid_price
                If(
                    Gtxn[2].asset_receiver() == self.escrow_address.get(),
                    # Gtxn[2].type_enum() == TxnType.AssetTransfer,
                    # Gtxn[2].xfer_asset() == Int(usdc_id),
                    # Gtxn[2].sender() == Gtxn[0].sender(),
                    Seq(
                        [
                            self.bid_price.put(
                                self.bid_price.get() + Gtxn[2].asset_amount()
                            ),
                        ]
                    ),
                ),
                # Decrease bid_price
                If(
                    Gtxn[2].sender() == self.escrow_address.get(),
                    # Gtxn[2].type_enum() == TxnType.AssetTransfer,
                    # Gtxn[2].xfer_asset() == Int(usdc_id),
                    # Gtxn[2].asset_receiver() == Gtxn[0].sender(),
                    Seq(
                        [
                            self.bid_price.put(
                                self.bid_price.get() - Gtxn[2].asset_amount()
                            ),
                        ]
                    ),
                ),
                Assert(
                    And(
                        self.bid_price.get() == self.ask_price.get(),
                        # Cover fee
                        Gtxn[1].receiver() == self.escrow_address.get(),
                        # Gtxn[1].type_enum() == TxnType.Payment,
                        # Gtxn[1].sender() == Gtxn[0].sender(),
                        # Transfer NFT to a new owner
                        Gtxn[3].sender() == self.escrow_address.get(),
                        # Gtxn[3].type_enum() == TxnType.AssetTransfer,
                        # Gtxn[3].xfer_asset() == Int(nft_id),
                        # Gtxn[3].asset_receiver() == Gtxn[0].sender(),
                        # Gtxn[3].amount() == Int(1),
                        # Transfer USDC to the former owner
                        Gtxn[4].asset_receiver() == self.owner_address.get(),
                        Gtxn[4].sender() == self.escrow_address.get(),
                        Gtxn[4].asset_amount() == self.ask_price.get(),
                        # Gtxn[4].type_enum() == TxnType.AssetTransfer,
                        # Gtxn[4].xfer_asset() == Int(usdc_id),
                    )
                ),
                # Reset ask offer
                self.ask_price.put(Int(0)),
                self.owner_address.put(Global.zero_address()),
                self.bid_price.put(Int(0)),
                Return(Int(1)),
            ]
        )

    def on_sell_now(self):
        return Seq(
            [
                Assert(
                    And(
                        # Make sure there's a bid in buyer's account
                        App.localGet(Int(1), Bytes("B")) != Int(0),
                        # Transfer USDC to the seller
                        Gtxn[2].asset_amount() == App.localGet(Int(1), Bytes("B")),
                        Gtxn[2].sender() == self.escrow_address.get(),
                        # Gtxn[2].type_enum() == TxnType.AssetTransfer,
                        # Gtxn[2].xfer_asset() == Int(usdc_id),
                        # Gtxn[2].receiver() == Gtxn[0].sender(),
                        # Cover fee
                        Gtxn[1].receiver() == self.escrow_address.get(),
                        # Gtxn[1].type_enum() == TxnType.Payment,
                        # Gtxn[1].sender() == Gtxn[0].sender(),
                    )
                ),
                # Reset the bidder's offer
                App.localPut(Int(1), Bytes("B"), Int(0)),
                self.bids_amount.put(self.bids_amount.get() - Int(1)),
                # Transfer NFT to a new owner
                Assert(
                    Gtxn[3].asset_receiver() == Txn.accounts[1],
                    # Gtxn[3].type_enum() == TxnType.AssetTransfer,
                    # Gtxn[3].xfer_asset() == Int(nft_id),
                    # Gtxn[3].asset_amount() == Int(1),
                ),
                If(
                    self.owner_address.get() == Global.zero_address(),
                    Seq(
                        [
                            Assert(
                                Gtxn[3].sender() == Txn.sender(),
                            ),
                            Return(Int(1)),
                        ]
                    ),
                ),
                If(
                    self.owner_address.get() == Txn.sender(),
                    Seq(
                        [
                            Assert(Gtxn[3].sender() == self.escrow_address.get()),
                            # Reset ask offer
                            self.ask_price.put(Int(0)),
                            self.owner_address.put(Global.zero_address()),
                            Return(Int(1)),
                        ]
                    ),
                ),
                Return(Int(0)),
            ]
        )

    def on_create(self):
        return Seq(
            [
                self.usdc_id.put(Btoi(Txn.application_args[0])),
                self.nft_id.put(Btoi(Txn.application_args[1])),
                self.owner_address.put(Global.zero_address()),
                self.creator_address.put(Txn.accounts[1]),
                self.escrow_address.put(Global.zero_address()),
                self.ask_price.put(Int(0)),
                self.bids_amount.put(Int(0)),
                Return(Int(1)),
            ]
        )

    def on_closeout(self):
        return Seq(
            [
                Assert(self.bid_price.get() == Int(0)),
                Return(Int(1)),
            ]
        )

    def on_setup_escrow(self):
        return Seq(
            [
                Assert(
                    self.escrow_address.get() == Global.zero_address(),
                ),
                Return(Int(1)),
            ]
        )

    def on_configure(self):
        return Seq(
            [
                # Update escrow address after creating it
                Assert(
                    And(
                        Txn.sender() == self.creator_address.get(),
                        self.escrow_address.get() == Global.zero_address(),
                    )
                ),
                self.escrow_address.put(Txn.accounts[1]),
                Return(Int(1)),
            ]
        )

    def get_contract(self):
        return Seq(
            [
                If(Txn.application_id() == Int(0), self.on_create()),
                Assert(
                    And(
                        Txn.close_remainder_to() == Global.zero_address(),
                        Txn.rekey_to() == Global.zero_address(),
                    )
                ),
                Cond(
                    [Txn.on_completion() == OnComplete.OptIn, self.on_register()],
                    [
                        Txn.on_completion()
                        == Or(
                            OnComplete.UpdateApplication, OnComplete.DeleteApplication
                        ),
                        Return(Int(0)),
                    ],
                    [Txn.on_completion() == OnComplete.CloseOut, self.on_closeout()],
                    [Txn.application_args[0] == Bytes("B"), self.on_bid()],
                    [Txn.application_args[0] == Bytes("S"), self.on_set_price()],
                    [Txn.application_args[0] == Bytes("BN"), self.on_buy_now()],
                    [Txn.application_args[0] == Bytes("SN"), self.on_sell_now()],
                    [Txn.application_args[0] == Bytes("C"), self.on_configure()],
                ),
            ]
        )


if __name__ == "__main__":
    params = {}

    # Overwrite params if sys.argv[1] is passed
    if len(sys.argv) > 1:
        params = parse_args(sys.argv[1], params)

    print(
        compileTeal(
            ManagerContract().get_contract(),
            Mode.Application,
        )
    )
