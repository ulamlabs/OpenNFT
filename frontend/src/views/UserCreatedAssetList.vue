<template>
  <div>
    <h1 class="mb-8 tracking-widest text-center">
      Created NFTs
    </h1>
    <h4
      v-if="deployedAssets.length === 0 && pendingAssets.length === 0"
      class="text-center mb-8"
    >
      You have not created any NFT!
    </h4>
    <h2
      v-if="deployedAssets.length && pendingAssets.length"
      class="mb-8 text-center"
    >
      Pending
    </h2>
    <div class="flex flex-wrap justify-center">
      <div
        v-for="asset in pendingAssets"
        :key="asset['guid']"
      >
        <AssetListCard :asset="asset" />
      </div>
    </div>
    <h2
      v-if="deployedAssets.length && pendingAssets.length"
      class="mb-8 mt-8 text-center"
    >
      Ready To Use
    </h2>
    <div class="flex flex-wrap justify-center">
      <div
        v-for="asset in deployedAssets"
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
import { mapGetters } from 'vuex';
import eventBus from '@/utils/eventBus';
import staffOnly from '@/mixins/staffOnly';

export default {
  name: 'UserCreatedAssetList',
  components: {
    AssetListCard
  },
  mixins: [
    staffOnly
  ],
  data() {
    return {
      pendingAssets: [],
      deployedAssets: []
    };
  },
  computed: {
    ...mapGetters({
      userAssets: 'algorand/userAssets',
      account: 'algorand/account',
      isFetched: 'internal/isFetched'
    })
  },
  watch: {
    async userAssets() {
      await this.fetchAll();
    }
  },
  async mounted() {
    await this.fetchAll();
    eventBus.$on('update', this.fetchAll);
  },
  beforeDestroy() {
    eventBus.$off('update');
  },
  methods: {
    async fetchAll() {
      await this.fetchPendingAssetList();
      await this.fetchDeployedAssetList();
    },
    async fetchPendingAssetList() {
      const response = await internalService.getAssets({
        'ordering': 'created_at',
        'creator_address': this.account,
        'status__exclude': 'RD'
      });
      this.pendingAssets = response['results'] || [];
    },
    async fetchDeployedAssetList() {
      const response = await internalService.getAssets({
        'ordering': 'created_at',
        'creator_address': this.account,
        'status': 'RD'
      });
      this.deployedAssets = response['results'] || [];
    }
  }
};
</script>
