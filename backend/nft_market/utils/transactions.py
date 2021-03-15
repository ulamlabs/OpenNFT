import base64


def decode_state(state):
    decoded_state = {}
    for obj in state:
        key = base64.b64decode(obj["key"]).decode("utf-8")
        type = obj["value"]["action"]
        if type == 2:
            decoded_state[key] = int(obj["value"]["uint"])
        elif type == 1:
            decoded_state[key] = base64.b64decode(obj["value"]["bytes"])
    return decoded_state


def decode_global_state(state):
    decoded_state = {}
    for obj in state:
        key = base64.b64decode(obj["key"]).decode("utf-8")
        value_type = obj["value"]["type"]
        if value_type == 2:
            decoded_state[key] = int(obj["value"]["uint"])
        elif value_type == 1:
            decoded_state[key] = base64.b64decode(obj["value"]["bytes"])
    return decoded_state


def is_non_zero_asset_tx(tx):
    asset_tx = tx["asset-transfer-transaction"]
    amount = asset_tx["amount"]
    return amount > 0
