import type { CalendarEvent } from '../types/index'

export const formatDate = (date: Date): string => {
   const year = date.getFullYear()
   const month = (date.getMonth() + 1).toString().padStart(2, '0')
   const day = date.getDate().toString().padStart(2, '0')
   return `${year}-${month}-${day}`
}

export const parseDate = (dateString: string): Date => {
   const [year, month, day] = dateString.split('-').map(Number)
   return new Date(year, month - 1, day)
}

export const formatTime = (date: Date): string => {
   const hours = date.getHours().toString().padStart(2, '0')
   const minutes = date.getMinutes().toString().padStart(2, '0')
   return `${hours}:${minutes}`
}

export const parseTime = (timeString: string): { hour: number; minute: number } => {
   const [hour, minute] = timeString.split(':').map(Number)
   return { hour, minute }
}

export const parseISOString = (isoString: string): Date => {
   return new Date(isoString)
}

export const formatToISO = (date: Date): string => {
   return date.toISOString()
}

export const formatToLocalISO = (date: Date): string => {
   const offset = date.getTimezoneOffset()
   const localDate = new Date(date.getTime() - offset * 60 * 1000)
   return localDate.toISOString().slice(0, -1)
}

export const createISODateTime = (date: Date, timeString?: string): string => {
   if (!timeString) {
      const localDate = new Date(date)
      localDate.setHours(0, 0, 0, 0)
      return localDate.toISOString()
   }

   const { hour, minute } = parseTime(timeString)
   const dateTime = new Date(date)
   dateTime.setHours(hour, minute, 0, 0)
   return dateTime.toISOString()
}

export const extractDateFromISO = (isoString: string): Date => {
   const date = new Date(isoString)
   return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export const extractTimeFromISO = (isoString: string): string => {
   const date = new Date(isoString)
   const hours = date.getHours().toString().padStart(2, '0')
   const minutes = date.getMinutes().toString().padStart(2, '0')
   return `${hours}:${minutes}`
}

export const getEventStartDate = (event: CalendarEvent): Date => {
   return extractDateFromISO(event.start)
}

export const getEventEndDate = (event: CalendarEvent): Date => {
   if (!event.end) return getEventStartDate(event)
   return extractDateFromISO(event.end)
}

export const getEventStartTime = (event: CalendarEvent): string | undefined => {
   if (event.allDay) return undefined
   return extractTimeFromISO(event.start)
}

export const getEventEndTime = (event: CalendarEvent): string | undefined => {
   if (event.allDay || !event.end) return undefined
   return extractTimeFromISO(event.end)
}

export const isEventOnDate = (event: CalendarEvent, date: Date): boolean => {
   const eventStartDate = getEventStartDate(event)
   const eventEndDate = getEventEndDate(event)
   const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

   return targetDate >= eventStartDate && targetDate <= eventEndDate
}

export const isEventMultiDay = (event: CalendarEvent): boolean => {
   if (!event.end) return false
   const startDate = getEventStartDate(event)
   const endDate = getEventEndDate(event)
   return !isSameDay(startDate, endDate)
}

export const getEventDurationInDays = (event: CalendarEvent): number => {
   const startDate = getEventStartDate(event)
   const endDate = getEventEndDate(event)
   const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
   return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

export const isToday = (date: Date): boolean => {
   const today = new Date()
   return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
   )
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
   return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
   )
}

export const isSameMonth = (date1: Date, date2: Date): boolean => {
   return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear()
}

export const getStartOfMonth = (date: Date): Date => {
   return new Date(date.getFullYear(), date.getMonth(), 1)
}

