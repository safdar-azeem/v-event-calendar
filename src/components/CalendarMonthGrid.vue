<script setup lang="ts">
import { computed, ref } from 'vue'
import Draggable from 'vuedraggable'
import CalendarDay from './CalendarDay.vue'
import ScrollableWrapper from './Scrollablar.vue'
import CalendarEventComponent from './CalendarEvent.vue'
import type { CalendarEvent, CalendarMonth } from '../types'
import {
   calculateAllDayEventLayout,
   calculateMultiDayEventCountForDay,
   type EventLayout,
} from '../utils/calendarLayoutUtils'
import {
   createEventFromDateTime,
   findNextAvailableTime,
   isEventMultiDay,
} from '../utils/calendarDateUtils'

interface CalendarMonthGridProps {
   calendarMonth: CalendarMonth
   dayNames: string[]
   showWeekNumbers?: boolean
   allowEventCreation?: boolean
   maxEventsPerDay?: number
   timeFormat?: '12h' | '24h'
}

interface CalendarMonthGridEmits {
   (e: 'dayClick', date: Date): void
   (e: 'eventClick', event: CalendarEvent): void
   (e: 'createEvent', date: Date, start: string, end?: string): void
   (e: 'eventUpdate', eventId: string, start: string, end?: string): void
}

const disabledAllDayDrag = ref(false)

const props = withDefaults(defineProps<CalendarMonthGridProps>(), {
   showWeekNumbers: false,
   allowEventCreation: true,
   maxEventsPerDay: 3,
   timeFormat: '24h',
})

const emit = defineEmits<CalendarMonthGridEmits>()

const weekLayouts = computed(() => {
   const layouts = new Map<number, EventLayout[]>()
   props.calendarMonth.weeks.forEach((week) => {
      layouts.set(week.weekNumber, calculateAllDayEventLayout(week.days))
   })
   return layouts
})

const handleEventClick = (event: CalendarEvent) => {
   emit('eventClick', event)
}

const handleEventUpdate = (eventId: string, start: string, end?: string) => {
   emit('eventUpdate', eventId, start, end)
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
      emit('eventUpdate', eventId, eventData.start, eventData.end)
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
               :multiDayTrackCount="calculateMultiDayEventCountForDay(cell)"
               :max-events-display="maxEventsPerDay"
               :allow-event-creation="allowEventCreation"
               :time-format="props.timeFormat"
               :class="`${index !== week.days?.length - 1 && 'border-right'} group calendar-day-cell`"
               @dragStart="disabledAllDayDrag = true"
               @dragEnd="disabledAllDayDrag = false"
               @day-click="$emit('dayClick', $event)"
               @event-click="$emit('eventClick', $event)"
               @create-event="(date, start, end) => $emit('createEvent', date, start, end)"
               @event-update="handleEventUpdate">
               <template #event="props">
                  <slot name="event" v-bind="props" />
               </template>
            </CalendarDay>

            <Draggable
               :list="weekLayouts.get(week.weekNumber) || []"
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
                     :data-event-all-day="layout.event.allDay"
                     :data-is-multi-day="isEventMultiDay(layout.event)"
                     class="multi-day-event-container"
                     :style="{
                        top: `calc(${25 + layout.track * 24}px - ${index * 3}px)`,
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
