import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/home/home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/beneficiaries',
    name: 'beneficiaries',
    component: () => import(/* webpackChunkName: "beneficiaries" */ '../views/beneficiaries.vue')
  },
  {
    path: '/nominate',
    name: 'nominate',
    component: () => import(/* webpackChunkName: "nominate" */ '../views/nominate.vue')
  },
  {
    path: '/history',
    name: 'history',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "history" */ '../views/history.vue')
  },
  {
    path: '/middlemen',
    name: 'middlemen',
    component: () => import(/* webpackChunkName: "middlemen" */ '../views/middlemen.vue')
  }, {
    path: '/invitations',
    name: 'invitations',
    component: () => import(/* webpackChunkName: "invitations" */ '../views/invitations.vue')
  },
  {
    path: '/sign-in',
    name: 'sign-in',
    component: () => import(/* webpackChunkName: "sign-in" */ '../views/sign-in.vue')
  },
  {
    path: '/sign-up',
    name: 'sign-up',
    component: () => import(/* webpackChunkName: "sign-up" */ '../views/sign-up.vue')
  },
  {
    path: '/sign-up/:googleUser',
    name: 'google-sign-up',
    props: true,
    component: () => import(/* webpackChunkName: "google-sign-up" */ '../views/sign-up.vue')
  }
]

// @ts-ignore
// eslint-disable-next-line
const scrollBehavior = function (to, from, savedPosition) {
    if (to.hash) {
      if (to.hash === "#") {
        return { x: 0, y: 0}
      }
      return { 
        selector: to.hash,
        offset: { x: 0, y: 50 }
      }  
    }
}

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  //@ts-ignore
  scrollBehavior,
  routes
})

export default router
