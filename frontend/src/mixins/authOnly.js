import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters({
      account: 'algorand/account'
    })
  },
  watch: {
    account() {
      this.redirectIfNotLoggedIn();
    }
  },
  methods: {
    redirectIfNotLoggedIn() {
      if (!this.account) {
        this.goBack();
      }
    },
  },
  mounted() {
    this.redirectIfNotLoggedIn();
  }
};
