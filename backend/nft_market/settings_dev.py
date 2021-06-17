from nft_market.settings import *


USE_TESTNET = os.environ.get("USE_TESTNET", "true") != "true"
SECRET_KEY = "#4vw_a2_1w&*=_(*3wm(3=650hi_!m#zxc_r4f4c$texam7rk+"
DEBUG = True
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
PURESTAKE_API_KEY = os.environ.get("PURESTAKE_API_KEY")
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
CELERY_BROKER_URL = os.getenv(
    "CELERY_CONFIG_MODULE", "amqp://guest:guest@localhost:5672//"
)
