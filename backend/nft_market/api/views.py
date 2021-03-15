import base64
import datetime

from django.db.models import OuterRef, Subquery
from django.db.models import Case, CharField, Value, When, IntegerField
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from django.middleware import csrf
from nft_market import contracts
from nft_market.api.filters import AssetFilter
from nft_market.api.models import Asset, User, Operation
from nft_market.api.serializers import (
    CompileEscrowSerializer,
    CompileProxySerializer,
    SendTxSerializer,
    CreateAssetSerializer,
    ContractTxSerializer,
    ValidateAssetSerializer,
    AssetSerializer,
    UserSerializer,
    SendOperationSerializer,
    OperationSerializer,
)
from nft_market.services import algorand
from nft_market.utils import deployment
from nft_market.api.tasks import send_operation_tx, index_all
from rest_framework import mixins, filters
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response


class ContractViewSet(viewsets.ViewSet):
    @action(detail=False, methods=["post"], name="Compile Escrow")
    def compile_escrow(self, request, format=None):
        params = CompileEscrowSerializer(data=request.data)
        params.is_valid(raise_exception=True)
        escrow_teal = contracts.get_escrow_teal(
            params.validated_data["app_id"],
            params.validated_data["usdc_id"],
            params.validated_data["nft_id"],
        )
        response = algorand.algod.compile(escrow_teal)
        return Response(response)

    @action(detail=False, methods=["post"], name="Compile Proxy")
    def compile_proxy(self, request, format=None):
        params = CompileProxySerializer(data=request.data)
        params.is_valid(raise_exception=True)
        proxy_teal = contracts.get_proxy_teal(params.validated_data["proxy_id"])
        response = algorand.algod.compile(proxy_teal)
        return Response(response)

    @action(detail=False, methods=["post"], name="Submit Contract")
    def submit_contract(self, request, format=None):
        params = ContractTxSerializer(data=request.data)
        params.is_valid(raise_exception=True)

        nft_id = deployment.ContractDeployment.find_and_validate(
            tx_id=params.validated_data["tx_id"], app_id=params.validated_data["app_id"]
        )
        asset_obj = get_object_or_404(
            Asset, asset_id=nft_id, status=Asset.AssetStatus.DEPLOYED_ASSET
        )
        asset_obj.application_id = params.validated_data["app_id"]
        asset_obj.status = Asset.AssetStatus.DEPLOYED_CONTRACT
        asset_obj.save()
        return Response(status=200)

    @action(detail=False, methods=["post"], name="Submit Configuration")
    def submit_configuration(self, request, format=None):
        params = ContractTxSerializer(data=request.data)
        params.is_valid(raise_exception=True)

        app_tx = deployment.AppConfiguration.find_and_validate(
            app_id=params.validated_data["app_id"],
            tx_id=params.validated_data["tx_id"],
        )
        escrow_addr = app_tx["accounts"][0]
        asset_obj = get_object_or_404(
            Asset,
            application_id=params.validated_data["app_id"],
            status=Asset.AssetStatus.DEPLOYED_CONTRACT,
        )
        asset_obj.escrow_address = escrow_addr
        asset_obj.status = Asset.AssetStatus.READY
        asset_obj.save()
        return Response(status=200)

    @action(detail=False, methods=["post"], name="Compile Clear")
    def compile_clear(self, request, format=None):
        clear_teal = contracts.get_clear_teal()
        response = algorand.algod.compile(clear_teal)
        return Response(response)

    @action(detail=False, methods=["post"], name="Compile Manager")
    def compile_manager(self, request, format=None):
        manager_teal = contracts.get_manager_teal()
        response = algorand.algod.compile(manager_teal)
        return Response(
            {
                **response,
                "params": {
                    "num_local_ints": 1,
                    "num_local_byte_slices": 0,
                    "num_global_ints": 4,
                    "num_global_byte_slices": 3,
                },
            }
        )


class TransactionViewSet(viewsets.ViewSet):
    @action(detail=False, methods=["post"], name="Send Raw Transaction")
    def send_raw(self, request, format=None):
        params = SendTxSerializer(data=request.data)
        params.is_valid(raise_exception=True)
        tx = params.validated_data["blob"]
        tx_id = algorand.algod.send_raw_transaction(tx)
        return Response(
            {
                "tx_id": tx_id,
            }
        )


