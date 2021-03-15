<template>
  <div>
    <div v-if="!rawStore.connected">
      <component
        :is="component"
        :disabled="!!error"
        @click="onConnect"
      >
        {{ label }}
      </component>
    </div>
    <div v-else-if="!isReady || spinner">
      <component
        :is="component"
        disabled
      >
        <span class="inline-block pr-2 align-middle spinner">
          <Spinner size="tiny" />
        </span>
        <span>{{ label }}</span>
      </component>
    </div>
    <div
      v-else
      class="flex items-center flex-col justify-center"
      @mouseenter="toggleTooltip()"
      @mouseleave="toggleTooltip()"
    >
      <component
        :is="component"
        ref="btnRef"
        :disabled="!isReadyToTransact || !!error"
        @click="onExecute"
      >
        <span>{{ label }}</span>
      </component>
      <div>
        <div class="mx-auto absolute">
          <div
            v-show="typeof(error) === 'string'"
            :class="{'hidden': !tooltipShow, 'block': tooltipShow}"
            class="relative mt-1 mb-1 tooltip bg-gray-600 border-0 block z-50 font-normal leading-normal text-sm max-w-xs text-left no-underline break-words rounded-lg"
          >
            <div>
              <div class="text-white p-3">
                {{ error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import Spinner from 'vue-simple-spinner';
import eventBus from '@/utils/eventBus';

export default {
  name: 'ActionButton',
  components: {
    Spinner
  },
  props: {
    label: {
      type: String,
      required: true,
    },
    execute: {
      type: Function,
      required: true,
    },
    validate: {
      type: Function,
      default: null,
      required: false,
    },
    error: {
      type: [String, Boolean],
      default: null,
      required: false,
    },
    applicationId: {
      type: Number,
      default: null,
    },
    assetIds: {
      type: Array,
      default: null
    },
    component: {
      type: [Object, String],
      default: 't-button'
    }
  },
  data() {
    return {
      tooltipShow: false,
      spinner: false
    };
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore',
      userStates: 'algorand/userStates',
      userAssets: 'algorand/userAssets',
      isReady: 'algorand/isReadyToTransact',
      isReadyToTransact: 'algorand/isReadyToTransact',
      account: 'algorand/account',
    }),
    currentRouteName() {
      return this.$route.name;
    },
    requiresApplicationOptIn() {
      return !!(this.applicationId && !this.userStates[this.applicationId]);
    },
    requiredAssetOptIns() {
      let assetIds = [];
      if (!this.assetIds) {
        return [];
      }
      for (let assetId of this.assetIds) {
        assetId = String(assetId);
        if (assetId && !this.userAssets[assetId]) {
          assetIds.push(assetId);
        }
      }
      return assetIds;
    }
  },
  methods: {
    toggleTooltip: function() {
      if (typeof this.error !== 'string') {
        this.tooltipShow = false;
        return;
      }
      this.tooltipShow = !this.tooltipShow;
    },
    onConnect() {
      eventBus.$emit('open-select-wallet');
    },
    async onExecute() {
      if (this.validate) {
        try {
          this.spinner = true;
          if (!await this.validate()) {
            return;
          }
        } finally {
          this.spinner = false;
        }
      }
      if (this.requiresApplicationOptIn) {
        await this.$store.dispatch('algorand/QUEUE_ACTION', {
          actionMethod: async () => {
            await this.rawStore.walletManager.optInApp(this.account, this.applicationId);
          },
          actionMessage: 'Opting-in to application...',
          actionVerificationMethod: async ({ getters }) => {
            await this.$store.dispatch('algorand/FETCH_ACCOUNT_DATA', {});
            return !!getters.userStates[this.applicationId];
          }
        });
      }
      if (this.requiredAssetOptIns) {
        for (let assetIndex of this.requiredAssetOptIns) {
          await this.$store.dispatch('algorand/QUEUE_ACTION', {
            actionMethod: async () => {
              await this.rawStore.walletManager.optInAsset(this.account, Number(assetIndex));
            },
            actionMessage: 'Opting-in to ASA...',
            actionVerificationMethod: async ({ getters }) => {
              await this.$store.dispatch('algorand/FETCH_ACCOUNT_DATA', {});
              return !!getters.userAssets[assetIndex];
            }
          });
        }
      }
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          await this.execute();
        },
        backgroundAction: true
      });

    }
  },
};
</script>
<style scoped>
.spinner {
  position: relative;
  bottom: 1px;
}

.tooltip {
  transform: translateX(-50%);
}
</style>
