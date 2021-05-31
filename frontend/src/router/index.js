import Vue from 'vue';
import VueRouter from 'vue-router';
import AddAsset from '@/views/AddAsset.vue';
import AssetList from '@/views/AssetList.vue';
import DeployContract from '@/views/DeployContract.vue';
import AssetDetails from '@/views/AssetDetails';
import UserAssetList from '@/views/UserAssetList';
import ForSale from '@/views/ForSale';
import AllItems from '@/views/AllItems';
import HighestBids from '@/views/HighestBids';
import RecentlyAdded from '@/views/RecentlyAdded';
import UserCreatedAssetList from '@/views/UserCreatedAssetList';
import UserBidList from '@/views/UserBidList';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: AssetList
  },
  {
    path: '/nft/:id',
    name: 'AssetDetails',
    component: AssetDetails
  },
  {
    path: '/admin/add-nft/:id',
    name: 'DeployContract',
    component: DeployContract,
    meta: true
  },
  {
    path: '/admin/add-nft',
    name: 'AddAsset',
    component: AddAsset,
    staffOnly: true
  },
  {
    path: '/admin/nft-list',
    name: 'UserCreatedAssetList',
    component: UserCreatedAssetList,
    staffOnly: true
  },
  {
    path: '/my-nfts',
    name: 'UserAssetList',
    component: UserAssetList,
  },
  {
    path: '/my-bids',
    name: 'UserBidList',
    component: UserBidList,
  },
  {
    path: '/all-items',
    name: 'AllItems',
    component: AllItems,
  },
  {
    path: '/for-sale',
    name: 'ForSale',
    component: ForSale,
  },
  {
    path: '/highest-bids',
    name: 'HighestBids',
    component: HighestBids,
  },
  {
    path: '/recently-added',
    name: 'RecentlyAdded',
    component: RecentlyAdded,
  }
];

const router = new VueRouter({
  routes,
  scrollBehavior() {
    return { x: 0, y: 0 };
  }
});

export default router;
