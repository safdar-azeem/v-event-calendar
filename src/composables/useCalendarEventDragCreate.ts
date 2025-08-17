import { computed, ref } from 'vue'
import { parseTime } from '../utils/calendarDateUtils'

interface DragCreateState {
   isDragging: boolean
   startHour: number
   date: Date | null
   hourHeight: number
   startMouseY: number
   currentMouseY: number
   currentEndTime: string | null
   initialStartTime: string | null
   currentStartTime: string | null
   timeSlotElement: HTMLElement | null
   placeholderEventElement: HTMLElement | null
}

const dragCreateState = ref<DragCreateState>({
   date: null,
   startHour: 0,
   isDragging: false,
   startMouseY: 0,
   hourHeight: 60,
   currentMouseY: 0,
   currentEndTime: null,
   timeSlotElement: null,
   initialStartTime: null,
   currentStartTime: null,
   placeholderEventElement: null,
})

let onEventCreate: ((date: Date, startTime: string, endTime: string) => void) | null = null

export function useCalendarEventDragCreate() {
   const startDragCreate = (
      mouseY: number,
      hour: number,
      date: Date,
      timeSlotElement: HTMLElement,
      hourHeight: number
   ) => {
      const startTime = `${hour.toString().padStart(2, '0')}:00`
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`

      dragCreateState.value = {
         isDragging: true,
         startMouseY: mouseY,
         currentMouseY: mouseY,
         timeSlotElement,
         placeholderEventElement: null,
         startHour: hour,
         date,
         hourHeight,
         initialStartTime: startTime,
         currentStartTime: startTime,
         currentEndTime: endTime,
      }

      createPlaceholderEvent(timeSlotElement, startTime, endTime)

      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', updateDragCreate, { passive: false })
      document.addEventListener('mouseup', endDragCreate, { once: true })
      document.addEventListener('keydown', handleKeyDown)
   }

   const createPlaceholderEvent = (timeSlotElement: HTMLElement, startTime: string, endTime: string) => {
      if (!dragCreateState.value?.date) return

      const placeholderEvent = document.createElement('div')
      placeholderEvent.className = 'calendar-event-placeholder'
      placeholderEvent.style.backgroundColor = 'var(--calendar-primary-color)'
      placeholderEvent.style.minHeight = '28px'
      placeholderEvent.style.height = `${(dragCreateState.value?.hourHeight ?? 60) - 4}px`
      placeholderEvent.style.top = '1px'
      placeholderEvent.innerHTML = `
      <div class="calendar-event-content">
        <span class="event-title">New Event</span>
      </div>
    `

      const draggableContainer = timeSlotElement?.querySelector?.('.calendar-events-container')
      if (draggableContainer) {
         draggableContainer.appendChild(placeholderEvent)
         dragCreateState.value.placeholderEventElement = placeholderEvent
      }
   }

   const updateDragCreate = (event: MouseEvent) => {
      if (!dragCreateState.value?.isDragging || !dragCreateState.value?.placeholderEventElement) return

      event?.preventDefault?.()
      event?.stopPropagation?.()

      dragCreateState.value.currentMouseY = event?.clientY ?? 0
      const deltaY = (event?.clientY ?? 0) - (dragCreateState.value?.startMouseY ?? 0)

      const minutesPerPixel = 60 / (dragCreateState.value?.hourHeight ?? 60)
      const deltaMinutes = Math.round((deltaY * minutesPerPixel) / 15) * 15

      let newStartTime = dragCreateState.value?.initialStartTime ?? '00:00'
      let newEndTime = dragCreateState.value?.initialStartTime ?? '00:00'

      if (deltaY >= 0) {
         const startTime = parseTime(dragCreateState.value?.initialStartTime ?? '00:00')
         const startMinutes = startTime?.hour * 60 + startTime?.minute
         const endMinutes = Math.max(startMinutes + 15, startMinutes + Math.abs(deltaMinutes))

         const endHour = Math.min(23, Math.floor(endMinutes / 60))
         const endMinute = Math.min(59, endMinutes % 60)

         newStartTime = dragCreateState.value?.initialStartTime ?? '00:00'
         newEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
      } else {
         const startTime = parseTime(dragCreateState.value?.initialStartTime ?? '00:00')
         const endMinutes = startTime?.hour * 60 + startTime?.minute + 60
         const startMinutes = Math.max(0, startTime?.hour * 60 + startTime?.minute + deltaMinutes)

         const startHour = Math.max(0, Math.floor(startMinutes / 60))
         const startMinute = Math.max(0, startMinutes % 60)

         newStartTime = `${startHour.toString().padStart(2, '0')}:${startMinute
            .toString()
            .padStart(2, '0')}`
         newEndTime = `${Math.floor(endMinutes / 60)
            .toString()
            .padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`
      }

      dragCreateState.value.currentStartTime = newStartTime
      dragCreateState.value.currentEndTime = newEndTime

      updatePlaceholderVisual(newStartTime, newEndTime, deltaY)
   }

   const updatePlaceholderVisual = (startTime: string, endTime: string, deltaY: number) => {
      if (!dragCreateState.value?.placeholderEventElement) return

      const duration = calculateDuration(startTime, endTime)
      const newHeight = Math.max(28, (duration / 60) * (dragCreateState.value?.hourHeight ?? 60) - 4)

      let topOffset = 1
      if (deltaY < 0) {
         const minutesPerPixel = 60 / (dragCreateState.value?.hourHeight ?? 60)
         const deltaMinutes = Math.abs(deltaY * minutesPerPixel)
         topOffset = 1 - Math.max(0, (deltaMinutes / 60) * (dragCreateState.value?.hourHeight ?? 60))
      }

      dragCreateState.value.placeholderEventElement.style.height = `${newHeight}px`
      dragCreateState.value.placeholderEventElement.style.minHeight = `${newHeight}px`
      dragCreateState.value.placeholderEventElement.style.top = `${topOffset}px`
   }

   const calculateDuration = (startTime: string, endTime: string): number => {
      const start = parseTime(startTime)
      const end = parseTime(endTime)
      const startMinutes = start?.hour * 60 + start?.minute
      const endMinutes = end?.hour * 60 + end?.minute
      return Math.max(15, endMinutes - startMinutes)
   }

   const handleKeyDown = (event: KeyboardEvent) => {
      if (event?.key === 'Escape') {
         cancelDragCreate()
      }
   }

   const cancelDragCreate = () => {
      if (!dragCreateState.value?.isDragging) return
      dragCreateState.value?.placeholderEventElement?.remove()
      cleanupDragCreate()
   }

   const endDragCreate = () => {
      if (!dragCreateState.value?.isDragging) return
      dragCreateState.value?.placeholderEventElement?.remove()

      const wasDragged =
         Math.abs(
            (dragCreateState.value?.currentMouseY ?? 0) - (dragCreateState.value?.startMouseY ?? 0)
         ) > 10

      if (
         wasDragged &&
         onEventCreate &&
         dragCreateState.value?.date &&
         dragCreateState.value?.currentStartTime &&
         dragCreateState.value?.currentEndTime
      ) {
         onEventCreate(
            dragCreateState.value.date,
            dragCreateState.value.currentStartTime,
            dragCreateState.value.currentEndTime
         )
      }

      cleanupDragCreate()
   }

   const cleanupDragCreate = () => {
      document.removeEventListener('mousemove', updateDragCreate)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.userSelect = ''

      dragCreateState.value = {
         isDragging: false,
         startMouseY: 0,
         currentMouseY: 0,
         timeSlotElement: null,
         placeholderEventElement: null,
         startHour: 0,
         date: null,
         hourHeight: 60,
         initialStartTime: null,
         currentStartTime: null,
         currentEndTime: null,
      }
   }

   const setEventCreateCallback = (
      callback: (date: Date, startTime: string, endTime: string) => void
   ) => {
      onEventCreate = callback
   }

   const isDragCreating = computed(() => dragCreateState.value?.isDragging)

   return {
      startDragCreate,
      endDragCreate,
      cancelDragCreate,
      isDragCreating,
      setEventCreateCallback,
      dragCreateState: computed(() => dragCreateState.value),
   }
}
