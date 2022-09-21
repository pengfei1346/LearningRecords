== vs ===
==存在隐式转换

深浅拷贝 ： 有手写实现源码，看笔记
```
1、 object.assign
    var obj = { a: {a: "www", b: 39} };
    var cloneObj = Object.assign({}, obj);
    cloneObj.a.a = "yyy";
    console.log(obj.a.a);

    #注意： 有一个特殊情况，当object只有单层属性的时候，是深拷贝
    let obj = {
        username: 'www'
    };
    let obj2 = Object.assign({},obj);
    obj2.username = 'yyy';
    console.log(obj); //{username: "www"}
2、Array.prototype.concat()
    // let arr = [1, 3, {    username: 'www'    }];
    // let arr2=arr.concat();
    // arr2[2].username = 'yyy';
    // console.log(arr);

    // 当数组元素为基本数据类型，深拷贝，引用数据类型，浅拷贝
    // var sedan = ["S60", "S90"];
    // var SUV = ["XC40", "XC60", {
    //     label: "XC90",
    //     name: "666"
    // },[1,2,3]];
    // var Volvo = sedan.concat(SUV);
    // SUV[2].name = "888"
    // SUV[3][0] = 6
    // console.log(Volvo);
3、Array.prototype.slice()
    // let arr = [1, 3, {    username: ' www'    }];
    // let arr3 = arr.slice(0,3);
    // arr3[2].username = 'yyy'
    // console.log(arr);
4、
    function shallowClone(target) {
        var cloneTarget = {}
        for (const key in target) {
            cloneTarget[key] = target[key];
        }
        return cloneTarget
    }
    
    
深拷贝
     //  乞丐版
    //  JSON.parse(JSON.stringify());

  // 改进版
    /*  到这里面试已经够用了
    *   解决循环引用问题，我们可以额外开辟一个存储空间，来存储当前对象和拷贝对象的对应关系，当需要拷贝当前对象时，先去存储空间中找，有没有拷贝过这个对象，如果有的话直接返回，如果没有的话继续拷贝
    * */

    function clone(target, map = new WeakMap()) {
        if (typeof target === 'object') {
            let cloneTarget = Array.isArray(target) ? [] : {};
            if (map.get(target)) {
                return map.get(target);
            }
            map.set(target, cloneTarget);
            for (const key in target) {
                cloneTarget[key] = clone(target[key], map);
            }
            return cloneTarget;
        } else {
            return target;
        }
    }

    // console.log(clone(target));

```

let var const


暂时性死区：
当程序的控制流程在新的作用域（module function 或 block
作用域）进行实例化时，在此作用域中用let/const声明的变量会先在作用域中被创建出来，但因此时还未进行词法绑定，所以是不能被访问的，如果访问就会抛出错误。因此，在这运行流程进入作用域创建变量，到变量可以被访问之间的这一段时间，就称之为暂时死区。

暂时性死区原因：
ES6新增的let、const关键字声明的变量会产生块级作用域，如果变量在当前作用域中被创建之前被创建出来，由于此时还未完成语法绑定，如果我们访问或使用该变量，就会产生暂时性死区的问题，由此我们可以得知，从变量的创建到语法绑定之间这一段空间，我们就可以理解为‘暂时性死区’

闭包
阻止了垃圾回收器对外部访问变量值的回收
对闭包的描述是：当函数可以记住并访问所在的词法作用域时，就产生了闭包。闭包指的是作用域的引用。

js的垃圾回收机制：
常用的标记清除法，内部应该是指针，如果不存在指向这个变量的指针就会被垃圾回收机制回收。
不常用的引用计数法，引用一次计数加1，计数为0就被回收，但存在相互引用的问题，即使离开了作用域，计数也不会清零，会出现内存泄漏的情况。比较典型的是IE下BOM和DOM不是用JS原生对象实现的而是使用C++的COM实现的，所以在IE下操作BOM和DOM都会存在循环引用的问题

一种说法：其实并不是函数嵌套函数会产生闭包，只要函数中存在外部变量的就会产生闭包。
























