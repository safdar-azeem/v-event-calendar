<script setup lang="ts">
import CalendarDay from './CalendarDay.vue'
import ScrollableWrapper from './Scrollablar.vue'
import CalendarEventComponent from './CalendarEvent.vue'
import type { CalendarEvent, CalendarMonth } from '../types'
import { useCalendarEventNativeDrag } from '../composables/useCalendarEventNativeDrag'

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

const { startNativeDrag, draggedEventId } = useCalendarEventNativeDrag(emit, props)
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

            <div class="all-day-events-overlay absolute w-full h-full" style="left:0; top:0; z-index: 10;">
               <div
                  v-for="(layout, index) in week.allDayLayout || []"
                  :key="layout.event.id"
                  @mousedown.left.stop="startNativeDrag($event, layout.event)"
                  class="multi-day-event-container"
                  :style="{
                     top: `calc(${27 + layout.track * 20}px)`,
                     left: `calc(${(layout.startDayIndex / 7) * 100}% + 2px)`,
                     width: `calc(${(layout.span / 7) * 99}%)`,
                     opacity: draggedEventId === layout.event.id ? '0.4' : '1',
                     cursor: 'grab'
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
            </div>
         </div>
      </ScrollableWrapper>
   </div>
</template>
