<template>
  <t-nav-button
    @click="onConnect"
  >
    Connect To Wallet
  </t-nav-button>
</template>
<script>
import eventBus from '@/utils/eventBus';

export default {
  name: 'ConnectToWalletButton',
  methods: {
    onConnect() {
      eventBus.$emit('open-select-wallet');
    }
  }
};
</script>
