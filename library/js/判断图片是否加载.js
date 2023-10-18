let showTable = function(){
    let img = new Image();
    img.src = "images/banner_1_graphics.png";//需要判断的图片地址
    img.onload = function () {
        //该图片已加载完毕,实现自己的业务逻辑
        // 。。。
    }
}


//证明complete 属性不仅可以判断图片是否加载成功，还可以判断图片是否已经在缓存中存在
let img1
console.info(img1.complete)
setTimeout(function () {
    if (img1.complete) {
        console.info('加载成功' + img1.src);
        img2.src = img1.src;
        if (img2.complete) {
            console.info('img2加载成功');
        }
    } else {

    }
}, 100);
