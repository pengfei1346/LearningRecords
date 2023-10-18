## FileReader

FileReader 对象就是专门操作二进制数据的；
FileReader 主要用于将文件内容读入内存，通过一系列异步接口，可以在主线程中访问本地文件

###  属性

error：读取文件时产生的错误对象
readyState：表示读取文件时的当前状态（整数）
0表示尚未加载任何数据，
1表示数据正在加载，
2表示加载完成。

result：读取完成后的文件内容
有可能是字符串，也可能是一个 ArrayBuffer 实例。



### 实例方法
abort()：终止读取操作；readyState属性将变成2；
readAsArrayBuffer()：以 ArrayBuffer 的格式读取文件，读取完成后result属性将返回一个 ArrayBuffer 实例；
readAsBinaryString()：读取完成后，result属性将返回原始的二进制字符串；
readAsDataURL()：：读取完成后，result属性将返回一个 Data URL 格式（Base64 编码）的字符串，代表文件内容；
> 对于图片文件，这个字符串可以用于元素的src属性。
注意，这个字符串不能直接进行 Base64 解码，必须把前缀data:/;base64从字符串里删除以后，再进行解码。

readAsText()：读取完成后，result属性将返回文件内容的文本字符串；

>   该方法的第一个参数是代表文件的 Blob 实例，第二个参数是可选的，表示文本编码，默认为 UTF-8。


### 事件

onabort：abort事件（用户终止读取操作）的监听函数；
onerror：error事件（读取错误）的监听函数；
onload：load事件（读取操作完成）的监听函数；
通常在这个函数里面根据result属性，拿到文件内容

onloadstart：loadstart事件（读取操作开始）的监听函数；
onloadend：loadend事件（读取操作结束）的监听函数；
onprogress：progress事件（读取操作进行中）的监听函数；


## 应用

通过FileReader，我们可以把文件的内容（Blob对象）转换为字符串、Base64字符串、ArrayBuffer等其他类型；

```js
let blob = new Blob(["aaa, bbb"]);
var reader = new FileReader();
reader.readAsText(blob);
reader.onloadend = function () {
  var text = reader.result;
  console.log(text);
};
```