class OperationViewSet(viewsets.GenericViewSet, mixins.RetrieveModelMixin):
    queryset = Operation.objects.all().order_by("-block_time")
    serializer_class = OperationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["asset__guid"]

    @action(detail=False, methods=["post"], name="Send Operation Transaction")
    def send_tx(self, request, format=None):
        params = SendOperationSerializer(data=request.data)
        params.is_valid(raise_exception=True)
        operation = Operation.objects.create(
            op_type=params.validated_data["operation"],
            blob=base64.b64decode(params.validated_data["blob"]),
            is_pending=True,
            is_executed=False,
        )
        send_operation_tx.delay(operation.pk)
        return Response(
            {
                "operation_id": operation.pk,
            }
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset().filter(is_executed=True))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AssetViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    lookup_field = "guid"
    queryset = Asset.objects.none()
    serializer_class = AssetSerializer
    ordering_fields = ["created_at", "highest_bid__value"]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = AssetFilter

    def get_queryset(self):
        # Might need to be optimized
        ask_qs = (
            Operation.objects.filter(
                asset=OuterRef("pk"),
                op_type__in=[
                    Operation.OperationType.ASK,
                    Operation.OperationType.BUY_NOW,
                    Operation.OperationType.SELL_NOW,
                ],
                is_pending=False,
                is_valid=True,
            )
            .order_by("-block_number")
            .annotate(
                owner_address=Case(
                    When(
                        op_type=Operation.OperationType.ASK, value__gt=0, then="sender"
                    ),
                    default=Value(""),
                    output_field=CharField(),
                ),
                price=Case(
                    When(op_type=Operation.OperationType.ASK, then="value"),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
            )
        )
        bid_qs = Operation.objects.filter(
            op_type=Operation.OperationType.BID,
            asset=OuterRef("pk"),
            is_valid=True,
            is_pending=False,
            value__gt=0,
        ).order_by("-value")
        view_as = self.request.headers.get("X-View-As")
        if view_as and User.objects.filter(address=view_as, is_staff=True):
            qs = Asset.objects.all()
        else:
            qs = Asset.objects.filter(status=Asset.AssetStatus.READY)
        qs = qs.annotate(
            owner_address=Subquery(ask_qs.values("owner_address")[:1]),
            price=Subquery(ask_qs.values("price")[:1]),
            highest_bid__value=Subquery(bid_qs.values("value")[:1]),
            highest_bid__sender=Subquery(bid_qs.values("sender")[:1]),
        )
        return qs

    @action(detail=False, methods=["post"], name="Validate Asset")
    def validate_asset(self, request, format=None):
        asset_deployment = ValidateAssetSerializer(data=request.data)
        asset_deployment.is_valid(raise_exception=True)
        return Response()

    @action(detail=False, methods=["post"], name="Deploy Asset")
    def submit_asset(self, request, format=None):
        params = CreateAssetSerializer(data=request.data)
        params.is_valid(raise_exception=True)

        asset_config = deployment.AssetCreation.find_and_validate(
            asset_id=params.validated_data["asset_id"]
        )
        asset_deployment = AssetSerializer(
            data={
                "guid": base64.b64decode(asset_config["metadata-hash"]).decode("utf-8"),
                "unit_name": asset_config["unit-name"],
                "name": asset_config["name"],
                "creator_address": asset_config["creator"],
                "description": params.validated_data["description"],
                "image": params.validated_data["image"],
                "asset_id": params.validated_data["asset_id"],
            }
        )
        asset_deployment.is_valid(raise_exception=True)
        asset_deployment.save()
        return Response(asset_deployment.data, status=201)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        last_check = instance.last_check

        now = timezone.now()
        if last_check:
            time_diff = now - last_check
            if time_diff > datetime.timedelta(minutes=5):
                index_all.delay(instance.pk)
        else:
            index_all.delay(instance.pk)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class UserViewSet(viewsets.GenericViewSet, mixins.RetrieveModelMixin):
    lookup_field = "address"
    queryset = User.objects.all()
    serializer_class = UserSerializer


def get_csrf_token(request):
    token = csrf.get_token(request)
    return JsonResponse({"token": token})
