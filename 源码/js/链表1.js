//节点
function Node(element) {
    this.element = element;   //当前节点的元素
    this.next = null;         //下一个节点链接
}

//链表类
function LList () {
    this.head = new Node( 'head' );     //头节点
    this.find = find;                   //查找节点
    this.insert = insert;               //插入节点
    this.remove = remove;               //删除节点
    this.findPrev = findPrev;           //查找前一个节点
    this.display = display;             //显示链表
}

//查找给定节点

function find ( item ) {
    var currNode = this.head;
    while ( currNode.element != item ){
        currNode = currNode.next;
    }
    return currNode;
}

//插入节点

function insert ( newElement , item ) {
    var newNode = new Node( newElement );
    var currNode = this.find( item );
    newNode.next = currNode.next;
    currNode.next = newNode;
}


//显示链表元素

function display () {
    var currNode = this.head;
    while ( !(currNode.next == null) ){
        console.log( currNode.next.element );
        currNode = currNode.next;
    }
}


var fruits = new LList();

fruits.insert('Apple' , 'head');
fruits.insert('Banana' , 'Apple');
fruits.insert('Pear' , 'Banana');

console.log(fruits.display());       // Apple
                                     // Banana
                                     // Pear

// 从链表中删除节点时，我们先要找个待删除节点的前一个节点，找到后，我们修改它的 next 属性，使其不在指向待删除的节点，而是待删除节点的下一个节点。那么，我们就得需要定义一个 findPrevious 方法遍历链表，检查每一个节点的下一个节点是否存储待删除的数据。如果找到，返回该节点，这样就可以修改它的 next 属性了。 findPrevious 的实现如下：

//查找带删除节点的前一个节点

function findPrev( item ) {
    var currNode = this.head;
    while ( !( currNode.next == null) && ( currNode.next.element != item )){
        currNode = currNode.next;
    }
    return currNode;
}


//删除节点

function remove ( item ) {
    var prevNode = this.findPrev( item );
    if( !( prevNode.next == null ) ){
        prevNode.next = prevNode.next.next;
    }
}

// 接着上面的代码，我们再添加一个水果

fruits.insert('Grape' , 'Pear');
console.log(fruits.display());      // Apple
                                    // Banana
                                    // Pear
                                    // Grape

// 我们把香蕉吃掉

fruits.remove('Banana');
console.log(fruits.display());      // Apple
                                    // Pear
                                    // Grape
