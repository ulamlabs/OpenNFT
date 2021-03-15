import sys

from pyteal import *

if __name__ == "__main__":
    from helpers.parse import parse_args
else:
    from .helpers.parse import parse_args


def proxy(proxy_id: int):
    return Seq(
        [
            Assert(Int(proxy_id) == Int(proxy_id)),
            Return(Int(1)),
        ]
    )


if __name__ == "__main__":
    params = {
        "proxy_id": 123,
        "owner_address": "",
    }

    # Overwrite params if sys.argv[1] is passed
    if len(sys.argv) > 1:
        params = parse_args(sys.argv[1], params)

    print(
        compileTeal(
            proxy(params["proxy_id"]),
            Mode.Signature,
        )
    )
