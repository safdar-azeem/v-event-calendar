import { EventLayout } from '../utils/calendarLayoutUtils'

export type CalendarView = 'month' | 'week' | 'date'

export interface CalendarEvent {
   id: string
   title: string
   start: string // ISO 8601, e.g., "2025-08-09T10:00:00Z"
   end?: string // ISO 8601
   duration?: number
   backgroundColor: string
   textColor: string
   description?: string
   metadata?: Record<string, any>
}

export interface CalendarCell {
   date: Date
   dateString: string // YYYY-MM-DD
   isCurrentMonth: boolean
   isToday: boolean
   isSelected: boolean
   events: CalendarEvent[]
   isWeekend: boolean
   // Pre-calculated data for performance
   timedLayout?: Map<string, TimedEventLayout>
   multiDayTrackCount?: number
}

export interface CalendarWeek {
   weekNumber: number
   days: CalendarCell[]
   // Pre-calculated layout for all-day/multi-day events in this week
   allDayLayout: EventLayout[]
}

export interface CalendarMonth {
   year: number
   month: number // 0-based (0 = January)
   weeks: CalendarWeek[]
}

export interface TimedEventLayout {
   width: string
   left: string
   zIndex: number
   isContained?: boolean
}

export interface CalendarEventPosition {
   eventId: string
   top: number
   height: number
   left: number
   width: number
   zIndex: number
}

export interface CalendarTimeSlot {
   hour: number
   minute: number
   timeString: string // HH:MM
   events: CalendarEvent[]
}

export interface CalendarDay {
   date: Date
   dateString: string
   timeSlots: CalendarTimeSlot[]
}

export interface CalendarNavigation {
   currentDate: Date
   view: CalendarView
   canGoPrevious: boolean
   canGoNext: boolean
}

export interface CalendarEventCreateData {
   start: string // ISO 8601
   end?: string // ISO 8601
   title?: string
}

export interface CalendarViewConfig {
   startDayOfWeek: 0 | 1 // 0 = Sunday, 1 = Monday
   showWeekNumbers: boolean
   timeFormat: '12h' | '24h'
   weekStartsOnMonday: boolean
   showAllDayEvents: boolean
   eventHeight: number
   hourHeight: number
}

// New types for processed events
export interface ProcessedDay {
   date: Date
   events: CalendarEvent[]
   timedLayout: Map<string, TimedEventLayout>
   multiDayTrackCount: number
}

export type ProcessedEvents = Map<string, ProcessedDay>
