from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("nft_market.api.urls")),
    path("health/", lambda request: HttpResponse(status=200)),
]

if settings.DEBUG:
    from django.conf.urls.static import static

    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
