<script setup lang="ts">
import '../css/style.css'
import { computed, watch } from 'vue'
import CalendarDateGrid from './CalendarDateGrid.vue'
import CalendarWeekGrid from './CalendarWeekGrid.vue'
import CalendarMonthGrid from './CalendarMonthGrid.vue'
import { useCalendar } from '../composables/useCalendar'
import { addMonths, addWeeks } from '../utils/calendarDateUtils'
import type { CalendarEvent, CalendarView, CalendarViewConfig } from '../types'

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
   (e: 'dayClick', date: Date): void
   (e: 'dateChange', date: Date): void
   (e: 'eventClick', event: CalendarEvent): void
   (e: 'viewChange', view: CalendarView): void
   (e: 'eventCreate', date: Date, start: string, end?: string, duration?: number): void
   (e: 'eventUpdate', eventId: string, start: string, end?: string, duration?: number): void
}

const props = withDefaults(defineProps<CalendarViewProps>(), {
   events: () => [],
   maxEventsPerDay: 3,
   initialView: 'month',
   showWeekNumbers: false,
   allowEventEditing: true,
   allowEventCreation: true,
})

const emit = defineEmits<CalendarViewEmits>()

const {
   config,
   calendarCells,
   calendarMonth,
   calendarDayNames,
   view: calendarView,
   calendarCurrentMonthName,
   calendarCurrentWeekRange,
   currentDate: calendarCurrentDate,
   selectedDate: calendarSelectedDate,
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
   forceUpdate,
   view: calendarView,
   canGoNext: canGoNext,
   goToDate: calendarGoToDate,
   goToNext: handleGoToNext,
   setView: calendarSetView,
   title: currentTitle.value,
   goToToday: handleGoToToday,
   canGoPrevious: canGoPrevious,
   selectDate: calendarSelectDate,
   goToPrevious: handleGoToPrevious,
   currentDate: calendarCurrentDate,
   selectedDate: calendarSelectedDate,
})
</script>

<template>
   <div class="calendar-view">
      <slot name="header" v-bind="{ currentTitle }" />
      <div class="flex-1">
         <CalendarMonthGrid
            v-if="calendarView === 'month'"
            @day-click="handleDayClick"
            :day-names="calendarDayNames"
            :calendar-month="calendarMonth"
            @event-click="handleEventClick"
            :time-format="config.timeFormat"
            @create-event="handleCreateEvent"
            @event-update="handleEventUpdate"
            :show-week-numbers="showWeekNumbers"
            :max-events-per-day="maxEventsPerDay"
            :allow-event-creation="allowEventCreation">
            <template #event="props">
               <slot name="event" v-bind="props" />
            </template>
         </CalendarMonthGrid>
         <CalendarWeekGrid
            v-else-if="calendarView === 'week'"
            :calendar-cells="calendarCells"
            @day-click="handleDayClick"
            :day-names="calendarDayNames"
            @event-click="handleEventClick"
            :hour-height="config.hourHeight"
            :time-format="config.timeFormat"
            @create-event="handleCreateEvent"
            @event-update="handleEventUpdate"
            @time-slot-click="handleTimeSlotClick"
            :allow-event-creation="allowEventCreation">
            <template #event="props">
               <slot name="event" v-bind="props" />
            </template>
         </CalendarWeekGrid>
         <CalendarDateGrid
            v-else-if="calendarView === 'date'"
            :calendar-cells="calendarCells"
            @day-click="handleDayClick"
            @event-click="handleEventClick"
            :hour-height="config.hourHeight"
            :time-format="config.timeFormat"
            @create-event="handleCreateEvent"
            @event-update="handleEventUpdate"
            @time-slot-click="handleTimeSlotClick"
            :allow-event-creation="allowEventCreation">
            <template #event="props">
               <slot name="event" v-bind="props" />
            </template>
         </CalendarDateGrid>
      </div>
   </div>
</template>
