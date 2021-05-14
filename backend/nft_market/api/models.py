import uuid

from django.db import models
from django.db.models import Q


class TimeStampMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Asset(TimeStampMixin, models.Model):
    class AssetStatus(models.TextChoices):
        DEPLOYED_ASSET = "DA", "Deployed asset"
        DEPLOYED_CONTRACT = "DC", "Deployed contract"
        READY = "RD", "Ready to use"

    guid = models.UUIDField(unique=True, db_index=True)
    unit_name = models.CharField(
        max_length=8, unique=True, verbose_name="ticker symbol"
    )
    name = models.CharField(max_length=32, unique=True, verbose_name="asset name")
    asset_id = models.PositiveBigIntegerField(unique=True)
    description = models.TextField()
    application_id = models.PositiveBigIntegerField(unique=True, blank=True, null=True)
    escrow_address = models.CharField(max_length=58, unique=True, blank=True, null=True)
    holding_address = models.CharField(max_length=58, blank=True, null=True)
    creator_address = models.CharField(max_length=58)
    status = models.CharField(
        max_length=2,
        choices=AssetStatus.choices,
        default=AssetStatus.DEPLOYED_ASSET,
    )
    image = models.FileField()
    last_round = models.PositiveBigIntegerField(default=0)
    last_check = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Asset"


class User(TimeStampMixin, models.Model):
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    address = models.CharField(max_length=58)
    is_staff = models.BooleanField()


def get_placeholder_tx_id():
    return uuid.uuid4().hex


class Operation(TimeStampMixin, models.Model):
    class OperationType(models.TextChoices):
        ASK = "ASK", "Ask"
        BID = "BID", "Bid"
        BUY_NOW = (
            "BUY_NOW",
            "Buy Now",
        )
        SELL_NOW = "SELL_NOW", "Sell Now"

    op_type = models.CharField(
        max_length=8,
        choices=OperationType.choices,
    )
    value = models.PositiveBigIntegerField(blank=True, null=True)
    tx_id = models.CharField(max_length=58, blank=True, null=True)
    sender = models.CharField(max_length=58, blank=True, null=True)
    # Other side of the transaction e.g. buyer in case of SELL_NOW tx
    account = models.CharField(max_length=58, blank=True, null=True)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, blank=True, null=True)
    # Determines whether offer is still valid
    is_valid = models.BooleanField(default=True)
    is_executed = models.BooleanField(default=False)
    is_pending = models.BooleanField(default=False)  # Has to be sent
    block_number = models.PositiveBigIntegerField(blank=True, null=True)
    block_time = models.DateTimeField(blank=True, null=True)
    blob = models.BinaryField(blank=True, null=True)  # Raw tx data

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["tx_id"],
                name="unique__name__when__tx_id__not_null",
                condition=Q(tx_id__isnull=False),
            ),
        ]
