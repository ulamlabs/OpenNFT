<template>
  <div>
    <t-nav-button
      v-if="!rawStore.fetchedAccounts"
      class="inline-flex whitespace-nowrap items-center h-8 px-4 m-2 text-sm text-indigo-100 transition-colors duration-150 bg-indigo-700 rounded-lg focus:shadow-outline hover:bg-indigo-800"
    >
      Please wait...
    </t-nav-button>
    <t-nav-button
      v-else-if="rawStore.accounts.length === 0"
      class="inline-flex whitespace-nowrap items-center h-8 px-4 m-2 text-sm text-indigo-100 transition-colors duration-150 bg-indigo-700 rounded-lg focus:shadow-outline hover:bg-indigo-800"
    >
      No accounts
    </t-nav-button>
    <div
      v-else-if="isReady"
      class="m-2"
    >
      <nav-dropdown>
        <div
          slot="trigger"
          slot-scope="{
            mousedownHandler,
            focusHandler,
            blurHandler,
            keydownHandler,
            hide
          }"
          class="flex"
        >
          <t-nav-button
            classes="inline-flex items-center h-8 px-4 text-sm text-indigo-100 transition-colors duration-150 bg-indigo-700 rounded-l focus:shadow-outline hover:bg-indigo-800"
            @click="onSelectAccount(hide)"
          >
            {{ accountDisplay }}
            <img
              :src="logo"
              class="logo ml-2"
              alt="Algorand Logo"
            >
          </t-nav-button>
          <t-nav-button
            classes="inline-flex items-center h-8 px-4 text-sm text-indigo-100 transition-colors duration-150 bg-indigo-700 rounded-r focus:shadow-outline hover:bg-indigo-800 border-l border-black"
            @mousedown="mousedownHandler"
            @focus="focusHandler"
            @blur="blurHandler"
            @keydown="keydownHandler"
          >
            <svg
              class="w-4 h-4 text-white fill-current"
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
            >
              <g
                stroke="none"
                stroke-width="1"
                fill="currentColor"
                fill-rule="evenodd"
              >
                <g id="icon-shape">
                  <polygon
                    id="Combined-Shape"
                    points="9.29289322 12.9497475 10 13.6568542 15.6568542 8 14.2426407 6.58578644 10 10.8284271 5.75735931 6.58578644 4.34314575 8"
                  />
                </g>
              </g>
            </svg>
          </t-nav-button>
        </div>
        <div slot-scope="{ hide }">
          <button
            class="block w-full px-4 py-2 text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            role="menuitem"
            @click="onSelectAccount(hide)"
          >
            Select Account
          </button>
          <hr>
          <button
            v-if="isStaff"
            class="block w-full px-4 py-2 text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            role="menuitem"
            @click="onViewCreateNewAsset(hide)"
          >
            Create new NFT
          </button>
          <button
            v-if="isStaff"
            class="block w-full px-4 py-2 text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            role="menuitem"
            @click="onViewCreatedAssets(hide)"
          >
            Created NFTs
          </button>
          <hr v-if="isStaff">
          <button
            class="block w-full px-4 py-2 text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            role="menuitem"
            @click="onViewMyAssets(hide)"
          >
            My NFTs
          </button>
          <button
            class="block w-full px-4 py-2 text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            role="menuitem"
            @click="onViewMyBids(hide)"
          >
            My bids
          </button>
          <hr>
          <button
            class="block w-full px-4 py-2 text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            role="menuitem"
            @click="onLogout(hide)"
          >
            Logout
          </button>
        </div>
      </nav-dropdown>
    </div>
    <t-nav-button
      v-else
      class="inline-flex whitespace-nowrap items-center h-8 px-4 m-2 text-sm text-indigo-100 transition-colors duration-150 bg-indigo-700 rounded-lg focus:shadow-outline hover:bg-indigo-800"
    >
      Please wait...
    </t-nav-button>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import eventBus from '@/utils/eventBus';

export default {
  name: 'AccountButton',
  data() {
    return {
      logo: require('@/assets/algorand-logo.svg')
    };
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore',
      isReady: 'algorand/isReady',
      isStaff: 'internal/isStaff',
    }),
    accountDisplay() {
      const account = this.rawStore.account;
      return (
        account.substring(0, 3) +
        '...' +
        account.substring(account.length - 3, account.length)
      );
    },
  },
  methods: {
    onViewCreateNewAsset(hide) {
      this.$router.push({
        name: 'AddAsset'
      });
      hide();
    },
    onLogout(hide) {
      this.$store.dispatch('algorand/DISCONNECT');
      hide();
    },
    onSelectAccount(hide) {
      this.$store.dispatch('algorand/FETCH_ACCOUNTS');
      eventBus.$emit('open-select-account');
      hide();
    },
    onViewMyAssets(hide) {
      this.$router.push({
        name: 'UserAssetList'
      });
      hide();
    },
    onViewMyBids(hide) {
      this.$router.push({
        name: 'UserBidList'
      });
      hide();
    },
    onViewCreatedAssets(hide) {
      this.$router.push({
        name: 'UserCreatedAssetList'
      });
      hide();
    }
  },
};
</script>
<style scoped>
.logo {
  display: inline;
  height: 0.75rem;
}
</style>
