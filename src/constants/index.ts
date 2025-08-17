import { CalendarViewConfig } from '../types'

export const DEFAULT_CALENDAR_CONFIG: CalendarViewConfig = {
   startDayOfWeek: 1, // Monday
   showWeekNumbers: false,
   timeFormat: '24h',
   weekStartsOnMonday: true,
   showAllDayEvents: true,
   eventHeight: 90,
   hourHeight: 60,
}

export const CALENDAR_COLORS = [
   '#3b82f6', // Blue
   '#10b981', // Green
   '#f59e0b', // Yellow
   '#ef4444', // Red
   '#8b5cf6', // Purple
   '#06b6d4', // Cyan
   '#f97316', // Orange
   '#84cc16', // Lime
   '#ec4899', // Pink
   '#6b7280', // Gray
] as const

export const TIME_SLOTS = Array.from({ length: 24 }, (_, hour) => ({
   hour,
   display: hour.toString().padStart(2, '0') + ':00',
   value: hour,
}))

export const DAYS_OF_WEEK = [
   'Sunday',
   'Monday',
   'Tuesday',
   'Wednesday',
   'Thursday',
   'Friday',
   'Saturday',
] as const

export const MONTHS = [
   'January',
   'February',
   'March',
   'April',
   'May',
   'June',
   'July',
   'August',
   'September',
   'October',
   'November',
   'December',
] as const
