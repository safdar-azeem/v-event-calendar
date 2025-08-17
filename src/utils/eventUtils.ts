import type { CalendarEvent } from '../types'

export function isEventAllDay(event: CalendarEvent): boolean {
   if (!event.start || !event.end) {
      return false
   }
   const startDate = new Date(event.start)
   const endDate = new Date(event.end)
   const diff = endDate.getTime() - startDate.getTime()
   const hours = diff / (1000 * 60 * 60)
   return hours >= 24
}
