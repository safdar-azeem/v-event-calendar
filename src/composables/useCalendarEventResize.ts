import { computed, ref, watch } from 'vue'
import type { CalendarEvent } from '../types'
import { formatDisplayTime, getEventEndTime, getEventStartTime } from '../utils/calendarDateUtils'

interface ResizeState {
   isResizing: boolean
   hourHeight: number
   startMouseY: number
   date: string | null
   eventId: string | null
   originalDuration: number
   originalEventTop: number
   currentEnd: string | null
   timeFormat: '12h' | '24h'
   originalEnd: string | null
   originalEventHeight: number
   currentStart: string | null
   originalStart: string | null
   eventElement: HTMLElement | null
   timeSlotElement: HTMLElement | null
   resizeHandle: 'top' | 'bottom' | null
}

const resizeState = ref<ResizeState>({
   date: null,
   eventId: null,
   isResizing: false,
   startMouseY: 0,
   hourHeight: 60,
   currentEnd: null,
   originalEnd: null,
   timeFormat: '24h',
   resizeHandle: null,
   eventElement: null,
   currentStart: null,
   originalStart: null,
   originalDuration: 0,
   originalEventTop: 0,
   timeSlotElement: null,
   originalEventHeight: 0,
})

let onRealtimeUpdate: ((eventId: string, start: string, end: string) => void) | null = null
let onFinalUpdate: ((eventId: string, start: string, end: string) => void) | null = null

const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
   let timeout: ReturnType<typeof setTimeout> | null = null
   return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
   }
}

