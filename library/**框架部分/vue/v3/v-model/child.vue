<script lang="ts">
interface Data {
  [key: string]: unknown
}

interface eventData {
  target:{
    value:string
  }
}

interface SetupContext {
  attrs: Data
  emit: (event: string, ...args: unknown[]) => void
}
export default {
  props:{
    firstName:String,
    lastName:String,
    modelValue:String,//modelValue就是不带名字的默认v-model,触发修改用emit("update:modelValue")
  },
  setup(props:Data,{emit}:SetupContext){

    const changDefaultName = (val:eventData)=>{
      //TODO
      emit("update:modelValue",val.target.value)
    }

    const changFirstName = (val:eventData)=>{
      //TODO
      emit("update:firstName",val.target.value)
    }

    const changLastName = (val:eventData)=>{
      //TODO
      emit("update:lastName",val.target.value)
    }

    return {
      changDefaultName,
      changFirstName,
      changLastName
    }
  }
}
</script>
<template>
  <div>
    <input type="text" :value="modelValue" @input="changDefaultName">
    <input type="text" :value="firstName" @input="changFirstName">
    <input type="text" :value="lastName" @input="changLastName">
  </div>
</template>
