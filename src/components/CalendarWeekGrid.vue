<script setup lang="ts">
import Icon from './Icon.vue'
import { computed, watch } from 'vue'
import ScrollableWrapper from './Scrollablar.vue'
import CalendarEventComponent from './CalendarEvent.vue'
import type { CalendarCell, CalendarEvent } from '../types'
import CurrentTimeIndicator from './CurrentTimeIndicator.vue'
import { useCurrentTime } from '../composables/useCurrentTime'
import { useCalendarGrid } from '../composables/useCalendarGrid'
import { calculateAllDayEventLayout } from '../utils/calendarLayoutUtils'
import { useCalendarEventResize } from '../composables/useCalendarEventResize'
import { useCalendarEventNativeDrag } from '../composables/useCalendarEventNativeDrag'

interface CalendarWeekGridProps {
   calendarCells: CalendarCell[]
   dayNames: string[]
   allowEventCreation?: boolean
   hourHeight?: number
   startHour?: number
   endHour?: number
   timeFormat?: '12h' | '24h'
}

interface CalendarWeekGridEmits {
   (e: 'dayClick', date: Date): void
   (e: 'eventClick', event: CalendarEvent): void
   (e: 'createEvent', date: Date, start: string, end?: string, duration?: number): void
   (e: 'timeSlotClick', date: Date, time: string): void
   (e: 'eventUpdate', eventId: string, start: string, end?: string, duration?: number): void
}

const props = withDefaults(defineProps<CalendarWeekGridProps>(), {
   allowEventCreation: true,
   hourHeight: 60,
   startHour: 0,
   endHour: 24,
   timeFormat: '24h',
})

const emit = defineEmits<CalendarWeekGridEmits>()

const {
   hours,
   getEventsForTimeSlot,
   getTimeSlotHeight,
   getDayHeaderClass,
   getTimeSlotClass,
   handleTimeSlotClick,
   handleTimeSlotMouseDown,
   handleTimeSlotMouseUp,
   setDraggingDisabled,
   isDraggingDisabled,
   isDragCreating,
} = useCalendarGrid(props, emit)

const isCurrentWeek = computed(() => props.calendarCells.some((cell) => cell.isToday))
const { topPosition } = useCurrentTime({
   getTimeSlotHeight,
   startHour: props.startHour,
   enabled: isCurrentWeek,
})

const { isCurrentlyResizing, getCurrentResizeEventId } = useCalendarEventResize()
const { startNativeDrag, draggedEventId, isDraggingEvent } = useCalendarEventNativeDrag(emit, props)

const allDayLayout = computed(() => {
   return calculateAllDayEventLayout(props.calendarCells)
})

const allDaySectionHeight = computed(() => {
   if (allDayLayout.value.length === 0) return 0
   const maxTrack = Math.max(...allDayLayout.value.map((l) => l.track))
   return (maxTrack + 1) * 21.5 + 2.5
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

const handleDayHeaderClick = (cell: CalendarCell) => {
   if (isCurrentlyResizing.value || isDragCreating.value) return
   emit('dayClick', cell.date)
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
   <div class="calendar-week-grid">
      <div class="grid-template-week-header">
         <div class="day-header"></div>
         <div
            v-for="(cell, index) in calendarCells"
            :key="cell.dateString"
            :class="getDayHeaderClass(cell)"
            class="day-header"
            :data-day-date="cell.dateString"
            @click="handleDayHeaderClick(cell)">
            <div class="day-name">
               {{ dayNames[index] }}
            </div>
            <div class="day-number">
               {{ cell.date.getDate() }}
            </div>
         </div>
      </div>

      <div v-if="allDayLayout.length > 0" class="grid-template-time all-day-section">
         <div class="all-day-label" v-once>All-day</div>

         <div class="relative">
            <div
               class="absolute inset-0 flex w-full h-full"
               style="left: 0; top: 0; right: 0; bottom: 0">
               <div
                  v-for="cell in calendarCells"
                  :key="cell.dateString"
                  :data-col="cell.dateString"
                  class="flex-1 all-day-drop-zone h-full"></div>
            </div>
            <div class="grid-cols-7" :style="{ height: `${allDaySectionHeight}px` }"></div>

            <div
               v-for="(layout, index) in allDayLayout"
               :key="layout.event.id"
               @mousedown.left.stop="startNativeDrag($event, layout.event)"
               class="all-day-event-item absolute"
               :style="{
                  left: `${(layout.startDayIndex / 7) * 100}%`,
                  width: `${(layout.span / 7) * 100}%`,
                  top: `${layout.track * 21}px`,
                  opacity: draggedEventId === layout.event.id ? '0.4' : '1',
                  cursor: 'grab',
                  zIndex: 10,
               }">
               <CalendarEventComponent
                  :event="layout.event"
                  view="week"
                  :compact="true"
                  rounded="sm"
                  class="all-day-event"
                  :time-format="props.timeFormat"
                  @click="handleEventClick(layout.event)">
                  <template #event="props">
                     <slot name="event" v-bind="{ ...props, isMultiDay: true }" />
                  </template>
               </CalendarEventComponent>
            </div>
         </div>
      </div>

      <ScrollableWrapper class="flex-1 overflow-auto">
         <div class="grid-template-week-body">
            <div class="time-slot-container">
               <div
                  v-for="hourSlot in hours"
                  :key="hourSlot.hour"
                  class="time-slot-label"
                  :style="{ height: `${getTimeSlotHeight(hourSlot.hour) + 0.02}px` }">
                  {{ hourSlot.display }}
               </div>
            </div>

            <div v-for="cell in calendarCells" :key="cell.dateString" class="week-grid-border relative">
               <CurrentTimeIndicator v-if="cell.isToday" :top="topPosition" />
               <div
                  v-for="hourSlot in hours"
                  :key="`${cell.dateString}-${hourSlot.hour}`"
                  :class="getTimeSlotClass(cell, hourSlot.hour)"
                  :style="{ height: `${getTimeSlotHeight(hourSlot.hour)}px` }"
                  :data-hour="hourSlot.hour"
                  :data-col="cell.dateString"
                  class="calendar-time-slot"
                  @click="handleTimeSlotClick(cell, hourSlot.hour)"
                  @mousedown="handleTimeSlotMouseDown($event, cell, hourSlot.hour)"
                  @mouseup="handleTimeSlotMouseUp($event)">
                  <div class="calendar-events-container week-view">
                     <div
                        v-for="(event, index) in getEventsForTimeSlot(cell, hourSlot.hour)"
                        :key="event.id"
                        @mousedown.left.stop="startNativeDrag($event, event)"
                        :style="{
                           pointerEvents:
                              (isCurrentlyResizing && event.id !== getCurrentResizeEventId) ||
                              isDragCreating
                                 ? 'none'
                                 : 'auto',
                           opacity: draggedEventId === event.id ? '0.4' : '1',
                           cursor: 'grab',
                        }">
                        <CalendarEventComponent
                           :event="event"
                           :layout="cell.timedLayout?.get(event.id)"
                           view="week"
                           canResize
                           :event-index="index"
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
                        getEventsForTimeSlot(cell, hourSlot.hour).length === 0 &&
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
