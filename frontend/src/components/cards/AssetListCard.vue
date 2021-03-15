<template>
  <div>
    <Card class="max-w-md sm:ml-2 sm:mr-2 md:mr-2 md:ml-2 mb-2 md:mb-2">
      <button
        class="py-2 px-2 focus:outline-none asset-card"
        @click="onClick"
      >
        <div class="flex flex-col">
          <div class="block w-full">
            <div class="block">
              <div class="flex flex-col">
                <div class="text-center">
                  <h3 class="text-gray-700 font-semibold tracking-wide mb-2">
                    {{ asset.name }}
                  </h3>
                  <div class="px-2 py-2 justify-center">
                    <img
                      v-if="asset.image"
                      :src="asset.image"
                      class="image w-36 h-36 object-contain my-auto mx-auto"
                      alt="NFT Logo"
                    >
                    <ImagePlaceholder
                      v-else
                      width="640"
                      height="640"
                      class="image w-36 h-36 object-contain my-auto mx-auto"
                    />
                  </div>
                  <div class="w-full mt-2">
                    <div
                      v-if="priceDisplay"
                      class="flex flex-row flex-nowrap justify-center"
                    >
                      <div class="whitespace-pre-wrap">
                        Price:
                      </div>
                      <div class="truncate">
                        {{ priceDisplay }}
                      </div>
                      <div class="whitespace-pre-wrap">
                        USDC
                      </div>
                    </div>
                    <div
                      v-if="highestBidDisplay"
                      class="flex flex-row flex-nowrap justify-center"
                    >
                      <div class="whitespace-pre-wrap">
                        Highest bid:
                      </div>
                      <div class="truncate">
                        {{ highestBidDisplay }}
                      </div>
                      <div class="whitespace-pre-wrap">
                        USDC
                      </div>
                    </div>
                    <div
                      v-if="myBidDisplay"
                      class="flex flex-row flex-nowrap justify-center"
                    >
                      <div class="whitespace-pre-wrap">
                        My Bid:
                      </div>
                      <div class="truncate">
                        {{ myBidDisplay }}
                      </div>
                      <div class="whitespace-pre-wrap">
                        USDC
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </Card>
  </div>
</template>
<script>
import Card from '@/components/cards/Card';
import ImagePlaceholder from 'vue-image-placeholder';
import { mapGetters } from 'vuex';
import { toDisplayValue } from '@/utils/precision';

export default {
  name: 'AssetListCard',
  components: {
    Card,
    ImagePlaceholder,
  },
  props: {
    asset: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore',
      userStates: 'algorand/userStates'
    }),
    highestBidDisplay() {
      if (this.asset['highest_bid']) {
        return toDisplayValue(this.asset['highest_bid'].value);
      }
      return null;
    },
    priceDisplay() {
      if (this.asset.price) {
        return toDisplayValue(this.asset.price);
      }
      return null;
    },
    myBidDisplay() {
      if (this.userStates[this.asset['application_id']]) {
        return toDisplayValue(this.userStates[this.asset['application_id']]['B']);
      }
      return null;
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
  height: 20rem;
}
</style>
