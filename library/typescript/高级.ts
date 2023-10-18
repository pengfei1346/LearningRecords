class Person {
    name: string
}

//交叉类型

function CrossType<T,U>(one: T, two: U): T&U{
    let r = {} as  T&U


    for (const rKey in one) {
        r[rKey] = one[rKey] as any
    }
    for (const rKey in two) {
        r[rKey] = two[rKey] as any
    }

    return r
}

class Person2 {
    name: string
    constructor(name:string) {
        this.name = name
    }
}

interface CanAble {
    happy():void
    work():void
}


class Jian implements CanAble{
    happy():void {
        console.log('找小姐姐')
    }

    work():void {
        console.log('不干活，家里有矿')
    }
}

class Girl implements CanAble{
    happy():void {
        console.log('买买买！')
    }

    work():void {
        console.log('有人养，上啥班啊？')
    }
}

let m = CrossType(new Person2('健健'),new Jian())

m.work()
m.happy()


// 联合类型
let r1: string|number

// 类型保护 instanceof
// 先判断是否是某个 实例













