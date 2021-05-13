TAG = $(shell ./dev/docker-tag)
IMAGE = gcr.io/main-ulam/nft-market:$(TAG)
HELM_DEPLOYMENT = nft-market

K8S_CONTEXT = gke_main-ulam_europe-west3-b_v2-ulam-io

.PHONY: help deploy

all: image push

help:
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

image:		## Build the docker image
	docker build -t nft-market -t $(IMAGE) .

push:    ## push image
	docker push $(IMAGE)

run:
	docker run -p 8000:80 -t nft-market

deploy:
	helm secrets upgrade --install \
						 -f ../helm/nft-market/secrets.yaml \
						 $(HELM_DEPLOYMENT) ../helm/nft-market \
						 --set image.tag=$(TAG)
