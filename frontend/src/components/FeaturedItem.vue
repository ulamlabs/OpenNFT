<template>
  <div class="bg-gray-800 header flex flex-col space-y-8 py-8 lg:flex-row lg:space-y-0 justify-evenly items-center">
    <MakeOfferModal
      v-if="showMakeOffer"
      :asset-data="item"
    />
    <BuyNowModal
      v-if="showBuyNow"
      :asset-data="item"
    />
    <div class="flex flex-col lg:w-1/4 md:w-1/2 w-5/6">
      <div class="text-gray-500 text-base leading-6 font-semibold tracking-wider uppercase">
        Featured
      </div>
      <div
        class="text-white text-6xl leading-none font-extrabold tracking-tight cursor-pointer"
        @click="onClick"
      >
        {{ item.name }}
      </div>
      <div class="border-2 border-indigo-500 rounded-lg p-4 mt-10 price">
        <dl class="grid grid-cols-2 overflow-hidden divide-indigo-200 divide-y-0 divide-x">
          <div class="pr-1 flex flex-col justify-between">
            <dt class="text-sm leading-5 font-medium text-gray-300 mb-2">
              Price
            </dt>
            <dd class="text-3xl leading-8 font-extrabold tracking-tight text-gray-50 my-auto truncate">
              {{ priceDisplay }}
            </dd>
          </div>
          <div class="px-1 flex flex-col justify-between ml-2 pl-6">
            <dt class="text-sm leading-5 font-medium text-gray-300 mb-2">
              Highest Bid
            </dt>
            <dd class="text-3xl leading-8 font-light tracking-tight text-gray-50 my-auto truncate">
              {{ highestValueDisplay }}
            </dd>
          </div>
        </dl>
      </div>
      <div class="grid grid-cols-2 items-start mt-8">
        <div class="mr-auto w-5/6">
          <ActionButton
            v-if="!userHasAsset && item.price"
            label="Buy Now"
            :validate="validateBuyNow"
            :execute="openBuyNow"
            component="t-featured-button"
          />
        </div>
        <div class="ml-auto w-5/6">
          <ActionButton
            v-if="!userHasAsset"
            class="indigo-700-imp"
            label="Place a bid"
            :execute="openMakeOffer"
            component="t-white-featured-button"
          />
        </div>
      </div>
    </div>
    <div
      class="sm:w-96 w-1/2 cursor-pointer"
      @click="onClick"
    >
      <TopImage :image="item.image" />
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import { USDC_ID } from '@/config';
import eventBus from '@/utils/eventBus';
import { emitError } from '@/utils/errors';
import { validateAlgoBalance, validateAssetBalances } from '@/utils/validation';
import TopImage from '@/components/TopImage';
import ActionButton from '@/components/ActionButton';
import BuyNowModal from '@/components/modals/BuyNowModal';
import MakeOfferModal from '@/components/modals/MakeOfferModal';
import { toDisplayValue } from '@/utils/precision';

export default {
  name: 'FeaturedItem',
  components: {
    TopImage,
    ActionButton,
    BuyNowModal,
    MakeOfferModal
  },
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showBuyNow: false,
      showMakeOffer: false,
    };
  },
  computed: {
    ...mapGetters({
      account: 'algorand/account',
    }),
    priceDisplay() {
      return this.item.price ? `${toDisplayValue(this.item.price)} USDC` : '-';
    },
    highestValueDisplay() {
      return this.item.highest_bid
        ? `${toDisplayValue(this.item.highest_bid.value)} USDC`
        : '-';
    },
    userHasAsset() {
      if (this.account === this.item.owner_address || this.account === this.item.holding_address) {
        return true;
      }
      return false;
    },
  },
  mounted() {
    eventBus.$on('close-asset-modals', this.closeModals);
  },
  methods: {
    onClick() {
      this.$router.push({
        name: 'AssetDetails',
        params: {
          id: this.item['guid']
        }
      });
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
    openBuyNow() {
      this.showBuyNow = true;
    },
    openMakeOffer() {
      this.showMakeOffer = true;
    },
    closeModals() {
      this.showBuyNow = false;
      this.showMakeOffer = false;
    },
  }
};
</script>
<style scoped>
.header {
  min-height: 35rem;
}
.price {
  height: fit-content;
}
</style>
