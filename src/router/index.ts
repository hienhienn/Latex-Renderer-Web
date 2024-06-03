import HomeView from '@/views/HomeView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/Signup.vue')
    },
    {
      path: '/project/:versionId',
      name: 'project',
      component: () => import('../views/Project.vue')
    },
    {
      path: '/version/:versionId',
      name: 'version',
      component: () => import('../views/Version.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (to.name !== 'login' && to.name !== 'signup' && !localStorage.getItem('token')) {
    next({ name: 'login' })
  } else if (to.name === 'login' && localStorage.getItem('token')) {
    next({ name: '' })
  } else {
    next()
  }
})

export default router
