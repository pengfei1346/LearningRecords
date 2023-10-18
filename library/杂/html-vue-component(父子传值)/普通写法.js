var headerTemplate = '<div><p>我是儿子，父亲对我说： {{give.val}}</p>\n' +
    '    <br>\n' +
    '    <p @click="returnBackFn">回应</p></div>'

Vue.component('my-header', {
    template: headerTemplate,
    props: {
        give: ''
        // give: Object
    },
    data: function () {
        return {
            reData:{
                title: '我是儿子',
                val: '不要,还你两百块'
            }
        }
    },
    methods: {
        returnBackFn: function () {
            this.$emit('returnback', this.reData);
        }
    },
    watch:{
        // give:function () {
        //     console.log(this.give);
        // }
    }
})