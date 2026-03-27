<script setup lang="ts">
import Icon from './Icon.vue'
import CalendarEventComponent from './CalendarEvent.vue'
import type { CalendarCell, CalendarEvent } from '../types'
import { useCalendarDay } from '../composables/useCalendarDay'
import { useCalendarEventNativeDrag } from '../composables/useCalendarEventNativeDrag'

interface CalendarDayProps {
   cell: CalendarCell
   view: 'month' | 'week' | 'date'
   maxEventsDisplay?: number
   allowEventCreation?: boolean
   multiDayTrackCount?: number
   timeFormat?: '12h' | '24h'
}

interface CalendarDayEmits {
   (e: 'dayClick', date: Date): void
   (e: 'eventClick', event: CalendarEvent): void
   (e: 'createEvent', date: Date, startTime: string, endTime: string, duration: number): void
   (
      e: 'eventUpdate',
      eventId: string,
      newStartTime?: string,
      newEndTime?: string,
      duration?: number
   ): void
}

const props = withDefaults(defineProps<CalendarDayProps>(), {
   view: 'month',
   timeFormat: '24h',
   maxEventsDisplay: 2,
   allowEventCreation: true,
})

const emit = defineEmits<CalendarDayEmits>()

const {
   calendarDayClasses,
   calendarDateNumber,
   calendarDisplayedEvents,
   hasMultiDayEvent,
   calendarHandleDayClick,
   calendarHandleCreateEvent,
   calendarHandleDoubleClick,
   calendarDayNumberClasses,
} = useCalendarDay(props, emit)

const { startNativeDrag, draggedEventId } = useCalendarEventNativeDrag(emit, props)
</script>

<template>
   <div
      class="calendar-day"
      :class="calendarDayClasses"
      :data-col="props.cell.dateString"
      @click="calendarHandleDayClick"
      @dblclick="calendarHandleDoubleClick">
      <div class="calendar-day-header pointer-events-none">
         <span class="calendar-day-number pointer-events-auto" :class="calendarDayNumberClasses">
            {{ calendarDateNumber }}
         </span>
         <button
            v-if="allowEventCreation"
            @click.stop="calendarHandleCreateEvent"
            class="add-event-btn pointer-events-auto"
            title="Add event">
            <Icon width="13" icon="plus" height="13" />
         </button>
      </div>

      <div
         class="flex-shrink-0"
         v-if="hasMultiDayEvent"
         v-for="(_, index) in multiDayTrackCount"
         :style="{
            minHeight: multiDayTrackCount == 1 ? '25px' : `${25 - (index + 1)}px`,
         }"></div>

      <div class="events-list relative w-full h-full flex flex-col gap-[2px]">
         <div
            v-for="(event, index) in calendarDisplayedEvents"
            :key="event.id"
            :data-event-id="event.id"
            @mousedown.left.stop="startNativeDrag($event, event)"
            :style="{ 
               opacity: draggedEventId === event.id ? '0.4' : '1', 
               cursor: 'grab' 
            }"
         >
            <CalendarEventComponent
               :event="event"
               :view="view"
               :event-index="index"
               :compact="true"
               :time-format="props.timeFormat"
               @click="emit('eventClick', $event)">
               <template #event="props">
                  <slot name="event" v-bind="props" />
               </template>
            </CalendarEventComponent>
         </div>
      </div>
   </div>
</template>
