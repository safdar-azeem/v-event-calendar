<script setup lang="ts">
import Icon from './Icon.vue'
import Draggable from 'vuedraggable'
import { computed, ref, watch } from 'vue'
import ScrollableWrapper from './Scrollablar.vue'
import CalendarEventComponent from './CalendarEvent.vue'
import type { CalendarCell, CalendarEvent } from '../types'
import CurrentTimeIndicator from './CurrentTimeIndicator.vue'
import { useCurrentTime } from '../composables/useCurrentTime'
import { useCalendarGrid } from '../composables/useCalendarGrid'
import { calculateAllDayEventLayout } from '../utils/calendarLayoutUtils'
import { useCalendarEventResize } from '../composables/useCalendarEventResize'
import {
   createEventFromDateTime,
   findNextAvailableTime,
   isEventMultiDay,
} from '../utils/calendarDateUtils'

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
   (e: 'createEvent', date: Date, start: string, end?: string): void
   (e: 'timeSlotClick', date: Date, time: string): void
   (e: 'eventUpdate', eventId: string, start: string, end?: string): void
}

const props = withDefaults(defineProps<CalendarWeekGridProps>(), {
   allowEventCreation: true,
   hourHeight: 60,
   startHour: 0,
   endHour: 24,
   timeFormat: '24h',
})

const emit = defineEmits<CalendarWeekGridEmits>()

const disabledAllDayDrag = ref(false)

const {
   hours,
   getEventsForTimeSlot,
   getTimeSlotHeight,
   getDayHeaderClass,
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
   timedEventLayouts,
} = useCalendarGrid(props, emit)

const isCurrentWeek = computed(() => props.calendarCells.some((cell) => cell.isToday))
const { topPosition } = useCurrentTime({
   getTimeSlotHeight,
   startHour: props.startHour,
   enabled: isCurrentWeek,
})

const { isCurrentlyResizing, getCurrentResizeEventId } = useCalendarEventResize()

const allDayLayout = computed(() => {
   return calculateAllDayEventLayout(props.calendarCells)
})

const allDaySectionHeight = computed(() => {
   if (allDayLayout.value.length === 0) return 0
   const maxTrack = Math.max(...allDayLayout.value.map((l) => l.track))
   return (maxTrack + 1) * 17 + 2
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
   handleEventResizeUpdate(eventId, start, end)
}

const handleEventResizeEndLocal = (eventId: string, start: string, end: string) => {
   handleEventResizeEnd(eventId, start, end)
}

const handleAllDayDragEnd = (event: any) => {
   if (!event.to || !event.from) return

   const eventId = event.item.dataset.eventId
   if (!eventId) return

   const dropTarget = event.to.closest('.calendar-time-slot')
   let newDateString = dropTarget?.getAttribute('data-col')
   let targetHour: number | null = null

   if (dropTarget) {
      const hourData = dropTarget.getAttribute('data-hour')
      if (hourData) {
         targetHour = parseInt(hourData, 10)
      }
   }

   if (!newDateString) {
      const dayHeaderTarget = event.to.closest('[data-day-date]')
      if (dayHeaderTarget) {
         newDateString = dayHeaderTarget.getAttribute('data-day-date')
      }
   }

   if (!newDateString && event.to) {
      const cellIndex = Array.from(event.to.parentElement?.children || []).indexOf(event.to)
      if (cellIndex >= 0 && cellIndex < props.calendarCells.length) {
         const targetCell = props.calendarCells[cellIndex]
         newDateString = targetCell.dateString
      }
   }

   if (newDateString) {
      const newDate = new Date(newDateString)
      let startTime: string
      let endTime: string

      if (targetHour !== null) {
         startTime = `${targetHour.toString().padStart(2, '0')}:00`
         endTime = `${(targetHour + 1).toString().padStart(2, '0')}:00`
      } else {
         const targetDayEvents =
            props.calendarCells.find((cell) => cell.dateString === newDateString)?.events || []
         const timeSlot = findNextAvailableTime(newDate, targetDayEvents)
         startTime = timeSlot.startTime
         endTime = timeSlot.endTime
      }

      const eventData = createEventFromDateTime(newDate, startTime, endTime, false)
      console.log('eventData.star :>> ', eventData.start)
      console.log('eventData.end :>> ', eventData.end)
      emit('eventUpdate', eventId, eventData.start, eventData.end)
   }
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
         <div class="all-day-label">All-day</div>

         <div class="relative">
            <div class="grid-cols-7" :style="{ height: `${allDaySectionHeight + 5}px` }"></div>
            <Draggable
               :list="allDayLayout"
               item-key="event.id"
               group="calendar-events"
               class="all-day-events-overlay"
               ghost-class="opacity-50"
               :disabled="disabledAllDayDrag || isCurrentlyResizing || isDragCreating"
               :component-data="{ class: 'w-full h-full all-day-events-overlay' }"
               @start="disabledAllDayDrag = true"
               @end="
                  (event:any) => {
                     handleAllDayDragEnd(event)
                     disabledAllDayDrag = false
                  }
               ">
               <template #item="{ element: layout, index }">
                  <div
                     :data-event-id="layout.event.id"
                     :data-event-all-day="layout.event.allDay"
                     :data-is-multi-day="isEventMultiDay(layout.event)"
                     class="all-day-event-item"
                     :style="{
                        left: `${(layout.startDayIndex / 7) * 100}%`,
                        width: `${(layout.span / 7) * 100}%`,
                        top: `${layout.track * 20}px`,
                     }">
                     <CalendarEventComponent
                        :event="layout.event"
                        view="week"
                        :compact="true"
                        rounded="sm"
                        class="all-day-event"
                        :is-multi-day="layout.span > 1"
                        :time-format="props.timeFormat"
                        @click="handleEventClick(layout.event)">
                        <template #event="props">
                           <slot name="event" v-bind="{ ...props, isMultiDay: true }" />
                        </template>
                     </CalendarEventComponent>
                  </div>
               </template>
            </Draggable>
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
                  <Draggable
                     :list="getEventsForTimeSlot(cell, hourSlot.hour)"
                     item-key="id"
                     group="calendar-events"
                     class="calendar-events-container week-view"
                     @end="handleDragEnd"
                     ghost-class="opacity-50"
                     :data-col="cell.dateString"
                     :animation="200"
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
                              view="week"
                              canResize
                              :event-index="index"
                              :compact="false"
                              :hour-height="hourHeight - 0.7"
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
                        getEventsForTimeSlot(cell, hourSlot.hour).length === 0 &&
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
