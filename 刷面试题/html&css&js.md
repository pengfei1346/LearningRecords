### 面试题整理

### 1、防抖与节流
> 防抖：触发高频事件后n秒内函数只会执行一次，如果n秒内高频事件再次被触发，则重新计算时间
> 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时。
> 函数在一段时间内的多次调用，仅使得最后一次调用有效。

手写实现：
```javascript
function _debounce(fn, delay = 1000, isRun = false) {
    // timer是一个定时器
    let timer
    // 返回一个闭包函数，用闭包保存timer确保其不会销毁，重复点击会清理上一次的定时器
    return function () {
        // timer 存在就清除定时器
        if(timer) {
            clearTimeout(timer)
        }

        // 开启这一次的定时器
        timer = setTimeout(() => {
            fn.call(this,arguments)
        }, delay)

        // 是否立即执行
        if(isRun && !timer) {
            // 改变this指向
            fn.call(this,arguments)
        }
    }
}
```

> 节流：当resize事件被触发后，指定时间内不允许再次触发，函数在一段时间内的多次调用，仅第一次有效。

时间戳版：
```javascript
function throttle(fun,delay = 1000) {
    // 记录第一次的调用时间
    var last = 0;
    // 返回闭包函数
    return function () {
        // 记录现在调用的时间
        let now = Date.now();
        // 如果间隔时间大于等于设置的节流时间
        if (now >= delay + last) {
            // 执行函数
            fun.apply(this, arguments);
            // 将现在的时间设置为上一次执行时间
            last = now;
        } else {
            console.log("距离上次调用的时间差不满足要求哦");
        }
    }
}
```
定时器版
```javascript
function throttle2(func, delay) {
    // 初始化定时器
    var timer = null;

    // 返回闭包函数
    return function () {
        // 记录事件参数
        let args = arguments;
        // 如果定时器为空

        //// ？？
        if (!timer) {
            func.apply(this, args);

            timer = setTimeout(() => {
                // 函数执行完毕后重置定时器
                timer = null;
            }, delay);
        } else {
            console.log("上一个定时器尚未完成");
        }
    }
}

```

### 2、get请求传参长度的误区、get和post请求在缓存方面的区别？
  > 误区：我们经常说get请求参数的大小存在限制，而post请求的参数大小是无限制的。
  
  * HTTP 协议 未规定 GET 和POST的长度限制
  * GET的最大长度显示是因为 浏览器和 web服务器限制了 URI的长度
  * 不同的浏览器和WEB服务器，限制的最大长度不一样
  * 要支持IE，则最大长度为2083byte，若只支持Chrome，则最大长度 8182byte


### 3、模块化历程
    > 模块化主要是用来抽离公共代码，隔离作用域，避免变量冲突等

  IIFE：使用自执行函数来编写模块化，特点：在一个单独的函数作用域中执行代码，避免变量冲突。
(function(){return { data:[] }})()

AMD：使用requireJS 来编写模块化，特点：依赖必须提前声明好。
define('./index.js',function(code){ // code 就是index.js 返回的内容})

CMD：使用seaJS 来编写模块化，特点：支持动态引入依赖文件。
define(function(require, exports, module) { var indexCode = require('./index.js');})

CommonJS：nodejs 中自带的模块化。
var fs = require('fs');

UMD：兼容AMD，CommonJS 模块化语法。
webpack(require.ensure)：webpack 2.x 版本中的代码分割。

ES Modules：ES6 引入的模块化，支持import 来引入另一个 js 。
import a from 'a';

### 4、npm 模块安装机制，为什么输入 npm install 就可以自动安装对应的模块？
 > npm模块安装机制： http://www.ruanyifeng.com/blog/2016/01/npm-install.html

安装过程总结：
 * 发出npm install命令
 * npm 向 registry 查询模块压缩包的网址 
 * 下载压缩包，存放在~/.npm目录
 * 解压压缩包到当前项目的node_modules目录

### 5、ES5的继承和ES6的继承有什么区别？

ES5的继承时通过prototype或构造函数机制来实现。ES5的继承实质上是先创建子类的实例对象，然后再将父类的方法添加到this上（Parent.apply(this)）。

ES6的继承机制完全不同，实质上是先创建父类的实例对象this（所以必须先调用父类的super()方法），然后再用子类的构造函数修改this。
类之间通过extends关键字实现继承。子类必须在constructor方法中调用super方法。

### 6、setTimeout、Promise、Async/Await 、定时器的执行顺序或机制？

结合异步，宏任务、微任务回答

### 7、['1','2','3'].map(parseInt)输出什么,为什么?

[1,"NAN","NAN"]




















