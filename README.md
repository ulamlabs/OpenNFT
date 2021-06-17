![White-label NFT Marketplace](https://user-images.githubusercontent.com/2101767/118617316-cd401700-b7c2-11eb-8baa-d7f83e07274d.jpg)

<p align="center">
Built on &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;     
<img src="https://user-images.githubusercontent.com/2101767/118615635-3aeb4380-b7c1-11eb-93d9-a46438542020.png" width="200">
</p>


# OpenAlgoNFT

OpenAlgoNFT is an open-source cloud-native platform for building an NFT Marketplace on top of Algorand blockchain. 

Learn more on our official [case study](https://staging.ulam.io/case-studies/whitelabel-nft-marketplace-by-ulam-labs/). 

# Getting started with OpenAlgoNFT

There are three components involved in the platform. The frontend, the backend, and the smart contracts. The backend and frontend parts of the application have to be deployed to a server. Smart contracts are automatically deployed by the platform when new NFTs are created.

Follow the instructions below to prepare your development environment or to deploy the application to a public server.

# How to deploy to Google Cloud Platform

To deploy OpenAlgoNFT we'll need to create a database, a Kubernetes cluster on the Google Cloud Platform, and install several associated tools. This guide assumes that the user has at least some proficiency in using the Google Cloud Platform.

### Prerequisites

- [Google Cloud Platform SDK](https://cloud.google.com/sdk/gcloud)
- [Docker](https://www.docker.com/)
- [Kubernetes Tools](https://kubernetes.io/docs/tasks/tools/)
- [Helm](https://helm.sh/)
- SQL Database on Google Cloud Platform
- Container Registry on Google Cloud Platform

### Creating a Kubernetes cluster

1. Initialize your Google Cloud Platform SDK by running `gcloud init` and following the instructions
1. Go to [Kubernetes Engine](https://console.cloud.google.com/kubernetes/)
2. Click on `Create`
3. Configure your cluster - for experimenting, we suggest using the `Standard` cluster with the pre-filled configuration and reduced number of nodes (depending on your budget).
  - To reduce the number of nodes go to `default-pool`, change `Number of nodes` to `1`.
4. Wait for your cluster to be provisioned
6. Click on the `Actions` button, select `Connect` and run provided command to connect to your cluster
7. After that you should be able to access your Kubernetes cluster using `kubectl` command. We suggest reading [Overview of kubectl](https://kubernetes.io/docs/reference/kubectl/overview/).

### Backend deployment

The `backend` folder contains `helm` folder that contains Helm chart. Helm charts help to manage the complexity of Kubernetes application deployment. Before deploying we'll need to configure our Helm chart and install [Kubernetes Nginx Controller](https://kubernetes.github.io/ingress-nginx/deploy/)

#### Configuration

- Inside the `values.yaml` file, set the `host_dns` variable to your domain
- Inside the `secrets.yaml` file, configure:
    - `DATABASE_URL` - URL to access the database compatible with [dj-database-url](https://github.com/jacobian/dj-database-url)
    - `PURESTAKE_API_KEY` - Purestake API Key
    - `GOOGLE_CREDENTIALS` - Credentials for Google Service Account encoded in base64

#### Deployment

1. Connect your Docker to your Container Registry on Google Cloud Platform - https://cloud.google.com/container-registry/docs/advanced-authentication
1. Create Kubernetes namespace using `kubectl create namespace <insert-namespace-name-here>`
2. Switch to that namespace using `kubectl config set-context --current --namespace=<insert-namespace-name-here>`
3. Run `make image && make push && make deploy`
4. Check if the containers are running using `kubectl get pods`
5. Switch to `nginx-ingress` Kubernetes namespace and get the IP number of the Nginx server using `kubectl get services`
6. Create a Load Balancer that points to that Nginx server


### Frontend deployment

For deploying the frontend we suggest [Vercel.com](https://vercel.com/) which can be connected to a Github repository and takes care of the deployment for you.

# Creating an NFT

1. Go to the admin panel in the backend part of the application
2. Click on `Users` in the `API` section of the admin panel
3. Click on `Add user`
4. Enter your Algorand address and select `Is Staff`
5. Click on `Save`
6. Visit the frontend part of the application
7. Connect with your wallet
8. Click on the arrow next to your address at the top bar
9. Select `Create new NFT`
10. Proceed according to the instructions displayed on the screen


# How to setup the development environment

## Backend

By default, the project is configured with an SQLite database, which is embedded into the application and doesn't require any separate installation. We'll only RabbitMQ as a message queue for the background worker. For the application to be fully functional we need both a server and a background worker.

### RabbitMQ
Running RabbitMQ with Docker:

 1. Install and run [Docker](https://docs.docker.com/get-docker/)
 2. Run `docker run -d -p 5672:5672 rabbitmq:3` - this will run RabbitMQ in the background and forward the `5672` port to your computer.

Manual installation:

 1. Download, install and run [RabbitMQ](https://www.rabbitmq.com/download.html)
 2. By default, RabbitMQ will listen on port 5672 on all available interfaces. Refer to https://www.rabbitmq.com/networking.html if you want to customize your configuration.

By default, OpenNFT is configured to connect to RabbitMQ hosted on localhost at port 5672. If you want to change it you can set the `CELERY_BROKER_URL` variable in your command-line environment or inside the `backend/settings_dev.py` file. 

Example value of `CELERY_BROKER_URL`:
`amqp://guest:guest@localhost:5672//`

For more information refer to `Broker Settings` section of [Celery documentation](https://docs.celeryproject.org/en/stable/userguide/configuration.html).

Alternatively, you can install RabbitMQ yourself and configure it to accept connections on port 5672.

### Configuration

You can set the configuration variables both in your shell environment or `backend/settings_dev.py` file.

`PURESTAKE_API_KEY` should to be equal to your [Purestake](https://www.purestake.com/) API key.
`USE_TESTNET` should be equal to `0` if you want to use MainNet infrastructure.

### Running development server
 1. Install [Python](https://www.python.org/) 3.9 and [Poetry](https://python-poetry.org/)
 2.  Go to `backend` folder
 3. Run `poetry install` to install the dependencies and `poetry shell` to start using a virtual environment which contains those dependencies
 4. Migrate the database using `python manage.py migrate` command
 5. Create admin account using `python manage.py createsuperuser` command, following the instructions on the screen.
 6. Run the development server with `python manage.py runserver`
 7. You can access the admin panel at http://localhost:8000/admin/

### Running background worker

 1. Follow the section above to install the dependencies and run `poetry shell` inside `backend` folder.
 2. Run `DJANGO_SETTINGS_MODULE=nft_market.settings_dev celery -A nft_market.celery worker --loglevel=DEBUG` and keep it running alongside the development server to test the application

## Frontend

### Configuration

The frontend configuration can be found in `/frontend/src/config/index.js`. It contains the following variables:
 - `ALGORAND_LEDGER` - determines the infrastructure that we want to use. Can be `MainNet` or `TestNet`.
 - `USDC_ID` - Identifier of Algorand Standard Asset which is going to be used as a stablecoin
 - `USDC_DECIMAL_POINTS` - the amount of decimal points for that asset
 - `BACKEND_URL` - URL of the backend part of the application. By default, it is `http://localhost:8000` for the development environment and `https://nft-be.ulam.io` for the production environment.

## Contract

It is necessary to run a contract development environment only if you want to introduce changes to it.

### Dependencies

- You'll need to download the [algorand-builder](https://github.com/scale-it/algorand-builder) repository and link the `algob` and `runtime` packages. The latest tested commit for  `algorand-builder` is `0cf0f338230521197079e292a4963e814fa574f2`.
    - To link the `algorand-builder` you need to build it using `yarn build`
    - Issue `yarn link` command in those folders: `packages/algob`, `packages/runtime`
    - Run `yarn link "@algorand-builder/algob"` and `yarn link "@algorand-builder/runtime"` in the contract directory
- To install the rest of the dependencies run:
    - `poetry install`
    - `yarn install`

### Useful commands

Commands should be run inside the poetry shell.

Here are some useful commands:
- `yarn test` - running tests
- `yarn algob compile` - contract compilation
- `yarn deploy` - contract deployment (requires configuring `algob.config.js` and setting ASA identifiers in `scripts/deploy.js`)

### Debugging

Algorand has a debugging tool called `tealdbg` which allows real-time debugging of the contract execution. To debug a transaction you need to supply a teal file with the contract and a dry-run of the transaction:

- `tealdbg debug state.teal --dryrun-req tx.dr` - `tealdbg` will provide you with an address that you can enter in your browser to run the debugger

### Obtaining dry-run

Dry-run can be obtained with the goal command-line tool when issuing a transaction:

- `goal app call --app-id {appid} --from {ACCOUNT} --out=dumptx.dr --dryrun-dump`

Dry-run can be also extracted from the user interface:

- First, you need to extract the transaction which is sent to the Algorand node by the frontend part of the application
- Then you need to convert it from base64 to binary form and save it to a file
    - You can use `base64 -d` to convert the base64 text to a binary form in the *nix command-line
- At last, you need to convert the binary form to dry-run using `goal clerk dryrun -t tx.bin --dryrun-dump -o tx.dr`
