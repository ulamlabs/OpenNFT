import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters({
      account: 'algorand/account',
      isStaff: 'internal/isStaff',
      isFetched: 'internal/isFetched'
    })
  },
  watch: {
    account() {
      this.redirectIfNotStaff();
    },
    isStaff() {
      this.redirectIfNotStaff();
    },
    isFetched() {
      this.redirectIfNotStaff();
    }
  },
  methods: {
    redirectIfNotStaff() {
      if (!this.account) {
        this.goBack();
      }
      if (!this.isStaff && this.isFetched) {
        this.goBack();
      }
    }
  },
  mounted() {
    this.redirectIfNotStaff();
  }
};
