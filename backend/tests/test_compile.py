from unittest.mock import patch

from rest_framework.exceptions import ErrorDetail
from rest_framework.reverse import reverse


class TestCompileEscrow:
    def test_invalid_params(self, api_client):
        url = reverse("contract-compile-escrow")
        response = api_client.post(url)
        assert response.status_code == 400
        assert response.data == {
            "app_id": [ErrorDetail(string="This field is required.", code="required")],
            "usdc_id": [ErrorDetail(string="This field is required.", code="required")],
            "nft_id": [ErrorDetail(string="This field is required.", code="required")],
        }

    def test_correct_params(self, api_client):
        with patch("nft_market.api.views.algorand.algod.compile") as mock_method:
            mock_method.return_value = {"result": "abc"}
            url = reverse("contract-compile-escrow")
            response = api_client.post(
                url,
                {
                    "app_id": 123,
                    "usdc_id": 123,
                    "nft_id": 123,
                },
                format="json",
            )
            mock_method.assert_called_once()
            assert response.status_code == 200
            assert response.data == {"result": "abc"}


class TestCompileProxy:
    def test_invalid_params(self, api_client):
        url = reverse("contract-compile-proxy")
        response = api_client.post(url)
        assert response.status_code == 400
        assert response.data == {
            "proxy_id": [
                ErrorDetail(string="This field is required.", code="required")
            ],
        }

    def test_correct_params(self, api_client):
        with patch("nft_market.api.views.algorand.algod.compile") as mock_method:
            mock_method.return_value = {"result": "abc"}
            url = reverse("contract-compile-proxy")
            response = api_client.post(
                url,
                {
                    "proxy_id": 123,
                },
                format="json",
            )
            mock_method.assert_called_once()
            assert response.status_code == 200
            assert response.data == {"result": "abc"}


class TestCompileManager:
    def test_correct(self, api_client):
        with patch("nft_market.api.views.algorand.algod.compile") as mock_method:
            mock_method.return_value = {"result": "abc"}
            url = reverse("contract-compile-manager")
            response = api_client.post(url)
            assert response.status_code == 200
            assert response.data == {
                "result": "abc",
                "params": {
                    "num_local_ints": 1,
                    "num_local_byte_slices": 0,
                    "num_global_ints": 4,
                    "num_global_byte_slices": 3,
                },
            }


class TestCompileClear:
    def test_correct(self, api_client):
        with patch("nft_market.api.views.algorand.algod.compile") as mock_method:
            mock_method.return_value = {"result": "abc"}
            url = reverse("contract-compile-clear")
            response = api_client.post(url)
            assert response.status_code == 200
            assert response.data == {
                "result": "abc",
            }
