var traverse = function(root) {
    for (var i = 0; i < root.children.length; i++) {
        // 前序位置需要的操作
        traverse(root.children[i]);
        // 后序位置需要的操作
    }
}


traverse([
    {
        id: '1',
        children: [
            {
                id: '1-1'
            },
            {
                id:'1-2',
                children: [
                    {
                        id:'1-2-1',
                    }
                ]
            }
        ]
    }
])



