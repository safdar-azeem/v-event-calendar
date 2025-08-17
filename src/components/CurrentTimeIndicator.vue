<script setup lang="ts">
interface Props {
   top: string
}
defineProps<Props>()
</script>

<template>
   <div class="current-time-indicator" :style="{ top }">
      <div class="current-time-indicator__dot"></div>
      <div class="current-time-indicator__line"></div>
   </div>
</template>
