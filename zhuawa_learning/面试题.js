

//百度一面
var length = 111

function fn() {
    console.log(this.length);
}

const obj = {
    length: 222,
    a(fn) {
        fn()
        arguments[0]()
        console.log(this.length);
    }
}

obj.a()

// 项目流程质量监控  性能优化


// 并发请求限制

// 实现一个搜索框

// 项目亮点挖掘，讲给别人看看有咩有含金量、


// 亮点：
// seo优化
// 自动化部署














