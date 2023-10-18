// 函数定义

// const fn1 = (option: string): void => {
//
// }
// 可选参数
// const fn2 = (option?: string): void => {
//
// }
// 剩余参数
// const fn3 = (...res:number[]): void => {
//
// }

// 函数重载
// 方法是为同一个函数提供多个函数类型定义来进行函数重载。 编译器会根据这个列表去处理函数的调用

function pickCard(x: {suit: string; card: number; }[]): number;
function pickCard(x: number): {suit: string; card: number; };
function pickCard(x): any {
    if (typeof x == "object") {
        return Math.floor(Math.random() * x.length);
    }
    // Otherwise just let them pick the card
    else if (typeof x == "number") {
        let pickedSuit = Math.floor(x / 13);
        return { suit: suits[pickedSuit], card: x % 13 };
    }
}


console.log(pickCard(20));






















