<template>
  <div>
    <div class="w-full flex flex-col items-center mb-16">
      <div class="px-4 py-4">
        <div class="shadow-md max-w-md w-full">
          <img
            v-if="image"
            :src="image"
            class="object-cover w-full"
            alt="NFT Logo"
            @error="onImageError"
          >
          <ImagePlaceholder
            v-else
            width="640"
            height="640"
            class="object-cover w-full"
          />
        </div>
        <FileInput
          class="mt-4"
          :value="imageValue"
          :error="errors['image']"
          @change="onImageChange"
        />
      </div>
    </div>
    <PageCard>
      <div class="py-4 px-4 mt-3">
        <div class="flex flex-col">
          <div class="flex flex-row flex-wrap">
            <div class="flex flex-row flex-grow px-4">
              <div class="flex flex-col flex-grow">
                <h2 class="text-gray-700 font-semibold tracking-wide mb-2">
                  Create NFT
                </h2>
                <p
                  v-if="errors['limits']"
                  class="text-red-900"
                >
                  {{ errors['limits'] }}
                </p>
                <div class="mt-4">
                  <NInput
                    :value="unitName"
                    label="Ticker Symbol"
                    :error="errors['unit_name']"
                    @change="onUnitNameChange"
                    @input="onUnitNameInput"
                  />
                </div>
                <div class="mt-4">
                  <NInput
                    v-model="assetName"
                    label="Asset Name"
                    :error="errors['name']"
                    @input="clearErrors"
                  />
                </div>
                <div class="mt-4">
                  <NInput
                    v-model="assetDescription"
                    label="Description"
                    :error="errors['description']"
                    component="t-textarea"
                    rows="6"
                    @input="clearErrors"
                  />
                </div>
              </div>
            </div>
          </div>
          <p class="px-4">
            Total cost: {{ creationCost }} Algos
          </p>

          <div class="flex flex-grow mt-4">
            <div class="mx-auto">
              <ActionButton
                label="Add NFT"
                :execute="onAddAsset"
                :validate="validate"
                :error="errors['limits'] || !!errors.length"
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
import ImagePlaceholder from 'vue-image-placeholder';
import { mapGetters } from 'vuex';
import { uuid } from 'uuidv4';
import { internalService } from '@/services/internal';
import NInput from '@/components/NInput';
import FileInput from '@/components/FileInput';
import { validateAlgoBalance } from '@/utils/validation';
import staffOnly from '@/mixins/staffOnly';
import { ASSET_URL } from '@/config';

export default {
  name: 'AddAssetCard',
  components: {
    PageCard,
    ActionButton,
    ImagePlaceholder,
    NInput,
    FileInput
  },
  mixins: [staffOnly],
  data() {
    return {
      unitName: '',
      assetName: '',
      assetDescription: '',
      image: null,
      imageFile: null,
      imageValue: '',
      errors: {},
      creationCost: 0.302 + 1.508 + (0.001 * 4)
    };
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore',
      account: 'algorand/account',
      userStates: 'algorand/userStates'
    })
  },
  watch: {
    userStates() {
      this.validateLimits();
    }
  },
  async mounted() {
    await this.validateLimits();
  },
  methods: {
    onUnitNameChange(e) {
      this.clearErrors();
      if (!e.target) {
        return;
      }
      this.unitName = String(e.target.value).toUpperCase();
    },
    onUnitNameInput(value) {
      this.unitName = String(value).toUpperCase();
    },
    async onImageChange(e) {
      this.clearErrors();
      const files = e.target && e.target.files || e.dataTransfer && e.dataTransfer.files;
      if (!files || !files.length) {
        return;
      }
      const limit = 4 * 1024 * 1024;
      if (files[0].size > limit) {
        this.$set(this.errors, 'image', 'File too large. Size should not exceed 4 MiB.');
        return;
      }
      this.imageFile = files[0];
      this.imageValue = e.target.value;
      this.image = await this.createImage(files[0]);
    },
    async createImage(file) {
      const image = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        this.image = reader.result;
      };
      await reader.readAsDataURL(file);
      return image.currentSrc;
    },
    async onImageError() {
      this.image = null;
      this.imageValue = '';
      this.imageFile = null;
      this.errors['image'] = 'Must be a valid image';
    },
    async validate() {
      this.errors = await internalService.validateAsset({
        unit_name: this.unitName,
        name: this.assetName,
        description: this.assetDescription
      }) || {};
      if (!this.image) {
        this.$set(this.errors, 'image', 'Image is required');
      }
      await this.validateLimits();
      console.log();
      return Object.keys(this.errors).length === 0;
    },
    validateLimits() {
      if (Object.keys(this.userStates).length >= 10) {
        this.$set(this.errors, 'limits', 'You\'ve exceeded the maximal amount of opted-in applications created per Algorand account. Use a different account or opt-out of other applications.');
      } else {
        delete this.errors['limits'];
        this.$forceUpdate();
      }
    },
    clearErrors() {
      this.errors = {};
    },
    async onCreatedAsset(asset, metadata, guid) {
      await validateAlgoBalance(this.creationCost);
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          await internalService.submitAsset({
            asset_id: asset['index'],
            ...metadata
          });
          await this.$router.push({
            name: 'DeployContract',
            params: {
              id: guid.replaceAll('-', '')
            },
            query: {
              start: true
            }
          });
        },
        actionMessage: 'Submitting asset...',
        requiresVerification: false
      });
    },
    async onAddAsset() {
      const accountAddress = this.account;
      const assetUUID = uuid();
      const metadata = {
        description: this.assetDescription,
        image: this.imageFile
      };
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          return await this.rawStore.walletManager.createAsset(accountAddress, {
            unitName: this.unitName,
            assetName: this.assetName,
            assetURL: ASSET_URL,
            metadataHash: assetUUID.replaceAll('-', '')
          });
        },
        actionMessage: 'Creating asset...',
        actionVerificationMethod: async ({ getters, dispatch }) => {
          await dispatch('FETCH_ACCOUNT_DATA', {});
          const asset = Object.values(getters['userCreatedAssets']).find((asset) => {
            return asset.params['metadata-hash'] === btoa(assetUUID.replaceAll('-', ''));
          });
          if (asset) {
            this.onCreatedAsset(asset, metadata, assetUUID).then();
            return true;
          }
          return false;
        }
      });
    }
  }
};
</script>
