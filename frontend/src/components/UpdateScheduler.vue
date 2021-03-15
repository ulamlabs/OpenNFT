<template>
  <div />
</template>
<script>
import { mapGetters } from 'vuex';
import eventBus from '@/utils/eventBus';

export default {
  name: 'UpdateScheduler',
  data() {
    return {
      interval: null,
    };
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore',
    }),
  },
  created() {
    this.interval = setInterval(this.updateState, 6000);
  },
  destroy() {
    clearInterval(this.interval);
  },
  methods: {
    updateState() {
      if (this.rawStore.pendingAction) {
        return;
      }
      if (this.rawStore.pendingUpdate) {
        this.$store.dispatch('algorand/RUN_VERIFICATION_FUNC');
      } else if (this.rawStore.connected) {
        this.$store.dispatch('algorand/FETCH_ACCOUNTS');
        this.$store.dispatch('algorand/FETCH_ACCOUNT_DATA', {});
      }
      eventBus.$emit('update');
    }
  }
};
</script>
