<template>
  <div>
    <div class="relative bg-gray-800 header flex flex-col justify-center items-center">
      <div class="topImage sm:w-96 w-1/2 cursor-pointer">
        <FileInput
          :value="imageValue"
          :error="errors['image']"
          @change="onImageChange"
        >
          <div class="w-full aspect-w-10 aspect-h-10">
            <img
              v-if="image"
              :src="image"
              class="object-cover rounded-lg"
              alt="NFT Logo"
              @error="onImageError"
            >
            <div
              v-else
              class="bg-white rounded-lg p-3 sm:p-10"
            >
              <div
                class="h-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center space-y-2"
              >
                <svg
                  width="38"
                  height="38"
                  viewBox="0 0 38 38"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 5H5C3.93913 5 2.92172 5.42143 2.17157 6.17157C1.42143 6.92172 1 7.93913 1 9V29M1 29V33C1 34.0609 1.42143 35.0783 2.17157 35.8284C2.92172 36.5786 3.93913 37 5 37H29C30.0609 37 31.0783 36.5786 31.8284 35.8284C32.5786 35.0783 33 34.0609 33 33V25M1 29L10.172 19.828C10.9221 19.0781 11.9393 18.6569 13 18.6569C14.0607 18.6569 15.0779 19.0781 15.828 19.828L21 25M33 17V25M33 25L29.828 21.828C29.0779 21.0781 28.0607 20.6569 27 20.6569C25.9393 20.6569 24.9221 21.0781 24.172 21.828L21 25M21 25L25 29M29 5H37M33 1V9M21 13H21.02"
                    stroke="#9CA3AF"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <div class="text-sm leading-5 font-medium text-indigo-600">
                  Upload a file
                </div>
                <div class="text-xs text-center text-gray-500 leading-4 font-normal">
                  PNG, JPG, GIF up to 4MB <br>
                  1000 x 1000 px
                </div>
              </div>
            </div>
          </div>
        </FileInput>
      </div>
    </div>

    <div class="flex flex-col mx-auto my-32 md:max-w-xl max-w-sm">
      <div class="text-gray-900 text-lg leading-6 font-medium">
        Create NFT
      </div>
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
      <p class="my-2 text-gray-500 text-sm leading-5 font-normal">
        Total cost: {{ creationCost }} Algos
      </p>
      <div
        v-if="errors['limits']"
        class="bg-red-50 my-2 p-4 flex space-x-4"
      >
        <div class="mt-0.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM6.70711 5.29289C6.31658 4.90237 5.68342 4.90237 5.29289 5.29289C4.90237 5.68342 4.90237 6.31658 5.29289 6.70711L6.58579 8L5.29289 9.29289C4.90237 9.68342 4.90237 10.3166 5.29289 10.7071C5.68342 11.0976 6.31658 11.0976 6.70711 10.7071L8 9.41421L9.29289 10.7071C9.68342 11.0976 10.3166 11.0976 10.7071 10.7071C11.0976 10.3166 11.0976 9.68342 10.7071 9.29289L9.41421 8L10.7071 6.70711C11.0976 6.31658 11.0976 5.68342 10.7071 5.29289C10.3166 4.90237 9.68342 4.90237 9.29289 5.29289L8 6.58579L6.70711 5.29289Z"
              fill="#F87171"
            />
          </svg>
        </div>
        <p class="text-red-800 text-sm leading-5 font-medium">
          {{ errors["limits"] }}
        </p>
      </div>
      <div class="mt-2 w-36 mx-auto">
        <ActionButton
          label="Add NFT"
          :execute="onAddAsset"
          :validate="validate"
          :error="errors['limits'] || !!errors.length"
        />
      </div>
    </div>
  </div>
</template>
<script>
import ActionButton from '@/components/ActionButton';
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
    ActionButton,
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
      creationCost: 0.302 + 1.508 + 0.001 * 4
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
      const files = (e.target && e.target.files) || (e.dataTransfer && e.dataTransfer.files);
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
      this.errors =
        (await internalService.validateAsset({
          unit_name: this.unitName,
          name: this.assetName,
          description: this.assetDescription
        })) || {};
      if (!this.image) {
        this.$set(this.errors, 'image', 'Image is required');
      }
      await this.validateLimits();
      return Object.keys(this.errors).length === 0;
    },
    validateLimits() {
      if (Object.keys(this.userStates).length >= 10) {
        this.$set(
          this.errors,
          'limits',
          'You’ve exceeded the maximum amount of opted-in applications created per Algorand account. Use a different account or opt-out of other applications.'
        );
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
          const asset = Object.values(getters['userCreatedAssets']).find(asset => {
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
<style scoped>
.header {
  height: 35rem;
}
</style>