export function useCalendarEventResize() {
   const startResize = (
      eventId: string,
      handle: 'top' | 'bottom',
      mouseY: number,
      event: CalendarEvent,
      hourHeight: number,
      eventElement: HTMLElement,
      timeSlotElement: HTMLElement,
      date: string,
      timeFormat: '12h' | '24h'
   ) => {
      if (event.allDay || !event.end) return

      const draggableContainers = document.querySelectorAll('.vdr')
      draggableContainers.forEach((container) => {
         ;(container as HTMLElement).setAttribute('data-draggable-disabled', 'true')
      })

      const eventRect = eventElement.getBoundingClientRect()
      const duration = calculateDurationFromISO(event.start, event.end)

      resizeState.value = {
         isResizing: true,
         eventId,
         originalStart: event.start,
         originalEnd: event.end,
         originalDuration: duration,
         resizeHandle: handle,
         startMouseY: mouseY,
         hourHeight,
         eventElement,
         timeSlotElement,
         originalEventHeight: eventRect.height,
         originalEventTop: eventRect.top,
         currentStart: event.start,
         currentEnd: event.end,
         date,
         timeFormat,
      }

      if (eventElement) {
         eventElement.style.transition = 'none'
         eventElement.style.zIndex = '1000'
         eventElement.style.userSelect = 'none'
         eventElement.classList.add('calendar-event-resizing')
         document.body.style.cursor = 'row-resize'
      }

      document.addEventListener('mousemove', debouncedUpdateResize, { passive: false })
      document.addEventListener('mouseup', endResize, { once: true })
      document.addEventListener('keydown', handleKeyDown)

      document.body.style.userSelect = 'none'
   }

   const updateResize = (event: MouseEvent) => {
      if (
         !resizeState.value.isResizing ||
         !resizeState.value.eventId ||
         !resizeState.value.eventElement ||
         !resizeState.value.originalStart ||
         !resizeState.value.originalEnd
      )
         return

      event?.preventDefault?.()
      event?.stopPropagation?.()

      const deltaY = event.clientY - resizeState.value.startMouseY
      const timeSlotHeight = resizeState.value.hourHeight
      const minutesPerPixel = 60 / timeSlotHeight
      const deltaMinutes = Math.round((deltaY * minutesPerPixel) / 15) * 15

      const originalStartDate = new Date(resizeState.value.originalStart)
      const originalEndDate = new Date(resizeState.value.originalEnd)

      let newStartDate = new Date(originalStartDate)
      let newEndDate = new Date(originalEndDate)

      if (resizeState.value.resizeHandle === 'top') {
         const newStartTime = originalStartDate.getTime() + deltaMinutes * 60 * 1000
         newStartDate = new Date(
            Math.max(0, Math.min(originalEndDate.getTime() - 15 * 60 * 1000, newStartTime))
         )
      } else {
         const newEndTime = originalEndDate.getTime() + deltaMinutes * 60 * 1000
         newEndDate = new Date(Math.max(originalStartDate.getTime() + 15 * 60 * 1000, newEndTime))
      }

      resizeState.value.currentStart = newStartDate.toISOString()
      resizeState.value.currentEnd = newEndDate.toISOString()

      updateEventVisualSize(newStartDate, newEndDate)

      if (onRealtimeUpdate && resizeState.value.eventId) {
         onRealtimeUpdate(
            resizeState.value.eventId,
            resizeState.value.currentStart,
            resizeState.value.currentEnd
         )
      }
   }

   const debouncedUpdateResize = debounce(updateResize, 16)

   const updateEventVisualSize = (newStartDate: Date, newEndDate: Date) => {
      if (!resizeState.value.eventElement || !resizeState.value.timeSlotElement) return

      const duration = (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60)
      const newHeight = Math.max(28, (duration / 60) * resizeState.value.hourHeight - 2)

      let newTop = resizeState.value.originalEventTop
      if (resizeState.value.resizeHandle === 'top' && resizeState.value.originalStart) {
         const originalStartDate = new Date(resizeState.value.originalStart)
         const minuteDiff = (newStartDate.getTime() - originalStartDate.getTime()) / (1000 * 60)
         newTop += (minuteDiff / 60) * resizeState.value.hourHeight
      }

      resizeState.value.eventElement.style.height = `${newHeight}px`
      resizeState.value.eventElement.style.minHeight = `${newHeight}px`
      resizeState.value.eventElement.setAttribute('data-event-duration', duration.toString())

      if (resizeState.value.resizeHandle === 'top') {
         const timeSlotRect = resizeState.value.timeSlotElement.getBoundingClientRect()
         const relativeTop = newTop - timeSlotRect.top
         resizeState.value.eventElement.style.position = 'absolute'
         resizeState.value.eventElement.style.top = `${relativeTop}px`
      }

      const timeDisplays = resizeState.value.eventElement.querySelectorAll('.event-time-display')
      timeDisplays.forEach((timeDisplay) => {
         const startTime = getEventStartTime({
            start: newStartDate.toISOString(),
            end: newEndDate.toISOString(),
         } as CalendarEvent)
         const endTime = getEventEndTime({
            start: newStartDate.toISOString(),
            end: newEndDate.toISOString(),
         } as CalendarEvent)

         if (startTime && endTime) {
            const startDisplay = formatDisplayTime(startTime, resizeState.value.timeFormat === '24h')
            const endDisplay = formatDisplayTime(endTime, resizeState.value.timeFormat === '24h')
            timeDisplay.textContent = `${startDisplay} - ${endDisplay}`
         }
      })
   }

   const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
         cancelResize()
      }
   }

   const cancelResize = () => {
      if (!resizeState.value.isResizing || !resizeState.value.eventElement) return

      resizeState.value.eventElement.style.height = `${resizeState.value.originalEventHeight}px`
      resizeState.value.eventElement.style.minHeight = `${resizeState.value.originalEventHeight}px`
      resizeState.value.eventElement.style.position = ''
      resizeState.value.eventElement.style.top = ''
      resizeState.value.eventElement.setAttribute(
         'data-event-duration',
         resizeState.value.originalDuration.toString()
      )

      if (resizeState.value.originalStart && resizeState.value.originalEnd) {
         const originalStartDate = new Date(resizeState.value.originalStart)
         const originalEndDate = new Date(resizeState.value.originalEnd)
         updateEventVisualSize(originalStartDate, originalEndDate)
      }

      endResize()
   }

   const endResize = () => {
      if (!resizeState.value.isResizing) return

      document.removeEventListener('mousemove', debouncedUpdateResize)
      document.removeEventListener('keydown', handleKeyDown)

      const draggableContainers = document.querySelectorAll('[data-draggable-disabled="true"]')
      draggableContainers.forEach((container) => {
         ;(container as HTMLElement).removeAttribute('data-draggable-disabled')
      })

      if (resizeState.value.eventElement) {
         resizeState.value.eventElement.style.transition = ''
         resizeState.value.eventElement.style.zIndex = ''
         resizeState.value.eventElement.style.userSelect = ''
         resizeState.value.eventElement.style.position = ''
         resizeState.value.eventElement.style.top = ''
         resizeState.value.eventElement.classList.remove('calendar-event-resizing')

         if (resizeState.value.currentStart && resizeState.value.currentEnd) {
            const duration = calculateDurationFromISO(
               resizeState.value.currentStart,
               resizeState.value.currentEnd
            )
            const newHeight = Math.max(28, (duration / 60) * resizeState.value.hourHeight - 2)
            resizeState.value.eventElement.style.height = `${newHeight}px`
            resizeState.value.eventElement.style.minHeight = `${newHeight}px`
            resizeState.value.eventElement.setAttribute('data-event-duration', duration.toString())
         }
      }

      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      if (
         onFinalUpdate &&
         resizeState.value.eventId &&
         resizeState.value.currentStart &&
         resizeState.value.currentEnd
      ) {
         onFinalUpdate(
            resizeState.value.eventId,
            resizeState.value.currentStart,
            resizeState.value.currentEnd
         )
      }

      resizeState.value = {
         isResizing: false,
         eventId: null,
         originalStart: null,
         originalEnd: null,
         originalDuration: 0,
         resizeHandle: null,
         startMouseY: 0,
         hourHeight: 60,
         timeSlotElement: null,
         eventElement: null,
         originalEventHeight: 0,
         originalEventTop: 0,
         currentStart: null,
         currentEnd: null,
         date: null,
         timeFormat: '24h',
      }
   }

   const calculateDurationFromISO = (start: string, end: string): number => {
      const startDate = new Date(start)
      const endDate = new Date(end)
      return Math.max(15, (endDate.getTime() - startDate.getTime()) / (1000 * 60))
   }

   const setUpdateCallbacks = (
      realtimeCallback: (eventId: string, start: string, end: string) => void,
      finalCallback: (eventId: string, start: string, end: string) => void
   ) => {
      onRealtimeUpdate = realtimeCallback
      onFinalUpdate = finalCallback
   }

   const isCurrentlyResizing = computed(() => resizeState.value.isResizing)
   const getCurrentResizeEventId = computed(() => resizeState.value.eventId)

   watch(
      () => resizeState.value.isResizing,
      (isResizing) => {
         if (
            !isResizing &&
            resizeState.value.eventElement &&
            resizeState.value.currentStart &&
            resizeState.value.currentEnd
         ) {
            const duration = calculateDurationFromISO(
               resizeState.value.currentStart,
               resizeState.value.currentEnd
            )
            const newHeight = Math.max(28, (duration / 60) * resizeState.value.hourHeight - 2)
            resizeState.value.eventElement.style.height = `${newHeight}px`
            resizeState.value.eventElement.style.minHeight = `${newHeight}px`
            resizeState.value.eventElement.setAttribute('data-event-duration', duration.toString())
         }
      }
   )

   return {
      startResize,
      endResize,
      cancelResize,
      isCurrentlyResizing,
      getCurrentResizeEventId,
      setUpdateCallbacks,
      resizeState: computed(() => resizeState.value),
   }
}
