import { isEventAllDay } from '../utils/eventUtils'
import { calculateTimedEventLayout } from '../utils/calendarLayoutUtils'
import { type CalendarEvent, type ProcessedEvents, type TimedEventLayout } from '../types'
import {
   formatDate,
   getEventEndDate,
   getEventStartDate,
   isEventMultiDay,
} from '../utils/calendarDateUtils'

const getDatesInRange = (startDate: Date, endDate: Date): Date[] => {
   const dates: Date[] = []
   let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
   const lastDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

   while (currentDate <= lastDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
   }
   return dates
}

export function useEventProcessor() {
   /**
    * Processes a flat array of events into a Map grouped by date string.
    * Pre-calculates layouts for timed and all-day events. The array of calendar events.
    * return A Map where keys are date strings (YYYY-MM-DD) and values are processed day objects.
    */
   const processEvents = (events: CalendarEvent[]): ProcessedEvents => {
      const processedMap: ProcessedEvents = new Map()

      if (!events || events.length === 0) {
         return processedMap
      }

      // First pass: group events by date
      events.forEach((event) => {
         const startDate = getEventStartDate(event)
         const endDate = getEventEndDate(event)
         const dates = getDatesInRange(startDate, endDate)

         dates.forEach((date) => {
            const dateString = formatDate(date)
            if (!processedMap.has(dateString)) {
               processedMap.set(dateString, {
                  date,
                  events: [],
                  timedLayout: new Map<string, TimedEventLayout>(),
                  multiDayTrackCount: 0,
               })
            }
            processedMap.get(dateString)!.events.push(event)
         })
      })

      // Second pass: calculate layouts for each day
      for (const dayData of processedMap.values()) {
         // Calculate timed event layouts for week/day views
         const timedEvents = dayData.events.filter((e) => !isEventAllDay(e) && !isEventMultiDay(e))
         dayData.timedLayout = calculateTimedEventLayout(timedEvents)

         // Calculate multi-day/all-day track count for month view placeholders
         const multiDayEvents = dayData.events.filter((e) => isEventAllDay(e) || isEventMultiDay(e))
         dayData.multiDayTrackCount = new Set(multiDayEvents.map((e) => e.id)).size
      }

      return processedMap
   }

   return {
      processEvents,
   }
}
