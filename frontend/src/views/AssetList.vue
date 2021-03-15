<template>
  <div>
    <div
      v-if="assetsForSale.length"
      class="flex flex-col mb-8"
    >
      <h1 class="mb-8 mx-auto tracking-widest">
        For Sale
      </h1>
      <div class="flex flex-wrap justify-center">
        <div
          v-for="asset in assetsForSale"
          :key="asset['guid']"
        >
          <AssetListCard :asset="asset" />
        </div>
        <ViewMore @click="onViewMoreForSale" />
      </div>
    </div>
    <div
      v-if="highestBids.length"
      class="flex flex-col mb-8"
    >
      <h1 class="mb-8 mx-auto tracking-widest">
        Highest Bids
      </h1>
      <div class="flex flex-wrap justify-center">
        <div
          v-for="asset in highestBids"
          :key="asset['guid']"
        >
          <AssetListCard :asset="asset" />
        </div>
        <ViewMore @click="onViewMoreHighestBids" />
      </div>
    </div>
    <div
      v-if="recentlyAdded.length"
      class="flex flex-col mb-8"
    >
      <h1 class="mb-8 mx-auto tracking-widest">
        Recently Added
      </h1>
      <div class="flex flex-wrap justify-center">
        <div
          v-for="asset in recentlyAdded"
          :key="asset['guid']"
        >
          <AssetListCard :asset="asset" />
        </div>
        <ViewMore @click="onViewMoreRecentlyAdded" />
      </div>
    </div>
  </div>
</template>
<script>
import AssetListCard from '@/components/cards/AssetListCard';
import { internalService } from '@/services/internal';
import ViewMore from '@/components/cards/ViewMore';

export default {
  name: 'AssetList',
  components: {
    ViewMore,
    AssetListCard
  },
  data() {
    return {
      assetsForSale: [],
      highestBids: [],
      recentlyAdded: []
    };
  },
  mounted() {
    this.getAssetsForSale();
    this.getHighestBids();
    this.getRecentlyAdded();
  },
  methods: {
    async getAssetsForSale() {
      const response = await internalService.getAssets({
        'status': 'RD',
        'ordering': '-created_at',
        'price__gt': 0
      });
      this.assetsForSale = response['results'].slice(0, 3);
    },
    async getHighestBids() {
      const response = await internalService.getAssets({
        'status': 'RD',
        'ordering': '-highest_bid__value',
        'highest_bid__value__gt': 0
      });
      this.highestBids = response['results'].slice(0, 3);
    },
    async getRecentlyAdded() {
      const response = await internalService.getAssets({
        'status': 'RD',
        'ordering': '-created_at'
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
