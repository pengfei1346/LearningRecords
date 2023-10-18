
var utilsObject ={};
//获得角度
utilsObject.getAngle = function(angx, angy) {
    return Math.atan2(angy, angx) * 180 / Math.PI;
};

//根据起点终点返回方向 1向上 2向下 3向左 4向右 0未滑动
utilsObject.getDirection = function (startx, starty, endx, endy) {
    var angx = endx - startx;
    var angy = endy - starty;
    var result = 0;

    //如果滑动距离太短
    if (Math.abs(angx) < 2 && Math.abs(angy) < 2) {
        return result;
    }

    var angle = this.getAngle(angx, angy);
    if (angle >= -135 && angle <= -45) {
        result = 1;
    } else if (angle > 45 && angle < 135) {
        result = 2;
    } else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
        result = 3;
    } else if (angle >= -45 && angle <= 45) {
        result = 4;
    }

    return result;
}

//ios 页面返回无刷新
utilsObject.reloadWindow=function (){
    var isPageHide = false; 
    window.addEventListener('pageshow', function () { 
    if (isPageHide) { 
      window.location.reload(); 
    } 
    }); 
    window.addEventListener('pagehide', function () { 
    isPageHide = true; 
    }); 
}

//base 转 blob
utilsObject.baseToBlob = function (data) {
    data = data.split(',')[1];
    data = window.atob(data);
    var ia = new Uint8Array(data.length);
    for (var i = 0; i < data.length; i++) {
        ia[i] = data.charCodeAt(i);
    }

    //canvas.toDataURL 返回的默认格式就是 image/png
    var blob = new Blob([ia], {
        type: "image/jpeg"
    });
    return blob
}