//  不可扩展对象
Object.preventExtensions()
// 仅阻止添加自身的属性。但属性仍然可以添加到对象原型。
// 可以用 Object.isExtensible(obj) 来判断对象是否可扩展


// 密封对象
Object.seal()
// 密封对象不可扩展，而且已有的属性成员[[configurable]]特性将被设置成false
// 可以用 Object.isSealed() 来判断对象是否已经被密封

// 冻结对象
Object.freeze()
// 冻结的对象既不可以扩展，又是密封的，而且对象数据属性的[[writable]]特性会被设置为false。
// 由于访问器属性没有writable，所以访问器属性还是可以用的：

let _obj = {name: 123}
let obj = {}

Object.defineProperty(obj, 'name', {
    configurable: true,
    enumerable: true,
    set(val) {
        _obj.name = val;
    },
    get() {
        return _obj.name
    }
})

Object.freeze(obj);
obj.name //123
obj.name = 666;
obj.name // 666


/*
* 方法名	                    增(extensible)	删(configurable)	改(writable)
Object.preventExtensions	×	√	√
Object.seal             	×	×	√
Object.freeze	            ×	×	×
*
*
* */




