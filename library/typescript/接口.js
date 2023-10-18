/*
* 属性类接口
* 函数类型接口
* 可索引接口
* 类类型接口
* 接口拓展
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
var fn1 = function (key) {
    return '1';
};
fn1('1');
function createSquare(config) {
    // ...
    return;
}
// let mySquare = createSquare({ colour: "red", width: 100 } as SquareConfig);
var squareOptions = { colour: "red", width: 100 };
var mySquare = createSquare(squareOptions);
var mySearch;
mySearch = function (src, sub) {
    var result = src.search(sub);
    return result > -1;
};
//可索引的类型   ------ 对数组的约束
// 索引签名： 字符串和数字
//  可以同时使用两种类型的索引，但是数字索引的返回值必须是字符串索引返回值类型的   子类型
// 解释： 这是因为当使用number来索引时，JavaScript会将它转换成string然后再去索引对象
var Animal = /** @class */ (function () {
    function Animal() {
    }
    return Animal;
}());
var Dog = /** @class */ (function (_super) {
    __extends(Dog, _super);
    function Dog() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Dog;
}(Animal));
var myArray = ["Alice", "Bob"];
myArray[2] = "Mallory"; // error!
function createClock(ctor, hour, minute) {
    return new ctor(hour, minute);
}
var DigitalClock = /** @class */ (function () {
    function DigitalClock(h, m) {
    }
    DigitalClock.prototype.tick = function () {
        console.log("beep beep");
    };
    return DigitalClock;
}());
var AnalogClock = /** @class */ (function () {
    function AnalogClock(h, m) {
    }
    AnalogClock.prototype.tick = function () {
        console.log("tick tock");
    };
    return AnalogClock;
}());
var digital = createClock(DigitalClock, 12, 17);
var analog = createClock(AnalogClock, 7, 32);
var cc = {
    name: '111',
    age: 2,
};
// todo ????? 混合类型
