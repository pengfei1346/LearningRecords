## 说明

dns欺骗利用的是dns缓存原理

### 应用

公众号开发的本地调试

### 背景

公众号本地调试是无法通过oauth2授权机制获取code码

```text
//1、vue.config.js修改配置

devserver: {
   port: 80,
   host: 'https://xxx.com'
}

//2、修改本机host文件
mac和window文件位置自行百度
mac: /etc/hosts
增加配置：

127.0.0.1  https://xxx.com

//3、刷新dns缓存 使配置生效  （可能需要，我本机不刷新也会生效）

```




