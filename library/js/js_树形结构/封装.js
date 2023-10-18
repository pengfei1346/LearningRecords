/**
 * 将一个普通的节点数组（带有指向父节点的指针）转换为嵌套的数据结构。
 * @param {*} data  一组数据
 * @param {*} option 包含以下字段的对象：
 *      parentProperty（String）：可以找到父节点链接的属性的名称。默认值：'pid'。
 *      childrenProperty（String）：将存储子节点的属性的名称。默认值：'children'。
 *      idProperty（String）：唯一的节点标识符。默认值：'id'。
 *      nameProperty（String）：节点的名称。默认值：'name'。
 */
function FlatToNested(data, option) {
    option = option || {};
    let idProperty = option.idProperty || 'id';
    let parentProperty = option.parentProperty || 'pid';
    let childrenProperty = option.childrenProperty || 'children';
    let res = [],
        tmpMap = [];
    for (let i = 0; i < data.length; i++) {
        tmpMap[data[i][idProperty]] = data[i];
        if (tmpMap[data[i][parentProperty]] && data[i][idProperty] !== data[i][parentProperty]) {
            if (!tmpMap[data[i][parentProperty]][childrenProperty])
                tmpMap[data[i][parentProperty]][childrenProperty] = [];
            tmpMap[data[i][parentProperty]][childrenProperty].push(data[i]);
        } else {
            res.push(data[i]);
        }
    }
    return res;
}

/**
 * 嵌套型格式转扁平型格式
 * @param {Array} data
 * @param pid
 */
function NestedToFlat(data,pid) {
    var res = []
    for (var i = 0; i < data.length; i++) {
        res.push({
            id: data[i].id,
            name: data[i].name,
            pid: pid || 0
        })
        if (data[i].children) {
            res = res.concat(NestedToFlat(data[i].children, data[i].id));
        }
    }
    return res;
}


//示例数据
const rdata =[
    { id:1,   pid:0,  name:"父节点1"     },
    { id:11,  pid:1,  name:"父节点11"    },
    { id:111, pid:11, name:"叶子节点111" },
    { id:112, pid:11, name:"叶子节点112" },
    { id:113, pid:11, name:"叶子节点113" },
    { id:114, pid:11, name:"叶子节点114" },
    { id:12,  pid:1,  name:"父节点12"    },
    { id:121, pid:12, name:"叶子节点121" },
    { id:122, pid:12, name:"叶子节点122" }
];


FlatToNested(rdata,{
    idProperty:'id',            //唯一的节点标识符。
    nameProperty:'name',         //节点的名称。
    parentProperty:'pid',  //可以找到父节点链接的属性的名称。
    childrenProperty:'child'      //将存储子节点的属性的名称。
})

//  ”嵌套型格式“转”扁平型格式“

let rdata1 = [
    {
        id:1,
        name:'根节点',
        children:[
            {
                id:11,
                name: '父节点11',
                children: [
                    {
                        id:111,
                        name:'父节点111',
                    },
                    {
                        id:112,
                        name:'父节点112',
                    }
                ]
            },
            {
                id:12,
                name:'父节点12',
            }
        ]
    }
]


console.log(NestedToFlat(rdata1));



