import Vue from 'vue';
import App from '@/App.vue';

import '@/assets/css/tailwind.css';
import '@/assets/css/custom.css';

import VueTailwind from 'vue-tailwind';
import {
  TButton,
  TDropdown,
  TInput,
  TSelect,
  TTable,
  TTextarea
} from 'vue-tailwind/dist/components';

import store from '@/store';
import router from '@/router';
import goBack from '@/mixins/goBack';

const settings = {
  'fixed-table': {
    component: TTable,
    props: {
      classes: {
        table: 'w-full table-fixed divide-y divide-gray-100 shadow-sm border-gray-200 border',
        thead: 'divide-y divide-gray-100',
        theadTr: '',
        theadTh: 'px-3 py-2 font-semibold text-left bg-gray-100 border-b',
        tbody: 'bg-white divide-y divide-gray-100 border-l border-r',
        tr: '',
        td: 'px-3 py-2 whitespace-no-wrap truncate',
        tfoot: 'bord',
        tfootTr: '',
        tfootTd: '',
      }
    }
  },
  't-nav-button': {
    component: TButton,
    props: {
      classes: 'inline-flex whitespace-nowrap items-center h-10 px-5 m-2 text-base text-white transition-colors duration-150 bg-indigo-500 rounded-lg focus:shadow-outline hover:bg-indigo-800'
    }
  },
  't-button': {
    component: TButton,
    props: {
      classes: 'block w-full text-center bg-indigo-500 hover:bg-indigo-600 focus:shadow-outline focus:outline-none text-white text-base leading-6 font-medium py-3 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed'
    }
  },
  't-light-button': {
    component: TButton,
    props: {
      classes: 'block w-full text-center bg-indigo-50 hover:bg-indigo-100 focus:shadow-outline focus:outline-none text-indigo-700 text-base leading-6 font-medium py-3 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed'
    }
  },
  't-white-button': {
    component: TButton,
    props: {
      classes: 'block w-full text-center bg-white hover:bg-gray-50 border border-gray-300 focus:shadow-outline focus:outline-none text-gray-700 text-base leading-6 font-medium py-3 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed'
    }
  },
  't-featured-button': {
    component: TButton,
    props: {
      classes: 'block w-full min-w-max text-center bg-indigo-500 hover:bg-indigo-600 focus:shadow-outline focus:outline-none text-white text-base leading-6 font-medium py-3 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed'
    }
  },
  't-white-featured-button': {
    component: TButton,
    props: {
      classes: 'block w-full min-w-max text-center bg-white hover:bg-gray-50 border border-gray-300 focus:shadow-outline focus:outline-none text-indigo-700 text-base leading-6 font-medium py-3 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed'
    }
  },
  'modal-button': {
    component: TButton,
    props: {
      classes: 'bg-indigo-500 hover:bg-indigo-600 mt-3 w-full justify-center text-white rounded-md border border-indigo-500 shadow-sm sm:w-36 py-2 sm:py-3 sm:text-base text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 disabled:opacity-50 disabled:cursor-not-allowed'
    }
  },
  'red-modal-button': {
    component: TButton,
    props: {
      classes: 'bg-rose-500 hover:bg-rose-600 mt-3 w-full justify-center text-white rounded-md shadow-sm sm:w-36 py-2 sm:py-3 sm:text-base text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 sm:mt-0 disabled:opacity-50 disabled:cursor-not-allowed'
    }
  },
  'cancel-modal-button': {
    component: TButton,
    props: {
      classes: 'mt-3 w-full justify-center rounded-md border border-gray-300 shadow-sm sm:w-36 py-2 sm:py-3 bg-white sm:text-base text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:mr-3'
    }
  },
  't-textarea': {
    component: TTextarea,
    props: {
      classes: 'block w-full px-3 py-2 text-black placeholder-gray-400 transition duration-100 ease-in-out bg-white border border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-opacity-50  disabled:opacity-50 disabled:cursor-not-allowed resize-none',
      variants: {
        'danger': 'border-red-300 bg-red-50 placeholder-red-200 text-red-900 block w-full px-3 py-2 text-black placeholder-gray-400 transition duration-100 ease-in-out bg-white border border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-opacity-50  disabled:opacity-50 disabled:cursor-not-allowed resize-none'
      }
    }
  },
  'nav-dropdown': {
    component: TDropdown,
    props: {
      classes: {
        wrapper: 'inline-flex flex-col',
        dropdownWrapper: 'relative z-50',
        dropdown: 'origin-top-left absolute left-0 w-full rounded shadow bg-white mt-1',
        enterClass: '',
        enterActiveClass: 'transition ease-out duration-100 transform opacity-0 scale-95',
        enterToClass: 'transform opacity-100 scale-100',
        leaveClass: 'transition ease-in transform opacity-100 scale-100',
        leaveActiveClass: '',
        leaveToClass: 'transform opacity-0 scale-95 duration-75',
      }
    }
  },
  't-input': {
    component: TInput,
    props: {
      fixedClasses: 'block w-full px-3 py-2 transition duration-100 ease-in-out border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed',
      classes: 'text-black placeholder-gray-400 bg-white border-gray-300 focus:border-blue-500 ',
      variants: {
        danger: 'border-red-300 bg-red-50 placeholder-red-200 text-red-900',
        success: 'border-green-300 bg-green-50 placeholder-gray-400 text-green-900'
      }
    }
  },
  't-currency-input': {
    component: TInput,
    props: {
      fixedClasses: 'block w-full px-3 py-2 transition duration-100 ease-in-out border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed pr-16',
      classes: 'text-black placeholder-gray-400 bg-white border-gray-300 focus:border-blue-500 ',
      variants: {
        danger: 'border-red-300 bg-red-50 placeholder-red-200 text-red-900',
        success: 'border-green-300 bg-green-50 placeholder-gray-400 text-green-900'
      }
    }
  },
  't-select': {
    component: TSelect
  }
};

Vue.use(VueTailwind, settings);

Vue.config.productionTip = false;

Vue.mixin(goBack);

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app');
