<script setup lang="ts">
import { ref } from 'vue'
import Draggable from 'vuedraggable'
import CalendarDay from './CalendarDay.vue'
import ScrollableWrapper from './Scrollablar.vue'
import { isEventAllDay } from '../utils/eventUtils'
import CalendarEventComponent from './CalendarEvent.vue'
import type { CalendarEvent, CalendarMonth } from '../types'

import {
   isEventMultiDay,
   findNextAvailableTime,
   createEventFromDateTime,
} from '../utils/calendarDateUtils'

interface CalendarMonthGridProps {
   dayNames: string[]
   maxEventsPerDay?: number
   calendarMonth: CalendarMonth
   showWeekNumbers?: boolean
   timeFormat?: '12h' | '24h'
   allowEventCreation?: boolean
}

interface CalendarMonthGridEmits {
   (e: 'dayClick', date: Date): void
   (e: 'eventClick', event: CalendarEvent): void
   (e: 'createEvent', date: Date, start: string, end?: string, duration?: number): void
   (e: 'eventUpdate', eventId: string, start: string, end?: string, duration?: number): void
}

const disabledAllDayDrag = ref(false)

const props = withDefaults(defineProps<CalendarMonthGridProps>(), {
   showWeekNumbers: false,
   allowEventCreation: true,
   maxEventsPerDay: 3,
   timeFormat: '24h',
})

const emit = defineEmits<CalendarMonthGridEmits>()

const handleEventClick = (event: CalendarEvent) => {
   emit('eventClick', event)
}

const handleEventUpdate = (eventId: string, start: string, end?: string, duration?: number) => {
   const calculatedDuration =
      duration || Math.max(15, (new Date(end || start).getTime() - new Date(start).getTime()) / 60000)
   emit('eventUpdate', eventId, start, end, calculatedDuration)
}

const calendarHandleDragEnd = (event: any) => {
   if (!event.to || !event.from) return

   const eventId = event.item.dataset.eventId
   if (!eventId) return

   const dropTarget = event.to.closest('.calendar-day')
   const newDateString = dropTarget?.querySelector('[data-col]')?.getAttribute('data-col')

   if (newDateString) {
      const newDate = new Date(newDateString)

      const targetDayEvents =
         props.calendarMonth.weeks
            .flatMap((week) => week.days)
            .find((day) => day.dateString === newDateString)?.events || []

      const { startTime, endTime } = findNextAvailableTime(newDate, targetDayEvents)
      const eventData = createEventFromDateTime(newDate, startTime, endTime, false)
      const duration = Math.max(
         15,
         (new Date(eventData.end || eventData.start).getTime() - new Date(eventData.start).getTime()) /
            60000
      )
      emit('eventUpdate', eventId, eventData.start, eventData.end, duration)
   }
}
</script>

<template>
   <div class="calendar-month-grid">
      <div class="month-header">
         <div v-for="dayName in dayNames" :key="dayName" class="month-header-cell">
            {{ dayName }}
         </div>
      </div>

      <ScrollableWrapper class="month-weeks-container">
         <div
            v-for="week in calendarMonth.weeks"
            :key="`week-${week.weekNumber}`"
            class="month-week relative">
            <CalendarDay
               v-for="(cell, index) in week.days"
               :key="cell.dateString"
               :cell="cell"
               view="month"
               :time-format="props.timeFormat"
               :max-events-display="maxEventsPerDay"
               @dragEnd="disabledAllDayDrag = false"
               @dragStart="disabledAllDayDrag = true"
               @day-click="$emit('dayClick', $event)"
               :allow-event-creation="allowEventCreation"
               @event-click="$emit('eventClick', $event)"
               :multiDayTrackCount="cell.multiDayTrackCount"
               :class="`${index !== week.days?.length - 1 && 'border-right'} group calendar-day-cell`"
               @create-event="
                  (date, start, end, duration) => $emit('createEvent', date, start, end, duration)
               "
               @event-update="handleEventUpdate">
               <template #event="props">
                  <slot name="event" v-bind="props" />
               </template>
            </CalendarDay>

            <Draggable
               :list="week.allDayLayout || []"
               item-key="event.id"
               group="calendar-events"
               class="all-day-events-overlay"
               ghost-class="opacity-50"
               :disabled="disabledAllDayDrag"
               :component-data="{ class: 'w-full h-full' }"
               @end="calendarHandleDragEnd">
               <template #item="{ element: layout, index }">
                  <div
                     :data-event-id="layout.event.id"
                     :data-event-all-day="isEventAllDay(layout.event)"
                     :data-is-multi-day="isEventMultiDay(layout.event)"
                     class="multi-day-event-container"
                     :style="{
                        top: `calc(${27 + layout.track * 20}px)`,
                        left: `calc(${(layout.startDayIndex / 7) * 100}% + 2px)`,
                        width: `calc(${(layout.span / 7) * 99}%)`,
                     }">
                     <CalendarEventComponent
                        :event="layout.event"
                        view="month"
                        :compact="true"
                        rounded="sm"
                        class="multi-day-event"
                        :time-format="props.timeFormat"
                        @click="handleEventClick(layout.event)">
                        <template #event="props">
                           <slot name="event" v-bind="props" />
                        </template>
                     </CalendarEventComponent>
                  </div>
               </template>
            </Draggable>
         </div>
      </ScrollableWrapper>
   </div>
</template>
