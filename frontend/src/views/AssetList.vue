<template>
  <div>
    <div v-if="assetsForSale.length > 1">
      <FeaturedItem :item="assetsForSale[1]" />
    </div>
    <div class="sm:ml-6 ml-3 mt-6 sm:pl-6 pl-3 py-6">
      <div
        v-if="assetsForSale.length"
        class="flex flex-col mb-8 pb-6 pl-3 sm:pl-10 pr-6 sm:pr-20"
      >
        <AssetTitle title="For Sale" />
        <div class="flex flex-wrap justify-center md:max-w-7xl mx-auto">
          <div
            v-for="asset in assetsForSale"
            :key="asset['guid']"
            class="asset"
          >
            <AssetListCard :asset="asset" />
          </div>
          <div class="asset">
            <ViewMore @click="onViewMoreForSale" />
          </div>
        </div>
      </div>
      <div
        v-if="highestBids.length"
        class="flex flex-col mb-8 py-6 pl-3 sm:pl-10 bg-gray-200 rounded-l-3xl pr-6 sm:pr-20"
      >
        <AssetTitle title="Highest Bids" />
        <div class="flex flex-wrap justify-center md:max-w-7xl mx-auto">
          <div
            v-for="asset in highestBids"
            :key="asset['guid']"
            class="asset"
          >
            <AssetListCard :asset="asset" />
          </div>
          <div class="asset">
            <ViewMore @click="onViewMoreHighestBids" />
          </div>
        </div>
      </div>
      <div
        v-if="recentlyAdded.length"
        class="flex flex-col mb-8 py-6 pl-3 sm:pl-10 pr-6 sm:pr-20"
      >
        <AssetTitle title="Recent" />
        <div class="flex flex-wrap justify-center md:max-w-7xl mx-auto">
          <div
            v-for="asset in recentlyAdded"
            :key="asset['guid']"
            class="asset"
          >
            <AssetListCard :asset="asset" />
          </div>
          <div class="asset">
            <ViewMore @click="onViewMoreRecentlyAdded" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import AssetListCard from '@/components/cards/AssetListCard';
import { internalService } from '@/services/internal';
import ViewMore from '@/components/cards/ViewMore';
import AssetTitle from '@/components/AssetTitle';
import FeaturedItem from '@/components/FeaturedItem';
import eventBus from '@/utils/eventBus';

export default {
  name: 'AssetList',
  components: {
    ViewMore,
    AssetListCard,
    AssetTitle,
    FeaturedItem
  },
  data() {
    return {
      assetsForSale: [],
      highestBids: [],
      recentlyAdded: []
    };
  },
  mounted() {
    eventBus.$on('update', this.getAssetsForSale);
    eventBus.$on('update', this.getHighestBids);
    eventBus.$on('update', this.getRecentlyAdded);

    this.getAssetsForSale();
    this.getHighestBids();
    this.getRecentlyAdded();
  },
  methods: {
    async getAssetsForSale() {
      const response = await internalService.getAssets({
        status: 'RD',
        ordering: '-created_at',
        price__gt: 0
      });
      this.assetsForSale = response['results'].slice(0, 7);
    },
    async getHighestBids() {
      const response = await internalService.getAssets({
        status: 'RD',
        ordering: '-highest_bid__value',
        highest_bid__value__gt: 0
      });
      this.highestBids = response['results'].slice(0, 3);
    },
    async getRecentlyAdded() {
      const response = await internalService.getAssets({
        status: 'RD',
        ordering: '-created_at'
      });
      this.recentlyAdded = response['results'].slice(0, 3);
    },
    onViewMoreForSale() {
      this.$router.push({
        name: 'ForSale'
      });
    },
    onViewMoreHighestBids() {
      this.$router.push({
        name: 'HighestBids'
      });
    },
    onViewMoreRecentlyAdded() {
      this.$router.push({
        name: 'RecentlyAdded'
      });
    }
  }
};
</script>
<style scoped>
.asset {
  flex: 0 0 24%;
}
</style>
