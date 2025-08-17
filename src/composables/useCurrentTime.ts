import { ref, computed, onUnmounted, type Ref, watch } from 'vue'

interface UseCurrentTimeConfig {
   getTimeSlotHeight: (hour: number) => number
   startHour?: number
   enabled: Ref<boolean>
}

export function useCurrentTime(config: UseCurrentTimeConfig) {
   const { getTimeSlotHeight, startHour = 0, enabled } = config
   const currentTime = ref(new Date())

   const updateCurrentTime = () => {
      currentTime.value = new Date()
   }

   let intervalId: number | undefined

   const stopTimer = () => {
      if (intervalId) {
         clearInterval(intervalId)
         intervalId = undefined
      }
   }

   const startTimer = () => {
      stopTimer()
      updateCurrentTime()
      intervalId = window.setInterval(updateCurrentTime, 60000)
   }

   watch(
      enabled,
      (isEnabled) => {
         if (isEnabled) {
            startTimer()
         } else {
            stopTimer()
         }
      },
      { immediate: true }
   )

   onUnmounted(() => {
      stopTimer()
   })

   const topPosition = computed(() => {
      const now = currentTime.value
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()

      let totalHeightBeforeCurrentHour = 0
      for (let hour = startHour; hour < currentHour; hour++) {
         totalHeightBeforeCurrentHour += getTimeSlotHeight(hour)
      }

      const heightOfCurrentHour = getTimeSlotHeight(currentHour)
      const pixelsPerMinuteInCurrentHour = heightOfCurrentHour / 60
      const offsetInCurrentHour = currentMinute * pixelsPerMinuteInCurrentHour

      return `${totalHeightBeforeCurrentHour + offsetInCurrentHour}px`
   })

   return {
      topPosition,
   }
}
