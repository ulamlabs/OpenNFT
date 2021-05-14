<template>
  <button
    class="group p-4 mx-3 rounded-xl border border-transparent hover:bg-gray-200 hover:border-gray-400 asset-card"
    @click="onClick"
  >
    <div class="flex flex-col">
      <div class="text-center">
        <div class="block w-full aspect-w-10 aspect-h-10 rounded-xl bg-gray-100 overflow-hidden">
          <img
            v-if="asset.image"
            :src="asset.image"
            class="object-cover pointer-events-none"
            alt="NFT Logo"
          >
          <ImagePlaceholder
            v-else
            width="640"
            height="640"
            class="object-cover pointer-events-none"
          />
        </div>
        <h3 class="py-2 mb-2 text-2xl leading-8 font-semibold">
          {{ asset.name }}
        </h3>
        <dl
          class="mb-4 grid grid-cols-2 rounded-lg overflow-hidden divide-indigo-200 divide-y-0 divide-x"
        >
          <div class="pr-1 text-right flex flex-col justify-between">
            <dt class="text-sm leading-5 font-medium text-gray-500 mb-2">
              Price
            </dt>
            <dd class="text-lg leading-7 font-bold truncate my-auto">
              {{ priceDisplay }}
            </dd>
          </div>
          <div class="px-1 flex flex-col justify-between ml-2 pl-2 text-left">
            <dt class="text-sm leading-5 font-medium text-gray-500 mb-2">
              Highest Bid
            </dt>
            <dd class="text-lg leading-7 font-normal truncate my-auto">
              {{ highestBidDisplay }}
            </dd>
            <dt
              v-if="withMyBid"
              class="my-2 text-sm leading-5 font-medium text-gray-500"
            >
              My Bid
            </dt>
            <dd
              v-if="withMyBid"
              class="text-lg leading-7 font-normal truncate"
            >
              {{ myBidDisplay }}
            </dd>
          </div>
        </dl>

        <button
          class="w-1/2 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs leading-4 font-medium group-hover:bg-indigo-500 group-hover:border-transparent group-hover:text-white"
        >
          {{ buttonLabel }}
        </button>
      </div>
    </div>
  </button>
</template>
<script>
import ImagePlaceholder from 'vue-image-placeholder';
import { mapGetters } from 'vuex';
import { toDisplayValue } from '@/utils/precision';

export default {
  name: 'AssetListCard',
  components: {
    ImagePlaceholder
  },
  props: {
    asset: {
      type: Object,
      required: true
    },
    withMyBid: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore',
      userStates: 'algorand/userStates',
      account: 'algorand/account',
    }),
    highestBidDisplay() {
      if (this.asset['highest_bid']) {
        return `${toDisplayValue(this.asset['highest_bid'].value)} USDC`;
      }
      return '-';
    },
    priceDisplay() {
      if (this.asset.price) {
        return `${toDisplayValue(this.asset.price)} USDC`;
      }
      return '-';
    },
    myBidDisplay() {
      if (this.userStates[this.asset['application_id']]) {
        return `${toDisplayValue(this.userStates[this.asset['application_id']]['B'])} USDC`;
      }
      return '-';
    },
    buttonLabel() {
      if (this.asset.owner_address) {
        return this.account === this.asset.owner_address ? 'Show my NFT' : 'Place a bid';
      } else {
        return this.account === this.asset.holding_address ? 'Show my NFT' : 'Place a bid';
      }
    }
  },
  methods: {
    onClick() {
      if (this.asset.status === 'RD') {
        this.$router.push({
          name: 'AssetDetails',
          params: {
            id: this.asset['guid']
          }
        });
      } else {
        this.$router.push({
          name: 'DeployContract',
          params: {
            id: this.asset['guid']
          }
        });
      }
    }
  }
};
</script>
<style scoped>
.asset-card {
  width: 16rem;
  min-width: 16rem;
}
</style>
