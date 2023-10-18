class MockHelper {
    constructor() {
        // 用于存储消息处理器
        this.messageHandlers = [];

        // 模拟消息发送（websocket）
        this.mock = new Mock();

        // 模拟消息接收
        this.mock.onmessage = (data) => {
            // 熔断器
            let fusing = false;
            const fused = () => {
                fusing = true;
            }

            // 执行消息处理
            for (let i = 0; i < this.messageHandlers.length; i++) {
                const handler = this.messageHandlers[i];
                try {
                    // 执行消息处理器
                    handler.handle(data, fused);
                } catch (e) {
                    // 消息处理器执行失败
                    handler.reject(e);
                    this.messageHandlers.splice(i, 1);
                    i--;
                }

                // 熔断
                if (fusing) {
                    this.messageHandlers.splice(i, 1);
                    break;
                }
            }
        }
    }

    send(data, handler) {
        // 返回一个 Promise
        return new Promise((resolve, reject) => {
            // 创建消息处理器
            const messageHandler = new MessageHandler();
            messageHandler.callback = handler;
            messageHandler.resolve = resolve;
            messageHandler.reject = reject;
            messageHandler.data = data;

            // 设置超时，3s
            messageHandler.timer = setTimeout(() => {
                messageHandler.reject(new Error('timeout'));
                this.messageHandlers.splice(this.messageHandlers.indexOf(messageHandler), 1);
            }, 3000);

            // 添加到消息处理器列表
            this.messageHandlers.push(messageHandler);

            // 发送消息
            this.mock.send(data);
        })
    }
}

// 消息处理器
class MessageHandler {
    constructor() {
        this.callback = null;
        this.timer = null;
        this.resolve = null;
        this.reject = null;
        this.data = null;
    }

    // 处理消息
    handle(data, fused) {
        // 消息处理结果
        let result = {
            sendData: this.data,
            receiveData: data,
            handleData: null
        };

        // 熔断器
        let fusing = false;
        const _fused = () => {
            // 收到熔断信号，清除定时器
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }

            // 标记为熔断
            fusing = true;

            // 执行上层的熔断函数
            fused();

            // 执行 resolve
            if (this.resolve) {
                // 这里需要等待回调函数执行完毕，才能执行 resolve，这样才能拿到 handleData
                Promise.resolve().then(() => {
                    this.resolve(result);
                    this.resolve = null;
                });
            }
        }

        // 执行回调函数
        if (typeof this.callback === 'function') {
            try {
                result.handleData = this.callback(data, _fused);
            } catch (e) {
                this.reject(e);
                throw e;
            }
        }
    }
}


/******************使用*************************/
// 实例化
const mockHelper = new MockHelper();

// 发送 hello 消息
const sendHello = () => {
    return mockHelper.send('hello', (data, fused) => {
        if (data === 'world') {
            fused();
            return 'hello world';
        }
    });
};

// 发送 world 消息
const sendWorld = () => {
    return mockHelper.send('world', (data, fused) => {
        if (data === 'hello') {
            fused();
            return 'hello world';
        }
    });
};

// 使用
sendHello().then((data) => {
    console.log(data);
})
sendHello().then((data) => {
    console.log(data);
})
sendHello().then((data) => {
    console.log(data);
});

sendWorld().then((data) => {
    console.log(data);
})
sendWorld().then((data) => {
    console.log(data);
})
sendWorld().then((data) => {
    console.log(data);
})


// ...其他

// 最后才是直接使用 send
mockHelper.send('xxx', (data, fused) => {
    if (data === 'xxx') {
        fused();
        return '...';
    }
}).then((data) => {
    console.log(data);
})
