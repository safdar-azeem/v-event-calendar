import Calendar from './components/CalendarView.vue'
import {
   extractTimeFromISO,
   parseISOToDateTime,
   extractDateFromISO,
   formatToISO,
   formatDate,
   formatTime,
   formatDisplayTime,
   findNextAvailableTime,
   getDuration,
   hasTimeConflict,
   addMinutes,
} from './utils/calendarDateUtils'
import type { CalendarEvent, CalendarView, CalendarViewConfig } from './types'

export default Calendar
export {
   extractTimeFromISO,
   extractDateFromISO,
   parseISOToDateTime,
   formatDisplayTime,
   findNextAvailableTime,
   getDuration,
   formatToISO,
   formatDate,
   formatTime,
   hasTimeConflict,
   addMinutes,
   CalendarEvent,
   CalendarView,
   CalendarViewConfig,
}
