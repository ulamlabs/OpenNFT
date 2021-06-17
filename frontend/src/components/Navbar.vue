<template>
  <div>
    <nav class="bg-white">
      <div class="lg:w-5/6 mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-20">
          <div class="inset-y-0 left-0 flex items-center md:hidden">
            <!-- Mobile menu button-->
            <button
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              :aria-expanded="menuIsOpened"
              @click="toggleMenu"
            >
              <span class="sr-only">Open main menu</span>
              <!-- Icon when menu is closed. -->
              <!--
              Heroicon name: outline/menu

              Menu open: "hidden", Menu closed: "block"
            -->
              <svg
                v-if="!menuIsOpened"
                class="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <!-- Icon when menu is open. -->
              <!--
              Heroicon name: outline/x

              Menu open: "block", Menu closed: "hidden"
            -->
              <svg
                v-if="menuIsOpened"
                class="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <a
                href="#"
                @click="goHome"
              >
                <img
                  class="hidden md:block h-8 w-auto"
                  src="https://tailwindui.com/img/logos/workflow-mark-indigo-500.svg"
                  alt="Workflow"
                >
              </a>
            </div>
          </div>
          <div class="flex">
            <div class="hidden md:ml-6 md:flex md:space-x-8">
              <router-link
                v-for="entry in entries"
                :key="entry.to"
                :to="entry.to"
                :exact="entry.exact"
                active-class="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-base font-medium"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-base font-medium"
              >
                {{ entry.label }}
              </router-link>
              <a
                href="https://www.ulam.io/case-studies/opennft-whitelabel-nft-marketplace/"
                target="blank"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-base font-medium"
              >
                Case Study
              </a>
            </div>
          </div>
          <div class="right-0 flex pr-2 static inset-auto ml-6 pr-0">
            <div
              v-if="!rawStore.connected"
              class="flex items-center"
            >
              <ConnectToWalletButton />
            </div>
            <div
              v-else
              class="flex items-center"
            >
              <AccountButton />
            </div>
          </div>
        </div>
      </div>

      <!--
      Mobile menu, toggle classes based on menu state.

      Menu open: "block", Menu closed: "hidden"
      -->
      <div :class="menuClass">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <router-link
            v-for="entry in entries"
            :key="entry.to"
            :to="entry.to"
            :exact="entry.exact"
            active-class="bg-indigo-50 border-indigo-500 text-indigo-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            {{ entry.label }}
          </router-link>
          <a
            href="#"
            target="blank"
            class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Case Study
          </a>
        </div>
      </div>
    </nav>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import AccountButton from '@/components/AccountButton';
import ConnectToWalletButton from '@/components/ConnectToWalletButton';

export default {
  name: 'Navbar',
  components: {
    AccountButton,
    ConnectToWalletButton
  },
  data() {
    return {
      menuIsOpened: false
    };
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore'
    }),
    menuClass() {
      if (this.menuIsOpened) {
        return 'block md:hidden';
      } else {
        return 'hidden md:hidden';
      }
    },
    entries() {
      return [
        {
          label: 'Home',
          to: '/',
          exact: true
        },
        {
          label: 'All Items',
          to: '/all-items',
          exact: true
        },
        {
          label: 'For Sale',
          to: '/for-sale',
          exact: true
        },
        {
          label: 'Highest Bids',
          to: '/highest-bids',
          exact: true
        },
        {
          label: 'Recent',
          to: '/recently-added',
          exact: true
        }
      ];
    }
  },
  methods: {
    goHome() {
      this.$router.push({
        name: 'Home'
      });
    },
    toggleMenu() {
      this.menuIsOpened = !this.menuIsOpened;
    }
  }
};
</script>
