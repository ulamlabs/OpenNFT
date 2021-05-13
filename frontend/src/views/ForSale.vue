<template>
  <div class="mx-6 mt-6 py-6 px-16">
    <AssetTitle title="For Sale" />
    <div class="flex flex-wrap justify-center sm:justify-start">
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
import AssetTitle from '@/components/AssetTitle';
import { internalService } from '@/services/internal';
import eventBus from '@/utils/eventBus';

export default {
  name: 'ForSale',
  components: {
    AssetListCard,
    AssetTitle
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
        status: 'RD',
        ordering: 'created_at',
        price__gt: 0
      });
      this.assets = response['results'];
    }
  }
};
</script>
