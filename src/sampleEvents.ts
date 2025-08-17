import { ref } from 'vue'
import { CalendarEvent } from './types'

// Utility to create ISO strings relative to today
function withTime(hours: number, minutes: number, dayOffset = 0) {
   const date = new Date()
   date.setDate(date.getDate() + dayOffset)
   date.setHours(hours, minutes, 0, 0)
   return date.toISOString()
}

const sampleEvents = ref<CalendarEvent[]>([
   {
      id: '1',
      title: 'Team Meeting',
      start: withTime(10, 0, 0), // today at 10:00
      end: withTime(11, 0, 0), // today at 11:00
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      description: 'Weekly team sync',
   },
   {
      id: '2',
      title: 'Project Review',
      start: withTime(14, 0, 2), // 2 days later at 14:00
      end: withTime(15, 30, 2), // 2 days later at 15:30
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      description: 'Quarterly project review',
   },
   {
      id: '3',
      title: 'Conference',
      start: withTime(9, 0, 5), // 5 days later at 09:00
      end: withTime(17, 0, 7), // 7 days later at 17:00
      allDay: true,
      backgroundColor: '#f59e0b',
      textColor: '#ffffff',
      description: 'Annual tech conference',
   },
   {
      id: '35',
      title: 'Conference',
      start: withTime(9, 0, 5), // 5 days later at 09:00
      end: withTime(17, 0, 7), // 7 days later at 17:00
      allDay: true,
      backgroundColor: '#f59e0b',
      textColor: '#ffffff',
      description: 'Annual tech conference',
   },
   {
      id: '32',
      title: 'Conference',
      start: withTime(9, 0, 5), // 5 days later at 09:00
      end: withTime(17, 0, 7), // 7 days later at 17:00
      allDay: true,
      backgroundColor: '#f59e0b',
      textColor: '#ffffff',
      description: 'Annual tech conference',
   },
   {
      id: '31',
      title: 'Conference',
      start: withTime(9, 0, 5), // 5 days later at 09:00
      end: withTime(17, 0, 7), // 7 days later at 17:00
      allDay: true,
      backgroundColor: '#f59e0b',
      textColor: '#ffffff',
      description: 'Annual tech conference',
   },
   {
      id: '4',
      title: 'Client Call',
      start: withTime(16, 0, 3), // 3 days later at 16:00
      end: withTime(17, 0, 3), // 3 days later at 17:00
      backgroundColor: '#ef4444',
      textColor: '#ffffff',
      description: 'Client consultation',
   },
   {
      id: '5',
      title: 'Hackathon',
      start: withTime(9, 0, 11), // 11 days later at 09:00
      end: withTime(18, 0, 14), // 14 days later at 18:00
      allDay: true,
      backgroundColor: '#8b5cf6',
      textColor: '#ffffff',
      description: '4-day coding hackathon',
   },
   {
      id: '6',
      title: 'Workshop',
      start: withTime(9, 0, -1), // 5 days before today at 09:00
      end: withTime(17, 0, 2), // 4 days before today at 17:00
      allDay: true,
      backgroundColor: '#06b6d4',
      textColor: '#ffffff',
      description: 'Two-day technical workshop',
   },
])

console.log('sampleEvents :>> ', sampleEvents)

export default sampleEvents
