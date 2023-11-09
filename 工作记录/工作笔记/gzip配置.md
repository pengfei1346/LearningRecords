## webpack 生成gz文件

### 方案对比

1、webpack打包，然后直接使用静态的gz，缺点就是打包后文件体积太大，但是不耗服务器性能；

2、使用nginx在线gzip，缺点就是耗性能，需要实时压缩，但是vue打包后的文件体积小。


### 1、静态生成，nginx开启配置

- 1、安装插件（compression-webpack-plugin）

```text
npm install compression-webpack-plugin --save-dev
```

- 2、vue.config.js增加配置

```js
const CompressionPlugin = require('compression-webpack-plugin');
module.exports = {
        plugins: [
            new CompressionPlugin({
                algorithm: 'gzip', // 使用gzip压缩
                test: /\.js$|\.html$|\.css$/, // 匹配文件名
                filename: '[path].gz[query]', // 压缩后的文件名(保持原文件名，后缀加.gz)
                minRatio: 1, // 压缩率小于1才会压缩
                threshold: 10240, // 对超过10k的数据压缩
                deleteOriginalAssets: false, // 是否删除未压缩的源文件，谨慎设置，如果希望提供非gzip的资源，可不设置或者设置为false（比如删除打包后的gz后还可以加载到原始资源文件）
            }),
        ],
    }
};

```

- 3、nginx修改配置开启gzip

配置参考

```text
http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    # 静态加载本地的gz文件
    gzip_static on;

    server {
        listen       8462;
        server_name  localhost;

        location / {
            root   dist;
            index  index.html index.htm;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }

}

```

### 2、nginx在线生成

> 服务器压力大


```text

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    # 开启gzip
    gzip  on;
    
    # 设置缓冲区大小
    gzip_buffers 4 16k;
    
    #压缩级别官网建议是6
    gzip_comp_level 6;
 
    #压缩的类型
    gzip_types text/plain application/javascript text/css application/xml text/javascript application/x-httpd-php;


    server {
        listen       8462;
        server_name  localhost;

        location / {
            root   dist;
            index  index.html index.htm;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}

```







