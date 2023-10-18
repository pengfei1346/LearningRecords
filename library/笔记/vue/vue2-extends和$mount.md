https://cn.vuejs.org/v2/api/#Vue-extend


# extend

> 接受的是一个组件对象，再执行extend时将继承基类构造器上的一些属性、原型方法、静态方法等，最后返回Sub这么一个构造好的子组件构造函数。拥有和vue基类一样的能力，并在实例化时会执行继承来的_init方法完成子组件的初始化。

# $mount

> 在得到初始化后的对象后，开始组件的挂载。首先将当前render函数转为VNode，然后将VNode转为真实Dom插入到页面完成渲染。再完成挂载之后，会在当前组件实例this下挂载$el属性，它就是完成挂载后对应的真实Dom，我们就需要使用这个属性。

```js
confirm/index.js

import Vue from 'vue';
import Confirm from './confirm';  // 引入组件

let newInstance;
const ConfirmInstance = Vue.extend(Confirm);  // 创建构造函数

const initInstance = () => { // 执行方法后完成挂载
  newInstance = new ConfirmInstance();  // 实例化
  document.body.appendChild(newInstance.$mount().$el);
  // 实例化后手动挂载，得到$el真实Dom，将其添加到body最后
}

export default options => { 导出一个方法，接受配置参数
  if (!newInstance) {
    initInstance(); // 挂载
  }
  Object.assign(newInstance, options);
  // 实例化后newInstance就是一个对象了，所以data内的数据会
  // 挂载到this下，传入一个对象与之合并
  
  return newInstance.show(vm => {  // 显示弹窗
    newInstance = null;  // 将实例对象清空
  })
}

```














