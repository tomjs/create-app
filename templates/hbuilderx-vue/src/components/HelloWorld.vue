<script setup lang="ts">
defineProps<{ msg: string }>();

const count = ref(0);

function onPostMessage() {
  hbuilderx.postMessage({
    command: 'alert',
    text: `HelloWorld-${Date.now()}`,
  });
}
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">
      count is {{ count }}
    </button>
    <button type="button" style="margin-left: 12px;" @click="onPostMessage">
      发送消息
    </button>
  </div>
</template>

<style scoped></style>
