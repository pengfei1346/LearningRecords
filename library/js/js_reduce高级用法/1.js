// arr.reduce(callback,[initialValue])

// callback （执行数组中每个值的函数，包含四个参数）
//
//     1、previousValue （上一次调用回调返回的值，或者是提供的初始值（initialValue））
//     2、currentValue （数组中当前被处理的元素）
//     3、index （当前元素在数组中的索引）
//     4、array （调用 reduce 的数组）
//
//      initialValue （作为第一次调用 callback 的第一个参数。）


//////////////
//  1、数组求和，求乘积

//  reduce的高级用法

// （1）计算数组中每个元素出现的次数

let names = ['Alice', 'Bob', 'Tiff', 'Bruce', 'Alice'];

let nameNum = names.reduce((pre,cur)=>{
    if(cur in pre){
        pre[cur]++
    }else{
        pre[cur] = 1
    }
    return pre
},{})
console.log(nameNum); //{Alice: 2, Bob: 1, Tiff: 1, Bruce: 1}
// （2）数组去重

let arr = [1,2,3,4,4,1]
let newArr = arr.reduce((pre,cur)=>{
    if(!pre.includes(cur)){
        return pre.concat(cur)
    }else{
        return pre
    }
},[])
console.log(newArr);// [1, 2, 3, 4]
// （3）将二维数组转化为一维

let arr = [[0, 1], [2, 3], [4, 5]]
let newArr = arr.reduce((pre,cur)=>{
    return pre.concat(cur)
},[])
console.log(newArr); // [0, 1, 2, 3, 4, 5]
// （3）将多维数组转化为一维

let arr = [[0, 1], [2, 3], [4,[5,6,7]]]
const newArr = function(arr){
    return arr.reduce((pre,cur)=>pre.concat(Array.isArray(cur)?newArr(cur):cur),[])
}
console.log(newArr(arr)); //[0, 1, 2, 3, 4, 5, 6, 7]
// （4）、对象里的属性求和

var result = [
    {
        subject: 'math',
        score: 10
    },
    {
        subject: 'chinese',
        score: 20
    },
    {
        subject: 'english',
        score: 30
    }
];

var sum = result.reduce(function(prev, cur) {
    return cur.score + prev;
}, 0);
console.log(sum) //60


//  数组元素分组

// var words = ['one', 'two', 'three'];
//
// // 返回 {'3': ['one', 'two'], '5': ['three']}
// _.groupBy(words, 'length');
// var groupBy = function (arr, criteria) {
//     return arr.reduce(function (obj, item) {
//
//         // 判断criteria是函数还是属性名
//         var key = typeof criteria === 'function' ? criteria(item) : item[criteria];
//
//         // 如果属性不存在，则创建一个
//         if (!obj.hasOwnProperty(key)) {
//             obj[key] = [];
//         }
//
//         // 将元素加入数组
//         obj[key].push(item);
//
//         // 返回这个对象
//         return obj;
//
//     }, {});
// };

//数组项最大值

var max = arr.reduce((prev, cur) => {
    return Math.max(prev,cur);
});

//
var newArr = arr.reduce((prev, cur) => {
    prev.indexOf(cur) === -1 && prev.push(cur);
    return prev;
},[]);


//  高级用法 递归利用reduce处理tree树形
var data = [
    {
        id: 1,
        name: "办公管理",
        pid: 0,
        children: [
            {
                id: 2,
                name: "请假申请",
                pid: 1,
                children: [{ id: 4, name: "请假记录", pid: 2 }],
            },
            { id: 3, name: "出差申请", pid: 1 },
        ]
    },
    {
        id: 5,
        name: "系统设置",
        pid: 0,
        children: [{
            id: 6,
            name: "权限管理",
            pid: 5,
            children: [
                { id: 7, name: "用户角色", pid: 6 },
                { id: 8, name: "菜单设置", pid: 6 },
            ]
        }]
    }];
const arr = data.reduce(function(pre,item){
    const callee = arguments.callee //将运行函数赋值给一个变量备用
    pre.push(item)
    if(item.children && item.children.length > 0) item.children.reduce(callee,pre); //判断当前参数中是否存在children，有则递归处理
    return pre;
},[]).map((item) => {
    item.children = []
    return item
})
console.log(arr)



//  计算一个字符串中每个字母出现次数
const str = 'jshdjsihh';
const obj = str.split('').reduce((pre,item) => {
    pre[item] ? pre[item] ++ : pre[item] = 1
    return pre
},{})
console.log(obj) // {j: 2, s: 2, h: 3, d: 1, i: 1}











