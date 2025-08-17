<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isEventAllDay } from '../utils/eventUtils'
import type { CalendarEvent, TimedEventLayout } from '../types'
import { useCalendarEventResize } from '../composables/useCalendarEventResize'

import {
   parseTime,
   formatDate,
   getEventEndTime,
   formatDisplayTime,
   getEventStartTime,
   getEventStartDate,
} from '../utils/calendarDateUtils'

interface CalendarEventProps {
   event: CalendarEvent
   compact?: boolean
   canResize?: boolean
   eventIndex?: number
   hourHeight?: number
   rounded?: 'sm' | 'md'
   maxDisplayEvents?: number
   layout?: TimedEventLayout
   timeFormat?: '12h' | '24h'
   view: 'month' | 'week' | 'date'
}

interface CalendarEventEmits {
   (e: 'click', event: CalendarEvent): void
   (e: 'resizeUpdate', eventId: string, start: string, end: string): void
   (e: 'resizeEnd', eventId: string, start: string, end: string): void
}

const props = withDefaults(defineProps<CalendarEventProps>(), {
   view: 'month',
   maxDisplayEvents: 3,
   eventIndex: 0,
   compact: false,
   hourHeight: 60,
   timeFormat: '24h',
})

const emit = defineEmits<CalendarEventEmits>()

const eventRef = ref<HTMLElement>()
const { startResize, isCurrentlyResizing, getCurrentResizeEventId, setUpdateCallbacks } =
   useCalendarEventResize()

const displayTime = computed(() => {
   if (!props.event) return ''
   if (isEventAllDay(props.event)) return 'All day'

   const startTime = getEventStartTime(props.event)
   const endTime = getEventEndTime(props.event)

   if (!startTime) return ''

   const startDisplay = startTime
   const endDisplay = endTime ? formatDisplayTime(endTime, props.timeFormat === '24h') : ''

   return `${startDisplay} - ${endDisplay}`
})

const eventClasses = computed(() => {
   const base = ['calendar-event', 'relative', 'cursor-pointer', 'group', 'flex-shrink-0']

   if (props.compact) {
      base.push('compact')
   }

   if (props.rounded === 'sm') {
      base.push('small-radius')
   }

   if (isCurrentlyResizing.value && getCurrentResizeEventId.value === props.event?.id) {
      base.push('calendar-event-resizing')
   }

   return base
})

const eventStyle = computed(() => {
   const baseStyle: any = {
      backgroundColor: props.event?.backgroundColor || '#3b82f6',
      color: props.event?.textColor || '#ffffff',
   }

   if (
      props.event &&
      (props.view === 'week' || props.view === 'date') &&
      !props.compact &&
      !isEventAllDay(props.event) &&
      props.event.end
   ) {
      const duration = getEventDurationMinutes()
      const pixelsPerMinute = (props.hourHeight ?? 60) / 60
      const calculatedHeight = Math.max(28, duration * pixelsPerMinute - 2)
      baseStyle.height = `${calculatedHeight}px`
      baseStyle.minHeight = `${calculatedHeight}px`
      baseStyle.position = 'absolute'

      const startTime = getEventStartTime(props.event)
      if (startTime) {
         const startTimeData = parseTime(startTime)
         const startMinutes = startTimeData?.minute ?? 0
         const topOffset = startMinutes * pixelsPerMinute
         baseStyle.top = `${topOffset + 2}px`
      }

      if (props.layout) {
         baseStyle.width = props.layout?.width
         baseStyle.left = props.layout?.left
         baseStyle.zIndex = props.layout?.zIndex
         baseStyle.margin = '0 2px'
      } else {
         baseStyle.width = '100%'
         baseStyle.left = '0'
         baseStyle.margin = '0 2px'
      }
   }

   return baseStyle
})

const isThisEventResizing = computed(() => {
   return isCurrentlyResizing.value && getCurrentResizeEventId.value === props.event?.id
})

const getEventDurationMinutes = (): number => {
   if (!props.event || isEventAllDay(props.event) || !props.event.end) return 60

   const startTime = getEventStartTime(props.event)
   const endTime = getEventEndTime(props.event)

   if (!startTime || !endTime) return 60

   const [startHour, startMinute] = startTime.split(':').map(Number)
   const [endHour, endMinute] = endTime.split(':').map(Number)

   const startMinutes = (startHour ?? 0) * 60 + (startMinute ?? 0)
   const endMinutes = (endHour ?? 0) * 60 + (endMinute ?? 0)

   return Math.max(15, endMinutes - startMinutes)
}

const handleClick = (event: MouseEvent) => {
   if (isCurrentlyResizing.value) {
      event?.preventDefault?.()
      event?.stopPropagation?.()
      return
   }
   event?.stopPropagation?.()
   emit('click', props.event)
}

const handleResizeStart = (handle: 'top' | 'bottom', event: MouseEvent) => {
   if (!props.canResize || !eventRef.value || !props.event || isEventAllDay(props.event)) return

   event?.preventDefault?.()
   event?.stopPropagation?.()

   const timeSlotElement = eventRef.value?.closest?.('.calendar-time-slot') as HTMLElement
   if (!timeSlotElement) return

   const eventDate = formatDate(getEventStartDate(props.event))

   startResize(
      props.event.id,
      handle,
      event.clientY,
      props.event,
      props.hourHeight ?? 60,
      eventRef.value,
      timeSlotElement,
      eventDate,
      props.timeFormat
   )
}

onMounted(() => {
   setUpdateCallbacks(
      (eventId: string, startTime: string, endTime: string) => {
         emit('resizeUpdate', eventId, startTime, endTime)
      },
      (eventId: string, startTime: string, endTime: string) => {
         emit('resizeEnd', eventId, startTime, endTime)
      }
   )
})
</script>

<template>
   <div
      ref="eventRef"
      :class="eventClasses"
      :style="eventStyle"
      @click.stop="handleClick"
      @mousedown.stop
      :title="`${event?.title ?? ''}${displayTime ? ' • ' + displayTime : ''}`">
      <div
         v-if="canResize && event && !isEventAllDay(event)"
         class="resize-handle resize-handle-top"
         :class="{
            'resize-handle-active': isThisEventResizing,
            'resize-handle-visible': isThisEventResizing,
         }"
         @mousedown="handleResizeStart('top', $event)"
         @click.stop.prevent></div>

      <slot
         name="event"
         v-bind="{
            event,
            displayTime,
            view,
            isMultiDay: false,
            isContained: props.layout?.isContained,
         }">
         <div class="calendar-event-content">
            <span
               :class="view !== 'month' ? 'event-title multiline' : 'event-title'"
               class="event-title">
               {{ event?.title }}
            </span>
         </div>
      </slot>

      <div
         v-if="canResize && event && !isEventAllDay(event)"
         class="resize-handle resize-handle-bottom"
         :class="{
            'resize-handle-active': isThisEventResizing,
            'resize-handle-visible': isThisEventResizing,
         }"
         @mousedown="handleResizeStart('bottom', $event)"
         @click.stop.prevent></div>
   </div>
</template>
