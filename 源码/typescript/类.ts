// 继承实现
interface Shape {
    name: string
}

class Person implements Shape{
    private id = 0 // 私有属性 类里边可以访问  子类、类外边不可访问

    public name = '111' // 公有属性 不写默认就是公有的  类里边、子类、类外边都可访问

    protected age = 111 // 保护类型 类里边、子类可以访问 、类外边不可访问

    constructor(name,age) {
        this.name = name
        this.age = age
    }

    getName (): string {
        return `Person-------${this.name}`
    }
}
// extends关键字继承父类
class Web extends Person{
    public name = 'Web'

    constructor(name,age) {
        // 调用super 继承父类
        super(name,age)
    }
    // 相同属性优先子类，原型链概念
    getName (): string {
        return `web-------${this.name}`
    }

    static print = function () {
        console.log('print' + this.name);
    }
}

// let p1 = new Web('张三',20)
// console.log(p1.getName());
Web.print()

/****es5继承---对象冒充****/

// function Person(name,age) {
//     this.name = name
//     this.age = age
//     this.run = () => {
//         console.log(333333);
//     }
// }
// Person.prototype.sex = '男'
// Person.prototype.work = function () {
//     console.log(this.name + 'work');
// }

//  对象冒充继承方式
// 对象冒充 可以继承构造函数里边的属性和方法，但是不能继承原型链上的属性和方法
// function Web() {
//     Person.call(this)
// }

// let w = new Web()
// w.run()
// w.work() // error


// es5继承---原型链继承
// 原型链继承 可以继承构造函数里边的属性和方法，也可以继承原型链上的属性和方法
// 实例化之后没法给父类传参数

// function Web1() {
//
// }
// Web1.prototype = new Person()
//
// let w2 = new Web1('111'，20)
// w2.run()

// es5继承---对象冒充 +  原型链继承

// function Web(name,age) {
//     // 1
//     Person.call(this,name,age)
// }
// // 2
// Web.prototype = Person.prototype
//
// let w2 = new Web('111',20)
// w2.work()




// es5中静态 方法
// function Person1() {
//
//     // 实例方法
//     this.run = function () {
//         console.log('run');
//     }
// }
// // 静态方法
// Person1.run2 = function () {
//     console.log('run2');
// }
//
// let pw = new Person1()
//
// // 实例方法必须创建实例才可以调用
// // 静态方法可以直接调用
// pw.run()
// Person1.run2()






