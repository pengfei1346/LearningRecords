

_### 为什么会有nextTick这个东西的存在?

因为 vue 采用的异步更新策略，当监听到数据发生变化的时候不会立即去更新DOM，
而是开启一个任务队列，并缓存在同一事件循环中发生的所有数据变更;
这种做法带来的好处就是可以将多次数据更新合并成一次，减少操作DOM的次数，
如果不采用这种方法，假设数据改变100次就要去更新100次DOM，而频繁的DOM更新是很耗性能的；


微任务执行过程中产生的微任务，不会放到下一轮事件循环去执行，会放入本轮事件循环的微任务队列尾部去

### nexTick 的作用？

nextTick 接收一个回调函数作为参数，并将这个回调函数延迟到DOM更新后才执行；
使用场景：想要操作 基于最新数据生成的DOM 时，就将这个操作放在 nextTick 的回调中；


### nextTick 实现原理

将传入的回调函数包装成异步任务，异步任务又分微任务和宏任务，为了尽快执行所以优先选择微任务；

nextTick 提供了四种异步方法 Promise.then、MutationObserver、setImmediate、setTimeout(fn,0)_











