import uuid

from nft_market.api.models import Asset, User, Operation
from rest_framework import serializers
from rest_framework.exceptions import ValidationError


class CompileEscrowSerializer(serializers.Serializer):
    app_id = serializers.IntegerField()
    nft_id = serializers.IntegerField()
    usdc_id = serializers.IntegerField()


class CompileProxySerializer(serializers.Serializer):
    proxy_id = serializers.IntegerField()


class SendTxSerializer(serializers.Serializer):
    blob = serializers.CharField()


class SendOperationSerializer(serializers.Serializer):
    blob = serializers.CharField()
    operation = serializers.ChoiceField(choices=Operation.OperationType.choices)


class CreateAssetSerializer(serializers.Serializer):
    asset_id = serializers.CharField()
    image = serializers.ImageField()
    description = serializers.CharField()


class ContractTxSerializer(serializers.Serializer):
    app_id = serializers.IntegerField()
    tx_id = serializers.CharField()


class ValidateAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = (
            "unit_name",
            "name",
            "description",
        )


def validate_file_size(value):
    limit = 4 * 1024 * 1024
    if value.size > limit:
        raise ValidationError("File too large. Size should not exceed 4 MiB.")


class AssetSerializer(serializers.ModelSerializer):
    guid = serializers.CharField()
    owner_address = serializers.CharField(read_only=True)
    image = serializers.ImageField(validators=[validate_file_size])
    description = serializers.CharField()
    asset_id = serializers.IntegerField()
    application_id = serializers.IntegerField(read_only=True)
    creator_address = serializers.CharField()
    escrow_address = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    price = serializers.IntegerField(read_only=True)
    highest_bid = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    modified_at = serializers.DateTimeField(read_only=True)

    def validate_guid(self, value):
        try:
            return uuid.UUID(value)
        except Exception as exc:
            raise serializers.ValidationError(f"{type(exc).__name__}: {str(exc)}")

    def get_highest_bid(self, obj):
        if not hasattr(obj, "highest_bid__sender") or not hasattr(
            obj, "highest_bid__value"
        ):
            return None
        if obj.highest_bid__sender and obj.highest_bid__value:
            return {
                "sender": obj.highest_bid__sender,
                "value": obj.highest_bid__value,
            }
        return None

    class Meta:
        model = Asset
        fields = (
            "unit_name",
            "name",
            "description",
            "guid",
            "creator_address",
            "owner_address",
            "image",
            "asset_id",
            "application_id",
            "escrow_address",
            "status",
            "price",
            "highest_bid",
            "created_at",
            "modified_at",
            "holding_address",
        )


class UserSerializer(serializers.ModelSerializer):
    address = serializers.CharField()

    class Meta:
        model = User
        fields = (
            "address",
            "is_staff",
        )


class OperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Operation
        fields = (
            "pk",
            "created_at",
            "op_type",
            "value",
            "tx_id",
            "sender",
            "is_valid",
            "is_pending",
            "is_executed",
            "block_time",
            "block_number",
        )
