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
    <TopImage :image="assetData.image" />
    <PageCard>
      <div class="py-4 px-4 mt-3">
        <div class="flex flex-col px-4">
          <h1 class="font-semibold tracking-wide my-auto mb-4">
            {{ assetData.name }}
          </h1>
          <div class="flex flex-row flex-col">
            <div class="mb-4">
              <h3 class="text-gray-700 tracking-wide">
                Asset Description
              </h3>
            </div>
            <div class="mb-8">
              <p class="break-words">
                {{ assetData.description }}
              </p>
            </div>
            <div class="mb-4">
              <h3 class="text-gray-700 tracking-wide">
                Current Owner
              </h3>
            </div>
            <div v-if="ownerAddress">
              <div class="sm:inline-block align-middle whitespace-nowrap">
                Owner<span class="whitespace-pre">:&nbsp;</span>
              </div>
              <div class="max-fill-available sm:inline-block align-middle">
                <AddressLink :address="ownerAddress" />
              </div>
            </div>
            <div v-else-if="assetData['holding_address']">
              <div class="sm:inline-block align-middle whitespace-nowrap">
                Owner<span class="whitespace-pre">:&nbsp;</span>
              </div>
              <div class="max-fill-available sm:inline-block align-middle">
                <AddressLink :address="assetData['holding_address']" />
              </div>
            </div>
            <div v-else>
              <strong>Information not available</strong>
            </div>
          </div>
          <div class="flex-row flex-grow min-w-0">
            <hr class="mb-8 mt-8">
            <h3 class="text-gray-700 tracking-wide mt-8 mb-8">
              Market Data
            </h3>
            <div class="flex flex-col md:flex-row flex-wrap justify-around">
              <div class="flex flex-col text-center">
                <div
                  v-if="priceDisplay"
                >
                  <div v-if="userHasAsset">
                    You are asking for <strong>{{ priceDisplay }}</strong> USDC
                  </div>
                  <div v-else>
                    Seller asks for <strong>{{ priceDisplay }}</strong> USDC
                  </div>
                </div>
                <div v-else>
                  There are no sale offers.
                </div>
                <div class="mx-auto mt-4">
                  <ActionButton
                    v-if="userHasAsset"
                    class="mb-4"
                    :label="priceButtonLabel"
                    :execute="openSetAskPrice"
                    :validate="checkIfUserHasAsset"
                  />
                  <ActionButton
                    v-if="userHasAsset && applicationData['A']"
                    class="mb-4"
                    label="Cancel Offer"
                    :execute="cancelAsk"
                    :validate="checkIfUserHasAsk"
                  />
                  <ActionButton
                    v-if="!userHasAsset && applicationData['A']"
                    class="mb-4"
                    label="Buy Now"
                    :validate="validateBuyNow"
                    :execute="openBuyNow"
                  />
                </div>
              </div>
              <div class="flex flex-col text-center">
                <div
                  v-if="highestValueDisplay"
                >
                  Best buyer offers <strong>{{ highestValueDisplay }}</strong> USDC.
                </div>
                <div
                  v-else
                >
                  There are no purchase offers.
                </div>
                <div v-if="userBidDisplay">
                  Your offer: <strong>{{ userBidDisplay }}</strong> USDC.
                </div>
                <div class="mx-auto mt-4">
                  <ActionButton
                    v-if="!userHasAsset"
                    class="mb-4"
                    label="Make Bid"
                    :execute="openMakeOffer"
                  />
                  <ActionButton
                    v-if="userBid"
                    class="mb-4"
                    label="Cancel Offer"
                    :execute="cancelBid"
                    :validate="checkIfUserHasBid"
                  />
                  <ActionButton
                    v-if="userHasAsset && hasBid"
                    class="mb-4"
                    label="Sell Now"
                    :execute="openSellNow"
                    :validate="validateSellNow"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="mb-4">
            <TransactionTable :asset-guid="this.$route.params.id" />
          </div>
        </div>
      </div>
    </PageCard>
  </div>
</template>
<script>
import PageCard from '@/components/cards/PageCard';
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

export default {
  name: 'AddAssetCard',
  components: {
    SellNowModal,
    BuyNowModal,
    MakeOfferModal,
    TransactionTable,
    PageCard,
    ActionButton,
    TopImage,
    SetAskPriceModal,
    AddressLink
  },
  data() {
    return {
      assetData: {},
      showSetAskPrice: false,
      showMakeOffer: false,
      showBuyNow: false,
      showSellNow: false
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
      return this.assetData['highest_bid'] ? `${toDisplayValue(this.assetData['highest_bid'].value)}` : null;
    },
    priceDisplay() {
      return this.applicationData['A'] ? `${toDisplayValue(this.applicationData['A'])}` : null;
    },
    contractOwnerAddress() {
      if (this.applicationData['O'] === 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=') {
        return null;
      }
      return this.applicationData['O'] ? algosdk.encodeAddress(base64ToUint8Array(this.applicationData['O'])) : null;
    },
    ownerAddress() {
      if (this.userHasAsset) {
        return this.account;
      } else if (this.contractOwnerAddress) {
        return this.contractOwnerAddress;
      }
      return null;
    },
    priceButtonLabel() {
      return this.applicationData['A'] ? 'Change Price' : 'Set Price';
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
      return !!(this.assetData['application_id'] && !this.userStates[this.assetData['application_id']]);
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
      if(!this.userHasAsset) {
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
      await this.$store.dispatch('algorand/FETCH_APPLICATION_DATA', { appId: this.assetData['application_id'] });
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
</style>
