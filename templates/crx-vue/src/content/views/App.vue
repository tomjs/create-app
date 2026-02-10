<script setup lang="ts">
import { ref } from 'vue';
import Logo from '@/assets/crx.svg';

const show = ref(false);
const toggle = () => show.value = !show.value;
</script>

<template>
  <div class="popup-container">
    <div
      v-show="show"
      class="popup-content"
      :class="show ? 'opacity-100' : 'opacity-0'"
    >
      <h1>HELLO CRXJS</h1>
    </div>
    <button
      class="toggle-button"
      @click="toggle()"
    >
      <img :src="Logo" alt="CRXJS logo" class="button-icon">
    </button>
  </div>
</template>

<style scoped>
.popup-container {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  margin: 1.25rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  line-height: 1em;
  user-select: none;
}

.popup-content {
  width: max-content;
  height: min-content;
  padding: 0.5rem 1rem;
  margin: auto 0.5rem 0 0;
  color: #1f2937;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  transition: opacity 300ms;
}

.toggle-button {
  display: flex;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  cursor: pointer;
  background-color: #288cd7;
  border: none;
  border-radius: 9999px;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.toggle-button:hover {
  background-color: #1e6aa3;
}

.button-icon {
  padding: 4px;
}
</style>
