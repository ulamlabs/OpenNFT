from pyteal import *

if __name__ == "__main__":
    from helpers.state import GlobalState, LocalState
else:
    from .helpers.state import GlobalState, LocalState


def clear():
    BID_PRICE = LocalState("B")

    return Seq(
        [
            BID_PRICE.put(Int(0)),
        ]
    )


if __name__ == "__main__":
    print(compileTeal(clear(), Mode.Application))
