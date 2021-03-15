<template>
  <div class="flex flex-col">
    <h1 class="mb-8 mx-auto tracking-widest">
      Highest Bids
    </h1>
    <div class="flex flex-wrap justify-center">
      <div
        v-for="asset in assets"
        :key="asset['guid']"
      >
        <AssetListCard :asset="asset" />
      </div>
    </div>
  </div>
</template>
<script>
import AssetListCard from '@/components/cards/AssetListCard';
import { internalService } from '@/services/internal';
import eventBus from '@/utils/eventBus';

export default {
  name: 'HighestBids',
  components: {
    AssetListCard
  },
  data() {
    return {
      assets: []
    };
  },
  async mounted() {
    await this.fetchAssetList();
    eventBus.$on('update', this.fetchAssetList);
  },
  beforeDestroy() {
    eventBus.$off('update');
  },
  methods: {
    async fetchAssetList() {
      const response = await internalService.getAssets({
        'status': 'RD',
        'ordering': '-highest_bid__value',
        'highest_bid__value__gt': 0
      });
      this.assets = response['results'];
    }
  }
};
</script>
