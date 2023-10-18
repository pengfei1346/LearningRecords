<template>
  <video class="main-video"
         ref="mainVideoRef"
         autoplay></video>
</template>

<script setup>
// * 初始化摄像头
// * */

let mainVideoRef = ref(null)
let localStream
let audioStream
let spinning = ref(false)

const initMedia = async () => {
  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  })
      .then((stream) => {
        // 将流数据存起来，之后停止流时需要
        localStream = stream;
        // 流展示到video标签中
        mainVideoRef.value.srcObject = stream;
      })
      .catch(err => mediaErrorCaptured(err));
}
const mediaErrorCaptured = (error) => {
  console.log("错误信息name打印", error?.name);
  console.log("错误信息message打印", error?.message);
  // 媒体权限失败处理（通用 详细）
  const nameMap = {
    AbortError: "操作中止",
    NotAllowedError: "打开设备权限不足，原因是用户拒绝了媒体访问请求",
    NotFoundError: "找不到满足条件的设备",
    NotReadableError:
        "系统上某个硬件、浏览器或网页层面发生的错误导致设备无法被访问",
    OverConstrainedError: "指定的要求无法被设备满足",
    SecurityError: "安全错误，使用设备媒体被禁止",
    TypeError: "类型错误",
    NotSupportedError: "不支持的操作",
    NetworkError: "网络错误发生",
    TimeoutError: "操作超时",
    UnknownError: "因未知的瞬态的原因使操作失败)",
    ConstraintError: "条件没满足而导致事件失败的异常操作",
  };
  // 媒体权限失败处理（通用 简单）
  const messageMap = {
    "permission denied": "麦克风、摄像头权限未开启，请检查后重试",
    "requested device not found": "未检测到摄像头",
    "could not start video source": "无法访问到摄像头",
  };
  let nameErrorMsg = nameMap[error.name];
  if (!nameErrorMsg) {
    nameErrorMsg = messageMap[error.message.toLowerCase() || "未知错误"];
  }
  // todo
  // alert(nameErrorMsg);
  // if (
  //     error.message.toLowerCase() === "permission denied" ||
  //     error.name == "NotAllowedError"
  // ) {
  //   console.log(`麦克风、摄像头权限未开启，请检查权限`);
  // }
}

const stopMedia = () => {
  // 一般预览成功后，在页面销毁之前，需要进行关闭数据及清空流的操作
// 方式一：获取对应的轨道数据，进行清空操作
  localStream.getAudioTracks()[0].stop();
  localStream.getVideoTracks()[0].stop();
  mainVideoRef.value.srcObject = null;
// 方式二：遍历操作，关闭媒体轨道
//   localStream.getTracks().forEach((stream: MediaStreamTrack) => {
//     stream.stop();
//   });
}

</script>

<style scoped>

</style>
