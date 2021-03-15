from nft_market.api.models import User


def is_authorized(address):
    if User.objects.filter(address=address, is_staff=True).first():
        return True
    return False
