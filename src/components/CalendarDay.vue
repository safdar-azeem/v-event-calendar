<script setup lang="ts">
import Icon from './Icon.vue'
import Draggable from 'vuedraggable'
import CalendarEventComponent from './CalendarEvent.vue'
import type { CalendarCell, CalendarEvent } from '../types'
import { useCalendarDay } from '../composables/useCalendarDay'

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
   (e: 'dragStart'): void
   (e: 'dragEnd'): void
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
   calendarHandleDragEnd,
   calendarDayNumberClasses,
} = useCalendarDay(props, emit)
</script>

<template>
   <div
      class="calendar-day"
      :class="calendarDayClasses"
      @click="calendarHandleDayClick"
      @dblclick="calendarHandleDoubleClick">
      <div class="calendar-day-header">
         <span class="calendar-day-number" :class="calendarDayNumberClasses">
            {{ calendarDateNumber }}
         </span>
         <button
            v-if="allowEventCreation"
            @click.stop="calendarHandleCreateEvent"
            class="add-event-btn"
            title="Add event">
            <Icon width="13" icon="plus" height="13" />
         </button>
      </div>

      <div
         class="flex-shrink-0"
         v-if="hasMultiDayEvent"
         v-for="_ in multiDayTrackCount"
         :style="{
            minHeight: multiDayTrackCount == 1 ? '25px' : '21.5px',
         }"></div>

      <Draggable
         :list="calendarDisplayedEvents"
         item-key="id"
         group="calendar-events"
         class="events-list"
         @start="emit('dragStart')"
         @end="
        (event: any) => {
          calendarHandleDragEnd(event)
          emit('dragEnd')
        }
      "
         :data-col="props.cell.date"
         ghost-class="opacity-50">
         <template #item="{ element: event, index }">
            <div
               :data-event-id="event.id"
               :data-event-endTime="event.end"
               :data-event-startTime="event.start"
               :data-event-duration="
                  Math.max(
                     15,
                     (new Date(event.end || event.start).getTime() - new Date(event.start).getTime()) /
                        60000
                  )
               ">
               <CalendarEventComponent
                  :event="event"
                  :view="view"
                  :event-index="index"
                  :compact="true"
                  :time-format="props.timeFormat"
                  @click.stop="emit('eventClick', $event)">
                  <template #event="props">
                     <slot name="event" v-bind="props" />
                  </template>
               </CalendarEventComponent>
            </div>
         </template>
      </Draggable>
   </div>
</template>
