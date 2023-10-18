var headerTemplate = '<div><p>我是儿子，父亲对我说： {{give.value}}</p>\n' +
    '    <br>\n' +
    '    <p  class="child" @click="returnBackFn">回应</p></div>'

Vue.component('my-header', {
    template: headerTemplate,
    props: {
        give: ''
        // give: Object
    },
    model: {
        prop: 'give',
        event: 'back'
    },
    data: function () {
        return {
            reData:{
                title: '我是儿子',
                value: '不要,还你两百块'
            }
        }
    },
    methods: {
        returnBackFn: function () {
            this.$emit('back', this.reData);
        }
    },
    watch:{
        give:function () {
            console.log(this.give);
        }
    }
})