export const getEndOfMonth = (date: Date): Date => {
   return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export const getStartOfWeek = (date: Date, startOnMonday: boolean = true): Date => {
   const day = date.getDay()
   const diff = startOnMonday ? (day === 0 ? -6 : 1 - day) : -day
   const startOfWeek = new Date(date)
   startOfWeek.setDate(date.getDate() + diff)
   return startOfWeek
}

export const getEndOfWeek = (date: Date, startOnMonday: boolean = true): Date => {
   const startOfWeek = getStartOfWeek(date, startOnMonday)
   const endOfWeek = new Date(startOfWeek)
   endOfWeek.setDate(startOfWeek.getDate() + 6)
   return endOfWeek
}

export const addDays = (date: Date, days: number): Date => {
   const result = new Date(date)
   result.setDate(date.getDate() + days)
   return result
}

export const addMonths = (date: Date, months: number): Date => {
   const result = new Date(date)
   result.setMonth(date.getMonth() + months)
   return result
}

export const addWeeks = (date: Date, weeks: number): Date => {
   return addDays(date, weeks * 7)
}

export const getDaysInMonth = (date: Date): number => {
   return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export const getWeekNumber = (date: Date): number => {
   const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
   const dayNum = d.getUTCDay() || 7
   d.setUTCDate(d.getUTCDate() + 4 - dayNum)
   const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
   return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export const isWeekend = (date: Date): boolean => {
   const day = date.getDay()
   return day === 0 || day === 6
}

export const getCalendarGrid = (date: Date, startOnMonday: boolean = true): Date[] => {
   const startOfMonth = getStartOfMonth(date)
   const startDate = getStartOfWeek(startOfMonth, startOnMonday)
   const grid: Date[] = []
   let currentDate = new Date(startDate)

   for (let i = 0; i < 42; i++) {
      grid.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
   }

   return grid
}

export const getWeekGrid = (date: Date, startOnMonday: boolean = true): Date[] => {
   const startOfWeek = getStartOfWeek(date, startOnMonday)
   const grid: Date[] = []

   for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      grid.push(day)
   }

   return grid
}

export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
   return events.filter((event) => isEventOnDate(event, date))
}

export const filterEventsByDateRange = (
   events: CalendarEvent[],
   startDate: Date,
   endDate: Date
): CalendarEvent[] => {
   return events.filter((event) => {
      const eventStartDate = getEventStartDate(event)
      const eventEndDate = getEventEndDate(event)

      return (
         (eventStartDate <= endDate && eventEndDate >= startDate) ||
         (eventStartDate >= startDate && eventStartDate <= endDate)
      )
   })
}

export const sortEventsByTime = (events: CalendarEvent[]): CalendarEvent[] => {
   return [...events].sort((a, b) => {
      if (a.allDay && !b.allDay) return -1
      if (!a.allDay && b.allDay) return 1
      if (a.allDay && b.allDay) return 0

      const aTime = getEventStartTime(a)
      const bTime = getEventStartTime(b)

      if (!aTime && bTime) return -1
      if (aTime && !bTime) return 1
      if (!aTime && !bTime) return 0

      return aTime!.localeCompare(bTime!)
   })
}

export const getEventDuration = (event: CalendarEvent): number => {
   if (event.allDay || !event.end) return 0

   const startTime = getEventStartTime(event)
   const endTime = getEventEndTime(event)

   if (!startTime || !endTime) return 0

   const start = parseTime(startTime)
   const end = parseTime(endTime)
   const startMinutes = start.hour * 60 + start.minute
   const endMinutes = end.hour * 60 + end.minute

   return endMinutes - startMinutes
}

export const hasTimeConflict = (event1: CalendarEvent, event2: CalendarEvent): boolean => {
   if (event1.allDay || event2.allDay) return false
   if (!event1.end || !event2.end) return false

   const event1StartDate = getEventStartDate(event1)
   const event2StartDate = getEventStartDate(event2)

   if (!isSameDay(event1StartDate, event2StartDate)) return false

   const start1Time = getEventStartTime(event1)
   const end1Time = getEventEndTime(event1)
   const start2Time = getEventStartTime(event2)
   const end2Time = getEventEndTime(event2)

   if (!start1Time || !end1Time || !start2Time || !end2Time) return false

   const start1 = parseTime(start1Time)
   const end1 = parseTime(end1Time)
   const start2 = parseTime(start2Time)
   const end2 = parseTime(end2Time)

   const start1Minutes = start1.hour * 60 + start1.minute
   const end1Minutes = end1.hour * 60 + end1.minute
   const start2Minutes = start2.hour * 60 + start2.minute
   const end2Minutes = end2.hour * 60 + end2.minute

   return start1Minutes < end2Minutes && start2Minutes < end1Minutes
}

export const generateTimeSlots = (startHour: number = 0, endHour: number = 24): string[] => {
   const slots: string[] = []
   for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
         const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
         slots.push(timeString)
      }
   }
   return slots
}

export const formatDisplayTime = (timeString: string, format24h: boolean = true): string => {
   if (!timeString) return ''
   const [hour, minute] = timeString.split(':').map(Number)
   if (format24h) {
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
   }
   const period = hour >= 12 ? 'PM' : 'AM'
   const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
   return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}

export const getRandomColor = (): string => {
   const colors = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#06b6d4',
      '#f97316',
      '#84cc16',
      '#ec4899',
      '#6b7280',
   ]
   return colors[Math.floor(Math.random() * colors.length)]
}

export const addMinutes = (date: Date, minutes: number): Date => {
   return new Date(date.getTime() + minutes * 60 * 1000)
}

export const getRoundedTimeSlots = (date: Date) => {
   const startTime = formatTime(date)
   const endTime = formatTime(addMinutes(date, 30))
   return { startTime, endTime }
}

export function calculateEventEndTime(startTime: string, duration: string): string {
   if (!startTime || !duration) return ''
   const durationMinutes = parseInt(duration, 10)
   if (isNaN(durationMinutes) || durationMinutes <= 0) return ''

   const { hour: startHour, minute: startMinute } = parseTime(startTime)
   const totalStartMinutes = startHour * 60 + startMinute
   const totalEndMinutes = totalStartMinutes + durationMinutes

   const endHour = Math.floor(totalEndMinutes / 60) % 24
   const endMinute = totalEndMinutes % 60

   return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
}

export const createEventFromDateTime = (
   date: Date,
   startTime?: string,
   endTime?: string,
   allDay?: boolean
): { start: string; end?: string; allDay?: boolean } => {
   if (allDay) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      return {
         start: startOfDay.toISOString(),
         end: endOfDay.toISOString(),
         allDay: true,
      }
   }

   const startDateTime = createISODateTime(date, startTime)
   const endDateTime = endTime ? createISODateTime(date, endTime) : undefined

   return {
      start: startDateTime,
      end: endDateTime,
      allDay: false,
   }
}

export function parseISOToDateTime(isoString: string): { date: string; time: string } {
   const dateObj = new Date(isoString)
   const date = formatDate(dateObj)
   const time = formatTime(dateObj)
   return { date, time }
}

export const findNextAvailableTime = (targetDate: Date, eventsOnDay: CalendarEvent[]) => {
   const timedEvents = eventsOnDay.filter(
      (event) => !event.allDay && event.end && isSameDay(getEventStartDate(event), targetDate)
   )

   if (!timedEvents.length) {
      return { startTime: '09:00', endTime: '10:00' }
   }

   const sortedEvents = [...timedEvents].sort((a, b) => {
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
      // This day is full, default to 9 AM
      return { startTime: '09:00', endTime: '10:00' }
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

export const getDuration = (startTime?: string, endTime?: string): number => {
   if (!startTime || !endTime) return 60 // Default 1 hour

   const startDate = new Date(startTime)
   const endDate = new Date(endTime)

   return Math.max(15, (endDate.getTime() - startDate.getTime()) / (1000 * 60)) // Minutes
}
