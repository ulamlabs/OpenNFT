from django.urls import path
from rest_framework.routers import DefaultRouter

from nft_market.api.views import (
    ContractViewSet,
    AssetViewSet,
    TransactionViewSet,
    UserViewSet,
    OperationViewSet,
    get_csrf_token,
)

router = DefaultRouter()
router.register(r"contracts", ContractViewSet, basename="contract")
router.register(r"assets", AssetViewSet, basename="asset")
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(r"users", UserViewSet, basename="user")
router.register(r"operations", OperationViewSet, basename="operation")


urlpatterns = router.urls + [
    path("token/", get_csrf_token),
]
