<template>
  <a
    class="underline truncate text-gray-700"
    :href="addressLink"
  >{{ addressDisplay }}</a>
</template>
<script>
import { ALGORAND_LEDGER } from '@/config';

export default {
  name: 'AddressLink',
  props: {
    address: {
      type: String,
      required: true
    }
  },
  computed: {
    addressDisplay() {
      return (
        this.address.substring(0, 3) +
        '...' +
        this.address.substring(this.address.length - 3, this.address.length)
      );
    },
    addressLink() {
      if (ALGORAND_LEDGER.toUpperCase() === 'TESTNET') {
        return `https://testnet.algoexplorer.io/address/${this.address}`;
      } else {
        return `https://algoexplorer.io/address/${this.address}`;
      }
    }
  }
};
</script>
