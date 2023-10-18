import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

const todoIndex = () => import('@/components/todomvc/todoIndex');
const todoItem = () => import('@/components/todomvc/todoItem');

export default new Router({
  mode:'hash',
  routes: [
    {
      path:'/',
      redirect:'/todoIndex'
    },
    {
      path: '/todoIndex',
      component: todoIndex
      // component: resolve => require(['@/components/todomvc/todoIndex'],resolve)
    },
    {
      path: '/todoItem',
      component: todoItem
    }
  ]
})
