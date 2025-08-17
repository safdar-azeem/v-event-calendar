<script setup lang="ts">
import '../css/style.css'
import { computed, watch, defineAsyncComponent } from 'vue'
import { useCalendar } from '../composables/useCalendar'
import { addMonths, addWeeks } from '../utils/calendarDateUtils'
import type { CalendarEvent, CalendarView, CalendarViewConfig } from '../types'

const CalendarMonthGrid = defineAsyncComponent(() => import('./CalendarMonthGrid.vue'))
const CalendarWeekGrid = defineAsyncComponent(() => import('./CalendarWeekGrid.vue'))
const CalendarDateGrid = defineAsyncComponent(() => import('./CalendarDateGrid.vue'))

interface CalendarViewProps {
   events?: CalendarEvent[]
   initialView?: CalendarView
   allowEventCreation?: boolean
   allowEventEditing?: boolean
   maxEventsPerDay?: number
   showWeekNumbers?: boolean
   config?: Partial<CalendarViewConfig>
}

interface CalendarViewEmits {
   (e: 'eventClick', event: CalendarEvent): void
   (e: 'eventCreate', date: Date, start: string, end?: string, duration?: number): void
   (e: 'dayClick', date: Date): void
   (e: 'viewChange', view: CalendarView): void
   (e: 'dateChange', date: Date): void
   (e: 'eventUpdate', eventId: string, start: string, end?: string, duration?: number): void
}

const props = withDefaults(defineProps<CalendarViewProps>(), {
   events: () => [],
   initialView: 'month',
   allowEventCreation: true,
   allowEventEditing: true,
   maxEventsPerDay: 3,
   showWeekNumbers: false,
})

const emit = defineEmits<CalendarViewEmits>()

const {
   config,
   currentDate: calendarCurrentDate,
   selectedDate: calendarSelectedDate,
   view: calendarView,
   calendarCells,
   calendarMonth,
   calendarCurrentMonthName,
   calendarCurrentWeekRange,
   calendarDayNames,
   calendarGoToToday,
   calendarGoToDate,
   calendarSelectDate,
   calendarSetView,
   calendarSetEvents,
   forceUpdate,
} = useCalendar(props.config)

calendarSetView(props.initialView)

const currentTitle = computed(() => {
   if (calendarView.value === 'month') return calendarCurrentMonthName.value
   if (calendarView.value === 'week') return calendarCurrentWeekRange.value
   return calendarSelectedDate.value
      ? calendarSelectedDate.value.toLocaleDateString('en-US', {
           weekday: 'long',
           month: 'long',
           day: 'numeric',
           year: 'numeric',
        })
      : calendarCurrentDate.value.toLocaleDateString('en-US', {
           weekday: 'long',
           month: 'long',
           day: 'numeric',
           year: 'numeric',
        })
})

const canGoPrevious = computed(() => true)
const canGoNext = computed(() => true)

const handleDayClick = (date: Date) => {
   calendarSelectDate(date)
   emit('dayClick', date)
}

const handleEventClick = (event: CalendarEvent) => {
   emit('eventClick', event)
}

const handleCreateEvent = (date: Date, start: string, end?: string, duration?: number) => {
   if (props.allowEventCreation) {
      const calculatedDuration =
         duration || Math.max(15, (new Date(end || start).getTime() - new Date(start).getTime()) / 60000)
      emit('eventCreate', date, start, end, calculatedDuration)
   }
}

const handleEventUpdate = (eventId: string, start: string, end?: string, duration?: number) => {
   if (props.allowEventEditing) {
      const calculatedDuration =
         duration || Math.max(15, (new Date(end || start).getTime() - new Date(start).getTime()) / 60000)
      emit('eventUpdate', eventId, start, end, calculatedDuration)
   }
}

const handleGoToPrevious = () => {
   if (calendarView.value === 'date') {
      calendarCurrentDate.value = new Date(calendarCurrentDate.value.getTime() - 24 * 60 * 60 * 1000)
   } else if (calendarView.value === 'month') {
      calendarCurrentDate.value = addMonths(calendarCurrentDate.value, -1)
   } else {
      calendarCurrentDate.value = addWeeks(calendarCurrentDate.value, -1)
   }
   emit('dateChange', calendarCurrentDate.value)
}

