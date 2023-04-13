
// 定义一个人的属性
interface person {
    readonly id: number, // 只读属性
    name: string,
    age: number,
    hobby?: string, // 可选属性
    money?: number,
    girlFriend?: null | string | string[]
    boyfriend?: null | string | string[],
    wife?: string,
    husband?: string
    // mother: string,
    // father: string,
    [propName: string]: any, // 任意数量的其它属性
    func: (options: any ) => void
}

// todo 然而，最佳的方式是能够添加一个字符串索引签名，前提是你能够确定这个对象可能具有某些做为特殊用途使用的额外属性。

// 定义一个男性未婚，web前端程序员

interface WebFront {

}

interface SquareConfig {
    color?: string;
    width?: number;
}

function createSquare(config: SquareConfig):any{
    // ...
    return
}

// let mySquare = createSquare({ colour: "red", width: 100 } as SquareConfig);


let squareOptions = { colour: "red", width: 100 };
let mySquare = createSquare(squareOptions);


// 类型推论
interface SearchFunc {
    (source: string, subString: string): boolean;
}

let mySearch: SearchFunc;
mySearch = function(src, sub) {
    let result = src.search(sub);
    return result > -1;
}

//可索引的类型
// 索引签名： 字符串和数字
//  可以同时使用两种类型的索引，但是数字索引的返回值必须是字符串索引返回值类型的   子类型
// 解释： 这是因为当使用number来索引时，JavaScript会将它转换成string然后再去索引对象
class Animal {
    name: string;
}
class Dog extends Animal {
    breed: string;
}

// 错误：使用'string'索引，有时会得到Animal!
interface NotOkay {
    [x: number]: Animal;
    [x: string]: Dog;
}

// 错误：name的类型与字符串索引类型不匹配
interface NumberDictionary {
    [index: string]: number;
    length: number;    // 可以，length是number类型
    name: string       // 错误，`name`的类型与索引类型返回值的类型不匹配
}
//  将索引签名设置为只读，防止了给索引赋值
interface ReadonlyStringArray {
    readonly [index: number]: string;
}
let myArray: ReadonlyStringArray = ["Alice", "Bob"];
myArray[2] = "Mallory"; // error!


////       类类型
// 重点： 接口描述了类的公共部分，而不是公共和私有两部分。 它不会帮你检查类是否具有某些私有成员。

// interface Animal {
//     name: string
// }
//
// class BlackDog {
//     // static color: string = 'black'
//     private color: string;
//     constructor(c) {
//         console.log(this);
//         this.color = c
//     }
// }


//  当一个类实现了一个接口时，只对其实例部分进行类型检查。 constructor存在于类的静态部分，所以不在检查的范围内。
//  我们应该直接操作类的静态部分。 看下面的例子，我们定义了两个接口，ClockConstructor为构造函数所用和ClockInterface为实例方法所用。 为了方便我们定义一个构造函数createClock

interface ClockConstructor {
    new (hour: number, minute: number): ClockInterface;
}
interface ClockInterface {
    tick();
}

function createClock(ctor: ClockConstructor, hour: number, minute: number): ClockInterface {
    return new ctor(hour, minute);
}

class DigitalClock implements ClockInterface {
    constructor(h: number, m: number) { }
    tick() {
        console.log("beep beep");
    }
}
class AnalogClock implements ClockInterface {
    constructor(h: number, m: number) { }
    tick() {
        console.log("tick tock");
    }
}

let digital = createClock(DigitalClock, 12, 17);
let analog = createClock(AnalogClock, 7, 32);


// implements

//  继承接口
// extends

// todo ????? 混合类型

