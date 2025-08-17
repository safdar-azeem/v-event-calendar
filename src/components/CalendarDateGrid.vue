src/components/CalendarDateGrid.vue

<script setup lang="ts">
import Icon from './Icon.vue'
import Draggable from 'vuedraggable'
import { computed, watch } from 'vue'
import ScrollableWrapper from './Scrollablar.vue'
import CalendarEventComponent from './CalendarEvent.vue'
import type { CalendarCell, CalendarEvent } from '../types'
import CurrentTimeIndicator from './CurrentTimeIndicator.vue'
import { useCurrentTime } from '../composables/useCurrentTime'
import { useCalendarGrid } from '../composables/useCalendarGrid'
import { useCalendarEventResize } from '../composables/useCalendarEventResize'

interface CalendarDateGridProps {
   calendarCells: CalendarCell[]
   allowEventCreation?: boolean
   hourHeight?: number
   startHour?: number
   endHour?: number
   timeFormat?: '12h' | '24h'
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
   getEventsForTimeSlot,
   getTimeSlotHeight,
   getTimeSlotClass,
   handleTimeSlotClick,
   handleTimeSlotMouseDown,
   handleTimeSlotMouseUp,
   handleDragEnd,
   handleEventResizeUpdate,
   handleEventResizeEnd,
   setDraggingDisabled,
   isDraggingDisabled,
   isDragCreating,
   cancelDragCreate,
   timedEventLayouts,
   getEventHeight,
} = useCalendarGrid(props, emit, cell)

const isCurrentDay = computed(() => cell.value?.isToday ?? false)
const { topPosition } = useCurrentTime({
   getTimeSlotHeight,
   startHour: props.startHour,
   enabled: isCurrentDay,
})

const { isCurrentlyResizing, getCurrentResizeEventId } = useCalendarEventResize()

const allDayEvents = computed(() => {
   if (!cell.value) return []
   return cell.value.events.filter((e) => e.allDay)
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
   const duration = Math.max(15, (new Date(end).getTime() - new Date(start).getTime()) / 60000)
   handleEventResizeUpdate(eventId, start, end)
   emit('eventUpdate', eventId, start, end, duration)
}

const handleEventResizeEndLocal = (eventId: string, start: string, end: string) => {
   const duration = Math.max(15, (new Date(end).getTime() - new Date(start).getTime()) / 60000)
   handleEventResizeEnd(eventId, start, end)
   emit('eventUpdate', eventId, start, end, duration)
}
</script>

<template>
   <div class="calendar-date-grid">
      <div v-if="allDayEvents.length > 0" class="grid-template-time all-day-section">
         <div class="all-day-label">All-day</div>
         <div class="all-day-events">
            <CalendarEventComponent
               v-for="event in allDayEvents"
               :key="event.id"
               :event="event"
               view="date"
               :compact="true"
               :time-format="props.timeFormat"
               @click="handleEventClick(event)">
               <template #event="props">
                  <slot name="event" v-bind="props" />
               </template>
            </CalendarEventComponent>
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
                  v-for="(hourSlot, index) in hours"
                  :key="`${cell.dateString}-${hourSlot.hour}`"
                  :class="getTimeSlotClass(hourSlot.hour)"
                  :style="{ height: `${getTimeSlotHeight(hourSlot.hour)}px` }"
                  :data-hour="hourSlot.hour"
                  :data-col="cell.dateString"
                  class="calendar-time-slot"
                  @click="handleTimeSlotClick(hourSlot.hour)"
                  @mousedown="handleTimeSlotMouseDown($event, hourSlot.hour)"
                  @mouseup="handleTimeSlotMouseUp($event)">
                  <Draggable
                     :list="getEventsForTimeSlot(hourSlot.hour)"
                     item-key="id"
                     group="calendar-events"
                     class="calendar-events-container"
                     @end="handleDragEnd"
                     ghost-class="opacity-50"
                     :data-col="cell.date"
                     :disabled="isDraggingDisabled || isCurrentlyResizing || isDragCreating">
                     <template #item="{ element: event, index }">
                        <div
                           :data-event-id="event.id"
                           :data-event-start="event.start"
                           :data-event-end="event.end"
                           :data-event-duration="
                              Math.max(
                                 15,
                                 (new Date(event.end || event.start).getTime() -
                                    new Date(event.start).getTime()) /
                                    60000
                              )
                           "
                           :style="{
                              pointerEvents:
                                 (isCurrentlyResizing && event.id !== getCurrentResizeEventId) ||
                                 isDragCreating
                                    ? 'none'
                                    : 'auto',
                           }">
                           <CalendarEventComponent
                              :event="event"
                              :layout="timedEventLayouts.get(cell.dateString)?.get(event.id)"
                              :style="{ minHeight: `${getEventHeight(hourSlot.hour) - 4}px` }"
                              view="date"
                              :event-index="index"
                              canResize
                              :compact="false"
                              :hour-height="hourHeight - 4"
                              :time-format="props.timeFormat"
                              @click="handleEventClick"
                              @resize-update="handleEventResizeUpdateLocal"
                              @resize-end="handleEventResizeEndLocal">
                              <template #event="props">
                                 <slot name="event" v-bind="props" />
                              </template>
                           </CalendarEventComponent>
                        </div>
                     </template>
                  </Draggable>

                  <div
                     v-if="
                        allowEventCreation &&
                        getEventsForTimeSlot(hourSlot.hour).length === 0 &&
                        !isCurrentlyResizing &&
                        !isDragCreating
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
