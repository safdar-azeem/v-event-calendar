<script setup lang="ts">
import { computed } from 'vue'
import { icons } from '../constants/icons'

const props = defineProps<{
   icon: string
   width?: string
   height?: string
}>()

const iconSvg = computed(() => {
   return icons[props.icon]
      .replace(/width="(\d+)"/, `width="${props?.width}"`)
      .replace(/height="(\d+)"/, `height="${props?.height}"`)
})
</script>

<template>
   <div
      :style="{
         height: 'auto',
         display: 'flex',
      }"
      v-html="iconSvg"></div>
</template>
