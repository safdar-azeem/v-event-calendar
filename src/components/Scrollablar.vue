<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

const isScrolling = ref(false)
let timeoutId: any

function handleScroll() {
   isScrolling.value = true
   clearTimeout(timeoutId)
   timeoutId = setTimeout(() => {
      isScrolling.value = false
   }, 1000)
}

onBeforeUnmount(() => {
   clearTimeout(timeoutId)
})
</script>

<template>
   <div class="scrollable-wrapper" :class="{ scrolling: isScrolling }" @scroll="handleScroll">
      <slot />
   </div>
</template>
