### 性能优化相关

- 一个页面很卡，如何分析卡顿原因？

lighthouse、performance查看相关指标。

- 有一个1s一次的轮询请求，用户点击时发送的请求，需要等待这两次结果都返回执行一个操作如何实现？



### 项目相关

#### 问题



https://www.pipipi.net/28849.html

- 开发时如何调试你的组件？

```text
// 1、通过script标签引入
<script src="../dist/bs-display-umd.js"></script>

// 2、import引入
1、在组件库根目录执行 npm link
2、搭建一个用于测试的vue项目LibTest，在测试项目根目录下执行
npm link bs-display 
3、可以像普通npm安装的组件库一样使用
import { Frame } from 'bs-display'  //按需引入
Vue.use(Frame)


```

- 组件库版本更新时如何通知需要更新？

- 主版本.次版本.补丁版本   

major.minor.patch























