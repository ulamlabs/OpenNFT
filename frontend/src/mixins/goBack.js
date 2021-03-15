import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters({
      isStaff: 'internal/isStaff'
    })
  },
  methods: {
    goBack() {
      this.hasHistory() && this.isStaff ? this.$router.go(-1) : this.$router.push({
        name: 'Home'
      });
    },
    hasHistory() {
      return window.history.length > 2;
    }
  }
};
