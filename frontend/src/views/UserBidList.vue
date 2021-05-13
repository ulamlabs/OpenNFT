<template>
  <div class="mx-6 mt-6 py-6 px-16">
    <AssetTitle title="My Bids" />
    <h4
      v-if="assets.length === 0"
      class="text-xl text-center pt-8"
    >
      You have no bids!
    </h4>
    <div class="flex flex-wrap justify-center sm:justify-start">
      <div
        v-for="asset in assets"
        :key="asset['guid']"
      >
        <AssetListCard
          :asset="asset"
          :with-my-bid="true"
        />
      </div>
    </div>
  </div>
</template>
<script>
import AssetListCard from '@/components/cards/AssetListCard';
import AssetTitle from '@/components/AssetTitle';
import { internalService } from '@/services/internal';
import { mapGetters } from 'vuex';
import { BID_PRICE } from '@/utils/constants';
import eventBus from '@/utils/eventBus';
import authOnly from '@/mixins/authOnly';

export default {
  name: 'UserBidList',
  components: {
    AssetListCard,
    AssetTitle
  },
  mixins: [authOnly],
  data() {
    return {
      assets: []
    };
  },
  computed: {
    ...mapGetters({
      userAssets: 'algorand/userAssets',
      account: 'algorand/account',
      userStates: 'algorand/userStates'
    })
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
      const appIds = Object.keys(this.userStates).filter(key => {
        const userState = this.userStates[key];
        return !!userState[BID_PRICE];
      });
      if (appIds.length === 0) {
        this.assets = [];
        return;
      }
      const response = await internalService.getAssets({
        status: 'RD',
        ordering: 'created_at',
        application_id__in: appIds
      });
      this.assets = response['results'];
    }
  }
};
</script>
