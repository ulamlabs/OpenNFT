<template>
  <div>
    <h1 class="mb-8 tracking-widest text-center">
      My Bids
    </h1>
    <h4
      v-if="assets.length === 0"
      class="text-center mb-8"
    >
      You have no bids!
    </h4>
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
import { mapGetters } from 'vuex';
import { BID_PRICE } from '@/utils/constants';
import eventBus from '@/utils/eventBus';
import authOnly from '@/mixins/authOnly';

export default {
  name: 'UserBidList',
  components: {
    AssetListCard
  },
  mixins: [authOnly],
  data() {
    return {
      assets: [],
    };
  },
  computed: {
    ...mapGetters({
      userAssets: 'algorand/userAssets',
      account: 'algorand/account',
      userStates: 'algorand/userStates'
    }),
  },
  watch: {
    userAssets() {
      this.fetchAssetList();
    },
    userStates() {
      this.fetchAssetList();
    }
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
      const appIds = Object.keys(this.userStates).filter((key) => {
        const userState = this.userStates[key];
        return !!userState[BID_PRICE];
      });
      if (appIds.length === 0) {
        this.assets = [];
        return;
      }
      const response = await internalService.getAssets({
        'status': 'RD',
        'ordering': 'created_at',
        'application_id__in': appIds
      });
      this.assets = response['results'];
    }
  }
};
</script>