const handleGoToNext = () => {
   if (calendarView.value === 'date') {
      calendarCurrentDate.value = new Date(calendarCurrentDate.value.getTime() + 24 * 60 * 60 * 1000)
   } else if (calendarView.value === 'month') {
      calendarCurrentDate.value = addMonths(calendarCurrentDate.value, 1)
   } else {
      calendarCurrentDate.value = addWeeks(calendarCurrentDate.value, 1)
   }
   emit('dateChange', calendarCurrentDate.value)
}

const handleGoToToday = () => {
   calendarGoToToday()
   emit('dateChange', calendarCurrentDate.value)
}

const handleTimeSlotClick = (date: Date, time: string) => {
   calendarSelectDate(date)
   const [hour] = time.split(':')
   const startTime = time
   const endTime = `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`

   const startDate = new Date(date)
   const endDate = new Date(date)
   const [startHour, startMinute] = startTime.split(':').map(Number)
   const [endHour, endMinute] = endTime.split(':').map(Number)

   startDate.setHours(startHour, startMinute, 0, 0)
   endDate.setHours(endHour, endMinute, 0, 0)

   const duration = Math.max(15, (endDate.getTime() - startDate.getTime()) / 60000)
   handleCreateEvent(date, startDate.toISOString(), endDate.toISOString(), duration)
}

watch(
   () => props.events,
   (newEvents) => {
      calendarSetEvents(newEvents)
   },
   { deep: true, immediate: true }
)

defineExpose({
   goToDate: calendarGoToDate,
   goToToday: handleGoToToday,
   goToPrevious: handleGoToPrevious,
   goToNext: handleGoToNext,
   canGoPrevious: canGoPrevious,
   canGoNext: canGoNext,
   setView: calendarSetView,
   selectDate: calendarSelectDate,
   currentDate: calendarCurrentDate,
   selectedDate: calendarSelectedDate,
   view: calendarView,
   title: currentTitle.value,
   forceUpdate,
})
</script>

<template>
   <div class="calendar-view">
      <slot name="header" v-bind="{ currentTitle }" />
      <div class="flex-1">
         <CalendarMonthGrid
            v-if="calendarView === 'month'"
            :calendar-month="calendarMonth"
            :day-names="calendarDayNames"
            :show-week-numbers="showWeekNumbers"
            :allow-event-creation="allowEventCreation"
            :max-events-per-day="maxEventsPerDay"
            :time-format="config.timeFormat"
            @day-click="handleDayClick"
            @event-click="handleEventClick"
            @create-event="handleCreateEvent"
            @event-update="handleEventUpdate">
            <template #event="props">
               <slot name="event" v-bind="props" />
            </template>
         </CalendarMonthGrid>
         <CalendarWeekGrid
            v-else-if="calendarView === 'week'"
            :calendar-cells="calendarCells"
            :day-names="calendarDayNames"
            :allow-event-creation="allowEventCreation"
            :hour-height="config.hourHeight"
            :time-format="config.timeFormat"
            @day-click="handleDayClick"
            @event-click="handleEventClick"
            @create-event="handleCreateEvent"
            @time-slot-click="handleTimeSlotClick"
            @event-update="handleEventUpdate">
            <template #event="props">
               <slot name="event" v-bind="props" />
            </template>
         </CalendarWeekGrid>
         <CalendarDateGrid
            v-else-if="calendarView === 'date'"
            :calendar-cells="calendarCells"
            :allow-event-creation="allowEventCreation"
            :hour-height="config.hourHeight"
            :time-format="config.timeFormat"
            @day-click="handleDayClick"
            @event-click="handleEventClick"
            @create-event="handleCreateEvent"
            @time-slot-click="handleTimeSlotClick"
            @event-update="handleEventUpdate">
            <template #event="props">
               <slot name="event" v-bind="props" />
            </template>
         </CalendarDateGrid>
      </div>
   </div>
</template>
