<template>
  <div>
    <hr
      v-if="!renderResponsive || (renderResponsive && data.length)"
      class="mb-8 mt-8"
    >
    <h3 class="text-gray-700 tracking-wide mb-8">
      Transaction History
    </h3>
    <table
      v-if="!renderResponsive"
      class="w-full table-fixed divide-y divide-gray-100 shadow-sm border-gray-200 border"
    >
      <thead class="divide-y divide-gray-100">
        <th
          v-for="(header, headerIndex) in headers"
          :key="headerIndex"
          class="px-3 py-2 font-semibold text-left bg-gray-100 border-b"
        >
          {{ header }}
        </th>
      </thead>
      <tbody class="bg-white divide-y divide-gray-100 border-l border-r">
        <tr
          v-for="(row, rowIndex) in data"
          :key="rowIndex"
        >
          <td
            v-for="(header, headerIndex) in headers"
            :key="rowIndex + '' + headerIndex"
            class="px-3 py-2 whitespace-no-wrap truncate"
          >
            <template v-if="header === 'Who'">
              <AddressLink :address="row[header.toLowerCase()]" />
            </template>
            <template v-else-if="header === 'Transaction'">
              <TransactionLink :id="row[header.toLowerCase()]" />
            </template>
            <template v-else>
              {{ row[header.toLowerCase()] }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>
    <table
      v-if="renderResponsive"
      class="w-full table-fixed border-none"
    >
      <tbody>
        <template v-for="(row, rowIndex) in data">
          <tr
            v-for="(header, headerIndex) in headers"
            :key="rowIndex + '' + headerIndex"
            class="border-2"
          >
            <td class="px-2 py-2 w-28">
              <strong>{{ header }}</strong>
            </td>
            <td
              class="truncate block px-2 py-2 w-100"
            >
              <template v-if="header === 'Who'">
                <AddressLink :address="row[header.toLowerCase()]" />
              </template>
              <template v-else-if="header === 'Transaction'">
                <TransactionLink :id="row[header.toLowerCase()]" />
              </template>
              <template v-else>
                {{ row[header.toLowerCase()] }}
              </template>
            </td>
          </tr>
          <tr
            v-if="rowIndex < data.length - 1"
            :key="`${rowIndex}_`"
            class="bg-white h-10 border-r-0 border-l-0"
          >
            <td class="w-min" />
            <td class="w-100" />
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
<script>
import { internalService } from '@/services/internal';
import * as moment from 'moment';
import eventBus from '@/utils/eventBus';
import humanizeString from 'humanize-string';
import { toDisplayValue } from '@/utils/precision';
import AddressLink from '@/components/AddressLink';
import TransactionLink from '@/components/TransactionLink';

export default {
  name: 'TransactionTable',
  components: { TransactionLink, AddressLink },
  props: {
    assetGuid: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      data: [],
      headers: ['Type', 'Who', 'Price', 'Transaction', 'When'],
      windowWidth: window.innerWidth
    };
  },
  computed: {
    renderResponsive() {
      const { windowWidth } = this;
      return windowWidth && windowWidth < 768;
    }
  },
  mounted() {
    this.fetchTransactions();
    window.addEventListener('resize', this.resizeListener);
    eventBus.$on('update', this.fetchTransactions);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeListener);
    eventBus.$off('update');
  },
  methods: {
    resizeListener() {
      this.windowWidth = window.innerWidth;
    },
    async fetchTransactions() {
      const response = await internalService.getOperations({
        'asset__guid': this.assetGuid
      });
      this.data = this.mapTransactions(response['results']);
    },
    mapTransactions(transactions) {
      return transactions.map((tx) => {
        if (tx['op_type'] === 'ASK' && tx['value'] === 0) {
          tx['op_type'] = 'Cancel ask';
        } else if (tx['op_type'] === 'BID' && tx['value'] === 0) {
          tx['op_type'] = 'Cancel bid';
        }
        return {
          type: humanizeString(tx['op_type'].replace('_', ' ')),
          who: tx['sender'],
          price: tx['value'] ? toDisplayValue(tx['value']) + ' USDC' : 'N/A',
          transaction: tx['tx_id'],
          when: moment(tx['block_time']).fromNow()
        };
      });
    }
  }
};
</script>
