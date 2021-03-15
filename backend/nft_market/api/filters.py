import django_filters
from django.db.models import Q
from nft_market.api.models import Asset


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass


class AssetFilter(django_filters.FilterSet):
    highest_bid__value__gt = django_filters.NumberFilter(
        field_name="highest_bid__value", lookup_expr="gt"
    )
    price__gt = django_filters.NumberFilter(field_name="price", lookup_expr="gt")
    status__exclude = django_filters.CharFilter(field_name="status", exclude=True)
    application_id__in = NumberInFilter(field_name="application_id", lookup_expr="in")

    @property
    def qs(self):
        base_queryset = super().qs

        asset_id__in = self.data.get("asset_id__in")
        asset_id__in = asset_id__in.split(",") if asset_id__in else None
        owner_address = self.data.get("owner_address")
        if asset_id__in and owner_address:
            return base_queryset.filter(
                Q(asset_id__in=asset_id__in) | Q(owner_address=owner_address)
            )
        elif asset_id__in:
            return base_queryset.filter(asset_id__in=asset_id__in)
        elif owner_address:
            return base_queryset.filter(owner_address=owner_address)

        return base_queryset

    class Meta:
        model = Asset
        fields = ("status", "creator_address")
