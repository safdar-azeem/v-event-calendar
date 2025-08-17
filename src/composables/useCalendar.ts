import { ref, computed, reactive, watch } from 'vue'
import type {
   CalendarEvent,
   CalendarView,
   CalendarCell,
   CalendarMonth,
   CalendarViewConfig,
} from '../types/index'
import { isEventAllDay } from '../utils/eventUtils'

import {
   formatDate,
   isToday,
   isSameMonth,
   getCalendarGrid,
   getWeekGrid,
   sortEventsByTime,
   isWeekend,
   getWeekNumber,
   getEventStartTime,
} from '../utils/calendarDateUtils'

import { DEFAULT_CALENDAR_CONFIG } from '../constants'
import { useEventProcessor } from './useEventProcessor'
import { calculateAllDayEventLayout } from '../utils/calendarLayoutUtils'

export function useCalendar(initialConfig?: Partial<CalendarViewConfig>) {
   const config = reactive({ ...DEFAULT_CALENDAR_CONFIG, ...initialConfig })
   const calendarCurrentDate = ref(new Date())
   const calendarSelectedDate = ref<Date | null>(null)
   const calendarView = ref<CalendarView>('month')
   const calendarEvents = ref<CalendarEvent[]>([])

   const { processEvents } = useEventProcessor()
   const processedEvents = ref(processEvents(calendarEvents.value))

   watch(
      calendarEvents,
      (newEvents) => {
         processedEvents.value = processEvents(newEvents)
      },
      { deep: true }
   )

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
         const dayData = processedEvents.value.get(dateString)

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
            events: dayData ? sortEventsByTime(dayData.events) : [],
            isWeekend: isWeekend(date),
            timedLayout: dayData?.timedLayout,
            multiDayTrackCount: dayData?.multiDayTrackCount,
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
            allDayLayout: calculateAllDayEventLayout(weekCells),
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
      const dayData = processedEvents.value.get(formatDate(date))
      const dayEvents = dayData ? dayData.events : []

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

   const calendarGoToDate = (date: Date) => {
      calendarCurrentDate.value = new Date(date)
   }

   const calendarSelectDate = (date: Date) => {
      calendarSelectedDate.value = new Date(date)
   }

   const calendarSetView = (newView: CalendarView) => {
      calendarView.value = newView
   }

   const calendarSetEvents = (newEvents: CalendarEvent[]) => {
      calendarEvents.value = [...newEvents]
   }

   const forceUpdate = () => {
      processedEvents.value = processEvents(calendarEvents.value)
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
      calendarCurrentMonthName,
      calendarCurrentWeekRange,
      calendarDayNames,
      calendarGoToToday,
      calendarGoToDate,
      calendarSelectDate,
      calendarSetView,
      calendarSetEvents,
      forceUpdate,
   }
}
