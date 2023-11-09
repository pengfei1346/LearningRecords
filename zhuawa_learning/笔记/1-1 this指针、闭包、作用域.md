# 作用域 + 上下文

----------------------------------

## 作用域链

```js
// 因为JavaScript采用的是词法作用域，函数的作用域基于函数创建的位置。
// 而引用《JavaScript权威指南》的回答就是：JavaScript 函数的执行用到了作用域链，这个作用域链是在函数定义的时候创建的。嵌套的函数 f() 定义在这个作用域链里，其中的变量 scope 一定是局部变量，不管何时何地执行函数 f()，这种绑定在执行 f() 时依然有效。
// case 1
var scope = "global scope";
function checkscope(){
    var scope = "local scope";
    function f(){
        return scope;
    }
    return f();
}
checkscope(); // local scope

// case 2
var scope = "global scope";
function checkscope(){
    var scope = "local scope";
    function f(){
        return scope;
    }
    return f;
}
checkscope()(); // local scope
```

### 变量提升 提升的是声明 赋值不提升

- var 存在
- let const不提升

### 函数提升

> 提升纬度： 变量提升 > 函数提升
>
> 执行纬度： 函数先打印

### 块级作用域

```js
if (1) {
    let e = 1
    var f = 2
}
// var声明的变量默认是全局的
```

* js是静态作用域，弱类型、单线程的语言
* 1、对于作用域链 可以直接通过创建态来定位作用域链条的某一环
* 2、手动取消链条环甚至全局作用域的话，可以直接利用块级作用域做性能优化

----------------------------------

## this 上下文 context

* this是在执行时动态读取上下文决定的

### 考察重点： 各使用态上的指针指向

* 1、函数直接调用 - this指向window， 严格模式下指向undefined

```js
function foo() {
    console.log(this);
}

foo()
```

* 2、隐式绑定 - this指向调用堆栈的上一级

```js
function fn() {
    console.log(this.a);
}

const obj = {
    a: 1,
    fn: null
}

obj.fn = fn
obj.fn()

```

---

```js
// 面试题
const foo = {
    bar: 1,
    fn() {
        console.log(this.bar);
        console.log(this);
    }
}

// 取出
// 取出后相当于在全局调用
let fn1 = foo.fn
fn1() // undefined



// 追问1，如何改变this指向
const o1 = {
    text: 'o1',
    fn() {
        return this.text
    }
}

const o2 = {
    text: 'o2',
    fn() {
        return o1.fn()
    }
}

const o3 = {
    text: 'o3',
    fn() {
        let fn = o1.fn
        return fn()
    }
}


console.log(o1.fn());
console.log(o2.fn());
console.log(o3.fn());
//  o1   o1  o3


// 追问2，如何改变this指向

// 1、显示的人为干涉 call bind apply
o2.fn.call(02)

// 2、
const o11 = {
    text: 'o11',
    fn() {
        return this.text
    }
}

const o22 = {
    text: 'o22',
    fn: o11.fn
}

```

###  call bind apply

> 不同点 
> 
> 1、call apply 传参不同 依次传入/数组传入
> 
> 2、bind 返回值不同

```js
// 使用 
function foo() {
    console.log(this);
}

foo()
foo.call({a:1})
foo.apply({a:2})
const bindFoo = foo.bind({a:1})

bindFoo()
```

```js
// todo 手写aplly bind


```

```js
// new

class C {
    constructor(name) {
        this.name = name
        console.log(this);
    }
    
    test() {
        console.log(this);
    }
    
    asyncTest() {
        setTimeout(function () {
            console.log(this);
        },100)
    }
}

const c = new C('666')
c.test() // 666
c.asyncTest() // window
```

--- 


### 闭包

 ```js

function foo() {
    let a = 1
    function fn() {
        return a
    }
}

console.log(foo.fn());


```




