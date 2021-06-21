from nft_market.settings import *


USE_TESTNET = True
SECRET_KEY = "#4vw_a2_1w&*=_(*3wm(3=650hi_!m#zxc_r4f4c$texam7rk+"
DEBUG = False
WSGI_APPLICATION = "nft_market.wsgi.application"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
