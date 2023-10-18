var fs = require('fs'); // 引入fs模块


// 写入成功后读取测试
fs.readFile('./test.txt', 'utf-8', function (err, arr) {
    // if (err) {
    //     throw err;
    // }

    // var dataarr =(arr)
    console.log(arr[1]);
    // for(i = 0; i < arr.length; i++){
    //     console.log(arr[i]);
    // }

    fs.writeFile('./1.txt','666', 'utf-8', function (err,data) {
        if (err) {
            throw err;
        }
    });
});

