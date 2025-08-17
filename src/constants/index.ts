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
