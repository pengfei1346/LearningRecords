var Person = /** @class */ (function () {
    function Person() {
    }
    return Person;
}());
//交叉类型
function CrossType(one, two) {
    var r = {};
    for (var rKey in one) {
        r[rKey] = one[rKey];
    }
    for (var rKey in two) {
        r[rKey] = two[rKey];
    }
    return r;
}
var Person2 = /** @class */ (function () {
    function Person2(name) {
        this.name = name;
    }
    return Person2;
}());
var Jian = /** @class */ (function () {
    function Jian() {
    }
    Jian.prototype.happy = function () {
        console.log('找小姐姐');
    };
    Jian.prototype.work = function () {
        console.log('不干活，家里有矿');
    };
    return Jian;
}());
var Girl = /** @class */ (function () {
    function Girl() {
    }
    Girl.prototype.happy = function () {
        console.log('买买买！');
    };
    Girl.prototype.work = function () {
        console.log('有人养，上啥班啊？');
    };
    return Girl;
}());
var m = CrossType(new Person2('健健'), new Jian());
m.work();
m.happy();
// 联合类型
var r1;
// 类型保护 instanceof
// 先判断是否是某个 实例
