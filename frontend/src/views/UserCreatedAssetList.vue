<template>
  <div class="mx-6 mt-6 py-6 px-16">
    <AssetTitle title="Created NFTs" />
    <h4
      v-if="deployedAssets.length === 0 && pendingAssets.length === 0"
      class="text-xl text-center pt-8"
    >
      You have not created any NFT!
    </h4>
    <AssetTitle
      v-if="deployedAssets.length && pendingAssets.length"
      title="Pending"
    />
    <div class="flex flex-wrap justify-center sm:justify-start">
      <div
        v-for="asset in pendingAssets"
        :key="asset['guid']"
      >
        <AssetListCard :asset="asset" />
      </div>
    </div>
    <br>
    <AssetTitle
      v-if="deployedAssets.length && pendingAssets.length"
      title="Ready To Use"
    />
    <div class="flex flex-wrap justify-center sm:justify-start">
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
import AssetTitle from '@/components/AssetTitle';
import { internalService } from '@/services/internal';
import { mapGetters } from 'vuex';
import eventBus from '@/utils/eventBus';
import staffOnly from '@/mixins/staffOnly';

export default {
  name: 'UserCreatedAssetList',
  components: {
    AssetListCard,
    AssetTitle
  },
  mixins: [staffOnly],
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
        ordering: 'created_at',
        creator_address: this.account,
        status__exclude: 'RD'
      });
      this.pendingAssets = response['results'] || [];
    },
    async fetchDeployedAssetList() {
      const response = await internalService.getAssets({
        ordering: 'created_at',
        creator_address: this.account,
        status: 'RD'
      });
      this.deployedAssets = response['results'] || [];
    }
  }
};
</script>
