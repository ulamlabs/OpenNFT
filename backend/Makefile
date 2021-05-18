TAG = $(shell ./dev/docker-tag)
IMAGE = ulamlabs/opennft:$(TAG)
HELM_DEPLOYMENT = opennft

K8S_CONTEXT = some-context

.PHONY: help deploy

all: image push

help:
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

image:		## Build the docker image
	docker build -t opennft -t $(IMAGE) .

push:    ## push image
	docker push $(IMAGE)

run:
	docker run -p 8000:80 -t opennft

deploy:
	helm secrets upgrade --install \
						 -f ./helm//secrets.yaml \
						 $(HELM_DEPLOYMENT) ./helm/ \
						 --set image.tag=$(TAG)
