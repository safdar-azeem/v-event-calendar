import { ref, computed, reactive } from 'vue'
import type {
   CalendarEvent,
   CalendarView,
   CalendarCell,
   CalendarMonth,
   CalendarViewConfig,
   CalendarEventCreateData,
} from '../types/index'
import { isEventAllDay } from '../utils/eventUtils'

import {
   formatDate,
   isToday,
   isSameMonth,
   getCalendarGrid,
   getWeekGrid,
   addDays,
   addMonths,
   addWeeks,
   filterEventsByDate,
   filterEventsByDateRange,
   sortEventsByTime,
   isWeekend,
   getWeekNumber,
   parseTime,
   createEventFromDateTime,
   getEventStartTime,
   getEventEndTime,
} from '../utils/calendarDateUtils'

import { DEFAULT_CALENDAR_CONFIG } from '../constants'

export function useCalendar(initialConfig?: Partial<CalendarViewConfig>) {
   const config = reactive({ ...DEFAULT_CALENDAR_CONFIG, ...initialConfig })
   const calendarCurrentDate = ref(new Date())
   const calendarSelectedDate = ref<Date | null>(null)
   const calendarView = ref<CalendarView>('month')
   const calendarEvents = ref<CalendarEvent[]>([])

   const calendarDates = computed(() => {
      if (calendarView.value === 'month') {
         return getCalendarGrid(calendarCurrentDate.value, config.weekStartsOnMonday)
      } else if (calendarView.value === 'week') {
         return getWeekGrid(calendarCurrentDate.value, config.weekStartsOnMonday)
      } else {
         return [new Date(calendarCurrentDate.value)]
      }
   })

   const calendarCells = computed((): CalendarCell[] => {
      return calendarDates.value.map((date) => {
         const dateString = formatDate(date)
         const dayEvents = filterEventsByDate(calendarEvents.value, date)

         return {
            date,
            dateString,
            isCurrentMonth:
               calendarView.value === 'week' ||
               calendarView.value === 'date' ||
               isSameMonth(date, calendarCurrentDate.value),
            isToday: isToday(date),
            isSelected: calendarSelectedDate.value
               ? date.getTime() === calendarSelectedDate.value.getTime()
               : false,
            events: sortEventsByTime(dayEvents),
            isWeekend: isWeekend(date),
         }
      })
   })

   const calendarMonth = computed((): CalendarMonth => {
      const cells = calendarCells.value
      const weeks = []

      for (let i = 0; i < cells.length; i += 7) {
         const weekCells = cells.slice(i, i + 7)
         weeks.push({
            weekNumber: getWeekNumber(weekCells[0].date),
            days: weekCells,
         })
      }

      return {
         year: calendarCurrentDate.value.getFullYear(),
         month: calendarCurrentDate.value.getMonth(),
         weeks,
      }
   })

   const calendarWeek = computed(() => {
      return {
         startDate: calendarDates.value[0],
         endDate: calendarDates.value[6],
         days: calendarCells.value.map((cell) => ({
            date: cell.date,
            dateString: cell.dateString,
            timeSlots: generateTimeSlots(cell.date),
         })),
      }
   })

   const calendarVisibleEvents = computed(() => {
      const startDate = calendarDates.value[0]
      const endDate = calendarDates.value[calendarDates.value.length - 1]
      return filterEventsByDateRange(calendarEvents.value, startDate, endDate)
   })

   const calendarCurrentMonthName = computed(() => {
      return calendarCurrentDate.value.toLocaleDateString('en-US', {
         month: 'long',
         year: 'numeric',
      })
   })

   const calendarCurrentWeekRange = computed(() => {
      if (calendarView.value !== 'week') return ''
      const start = calendarDates.value[0]
      const end = calendarDates.value[6]

      if (start.getMonth() === end.getMonth()) {
         return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
         })}`
      } else {
         return `${start.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
         })} - ${end.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
         })}`
      }
   })

   const calendarDayNames = computed(() => {
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      if (config.weekStartsOnMonday) {
         return [...names.slice(1), names[0]]
      }
      return names
   })

   function generateTimeSlots(date: Date) {
      const slots = []
      const dayEvents = filterEventsByDate(calendarEvents.value, date)

      for (let hour = 0; hour < 24; hour++) {
         const timeString = `${hour.toString().padStart(2, '0')}:00`
         const hourEvents = dayEvents.filter((event) => {
            if (isEventAllDay(event)) return false
            const eventStartTime = getEventStartTime(event)
            if (!eventStartTime) return false
            const eventHour = parseInt(eventStartTime.split(':')[0])
            return eventHour === hour
         })

         slots.push({
            hour,
            minute: 0,
            timeString,
            events: hourEvents,
         })
      }

      return slots
   }

   const calendarGoToToday = () => {
      calendarCurrentDate.value = new Date()
      calendarSelectedDate.value = new Date()
   }

   const calendarGoToPrevious = () => {
      if (calendarView.value === 'month') {
         calendarCurrentDate.value = addMonths(calendarCurrentDate.value, -1)
      } else if (calendarView.value === 'week') {
         calendarCurrentDate.value = addWeeks(calendarCurrentDate.value, -1)
      } else {
         calendarCurrentDate.value = addDays(calendarCurrentDate.value, -1)
      }
   }

   const calendarGoToNext = () => {
      if (calendarView.value === 'month') {
         calendarCurrentDate.value = addMonths(calendarCurrentDate.value, 1)
      } else if (calendarView.value === 'week') {
         calendarCurrentDate.value = addWeeks(calendarCurrentDate.value, 1)
      } else {
         calendarCurrentDate.value = addDays(calendarCurrentDate.value, 1)
      }
   }

   const calendarGoToDate = (date: Date) => {
      calendarCurrentDate.value = new Date(date)
   }

   const calendarSelectDate = (date: Date) => {
      calendarSelectedDate.value = new Date(date)
   }

   const calendarSetView = (newView: CalendarView) => {
      calendarView.value = newView
   }

   const calendarAddEvent = (event: CalendarEvent) => {
      calendarEvents.value.push(event)
   }

   const calendarUpdateEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
      const index = calendarEvents.value.findIndex((e) => e.id === eventId)
      if (index !== -1) {
         calendarEvents.value[index] = { ...calendarEvents.value[index], ...updates }
      }
   }

   const calendarRemoveEvent = (eventId: string) => {
      calendarEvents.value = calendarEvents.value.filter((e) => e.id !== eventId)
   }

   const calendarSetEvents = (newEvents: CalendarEvent[]) => {
      calendarEvents.value = [...newEvents]
   }

   const calendarGetEventsForDate = (date: Date): CalendarEvent[] => {
      return filterEventsByDate(calendarEvents.value, date)
   }

   const calendarCreateEventAtDate = (
      date: Date,
      time?: string,
      allDay?: boolean
   ): CalendarEventCreateData => {
      const dayEvents = calendarGetEventsForDate(date).filter((e) => !isEventAllDay(e) && e.end)
      let startTime = time
      let endTime = time ? addHourToTime(time) : undefined

      if (allDay) {
         return createEventFromDateTime(date, undefined, undefined, true)
      }

      if (!time) {
         if (dayEvents.length === 0) {
            startTime = '09:00'
            endTime = '10:00'
         } else {
            const lastEvent = dayEvents.reduce((latest, event) => {
               const latestEndTime = getEventEndTime(latest)
               const currentEndTime = getEventEndTime(event)

               if (!latestEndTime || !currentEndTime) return latest

               const latestTime = parseTime(latestEndTime)
               const currentTime = parseTime(currentEndTime)

               return currentTime.hour > latestTime.hour ||
                  (currentTime.hour === latestTime.hour && currentTime.minute > latestTime.minute)
                  ? event
                  : latest
            }, dayEvents[0])

            const lastEventEndTime = getEventEndTime(lastEvent)
            if (lastEventEndTime) {
               const { hour, minute } = parseTime(lastEventEndTime)
               startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
               endTime = addHourToTime(startTime)
            } else {
               startTime = '09:00'
               endTime = '10:00'
            }
         }
      }
      return createEventFromDateTime(date, startTime, endTime, false)
   }

   const addHourToTime = (timeString: string): string => {
      const [hour, minute] = timeString.split(':').map(Number)
      const newHour = (hour + 1) % 24
      return `${newHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
   }

   const calendarUpdateConfig = (updates: Partial<CalendarViewConfig>) => {
      Object.assign(config, updates)
   }

   return {
      config,
      currentDate: calendarCurrentDate,
      selectedDate: calendarSelectedDate,
      view: calendarView,
      events: calendarEvents,
      calendarCells,
      calendarMonth,
      calendarWeek,
      calendarVisibleEvents,
      calendarCurrentMonthName,
      calendarCurrentWeekRange,
      calendarDayNames,
      calendarGoToToday,
      calendarGoToPrevious,
      calendarGoToNext,
      calendarGoToDate,
      calendarSelectDate,
      calendarSetView,
      calendarAddEvent,
      calendarUpdateEvent,
      calendarRemoveEvent,
      calendarSetEvents,
      calendarGetEventsForDate,
      calendarCreateEventAtDate,
      calendarUpdateConfig,
   }
}
