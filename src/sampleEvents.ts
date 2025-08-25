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
      end: withTime(11, 0, 0),
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      description: 'Weekly team sync',
   },
   {
      id: '2',
      title: 'Project Review',
      start: withTime(14, 0, 2), // in 2 days
      end: withTime(15, 30, 2),
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      description: 'Quarterly project review',
   },
   {
      id: '3',
      title: 'Doctor Appointment',
      start: withTime(9, 30, 1), // tomorrow morning
      end: withTime(10, 30, 1),
      backgroundColor: '#ef4444',
      textColor: '#ffffff',
      description: 'Routine health check-up',
   },
   {
      id: '4',
      title: 'Lunch with Sarah',
      start: withTime(12, 30, 1), // tomorrow lunchtime
      end: withTime(13, 30, 1),
      backgroundColor: '#f97316',
      textColor: '#ffffff',
      description: 'Catch-up lunch at Italian Bistro',
   },
   {
      id: '5',
      title: 'Yoga Class',
      start: withTime(7, 0, 3), // 3 days later at 07:00
      end: withTime(8, 0, 3),
      backgroundColor: '#06b6d4',
      textColor: '#ffffff',
      description: 'Morning yoga session',
   },
   {
      id: '6',
      title: 'Client Call',
      start: withTime(16, 0, 3), // 3 days later afternoon
      end: withTime(17, 0, 3),
      backgroundColor: '#8b5cf6',
      textColor: '#ffffff',
      description: 'Client consultation regarding new features',
   },
   {
      id: '7',
      title: 'Birthday Party 🎉',
      start: withTime(19, 0, 4), // 4 days later
      end: withTime(23, 0, 4),
      backgroundColor: '#ec4899',
      textColor: '#ffffff',
      description: 'Celebrating Anna’s birthday at her place',
   },
   {
      id: '8',
      title: 'Conference',
      start: withTime(9, 0, 5), // 5 days later
      end: withTime(17, 0, 7),
      backgroundColor: '#f59e0b',
      textColor: '#ffffff',
      description: 'Annual tech conference',
   },
   {
      id: '9',
      title: 'Hackathon',
      start: withTime(9, 0, 11),
      end: withTime(18, 0, 14),
      backgroundColor: '#a855f7',
      textColor: '#ffffff',
      description: '4-day coding hackathon',
   },
   {
      id: '10',
      title: 'Vacation',
      start: withTime(0, 0, 20),
      end: withTime(23, 59, 27),
      backgroundColor: '#22c55e',
      textColor: '#ffffff',
      description: 'Trip to the mountains',
   },
   {
      id: '11',
      title: 'Workshop',
      start: withTime(9, 0, -1), // yesterday
      end: withTime(17, 0, 0), // today
      backgroundColor: '#0ea5e9',
      textColor: '#ffffff',
      description: 'Two-day technical workshop',
   },
   {
      id: '13',
      title: 'Workshop',
      start: withTime(9, 0, -1), // yesterday
      end: withTime(17, 0, 0), // today
      backgroundColor: '#0ea5e9',
      textColor: '#ffffff',
      description: 'Two-day technical workshop',
   },
   {
      id: '14',
      title: 'Workshop',
      start: withTime(9, 0, -1), // yesterday
      end: withTime(17, 0, 0), // today
      backgroundColor: '#0ea5e9',
      textColor: '#ffffff',
      description: 'Two-day technical workshop',
   },
   {
      id: '15',
      title: 'Workshop',
      start: withTime(9, 0, -1), // yesterday
      end: withTime(17, 0, 0), // today
      backgroundColor: '#0ea5e9',
      textColor: '#ffffff',
      description: 'Two-day technical workshop',
   },
])

export default sampleEvents
