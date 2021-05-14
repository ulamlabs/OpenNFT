<template>
  <div>
    <SetAskPriceModal
      v-if="showSetAskPrice"
      :asset-data="assetData"
    />
    <MakeOfferModal
      v-if="showMakeOffer"
      :asset-data="assetData"
    />
    <BuyNowModal
      v-if="showBuyNow"
      :asset-data="assetData"
    />
    <SellNowModal
      v-if="showSellNow"
      :asset-data="assetData"
    />
    <CancelModal
      v-if="showCancelAsk"
      :execute="cancelAsk"
      :validate="checkIfUserHasAsk"
      :fee="0.003"
    />
    <CancelModal
      v-if="showCancelBid"
      :execute="cancelBid"
      :validate="checkIfUserHasBid"
      :fee="0.003"
    />
    <div class="relative bg-gray-800 header flex flex-col justify-center items-center">
      <div class="sm:w-96 w-1/2">
        <TopImage :image="assetData.image" />
      </div>
      <div class="absolute bottom-5 md:right-40 right-20 space-x-3 flex">
        <div
          class="bg-gray-700 text-gray-400 rounded-lg w-8 h-8 cursor-pointer"
          @click="copyLink"
        >
          <svg
            class="mt-1.5 mx-auto"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            :fill="showShareIcon ? 'none' : 'currentColor'"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              v-if="showShareIcon"
              d="M6.68387 11.3419C6.88616 10.9381 7 10.4824 7 10C7 9.51763 6.88616 9.06185 6.68387 8.65807M6.68387 11.3419C6.19134 12.3251 5.17449 13 4 13C2.34315 13 1 11.6569 1 10C1 8.34315 2.34315 7 4 7C5.17449 7 6.19134 7.67492 6.68387 8.65807M6.68387 11.3419L13.3161 14.6581M6.68387 8.65807L13.3161 5.34193M13.3161 5.34193C13.8087 6.32508 14.8255 7 16 7C17.6569 7 19 5.65685 19 4C19 2.34315 17.6569 1 16 1C14.3431 1 13 2.34315 13 4C13 4.48237 13.1138 4.93815 13.3161 5.34193ZM13.3161 14.6581C13.1138 15.0619 13 15.5176 13 16C13 17.6569 14.3431 19 16 19C17.6569 19 19 17.6569 19 16C19 14.3431 17.6569 13 16 13C14.8255 13 13.8087 13.6749 13.3161 14.6581Z"
              stroke="#9CA3AF"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              v-else
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <a
          :href="assetData.image"
          class="bg-gray-700 rounded-lg w-8 h-8 cursor-pointer"
        >
          <svg
            class="mt-1.5 mx-auto"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 5V1M1 1H5M1 1L6 6M17 5V1M17 1H13M17 1L12 6M1 13V17M1 17H5M1 17L6 12M17 17L12 12M17 17V13M17 17H13"
              stroke="#9CA3AF"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </a>
      </div>
    </div>

    <div class="md:mx-20 px-10 mt-3">
      <div class="mt-10 text-gray-500 text-sm leading-5 font-medium flex space-x-5 items-baseline">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.292893 7.29289C-0.0976311 7.68342 -0.0976311 8.31658 0.292893 8.70711C0.683417 9.09763 1.31658 9.09763 1.70711 8.70711L2 8.41421V15C2 15.5523 2.44772 16 3 16H5C5.55228 16 6 15.5523 6 15V13C6 12.4477 6.44772 12 7 12H9C9.55229 12 10 12.4477 10 13V15C10 15.5523 10.4477 16 11 16H13C13.5523 16 14 15.5523 14 15V8.41421L14.2929 8.70711C14.6834 9.09763 15.3166 9.09763 15.7071 8.70711C16.0976 8.31658 16.0976 7.68342 15.7071 7.29289L8.70711 0.292893Z"
            fill="#9CA3AF"
          />
        </svg>
        <svg
          width="6"
          height="10"
          viewBox="0 0 6 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M0.292894 9.70711C-0.0976307 9.31658 -0.0976307 8.68342 0.292894 8.29289L3.58579 5L0.292893 1.70711C-0.0976311 1.31658 -0.0976311 0.683418 0.292893 0.292894C0.683417 -0.0976312 1.31658 -0.0976312 1.70711 0.292894L5.70711 4.29289C6.09763 4.68342 6.09763 5.31658 5.70711 5.70711L1.70711 9.70711C1.31658 10.0976 0.683418 10.0976 0.292894 9.70711Z"
            fill="#9CA3AF"
          />
        </svg>
        <router-link to="/all-items">
          All items
        </router-link>
        <svg
          width="6"
          height="10"
          viewBox="0 0 6 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M0.292894 9.70711C-0.0976307 9.31658 -0.0976307 8.68342 0.292894 8.29289L3.58579 5L0.292893 1.70711C-0.0976311 1.31658 -0.0976311 0.683418 0.292893 0.292894C0.683417 -0.0976312 1.31658 -0.0976312 1.70711 0.292894L5.70711 4.29289C6.09763 4.68342 6.09763 5.31658 5.70711 5.70711L1.70711 9.70711C1.31658 10.0976 0.683418 10.0976 0.292894 9.70711Z"
            fill="#9CA3AF"
          />
        </svg>
        <router-link :to="navLink">
          {{ navLabel }}
        </router-link>
      </div>
      <div class="grid grid-cols-1 mb-20 lg:grid-cols-3 lg:space-x-10">
        <div class="col-span-2">
          <div class="text-6xl leading-none font-extrabold tracking-tight py-10">
            {{ assetData.name }}
          </div>
          <div class="text-lg leading-7 font-normal text-gray-500">
            {{ assetData.description }}
          </div>
        </div>

        <div class="border border-gray-200 rounded-md px-4 py-6 mt-10 price">
          <dl class="mb-4 grid grid-cols-2 overflow-hidden divide-indigo-200 divide-y-0 divide-x">
            <div class="pr-1 flex flex-col justify-between">
              <dt class="text-sm leading-5 font-medium text-gray-600 mb-2">
                {{ priceLabel }}
              </dt>
              <dd class="text-3xl leading-8 font-extrabold tracking-tight text-gray-800 my-auto break-words">
                {{ priceDisplay }}
              </dd>
            </div>
            <div class="px-1 flex flex-col justify-between ml-2 pl-4">
              <dt class="text-sm leading-5 font-medium text-gray-600 mb-2">
                {{ highestBidLabel }}
              </dt>
              <dd class="text-3xl leading-8 font-light tracking-tight text-gray-800 my-auto break-words">
                {{ highestValueDisplay }}
              </dd>
              <dt
                v-if="userBidDisplay"
                class="my-2 text-sm leading-5 font-medium text-gray-600"
              >
                My Bid
              </dt>
              <dd
                v-if="userBidDisplay"
                class="text-3xl leading-8 font-light tracking-tight text-gray-800 break-words"
              >
                {{ userBidDisplay }} USDC
              </dd>
            </div>
          </dl>
          <div class="grid grid-cols-2 items-start">
            <div class="mt-4 mx-auto w-5/6">
              <ActionButton
                v-if="userHasAsset"
                :label="priceButtonLabel"
                :execute="openSetAskPrice"
                :validate="checkIfUserHasAsset"
                :component="priceButtonComponent"
              />
              <ActionButton
                v-if="userHasAsset && applicationData['A']"
                class="mt-2"
                label="Cancel Offer"
                :execute="openCancelAsk"
                :validate="checkIfUserHasAsk"
                component="t-white-button"
              />
              <ActionButton
                v-if="!userHasAsset && applicationData['A']"
                label="Buy Now"
                :validate="validateBuyNow"
                :execute="openBuyNow"
              />
            </div>
            <div class="mt-4 mx-auto w-5/6">
              <ActionButton
                v-if="!userHasAsset"
                label="Place a bid"
                :execute="openMakeOffer"
                component="t-light-button"
              />
              <ActionButton
                v-if="userBid"
                class="mt-2"
                label="Cancel"
                :execute="openCancelBid"
                :validate="checkIfUserHasBid"
                component="t-white-button"
              />
              <ActionButton
                v-if="userHasAsset && hasBid"
                class="mt-2"
                label="Sell Now"
                :execute="openSellNow"
                :validate="validateSellNow"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="text-xs leading-4 font-medium tracking-wide uppercase">
          Current Owner:
        </div>
        <div class="flex items-center">
          <div class="bg-gray-400 rounded-full m-2 w-9 h-9">
            <svg
              class="mx-auto mt-2"
              width="14"
              height="17"
              viewBox="0 0 14 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.3333 4.57976C10.3333 6.34067 8.84091 7.76817 6.99996 7.76817C5.15901 7.76817 3.66663 6.34067 3.66663 4.57976C3.66663 2.81886 5.15901 1.39136 6.99996 1.39136C8.84091 1.39136 10.3333 2.81886 10.3333 4.57976Z"
                stroke="#F9FAFB"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6.99996 10.1595C3.7783 10.1595 1.16663 12.6576 1.16663 15.7392H12.8333C12.8333 12.6576 10.2216 10.1595 6.99996 10.1595Z"
                stroke="#F9FAFB"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <span v-if="ownerAddress">
            <AddressLink :address="ownerAddress" />
          </span>
          <span v-else-if="assetData['holding_address']">
            <AddressLink :address="assetData['holding_address']" />
          </span>
          <span v-else>
            Information not available
          </span>
        </div>
      </div>

      <div class="mb-4">
        <TransactionTable :asset-guid="this.$route.params.id" />
      </div>
    </div>
  </div>
