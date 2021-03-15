<template>
  <div>
    <TopImage :image="image" />
    <PageCard>
      <div class="py-4 px-4 mt-3">
        <div class="flex flex-col">
          <div class="flex flex-row flex-wrap">
            <div class="flex flex-row flex-grow px-4">
              <div class="flex flex-col flex-grow">
                <h2 class="text-gray-700 font-semibold tracking-wide mb-2">
                  Create NFT
                </h2>
                <div class="mt-4">
                  <NInput
                    v-model="unitName"
                    disabled
                    label="Ticker Symbol"
                  />
                </div>
                <div class="mt-4">
                  <NInput
                    v-model="assetName"
                    disabled
                    label="Asset Name"
                  />
                </div>
                <div class="mt-4">
                  <NInput
                    v-model="assetDescription"
                    disabled
                    label="Description"
                    component="t-textarea"
                    rows="6"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-grow mt-4">
            <div class="mx-auto">
              <ActionButton
                :label="actionLabel"
                :execute="onSubmit"
                :validate="validate"
              />
            </div>
          </div>
        </div>
      </div>
    </PageCard>
  </div>
</template>
<script>
import PageCard from '@/components/cards/PageCard';
import ActionButton from '@/components/ActionButton';
import { mapGetters } from 'vuex';
import { internalService } from '@/services/internal';
import NInput from '@/components/NInput';
import { getMappedGlobalState } from '@/utils/format';
import { emitError } from '@/utils/errors';
import staffOnly from '@/mixins/staffOnly';
import TopImage from '@/components/TopImage';

export default {
  name: 'DeployContractCard',
  components: {
    TopImage,
    PageCard,
    ActionButton,
    NInput
  },
  mixins: [staffOnly],
  data() {
    return {
      unitName: '',
      assetName: '',
      assetDescription: '',
      image: null,
      assetId: null,
      status: null,
      creatorAddress: ''
    };
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore',
      isReadyToTransact: 'algorand/isReadyToTransact',
      account: 'algorand/account'
    }),
    actionLabel() {
      if (this.status === 'DA') {
        return 'Deploy Contract';
      } else if (this.status === 'DC') {
        return 'Finish Setup';
      }
      return '';
    }
  },
  async mounted() {
    const id = this.$route.params.id;
    if (!id) {
      await this.goBack();
    }
    try {
      await this.fetchAssetData();
    } catch (e) {
      await this.goBack();
    }
    if (this.status === 'RD') {
      await this.$router.push({
        name: 'AssetDetails',
        params: {
          id: this.$route.params.id
        }
      });
    } else if (this.$route.query.start && this.isReadyToTransact) {
      if (!this.creatorAddress || this.creatorAddress === this.rawStore.account) {
        await this.onSubmit();
      }
    }
    if (this.appId) {
      await this.$store.dispatch('algorand/FETCH_APPLICATION_DATA', { appId: this.appId });
    }
  },
  methods: {
    async validate() {
      if (this.status === 'RD') {
        await this.$router.push({
          name: 'AssetDetails',
          params: {
            id: this.$route.params.id
          }
        });
        return false;
      } else if (this.creatorAddress && this.creatorAddress !== this.rawStore.account) {
        emitError('This process can only be finished by the person who started it');
        return false;
      }
      return true;
    },
    async fetchAssetData() {
      const id = this.$route.params.id;
      const obj = await internalService.getAsset(id);
      if (!obj) {
        this.goBack();
      }
      this.unitName = obj['unit_name'];
      this.assetName = obj['name'];
      this.assetDescription = obj['description'];
      this.image = obj['image'];
      this.assetId = obj['asset_id'];
      this.appId = obj['application_id'];
      this.status = obj['status'];
      this.creatorAddress = obj['creator_address'];
    },
    async onSubmit() {
      if (this.status === 'DA') {
        await this.deploy();
      } else {
        await this.finishSetup();
      }
    },
    async whenDeployed(appId, txId) {
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          await internalService.submitContract({
            app_id: appId,
            tx_id: txId
          });
          this.finishSetup().then();
        },
        actionMessage: 'Submitting contract...',
        requiresVerification: false
      });
    },
    async onFinishedSetup(appId, txId) {
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          await internalService.submitConfiguration({
            app_id: appId,
            tx_id: txId
          });
          this.status = 'RD';
          await this.$router.push({
            name: 'AssetDetails',
            params: {
              id: this.$route.params.id
            }
          });
        },
        actionMessage: 'Submitting contract configuration...',
        requiresVerification: false
      });
    },
    async finishSetup() {
      await this.fetchAssetData();
      if (!this.appId) {
        return;
      }
      const accountAddress = this.rawStore.account;
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          return await this.rawStore.walletManager.configureContract(
            accountAddress,
            this.assetId,
            this.appId
          );
        },
        actionMessage: 'Creating contract configuration...',
        actionVerificationMethod: async ({ state, dispatch }) => {
          const actionResult = state.actionResult;
          const txId = actionResult['txId'];
          await dispatch('FETCH_APPLICATION_DATA', { appId: this.appId });
          const appState = getMappedGlobalState(state.applicationDataCache[this.appId]);
          if (appState['E'] !== 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=') {
            this.onFinishedSetup(this.appId, txId).then();
            return true;
          }
          return false;
        }
      });
    },
    async deploy() {
      const accountAddress = this.rawStore.account;
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          return await this.rawStore.walletManager.createContract(
            accountAddress,
            this.assetId
          );
        },
        actionMessage: 'Creating contract...',
        actionVerificationMethod: async ({ state, dispatch }) => {
          const actionResult = state.actionResult;
          const proxyAddress = actionResult['proxyAddress'];
          const oldAccountData = Object.assign( {}, state.accountDataCache[proxyAddress] || {});
          const oldAccountApps = oldAccountData['created-apps'] || [];
          await dispatch('FETCH_ACCOUNT_DATA', { customAddress: proxyAddress });
          const newAccountData = state.accountDataCache[proxyAddress];
          const newAccountApps = newAccountData['created-apps'] || [];
          if (newAccountApps.length > oldAccountApps.length) {
            const txId = actionResult['txId'];
            this.whenDeployed(newAccountApps[newAccountApps.length-1]['id'], txId).then();
            return true;
          }
          return false;
        }
      });
    }
  }
};
</script>
