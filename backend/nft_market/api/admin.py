from django.contrib import admin
from nft_market.api.models import Asset, User, Operation


class AssetAdmin(admin.ModelAdmin):
    list_display = ("unit_name", "name", "asset_id")


class OperationAdmin(admin.ModelAdmin):
    list_display = (
        "op_type",
        "sender",
        "tx_id",
        "is_valid",
        "is_pending",
        "is_executed",
        "block_number",
        "block_time",
    )


class UserAdmin(admin.ModelAdmin):
    pass


admin.site.register(Asset, AssetAdmin)
admin.site.register(Operation, OperationAdmin)
admin.site.register(User, UserAdmin)
