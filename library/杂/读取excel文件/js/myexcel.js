/*jshint browser:true */
/*global XLSX */
var X = XLSX;
var XW = {
    /* worker message */
    msg: 'xlsx',
    /* worker scripts */
    rABS: '../js/xlsxworker2.js',
    norABS: '../js/xlsxworker1.js',
    noxfer: '../js/xlsxworker.js'
};

function ab2str(data) {
    var o = "", l = 0, w = 10240;
    for(; l<data.byteLength/w; ++l) o+=String.fromCharCode.apply(null,new Uint16Array(data.slice(l*w,l*w+w)));
    o+=String.fromCharCode.apply(null, new Uint16Array(data.slice(l*w)));
    return o;
}
function s2ab(s) {
    var b = new ArrayBuffer(s.length*2), v = new Uint16Array(b);
    for (var i=0; i != s.length; ++i) v[i] = s.charCodeAt(i);
    return [v, b];
}
function xw_xfer(data, cb) {
    var worker = new Worker(rABS ? XW.rABS : XW.norABS);
    worker.onmessage = function(e) {
        switch(e.data.t) {
            case 'ready': break;
            case 'e': console.error(e.data.d); break;
            default: xx=ab2str(e.data).replace(/\n/g,"\\n").replace(/\r/g,"\\r");cb(JSON.parse(xx)); break;
        }
    };
    if(rABS) {
        var val = s2ab(data);
        worker.postMessage(val[1], [val[1]]);
    } else {
        worker.postMessage(data, [data]);
    }
}
function xw(data, cb) {
    transferable = document.getElementsByName("xferable")[0].checked;
    if(transferable) xw_xfer(data, cb);
    else xw_noxfer(data, cb);
}
function get_radio_value( radioName ) {
    var radios = document.getElementsByName( radioName );
    for( var i = 0; i < radios.length; i++ ) {
        if( radios[i].checked || radios.length === 1 ) {
            return radios[i].value;
        }
    }
}
function to_json(workbook) {
    var result = {};
    workbook.SheetNames.forEach(function(sheetName) {
        var roa = X.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
        if(roa.length > 0){
            result[sheetName] = roa;
        }
    });
    return result;
}




var tarea = document.getElementById('b64data');
function b64it() {
    if(typeof console !== 'undefined') console.log("onload", new Date());
    var wb = X.read(tarea.value, {type: 'base64',WTF:wtf_mode});
    process_wb(wb);
}
var token=Cookies.get("token");
console.log(token);
if(token==null){
    // alert("你是怎么进来的？请先登录");
    // window.location.href="../login.html";
}
var global_wb;
function process_wb(wb) {
    global_wb = wb;
    var output = "";
