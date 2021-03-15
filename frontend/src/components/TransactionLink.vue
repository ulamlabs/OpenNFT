<template>
  <a
    class="underline truncate"
    :href="transactionLink"
  >{{ transactionDisplay }}</a>
</template>
<script>
import { ALGORAND_LEDGER } from '@/config';

export default {
  name: 'TransactionLink',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  computed: {
    transactionDisplay() {
      return (
        this.id.substring(0, 3) +
        '...' +
        this.id.substring(this.id.length - 3, this.id.length)
      );
    },
    transactionLink() {
      if (ALGORAND_LEDGER.toUpperCase() === 'TESTNET') {
        return `https://testnet.algoexplorer.io/tx/${this.id}`;
      } else {
        return `https://algoexplorer.io/tx/${this.id}`;
      }
    },
  }
};
</script>
