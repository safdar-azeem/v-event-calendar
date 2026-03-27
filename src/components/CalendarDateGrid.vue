<script setup lang="ts">
import Icon from './Icon.vue'
import { computed, watch } from 'vue'
import ScrollableWrapper from './Scrollablar.vue'
import { isEventAllDay } from '../utils/eventUtils'
import CalendarEventComponent from './CalendarEvent.vue'
import type { CalendarCell, CalendarEvent } from '../types'
import CurrentTimeIndicator from './CurrentTimeIndicator.vue'
import { useCurrentTime } from '../composables/useCurrentTime'
import { useCalendarGrid } from '../composables/useCalendarGrid'
import { useCalendarEventResize } from '../composables/useCalendarEventResize'
import { useCalendarEventNativeDrag } from '../composables/useCalendarEventNativeDrag'

interface CalendarDateGridProps {
   endHour?: number
   startHour?: number
   hourHeight?: number
   calendarCells: CalendarCell[]
   timeFormat?: '12h' | '24h'
   allowEventCreation?: boolean
}

interface CalendarDateGridEmits {
   (e: 'dayClick', date: Date): void
   (e: 'eventClick', event: CalendarEvent): void
   (e: 'createEvent', date: Date, start: string, end?: string, duration?: number): void
   (e: 'timeSlotClick', date: Date, time: string): void
   (e: 'eventUpdate', eventId: string, start: string, end?: string, duration?: number): void
}

const props = withDefaults(defineProps<CalendarDateGridProps>(), {
   allowEventCreation: true,
   hourHeight: 60,
   startHour: 0,
   endHour: 24,
   timeFormat: '24h',
})

const emit = defineEmits<CalendarDateGridEmits>()

const cell = computed(() => props.calendarCells[0])

const {
   hours,
   isDragCreating,
   getEventHeight,
   getTimeSlotClass,
   getEventsForTimeSlot,
   getTimeSlotHeight,
   isDraggingDisabled,
   handleTimeSlotClick,
   setDraggingDisabled,
   handleTimeSlotMouseUp,
   handleTimeSlotMouseDown,
} = useCalendarGrid(props, emit, cell)

const isCurrentDay = computed(() => cell.value?.isToday ?? false)
const { topPosition } = useCurrentTime({
   getTimeSlotHeight,
   startHour: props.startHour,
   enabled: isCurrentDay,
})

const { isCurrentlyResizing, getCurrentResizeEventId } = useCalendarEventResize()
const { startNativeDrag, draggedEventId, isDraggingEvent } = useCalendarEventNativeDrag(emit, props)

const allDayEvents = computed(() => {
   if (!cell.value) return []
   return cell.value.events.filter(isEventAllDay)
})

watch(
   () => isCurrentlyResizing.value,
   (resizing) => {
      setDraggingDisabled(resizing)
   }
)

const handleEventClick = (event: CalendarEvent) => {
   if (isCurrentlyResizing.value || isDragCreating.value) return
   emit('eventClick', event)
}

const handleEventResizeUpdateLocal = (eventId: string, start: string, end: string) => {
   // Intentionally left blank to prevent double-emits and preserve 60fps drag performance.
   // Visual updates are handled efficiently in DOM by useCalendarEventResize.
}

const handleEventResizeEndLocal = (eventId: string, start: string, end: string) => {
   const duration = Math.max(15, (new Date(end).getTime() - new Date(start).getTime()) / 60000)
   emit('eventUpdate', eventId, start, end, duration)
}
</script>

<template>
   <div class="calendar-date-grid">
      <div v-if="allDayEvents.length > 0" class="grid-template-time all-day-section">
         <div class="all-day-label" v-once>All-day</div>
         <div class="all-day-events relative">
            <div class="absolute inset-0 flex w-full h-full" style="left:0; top:0; right:0; bottom:0;">
               <div :data-col="cell.dateString" class="flex-1 all-day-drop-zone h-full"></div>
            </div>
            <div
               v-for="event in allDayEvents"
               :key="event.id"
               @mousedown.left.stop="startNativeDrag($event, event)"
               :style="{ opacity: draggedEventId === event.id ? '0.4' : '1', cursor: 'grab', zIndex: 10 }"
               class="relative"
            >
               <CalendarEventComponent
                  view="date"
                  :event="event"
                  :compact="true"
                  :time-format="props.timeFormat"
                  @click="handleEventClick(event)">
                  <template #event="props">
                     <slot name="event" v-bind="props" />
                  </template>
               </CalendarEventComponent>
            </div>
         </div>
      </div>

      <ScrollableWrapper class="flex-1 overflow-auto">
         <div class="grid-template-week">
            <div class="time-slot-container">
               <div
                  v-for="(hourSlot, index) in hours"
                  :key="hourSlot.hour"
                  class="time-slot-label"
                  :style="{
                     height: `${
                        index == 0
                           ? getTimeSlotHeight(hourSlot.hour) - 1
                           : getTimeSlotHeight(hourSlot.hour)
                     }px`,
                  }">
                  {{ hourSlot.display }}
               </div>
            </div>

            <div class="week-grid-border relative overflow-hidden">
               <CurrentTimeIndicator v-if="cell.isToday" :top="topPosition" />
               <div
                  v-for="hourSlot in hours"
                  :key="`${cell.dateString}-${hourSlot.hour}`"
                  :class="getTimeSlotClass(hourSlot.hour)"
                  :style="{ height: `${getTimeSlotHeight(hourSlot.hour)}px` }"
                  :data-hour="hourSlot.hour"
                  :data-col="cell.dateString"
                  class="calendar-time-slot"
                  @click="handleTimeSlotClick(hourSlot.hour)"
                  @mousedown="handleTimeSlotMouseDown($event, hourSlot.hour)"
                  @mouseup="handleTimeSlotMouseUp($event)">
                  
                  <div class="calendar-events-container">
                     <div
                        v-for="(event, index) in getEventsForTimeSlot(hourSlot.hour)"
                        :key="event.id"
                        @mousedown.left.stop="startNativeDrag($event, event)"
                        :style="{
                           pointerEvents:
                              (isCurrentlyResizing && event.id !== getCurrentResizeEventId) ||
                              isDragCreating
                                 ? 'none'
                                 : 'auto',
                           opacity: draggedEventId === event.id ? '0.4' : '1',
                           cursor: 'grab'
                        }">
                        <CalendarEventComponent
                           :event="event"
                           :layout="cell.timedLayout?.get(event.id)"
                           :style="{ minHeight: `${getEventHeight(hourSlot.hour) - 4}px` }"
                           view="date"
                           :event-index="index"
                           canResize
                           :compact="false"
                           :hour-height="hourHeight"
                           :time-format="props.timeFormat"
                           @click="handleEventClick"
                           @resize-update="handleEventResizeUpdateLocal"
                           @resize-end="handleEventResizeEndLocal">
                           <template #event="props">
                              <slot name="event" v-bind="props" />
                           </template>
                        </CalendarEventComponent>
                     </div>
                  </div>

                  <div
                     v-if="
                        allowEventCreation &&
                        getEventsForTimeSlot(hourSlot.hour).length === 0 &&
                        !isCurrentlyResizing &&
                        !isDragCreating &&
                        !isDraggingEvent
                     "
                     class="add-event-hover">
                     <div class="add-event-icon">
                        <Icon icon="plus" width="10" height="10" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </ScrollableWrapper>
   </div>
</template>
