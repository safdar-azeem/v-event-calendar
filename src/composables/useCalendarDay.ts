import { computed } from 'vue'
import type { CalendarCell } from '../types'
import {
   createEventFromDateTime,
   getEventEndTime,
   getEventStartTime,
   isEventMultiDay,
} from '../utils/calendarDateUtils'
import { isEventAllDay } from '../utils/eventUtils'

export function useCalendarDay(
   props: {
      cell: CalendarCell
      view: 'month' | 'week' | 'date'
      maxEventsDisplay: number
      allowEventCreation: boolean
   },
   emit: any
) {
   const calendarDayClasses = computed(() => {
      const classes = ['relative', 'transition-colors', 'cursor-pointer', 'flex', 'flex-col']

      if (props.cell.isToday) {
         classes.push('today')
      }

      if (props.cell.isSelected) {
         classes.push('selected')
      }

      if (props.cell.isWeekend) {
         classes.push('weekend')
      }

      return classes
   })

   const calendarDateNumber = computed(() => {
      return props.cell.date.getDate()
   })

   const calendarDisplayedEvents = computed(() => {
      if (props.view !== 'month') {
         return props.cell.events
      }
      return props.cell.events.filter((event) => !isEventAllDay(event) && !isEventMultiDay(event))
   })

   const hasMultiDayEvent = computed(() => {
      if (props.view !== 'month') return false
      return props.cell.events.some((event) => isEventAllDay(event) || isEventMultiDay(event))
   })

   const calendarGetNextAvailableTime = (newIndex: any) => {
      const m = props.cell.events[newIndex]

      console.log('m :>> ', m)

      const existingEvents = props.cell.events.filter((event) => !isEventAllDay(event) && event.end)

      if (!existingEvents.length) {
         return { startTime: '09:00', endTime: '10:00' }
      }

      const sortedEvents = [...existingEvents].sort((a, b) => {
         const aStartTime = getEventStartTime(a)
         const bStartTime = getEventStartTime(b)
         if (!aStartTime || !bStartTime) return 0
         return aStartTime.localeCompare(bStartTime)
      })

      const lastEvent = sortedEvents[sortedEvents.length - 1]
      const lastEventEndTime = getEventEndTime(lastEvent)

      if (!lastEventEndTime) {
         return { startTime: '09:00', endTime: '10:00' }
      }

      const [hours, minutes] = lastEventEndTime.split(':').map(Number)

      let nextStartHour = hours
      let nextStartMinute = minutes

      if (nextStartMinute > 0) {
         nextStartHour += 1
         nextStartMinute = 0
      }

      if (nextStartHour >= 24) {
         nextStartHour = 23
         nextStartMinute = 0
      }

      const startTime = `${nextStartHour.toString().padStart(2, '0')}:${nextStartMinute
         .toString()
         .padStart(2, '0')}`
      const endHour = Math.min(nextStartHour + 1, 23)
      const endTime = `${endHour.toString().padStart(2, '0')}:${nextStartMinute
         .toString()
         .padStart(2, '0')}`

      return { startTime, endTime }
   }

   const calendarHandleDayClick = () => {
      emit('dayClick', props.cell.date)
   }

   const calendarHandleCreateEvent = () => {
      if (props.allowEventCreation) {
         const { startTime, endTime } = calendarGetNextAvailableTime(props.cell.date)
         const eventData = createEventFromDateTime(props.cell.date, startTime, endTime, false)
         const duration = Math.max(
            15,
            (new Date(eventData.end || eventData.start).getTime() -
               new Date(eventData.start).getTime()) /
               60000
         )
         emit('createEvent', props.cell.date, eventData.start, eventData.end, duration)
      }
   }

   const calendarHandleDoubleClick = () => {
      calendarHandleCreateEvent()
   }

   const calendarHandleDragEnd = (event: any) => {
      if (!event.to || !event.from) return

      const toIndex = event.newIndex
      const newDateString = event.to.getAttribute('data-col')
      const eventId = event.item.dataset.eventId

      const originalStart = new Date(event.item.dataset.eventStarttime)
      const originalEnd = new Date(event.item.dataset.eventEndtime)
      const durationMs = originalEnd.getTime() - originalStart.getTime()

      const eventsOnDay = Array.from(event.to.children)
         .filter((child: any) => child.dataset?.eventStarttime && child.dataset?.eventEndtime)
         .map((child: any) => ({
            start: new Date(child.dataset.eventStarttime),
            end: new Date(child.dataset.eventEndtime),
         }))
         .sort((a, b) => a.start.getTime() - b.start.getTime())

      let newStart: Date
      let newEnd: Date

      if (eventsOnDay.length === 0) {
         newStart = new Date(newDateString)
         newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0)
         newEnd = new Date(newStart.getTime() + durationMs)
      } else {
         const earliestEvent = eventsOnDay[0]
         const dropAfterEvent = event?.to?.children[toIndex - 1]
            ? {
                 start: new Date(event.to.children[toIndex - 1].dataset.eventStarttime),
                 end: new Date(event.to.children[toIndex - 1].dataset.eventEndtime),
              }
            : null

         const isBeforeFirstEvent = toIndex === 0

         if (isBeforeFirstEvent) {
            if (originalStart < earliestEvent.start) {
               newStart = new Date(newDateString)
               newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0)
            } else {
               newStart = new Date(newDateString)
               newStart.setHours(9, 0, 0, 0)
            }
            newEnd = new Date(newStart.getTime() + durationMs)
         } else if (dropAfterEvent) {
            newStart = new Date(newDateString)
            newStart.setHours(dropAfterEvent.end.getHours(), dropAfterEvent.end.getMinutes(), 0, 0)
            newEnd = new Date(newStart.getTime() + durationMs)
         }
      }

      const duration = Math.max(15, (newEnd.getTime() - newStart.getTime()) / 60000)
      emit('eventUpdate', eventId, newStart.toISOString(), newEnd.toISOString(), duration)
   }

   const calendarDayNumberClasses = computed(() => {
      const classes = [
         'inline-flex',
         'items-center',
         'justify-center',
         'font-medium',
         'transition-colors',
      ]

      if (props.cell.isToday) {
         classes.push('today')
      }

      return classes
   })

   return {
      calendarDayClasses,
      calendarDateNumber,
      calendarDisplayedEvents,
      hasMultiDayEvent,
      calendarHandleDayClick,
      calendarHandleCreateEvent,
      calendarHandleDoubleClick,
      calendarHandleDragEnd,
      calendarDayNumberClasses,
   }
}
