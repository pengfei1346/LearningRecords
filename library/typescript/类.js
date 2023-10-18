/*
* 类的定义
* 继承
* 修饰符
* 静态属性 静态方法
* 抽象类 多态
* */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Person = /** @class */ (function () {
    function Person(name, age) {
        this.id = 0; // 私有属性 类里边可以访问  子类、类外边不可访问
        this.name = '111'; // 公有属性 不写默认就是公有的  类里边、子类、类外边都可访问
        this.age = 111; // 保护类型 类里边、子类可以访问 、类外边不可访问
        this.name = name;
        this.age = age;
    }
    Person.prototype.getName = function () {
        return "Person-------".concat(this.name);
    };
    return Person;
}());
// extends关键字继承父类
var Web = /** @class */ (function (_super) {
    __extends(Web, _super);
    function Web(name, age) {
        var _this = 
        // 调用super 继承父类
        _super.call(this, name, age) || this;
        _this.name = 'Web';
        return _this;
    }
    // 相同属性优先子类，原型链概念
    Web.prototype.getName = function () {
        return "web-------".concat(this.name);
    };
    Web.age = 20;
    // 静态属性没法直接调用类里边的属性
    Web.print = function () {
        console.log('print' + this.name);
        console.log('print' + Web.age);
    };
    return Web;
}(Person));
// let p1 = new Web('张三',20)
// console.log(p1.getName());
Web.print();
// 多态 ：父类定义一个方法不去实现，让继承它的子类去实现，每一个子类有不同的表现
// 多态也属于继承的一种
var Animal = /** @class */ (function () {
    function Animal(name) {
        this.name = name;
    }
    return Animal;
}());
var Dog = /** @class */ (function (_super) {
    __extends(Dog, _super);
    function Dog(name) {
        return _super.call(this, name) || this;
    }
    Dog.prototype.eat = function () {
        console.log('dog eat');
    };
    return Dog;
}(Animal));
var Cat = /** @class */ (function (_super) {
    __extends(Cat, _super);
    function Cat(name) {
        return _super.call(this, name) || this;
    }
    Cat.prototype.eat = function () {
        console.log('Cat eat');
    };
    return Cat;
}(Animal));
var dog = new Dog('dog');
dog.eat();
// 抽象类 abstract关键字来定义抽象类和抽象方法   抽象类中的抽象方法不包含具体实现 并且 必须在派生类中实现
//  abstract 抽象方法 只能 放在抽象类中
// ts中的抽象类 提供其他类继承的基类   不能直接被实例化
// 抽象类和抽象方法用来定义 继承的子类 的标准，子类必须包含父类定义的抽象方法
var Animal1 = /** @class */ (function () {
    function Animal1(name) {
        this.name = name;
    }
    // 其他方法可以不实现
    Animal1.prototype.run = function () {
    };
    return Animal1;
}());
// let a = new Animal1() // error
var Dog1 = /** @class */ (function (_super) {
    __extends(Dog1, _super);
    function Dog1() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // 抽象类的子类中必须实现抽象类中的抽象方法
    Dog1.prototype.eat = function () {
    };
    return Dog1;
}(Animal1));
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
