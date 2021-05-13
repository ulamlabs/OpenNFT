from pyteal import *


class State:
    """
    Wrapper around state vars.
    """

    def __init__(self, name: str):
        self._name = name

    def put(self, value) -> App:
        raise NotImplementedError

    def get(self) -> App:
        raise NotImplementedError


class LocalState(State):
    def put(self, value) -> App:
        return App.localPut(Int(0), Bytes(self._name), value)

    def get(self) -> App:
        return App.localGet(Int(0), Bytes(self._name))


class GlobalState(State):
    def put(self, value) -> App:
        return App.globalPut(Bytes(self._name), value)

    def get(self) -> App:
        return App.globalGet(Bytes(self._name))
