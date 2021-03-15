<template>
  <Card class="max-w-md sm:ml-2 sm:mr-2 md:mr-2 md:ml-2 mb-2 md:mb-2">
    <button
      class="py-2 px-2 focus:outline-none asset-card"
      @click="onClick"
    >
      <div class="flex flex-col justify-center h-full text-center">
        <div class="mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        </div>
        <h2 class="tracking-widest">
          View more...
        </h2>
      </div>
    </button>
  </Card>
</template>
<script>
import Card from '@/components/cards/Card';

export default {
  name: 'ViewMore',
  components: {
    Card
  },
  methods: {
    onClick() {
      this.$emit('click');
    }
  }
};
</script>
<style scoped>
.asset-card {
  width: 16rem;
  height: 20rem;
  overflow: hidden;
}
</style>
