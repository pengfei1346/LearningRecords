<script lang="ts">
import { ref } from "vue"
import ModelTest from './modelTest.vue'
export default {
  components:{ModelTest},
  setup(){
    const defaultName = ref("jack")
    const firstName = ref("hello")
    const lastName = ref("HELLO")
    return {
      defaultName,
      firstName,
      lastName
    }
  },
}
</script>
<template>
  <div>
    <div>{{defaultName}}</div>
    <div>{{firstName}}</div>
    <div>{{lastName}}</div>
    <ModelTest
        v-model="defaultName"
        v-model:firstName="firstName"
        v-model:lastName="lastName">
    </ModelTest>
  </div>
</template>
