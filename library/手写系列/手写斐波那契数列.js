/**
 * 什么是斐波那契数列
 * 定义：
 * f(1) = 1
 * f(2) = 1
 * f(n) = f(n-1) + f(n-2) (n >= 3, n为正整数)
 * */

// 1、 递归

function fib(n) {
    if( n==1 || n==2) {
        return 1;
    }
    return  fib(n-1) + fib(n-2)
}


// 2\循环
function fibonacci(n){
    var res1 = 1;
    var res2 = 1;
    var sum = res2;
    for(var i = 1;i < n;i ++){
        sum = res1 + res2;
        res1 = res2;
        res2 = sum;
    }
    return sum;
}

// 3 闭包
const fibonacci1 = function(){
    var mem = [0,1];
    var f = function(n){
        var res = mem[n];
        if(typeof res !== 'number'){
            mem[n] = f(n-1) + f(n-2);
            res = mem[n];
        }
        return res;
    }
    return f;
}();
















