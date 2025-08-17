import type { CalendarEvent, CalendarCell, TimedEventLayout } from '../types/index'
import { getEventStartDate, getEventEndDate, isEventMultiDay, isSameDay } from './calendarDateUtils'

export interface EventLayout {
   event: CalendarEvent
   startDayIndex: number
   span: number
   track: number
}

const doEventsOverlap = (eventA: CalendarEvent, eventB: CalendarEvent): boolean => {
   if (!eventA.end || !eventB.end) return false
   const startA = new Date(eventA.start).getTime()
   const endA = new Date(eventA.end).getTime()
   const startB = new Date(eventB.start).getTime()
   const endB = new Date(eventB.end).getTime()
   return startA < endB && startB < endA
}

export function calculateTimedEventLayout(eventsForDay: CalendarEvent[]): Map<string, TimedEventLayout> {
   const layoutMap = new Map<string, TimedEventLayout>()
   if (!eventsForDay || eventsForDay.length === 0) {
      return layoutMap
   }
   const sortedEvents = [...eventsForDay].sort((a, b) => {
      const startA = new Date(a.start).getTime()
      const startB = new Date(b.start).getTime()
      if (startA !== startB) {
         return startA - startB
      }
      const endA = a.end ? new Date(a.end).getTime() : 0
      const endB = b.end ? new Date(b.end).getTime() : 0
      return endB - endA
   })
   const eventsWithLayout = sortedEvents.map((event) => ({
      event,
      overlaps: [] as any[],
      column: -1,
   }))
   for (let i = 0; i < eventsWithLayout.length; i++) {
      for (let j = i + 1; j < eventsWithLayout.length; j++) {
         const eventA = eventsWithLayout[i]
         const eventB = eventsWithLayout[j]
         if (doEventsOverlap(eventA.event, eventB.event)) {
            eventA.overlaps.push(eventB)
            eventB.overlaps.push(eventA)
         }
      }
   }
   for (const eventWithLayout of eventsWithLayout) {
      const takenColumns = eventWithLayout.overlaps.map((e) => e.column).filter((c) => c !== -1)
      let col = 0
      while (takenColumns.includes(col)) {
         col++
      }
      eventWithLayout.column = col
   }
   for (const eventWithLayout of eventsWithLayout) {
      const allInvolved = [eventWithLayout, ...eventWithLayout.overlaps]
      const totalColumns = Math.max(...allInvolved.map((e) => e.column)) + 1
      const width = 100 / totalColumns
      const left = eventWithLayout.column * width
      layoutMap.set(eventWithLayout.event.id, {
         width: `calc(${width}% - 4px)`,
         left: `${left}%`,
         zIndex: 10 + eventWithLayout.column,
         isContained: width !== 100,
      })
   }
   return layoutMap
}

export function calculateAllDayEventLayout(cells: CalendarCell[]): EventLayout[] {
   if (!cells || cells.length === 0) return []
   const weekStartDate = cells[0].date
   const weekEndDate = cells[cells.length - 1].date
   const uniqueEvents = new Map<
      string,
      { event: CalendarEvent; startDayIndex: number; endDayIndex: number }
   >()
   cells.forEach((day) => {
      day.events.forEach((event) => {
         if (event.allDay || isEventMultiDay(event)) {
            if (!uniqueEvents.has(event.id)) {
               const eventStartDate = getEventStartDate(event)
               const eventEndDate = getEventEndDate(event)
               let startDayIndexInWeek = cells.findIndex((c) => isSameDay(c.date, eventStartDate))
               let endDayIndexInWeek = cells.findIndex((c) => isSameDay(c.date, eventEndDate))
               if (eventStartDate < weekStartDate) {
                  startDayIndexInWeek = 0
               }
               if (eventEndDate > weekEndDate) {
                  endDayIndexInWeek = cells.length - 1
               }
               if (
                  startDayIndexInWeek === -1 &&
                  eventStartDate <= weekEndDate &&
                  eventEndDate >= weekStartDate
               ) {
                  startDayIndexInWeek = 0
               }
               if (
                  endDayIndexInWeek === -1 &&
                  eventStartDate <= weekEndDate &&
                  eventEndDate >= weekStartDate
               ) {
                  endDayIndexInWeek = cells.length - 1
               }
               if (startDayIndexInWeek !== -1) {
                  uniqueEvents.set(event.id, {
                     event,
                     startDayIndex: startDayIndexInWeek,
                     endDayIndex: endDayIndexInWeek !== -1 ? endDayIndexInWeek : startDayIndexInWeek,
                  })
               }
            }
         }
      })
   })
   const eventsWithSpan = Array.from(uniqueEvents.values()).map(
      ({ event, startDayIndex, endDayIndex }) => {
         const span = Math.max(1, endDayIndex - startDayIndex + 1)
         return { event, startDayIndex, span }
      }
   )
   eventsWithSpan.sort((a, b) => {
      if (a.startDayIndex !== b.startDayIndex) {
         return a.startDayIndex - b.startDayIndex
      }
      if (a.span !== b.span) {
         return b.span - a.span
      }
      return a.event.title.localeCompare(b.event.title)
   })
   const tracks: (EventLayout | null)[][] = []
   const layout: EventLayout[] = []
   eventsWithSpan.forEach((eventInfo) => {
      let placed = false
      for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
         let isFree = true
         for (let i = 0; i < eventInfo.span; i++) {
            const dayIndex = eventInfo.startDayIndex + i
            if (dayIndex < cells.length && tracks[trackIndex][dayIndex]) {
               isFree = false
               break
            }
         }
         if (isFree) {
            const eventLayout: EventLayout = { ...eventInfo, track: trackIndex }
            for (let i = 0; i < eventInfo.span; i++) {
               const dayIndex = eventInfo.startDayIndex + i
               if (dayIndex < cells.length) {
                  tracks[trackIndex][dayIndex] = eventLayout
               }
            }
            layout.push(eventLayout)
            placed = true
            break
         }
      }
      if (!placed) {
         const newTrack: (EventLayout | null)[] = new Array(cells.length).fill(null)
         const trackIndex = tracks.length
         const eventLayout: EventLayout = { ...eventInfo, track: trackIndex }
         for (let i = 0; i < eventInfo.span; i++) {
            const dayIndex = eventInfo.startDayIndex + i
            if (dayIndex < cells.length) {
               newTrack[dayIndex] = eventLayout
            }
         }
         tracks.push(newTrack)
         layout.push(eventLayout)
      }
   })
   return layout
}

export function calculateMultiDayEventCountForDay(cell: CalendarCell): number {
   const weekStartDate = cell.date
   const weekEndDate = cell.date
   const uniqueEvents = new Set<string>()
   cell.events.forEach((event) => {
      if (event.allDay || isEventMultiDay(event)) {
         const eventStartDate = getEventStartDate(event)
         const eventEndDate = getEventEndDate(event)
         if (
            eventStartDate <= weekEndDate &&
            eventEndDate >= weekStartDate &&
            !uniqueEvents.has(event.id)
         ) {
            uniqueEvents.add(event.id)
         }
      }
   })
   return uniqueEvents.size
}
