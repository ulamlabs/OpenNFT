![White-label NFT Marketplace](https://user-images.githubusercontent.com/2101767/118617316-cd401700-b7c2-11eb-8baa-d7f83e07274d.jpg)

<p align="center">
Built on &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;     
<img src="https://user-images.githubusercontent.com/2101767/118615635-3aeb4380-b7c1-11eb-93d9-a46438542020.png" width="200">
</p>


# OpenAlgoNFT

OpenAlgoNFT is an open-source cloud-native platform for building an NFT Marketplace on top of Algorand blockchain. 

Learn more on our official [case study](https://staging.ulam.io/case-studies/whitelabel-nft-marketplace-by-ulam-labs/). 


# Getting started with OpenAlgoNFT


There are three components involved in the platform. Frontend, Backend and Smart Contracts. 

Backend and Frontend have to be deployed. Backend deployes Smart Contract when new NFTs are created. 


# Frontend Deployment 

Frontend is written in Vue and follows standard way of deploying frontends. We recommend using [Vercel](https://vercel.com/).


# Backend Deployment 

Backend is deployed as a Docker images using Kubernetes cluster with ingress controller on top of AWS, Google Cloud Platform or Azure.

Additionally we use PostgreSQL 11 and RabbitMQ 3.8 for persistance and background processing. 

First you need to create Kubernetes cluster together with database. RabbitMQ is deployed together with the platform but we recommend having off the cluster instance.

For Kubernetes deployment we use HELM. There is a HELM chart that is responsible for deployment in `backend/helm`. 

You need to adjust values in `backend/helm/values.yaml` and `backend/helm/secrets.yaml` and deploy the backend using `make deploy`.


