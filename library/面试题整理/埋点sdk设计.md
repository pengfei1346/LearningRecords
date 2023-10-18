
https://juejin.cn/post/7085679511290773534

### 数据发送

数据发送是一个最基础的api，后面的功能都要基于此进行。通常这种前后端分离的场景会使用AJAX的方式发送数据，但是这里使用图片的src属性。原因有两点：

没有跨域的限制，像srcipt标签、img标签都可以直接发送跨域的GET请求，不用做特殊处理；
兼容性好，一些静态页面可能禁用了脚本，这时script标签就不能使用了；

但要注意，这个图片不是用来展示的，我们的目的是去「传递数据」，只是借助img标签的的src属性，在其url后面拼接上参数，服务端收到再去解析。


### 更优雅的web beacon
使用 sendBeacon() 方法会使用户代理在有机会时异步地向服务器发送数据，同时不会延迟页面的卸载或影响下一导航的载入性能。这就解决了提交分析数据时的所有的问题：数据可靠，传输异步并且不会影响下一页面的加载。此外，代码实际上还要比其他技术简单许多！

这种打点标记的方式被称web beacon（网络信标）。除了gif图片，从2014年开始，浏览器逐渐实现专门的API，来更优雅的完成这件事：Navigator.sendBeacon
使用很简单
kotlin复制代码Navigator.sendBeacon(url,data)

相较于图片的src，这种方式的更有优势：

不会和主要业务代码抢占资源，而是在浏览器空闲时去做发送；
并且在页面卸载时也能保证请求成功发送，不阻塞页面刷新和跳转；

现在的埋点监控工具通常会优先使用sendBeacon，但由于浏览器兼容性，还是需要用图片的src兜底。


### 页面性能监控

页面的性能数据可以通过performance.timing这个API获取到，获取的数据是单位为毫秒的时间戳。

页面首次渲染时间：FP(firstPaint)=domLoading-navigationStart
DOM加载完成：DCL(DOMContentEventLoad)=domContentLoadedEventEnd-navigationStart
图片、样式等外链资源加载完成：L(Load)=loadEventEnd-navigationStart


### 错误处理

错误报警监控分为JS原生错误和React/Vue的组件错误的处理。

### JS原生错误

除了try catch中捕获住的错误，我们还需要上报没有被捕获住的错误——通过error事件和unhandledrejection事件去监听。

#### error类型

```text
InternalError: 内部错误，比如如递归爆栈;
RangeError: 范围错误，比如new Array(-1);
EvalError: 使用eval()时错误;
ReferenceError: 引用错误，比如使用未定义变量;
SyntaxError: 语法错误，比如var a = ;
TypeError: 类型错误，比如[1,2].split('.');
URIError:  给 encodeURI或 decodeURl()传递的参数无效，比如decodeURI('%2')
Error: 上面7种错误的基类，通常是开发者抛出
```

Promise内部抛出的错误是无法被error捕获到的，这时需要用unhandledrejection事件。

```js
class StatisticSDK {
  constructor(productID){
    this.productID = productID;
    // 初始化错误监控
    this.initError()
  }
  // 数据发送
  send(baseURL,query={}){
    query.productID = this.productID;
      let queryStr = Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&')
      let img = new Image();
      img.src = `${baseURL}?${queryStr}`
  }
  // 自定义错误上报
  error(err, etraInfo={}) {
    const errorURL = 'http://error/'
    const { message, stack } = err;
    this.send(errorURL, { message, stack, ...etraInfo})
  }
  // 初始化错误监控
  initError(){
    window.addEventListener('error', event=>{
      this.error(error);
    })
    window.addEventListener('unhandledrejection', event=>{
      this.error(new Error(event.reason), { type: 'unhandledrejection'})
    })
  }
}

```




