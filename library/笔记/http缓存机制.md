https://blog.csdn.net/qq_36538012/article/details/112343212

http缓存机制
强缓存和协商缓存

强缓存： 强缓存主要是采用响应头中的 Cache-Control 和 Expires 两个字段进行控制的。同时使用的时候 Cache-Control 的优先级会更高一点

协商缓存： ( Last-Modified 和 Etag )

协商缓存机制下，浏览器需要向服务器去询问缓存的相关信息，进而判断是重新发起请求还是从本地获取缓存的资源。如果服务端提示缓存资源未改动（ Not Modified ），资源会被重定向到浏览器缓存，这种情况下网络请求对应的状态码是 304。


#### 静态资源

强缓存和协商缓存同时存在，如果强缓存还在有效期内则直接使用缓存；如果强缓存不在有效期，协商缓存生效。
即：强缓存优先级 > 协商缓存优先级

强缓存的 expires 和 cache-control 同时存在时， cache-control 会覆盖 expires 的效果， expires 无论有没有过期，都无效。
即：cache-control 优先级 > expires 优先级。

协商缓存的 Etag 和 Last-Modified 同时存在时， Etag 会覆盖 Last-Modified的效果。
即：ETag 优先级 > Last-Modified 优先级。


#### 动态资源

关于动态资源一般前端是不做缓存的。

后端缓存主要通过保留数据库连接，存储处理结果等方式缩短处理时间，尽快响应客户端请求。






















