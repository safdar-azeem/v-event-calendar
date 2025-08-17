import { computed, ref } from 'vue'
import type { CalendarCell } from '../types'
import { isEventAllDay } from '../utils/eventUtils'
import { useCalendarEventDragCreate } from './useCalendarEventDragCreate'
import {
   createEventFromDateTime,
   formatDisplayTime,
   getEventEndTime,
   getEventStartTime,
   isEventMultiDay,
} from '../utils/calendarDateUtils'

export function useCalendarGrid(
   props: {
      calendarCells?: CalendarCell[]
      allowEventCreation: boolean
      hourHeight: number
      startHour: number
      endHour: number
      timeFormat?: '12h' | '24h'
   },
   emit: any,
   cell?: any
) {
   const isDraggingDisabled = ref(false)
   const dragCreateTimeout = ref<any>(null)

   const { startDragCreate, isDragCreating, setEventCreateCallback, cancelDragCreate } =
      useCalendarEventDragCreate()

   setEventCreateCallback((date: Date, startTime: string, endTime: string) => {
      const eventData = createEventFromDateTime(date, startTime, endTime, false)
      const duration = Math.max(
         15,
         (new Date(eventData.end || eventData.start).getTime() - new Date(eventData.start).getTime()) /
            60000
      )
      emit('createEvent', date, eventData.start, eventData.end, duration)
   })

   const hours = computed(() => {
      const result = []
      for (let i = props.startHour; i < props.endHour; i++) {
         result.push({
            hour: i,
            display: formatDisplayTime(
               `${i.toString().padStart(2, '0')}:00`,
               props.timeFormat === '24h'
            ),
            value: i,
         })
      }
      return result
   })

   const getEventsForTimeSlot = (cellOrHour: CalendarCell | number, hour?: number) => {
      const targetCell = typeof cellOrHour === 'number' ? cell.value : cellOrHour
      const targetHour = typeof cellOrHour === 'number' ? cellOrHour : hour!

      if (!targetCell || !targetCell.events) return []

      return targetCell.events.filter((event: any) => {
         if (isEventAllDay(event) || isEventMultiDay(event)) return false
         const eventStartTime = getEventStartTime(event)
         if (!eventStartTime) return false
         const eventHour = parseInt(eventStartTime.split(':')[0])
         return eventHour === targetHour
      })
   }

   const getMaxEventsInHourSlot = (hour: number) => {
      if (!props.calendarCells) return 0
      let maxEvents = 0
      props.calendarCells.forEach((cell) => {
         const eventsCount = getEventsForTimeSlot(cell, hour).length
         if (eventsCount > maxEvents) {
            maxEvents = eventsCount
         }
      })
      return maxEvents
   }

   const getTimeSlotHeight = (hour: number) => {
      const maxEvents = props.calendarCells
         ? getMaxEventsInHourSlot(hour)
         : getEventsForTimeSlot(hour).length

      if (maxEvents <= 1) return props.hourHeight

      const minHeight = props.hourHeight
      const eventSpacing = 32
      const additionalHeight = Math.max(0, maxEvents - 1) * eventSpacing

      return Math.max(minHeight, minHeight + additionalHeight)
   }

   const getEventHeight = (hour: number) => {
      const eventsCount = getEventsForTimeSlot(hour).length
      if (eventsCount <= 1) return Math.max(28, props.hourHeight - 4)
      return 28
   }

   const getNextAvailableTimeForSlot = (cellOrHour: CalendarCell | number, hour?: number) => {
      const targetCell = typeof cellOrHour === 'number' ? cell.value : cellOrHour
      const targetHour = typeof cellOrHour === 'number' ? cellOrHour : hour!
      const eventsInHour = getEventsForTimeSlot(targetCell, targetHour)

      if (!eventsInHour.length) {
         const startTime = `${targetHour.toString().padStart(2, '0')}:00`
         const endTime = `${(targetHour + 1).toString().padStart(2, '0')}:00`
         return { startTime, endTime }
      }

      const sortedEvents = eventsInHour.sort((a, b) => {
         const aStartTime = getEventStartTime(a)
         const bStartTime = getEventStartTime(b)
         if (!aStartTime || !bStartTime) return 0
         return aStartTime.localeCompare(bStartTime)
      })

      const lastEvent = sortedEvents[sortedEvents.length - 1]
      const lastEventEndTime = getEventEndTime(lastEvent)

      if (lastEventEndTime) {
         const [endHour, endMinute] = lastEventEndTime.split(':').map(Number)
         let startHour = endHour
         let startMinute = endMinute

         if (endMinute > 0) {
            startHour = endHour + 1
            startMinute = 0
         }

         const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute
            .toString()
            .padStart(2, '0')}`
         const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`
         return { startTime, endTime }
      }

      const startTime = `${targetHour.toString().padStart(2, '0')}:00`
      const endTime = `${(targetHour + 1).toString().padStart(2, '0')}:00`
      return { startTime, endTime }
   }

   const handleTimeSlotMouseDown = (
      event: MouseEvent,
      cellOrHour: CalendarCell | number,
      hour?: number
   ) => {
      if (!props.allowEventCreation || isDraggingDisabled.value || isDragCreating.value) return

      const targetCell = typeof cellOrHour === 'number' ? cell.value : cellOrHour
      const targetHour = typeof cellOrHour === 'number' ? cellOrHour : hour!

      if (!targetCell) return

      if (dragCreateTimeout.value) {
         clearTimeout(dragCreateTimeout.value)
         dragCreateTimeout.value = null
      }

      dragCreateTimeout.value = setTimeout(() => {
         const timeSlotElement = (event.target as HTMLElement).closest('.calendar-time-slot')
         if (timeSlotElement) {
            startDragCreate(
               event.clientY,
               targetHour,
               targetCell.date,
               timeSlotElement as HTMLElement,
               props.hourHeight
            )
         }
      }, 150)
   }

   const handleTimeSlotMouseUp = (event: MouseEvent) => {
      if (dragCreateTimeout.value) {
         clearTimeout(dragCreateTimeout.value)
         dragCreateTimeout.value = null
      }
   }

   const handleTimeSlotClick = (cellOrHour: CalendarCell | number, hour?: number) => {
      if (dragCreateTimeout.value) {
         clearTimeout(dragCreateTimeout.value)
         dragCreateTimeout.value = null
      }
      if (!props.allowEventCreation || isDraggingDisabled.value || isDragCreating.value) return

      const targetCell = typeof cellOrHour === 'number' ? cell.value : cellOrHour
      const targetHour = typeof cellOrHour === 'number' ? cellOrHour : hour!

      if (!targetCell) return

      const { startTime, endTime } = getNextAvailableTimeForSlot(targetCell, targetHour)
      emit('timeSlotClick', targetCell.date, startTime)
   }

   const handleDragEnd = (event: any) => {
      if (!event.to || !event.from) return

      const eventId = event.item.dataset.eventId
      if (!eventId) return

      const toTimeSlot = event.to.closest('.calendar-time-slot')
      const newDateString = toTimeSlot?.getAttribute('data-col')
      const newHourStr = toTimeSlot?.getAttribute('data-hour')

      if (!newDateString || !newHourStr) return

      const newHour = parseInt(newHourStr)
      const newDate = new Date(newDateString)

      const eventDuration = event.item.dataset.eventDuration || '60'
      const durationMinutes = parseInt(eventDuration)

      const [startHour, startMinute] = [
         `${newHour.toString().padStart(2, '0')}:00`.split(':')[0],
         '00',
      ].map(Number)

      const totalStartMinutes = startHour * 60 + startMinute
      const totalEndMinutes = totalStartMinutes + durationMinutes
      const endHour = Math.floor(totalEndMinutes / 60) % 24
      const endMinute = totalEndMinutes % 60
      const newEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute
         .toString()
         .padStart(2, '0')}`

      const eventData = createEventFromDateTime(
         newDate,
         `${newHour.toString().padStart(2, '0')}:00`,
         newEndTime,
         false
      )
      const duration = Math.max(
         15,
         (new Date(eventData.end || eventData.start).getTime() - new Date(eventData.start).getTime()) /
            60000
      )
      emit('eventUpdate', eventId, eventData.start, eventData.end, duration)
   }

   const getDayHeaderClass = (cell?: CalendarCell) => {
      if (!cell) return []
      const classes = []
      if (cell.isToday) {
         classes.push('today')
      }
      if (cell.isWeekend) {
         classes.push('weekend')
      }
      return classes
   }

   const getTimeSlotClass = (cellOrHour: CalendarCell | number, hour?: number) => {
      const targetHour = typeof cellOrHour === 'number' ? cellOrHour : hour!
      const classes = ['border-gray-100', 'relative', 'cursor-pointer']

      if (targetHour % 2 === 0) {
         classes.push('border-gray-200')
      }

      if (isDragCreating.value) {
         classes.push('drag-creating')
      }

      return classes
   }

   const handleEventResizeUpdate = (eventId: string, newStart: string, newEnd: string) => {
      const duration = Math.max(15, (new Date(newEnd).getTime() - new Date(newStart).getTime()) / 60000)
      emit('eventUpdate', eventId, newStart, newEnd, duration)
   }

   const handleEventResizeEnd = (eventId: string, newStart: string, newEnd: string) => {
      const duration = Math.max(15, (new Date(newEnd).getTime() - new Date(newStart).getTime()) / 60000)
      emit('eventUpdate', eventId, newStart, newEnd, duration)
   }

   const setDraggingDisabled = (disabled: boolean) => {
      isDraggingDisabled.value = disabled
   }

   return {
      hours,
      getEventsForTimeSlot,
      getMaxEventsInHourSlot,
      getTimeSlotHeight,
      getEventHeight,
      getNextAvailableTimeForSlot,
      handleTimeSlotClick,
      handleTimeSlotMouseDown,
      handleTimeSlotMouseUp,
      handleDragEnd,
      getDayHeaderClass,
      getTimeSlotClass,
      handleEventResizeUpdate,
      handleEventResizeEnd,
      setDraggingDisabled,
      isDraggingDisabled: computed(() => isDraggingDisabled.value),
      isDragCreating,
      cancelDragCreate,
   }
}
