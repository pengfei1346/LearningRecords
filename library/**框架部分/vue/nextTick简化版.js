// 用于存储待执行的回调函数数组
const callbacks = [];

// 标记任务队列是否正在执行中
let pending = false;

// 定义执行任务队列的函数
function flushCallbacks() {
    pending = false;
    const copies = callbacks.slice(); // 复制一份待执行的回调函数数组
    callbacks.length = 0; // 清空回调函数数组
    for (let i = 0; i < copies.length; i++) {
        copies[i](); // 依次执行回调函数
    }
}

// 定义 nextTick 方法
function nextTick(callback) {
    callbacks.push(callback);

    if (!pending) {
        pending = true;
        // 在任务队列中添加一个微任务（Promise 微任务或 MutationObserver 微任务）
        // 可以确保回调函数在 DOM 更新循环结束之后执行
        // 这里简化为使用 Promise 微任务
        Promise.resolve().then(flushCallbacks);
    }
}