</template>
<script>
import ActionButton from '@/components/ActionButton';
import { mapGetters } from 'vuex';
import { internalService } from '@/services/internal';
import { USDC_ID } from '@/config';
import SetAskPriceModal from '@/components/modals/SetAskPriceModal';
import eventBus from '@/utils/eventBus';
import { emitError } from '@/utils/errors';
import TransactionTable from '@/components/TransactionTable';
import MakeOfferModal from '@/components/modals/MakeOfferModal';
import { BID_PRICE } from '@/utils/constants';
import { checkIfOperationIsCompleted } from '@/utils/operations';
import { toDisplayValue } from '@/utils/precision';
import algosdk from 'algosdk';
import { base64ToUint8Array } from '@/utils/encoding';
import AddressLink from '@/components/AddressLink';
import { validateAlgoBalance, validateAssetBalances } from '@/utils/validation';
import BuyNowModal from '@/components/modals/BuyNowModal';
import SellNowModal from '@/components/modals/SellNowModal';
import TopImage from '@/components/TopImage';
import CancelModal from '@/components/modals/CancelModal';

export default {
  name: 'AddAssetCard',
  components: {
    SellNowModal,
    BuyNowModal,
    MakeOfferModal,
    TransactionTable,
    ActionButton,
    TopImage,
    SetAskPriceModal,
    AddressLink,
    CancelModal
  },
  data() {
    return {
      assetData: {},
      showSetAskPrice: false,
      showMakeOffer: false,
      showBuyNow: false,
      showSellNow: false,
      showCancelAsk: false,
      showCancelBid: false,
      showShareIcon: true
    };
  },
  computed: {
    ...mapGetters({
      isStaff: 'internal/isStaff',
      userAssets: 'algorand/userAssets',
      userStates: 'algorand/userStates',
      account: 'algorand/account',
      rawStore: 'algorand/rawStore',
      applicationData: 'algorand/applicationData'
    }),
    userHasAsset() {
      const userAsset = this.userAssets[String(this.assetData.asset_id)];
      if (userAsset && userAsset.amount > 0) {
        return true;
      } else if (this.account && this.contractOwnerAddress === this.account) {
        return true;
      }
      return false;
    },
    hasBid() {
      return !!(this.assetData['highest_bid'] && this.assetData['highest_bid'].value);
    },
    highestValueDisplay() {
      return this.assetData['highest_bid']
        ? `${toDisplayValue(this.assetData['highest_bid'].value)} USDC`
        : '-';
    },
    priceDisplay() {
      return this.applicationData['A'] ? `${toDisplayValue(this.applicationData['A'])} USDC` : '-';
    },
    contractOwnerAddress() {
      if (this.applicationData['O'] === 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=') {
        return null;
      }
      return this.applicationData['O']
        ? algosdk.encodeAddress(base64ToUint8Array(this.applicationData['O']))
        : null;
    },
    ownerAddress() {
      if (this.userHasAsset) {
        return this.account;
      } else if (this.contractOwnerAddress) {
        return this.contractOwnerAddress;
      }
      return null;
    },
    priceLabel() {
      return this.userHasAsset && this.applicationData['A'] ? 'You are asking for' : this.applicationData['A'] ? 'Price' : 'No sale offers';
    },
    highestBidLabel() {
      return this.highestValueDisplay === '-' ? 'No purchase offers' : this.userHasAsset && this.applicationData['A'] ? 'Best buyer offers' : 'Highest Bid';
    },
    priceButtonLabel() {
      return this.applicationData['A'] ? 'Change Price' : 'Set Price';
    },
    priceButtonComponent() {
      return this.applicationData['A'] && this.hasBid ? 't-light-button' : 't-button';
    },
    navLabel() {
      if (this.applicationData['A']) {
        return 'For Sale';
      } else if (this.assetData['highest_bid']) {
        return 'Highest Bids';
      }
      return 'Recent';
    },
    navLink() {
      if (this.applicationData['A']) {
        return '/for-sale';
      } else if (this.assetData['highest_bid']) {
        return '/highest-bids';
      }
      return '/recently-added';
    },
    userBid() {
      const userData = this.userStates[this.assetData['application_id']];
      let userBid = 0;
      if (userData && userData[BID_PRICE]) {
        userBid = Number(userData[BID_PRICE]);
      }
      return userBid;
    },
    userBidDisplay() {
      return this.userBid ? toDisplayValue(this.userBid) : null;
    },
    requiresApplicationOptIn() {
      return !!(
        this.assetData['application_id'] && !this.userStates[this.assetData['application_id']]
      );
    },
    requiresUSDCOptIn() {
      return !this.userAssets[USDC_ID];
    },
    requiresAssetOptIn() {
      return !this.userAssets[this.assetData.asset_id];
    }
  },
  async mounted() {
    eventBus.$on('close-asset-modals', this.closeModals);
    eventBus.$on('update', this.fetchAssetData);

    const id = this.$route.params.id;
    if (!id) {
      await this.goBack();
    }
    await this.fetchAssetData();
  },
  beforeDestroy() {
    eventBus.$off('update');
    eventBus.$off('close-asset-modals');
  },
  methods: {
    openCancelAsk() {
      this.showCancelAsk = true;
    },
    openCancelBid() {
      this.showCancelBid = true;
    },
    async cancelAsk() {
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          return await this.rawStore.walletManager.setPrice(
            this.account,
            this.assetData['escrow_address'],
            this.assetData['application_id'],
            this.assetData.asset_id,
            0,
            false
          );
        },
        actionMessage: 'Cancelling offer...',
        actionVerificationMethod: checkIfOperationIsCompleted
      });
    },
    async cancelBid() {
      const userData = this.userStates[this.assetData['application_id']];
      let userBid = 0;
      if (userData && userData[BID_PRICE]) {
        userBid = Number(userData[BID_PRICE]);
      }
      const targetBid = 0;
      const priceDiff = targetBid - userBid;
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          return await this.rawStore.walletManager.bid(
            this.account,
            this.assetData['escrow_address'],
            this.assetData['application_id'],
            this.assetData.asset_id,
            priceDiff,
            true
          );
        },
        actionMessage: 'Cancelling offer...',
        actionVerificationMethod: checkIfOperationIsCompleted
      });
    },
    validateSellNow() {
      let fee = 0.004;
      if (this.requiresApplicationOptIn) {
        fee += 0.001;
      }
      if (this.requiresUSDCOptIn) {
        fee += 0.001;
      }
      validateAlgoBalance(fee);
      return this.checkIfUserHasAsset() && this.checkIfHasBid();
    },
    validateBuyNow() {
      let fee = 0.005;
      if (this.requiresApplicationOptIn) {
        fee += 0.001;
      }
      if (this.requiresAssetOptIn) {
        fee += 0.001;
      }
      if (!this.applicationData['A']) {
        emitError('There are no sellers to buy from');
        return false;
      }
      validateAlgoBalance(fee);
      const assetSpending = {};
      assetSpending[USDC_ID] = this.applicationData['A'];
      validateAssetBalances(assetSpending);
      return true;
    },
    checkIfUserHasBid() {
      if (this.userBid > 0) {
        return true;
      } else {
        emitError('There is no offer to cancel');
        return false;
      }
    },
    checkIfUserHasAsk() {
      if (this.checkIfUserHasAsset()) {
        if (!this.applicationData['A']) {
          emitError('There is no offer to cancel');
          return false;
        }
        return true;
      }
      return false;
    },
    checkIfUserHasAsset() {
      if (!this.userHasAsset) {
        emitError('You must own the NFT');
        return false;
      }
      return true;
    },
    checkIfHasBid() {
      if (!this.hasBid) {
        emitError('There must be a bid');
        return false;
      }
      return true;
    },
    openSetAskPrice() {
      this.showSetAskPrice = true;
    },
    openMakeOffer() {
      this.showMakeOffer = true;
    },
    openBuyNow() {
      this.showBuyNow = true;
    },
    openSellNow() {
      this.showSellNow = true;
    },
    closeModals() {
      this.showSetAskPrice = false;
      this.showMakeOffer = false;
      this.showBuyNow = false;
      this.showSellNow = false;
      this.showCancelAsk = false;
      this.showCancelBid = false;
    },
    async fetchAssetData() {
      try {
        await this.fetchInternalAssetData();
        await this.fetchBlockchainAssetData();
      } catch {
        this.goBack();
      }
    },
    async fetchInternalAssetData() {
      const id = this.$route.params.id;
      const obj = await internalService.getAsset(id);

      if (!obj) {
        this.goBack();
      }
      this.assetData = obj;
      if (this.assetData.status !== 'RD') {
        if (this.isStaff) {
          await this.$router.push({
            name: 'DeployContract',
            params: {
              id: id
            }
          });
        } else {
          await this.goBack();
        }
      }
    },
    async fetchBlockchainAssetData() {
      await this.$store.dispatch('algorand/FETCH_APPLICATION_DATA', {
        appId: this.assetData['application_id']
      });
    },
    copyLink() {
      const url = document.createElement('input');
      document.body.appendChild(url);
      url.value = window.location.href;
      url.select();
      url.setSelectionRange(0, 99999);
      document.execCommand('copy');
      url.style = 'display: none';
      this.showShareIcon = false;
    }
  }
};
</script>
<style scoped>
.max-fill-available {
  max-width: 100%;
  max-width: -moz-available; /* WebKit-based browsers will ignore this. */
  max-width: -webkit-fill-available; /* Mozilla-based browsers will ignore this. */
  max-width: strech;
}
.header {
  height: 35rem;
}
.price {
  height: fit-content;
}
</style>
