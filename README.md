# Vue Event Calendar

A powerful, feature-rich Vue 3 calendar component with support for multiple views (Month, Week, Day), drag-and-drop functionality, event management, and real-time interactions. Built with TypeScript and optimized for performance.

## Features

- **Multiple View Types**: Month, Week, and Day views with seamless switching
- **Event Management**: Create, edit, delete, and drag-and-drop events
- **Drag & Drop**: Move events between dates and time slots with visual feedback
- **Event Resizing**: Resize events by dragging handles in week/day views
- **Real-time Updates**: Live current time indicator and automatic refreshing
- **Responsive Design**: Mobile-friendly with touch support
- **Customizable**: Flexible styling, time formats, and event rendering
- **Accessibility**: ARIA attributes and keyboard navigation support
- **TypeScript Support**: Fully typed for enhanced developer experience
- **Performance Optimized**: Efficient rendering and memory management

## Demo

[Live Demo](https://planner.builto.com)

## Installation

```bash
# npm
npm install v-event-calendar

# yarn
yarn add v-event-calendar

# pnpm
pnpm add v-event-calendar
```

## Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import Calendar from 'v-event-calendar'
import 'v-event-calendar/style.css'
import type { CalendarEvent } from 'v-event-calendar/types'

const events = ref<CalendarEvent[]>([
   {
      id: '1',
      title: 'Team Meeting',
      start: '2025-01-20T10:00:00.000Z', // Uses ISO format
      end: '2025-01-20T11:00:00.000Z',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
   },
])

const handleEventClick = (event) => {
   console.log('Event clicked:', event)
}

const handleEventCreate = (date, start, end) => {
   const newEvent = {
      id: Date.now().toString(),
      title: 'New Event',
      start,
      end,
      backgroundColor: '#10b981',
      textColor: '#ffffff',
   }
   events.value.push(newEvent)
}

const handleEventUpdate = (eventId, start, end) => {
   const eventIndex = events.value.findIndex((e) => e.id === eventId)
   if (eventIndex !== -1) {
      events.value[eventIndex] = {
         ...events.value[eventIndex],
         start,
         end,
      }
   }
}
</script>

<template>
   <Calendar
      :events="events"
      initial-view="month"
      :allow-event-creation="true"
      @event-click="handleEventClick"
      @event-create="handleEventCreate"
      @event-update="handleEventUpdate" />
</template>
```

## 📁 Importing Styles

You must import the CSS styles:

```ts
import 'v-event-calendar/style.css'
```

## Usage Examples

### 1\. Custom Header Slot

```vue
<script setup>
import { ref } from 'vue'
import Calendar from 'v-event-calendar'

const currentView = ref('month')
const calendarRef = ref()

const goToToday = () => {
   calendarRef.value?.goToToday()
}

const changeView = (view) => {
   currentView.value = view
   calendarRef.value?.setView(view)
}
</script>

<template>
   <Calendar
      ref="calendarRef"
      :events="events"
      :initial-view="currentView"
      :show-week-numbers="true"
      :max-events-per-day="3">
      <template #header="{ currentTitle }">
         <div class="calendar-header">
            <div class="view-controls">
               <button @click="changeView('month')" :class="{ active: currentView === 'month' }">
                  Month
               </button>
               <button @click="changeView('week')" :class="{ active: currentView === 'week' }">
                  Week
               </button>
               <button @click="changeView('date')" :class="{ active: currentView === 'date' }">
                  Day
               </button>
            </div>
            <h2>{{ currentTitle }}</h2>
            <div class="navigation">
               <button @click="calendarRef?.goToPrevious()">Previous</button>
               <button @click="goToToday">Today</button>
               <button @click="calendarRef?.goToNext()">Next</button>
            </div>
         </div>
      </template>
   </Calendar>
</template>
```

### 2\. Custom Event Slot

```vue
<script setup>
import Calendar from 'v-event-calendar'

const handleEventUpdate = (eventId, start, end) => {
   const eventIndex = events.value.findIndex((e) => e.id === eventId)
   if (eventIndex !== -1) {
      events.value[eventIndex] = {
         ...events.value[eventIndex],
         start,
         end,
      }
   }
}
</script>

<template>
   <Calendar
      :events="events"
      initial-view="month"
      :allow-event-editing="true"
      @event-update="handleEventUpdate">
      <template #event="{ event, view, displayTime }">
         <div class="custom-event">
            <div class="event-icon">📅</div>
            <div class="event-content">
               <div class="event-title">{{ event.title }}</div>
               <div v-if="view !== 'month'" class="event-time">{{ displayTime }}</div>
            </div>
         </div>
      </template>
   </Calendar>
</template>
```

## Props

| Prop                 | Type                          | Default   | Description                                               |
| -------------------- | ----------------------------- | --------- | --------------------------------------------------------- |
| `events`             | `CalendarEvent[]`             | `[]`      | Array of calendar events to display                       |
| `initialView`        | `'month' \| 'week' \| 'date'` | `'month'` | Initial view mode of the calendar                         |
| `allowEventCreation` | `boolean`                     | `true`    | Enable/disable event creation functionality               |
| `allowEventEditing`  | `boolean`                     | `true`    | Enable/disable event editing functionality                |
| `maxEventsPerDay`    | `number`                      | `3`       | Maximum number of events to display per day in month view |
| `showWeekNumbers`    | `boolean`                     | `false`   | Show week numbers in month view                           |
| `config`             | `CalendarViewConfig`          | `{}`      | Configuration object for calendar behavior                |

## Events

| Event         | Parameters                                     | Description                          |
| ------------- | ---------------------------------------------- | ------------------------------------ |
| `eventClick`  | `event: CalendarEvent`                         | Fired when an event is clicked       |
| `eventCreate` | `date: Date, start: string, end?: string`      | Fired when a new event is created    |
| `dayClick`    | `date: Date`                                   | Fired when a calendar day is clicked |
| `viewChange`  | `view: CalendarView`                           | Fired when the calendar view changes |
| `dateChange`  | `date: Date`                                   | Fired when the current date changes  |
| `eventUpdate` | `eventId: string, start: string, end?: string` | Fired when an event is updated/moved |

## 🛠 Utility Functions

The package exports several utility functions to help you manage dates and events outside the component.

### ISO & Date Parsing

- **`extractTimeFromISO(isoString: string): string`**
  Extracts the time portion from an ISO string in `HH:mm` format.
  _Example:_ `extractTimeFromISO("2025-01-20T10:30:00Z")` -\> `"10:30"`

- **`extractDateFromISO(isoString: string): Date`**
  Converts an ISO string into a JavaScript `Date` object representing the date at midnight local time.

- **`parseISOToDateTime(isoString: string): { date: string, time: string }`**
  Helper to get both date (`YYYY-MM-DD`) and time (`HH:mm`) from an ISO string.

- **`formatToISO(date: Date): string`**
  A wrapper for `date.toISOString()`.

### Formatting

- **`formatDate(date: Date): string`**
  Formats a Date object into a `YYYY-MM-DD` string.

- **`formatTime(date: Date): string`**
  Formats a Date object into a `HH:mm` string.

- **`formatDisplayTime(timeString: string, format24h: boolean = true): string`**
  Converts a `HH:mm` string into a user-friendly format.
  _Example:_ `formatDisplayTime("14:30", false)` -\> `"02:30 PM"`

### Event Management

- **`findNextAvailableTime(targetDate: Date, eventsOnDay: CalendarEvent[])`**
  Analyzes existing events on a specific day and returns the next suggested 1-hour slot (e.g., `{ startTime: "11:00", endTime: "12:00" }`).

- **`getDuration(startTime: string, endTime: string): number`**
  Calculates the difference between two ISO strings in minutes.

- **`hasTimeConflict(event1: CalendarEvent, event2: CalendarEvent): boolean`**
  Checks if two timed events overlap on the same day.

- **`addMinutes(date: Date, minutes: number): Date`**
  Returns a new Date object with the added minutes.

## 🔷 Core Types

### CalendarEvent

```typescript
interface CalendarEvent {
   id: string
   title: string
   start: string // ISO 8601 format (e.g., "2025-08-09T10:00:00Z")
   end?: string // ISO 8601 format
   duration?: number // Optional duration in minutes
   backgroundColor: string
   textColor: string
   description?: string
   metadata?: Record<string, any> // Custom data
}
```

### CalendarView

```typescript
type CalendarView = 'month' | 'week' | 'date'
```

### CalendarViewConfig

```typescript
interface CalendarViewConfig {
   startDayOfWeek: 0 | 1 // 0 = Sunday, 1 = Monday
   showWeekNumbers: boolean
   timeFormat: '12h' | '24h'
   weekStartsOnMonday: boolean
   showAllDayEvents: boolean
   eventHeight: number
   hourHeight: number // Height of one hour in pixels for week/day views
}
```

## Exposed Methods

Access these methods using template refs:

```vue
<script setup>
const calendarRef = ref()

// Example usage
const goToSpecificDate = () => {
   calendarRef.value?.goToDate(new Date('2025-12-25'))
}
</script>

<template>
   <Calendar ref="calendarRef" />
</template>
```

| Method         | Parameters                          | Description                 |
| -------------- | ----------------------------------- | --------------------------- |
| `goToDate`     | `date: Date`                        | Navigate to a specific date |
| `goToToday`    | -                                   | Navigate to today           |
| `goToPrevious` | -                                   | Navigate to previous period |
| `goToNext`     | -                                   | Navigate to next period     |
| `setView`      | `view: 'month' \| 'week' \| 'date'` | Change the calendar view    |
| `selectDate`   | `date: Date`                        | Select a specific date      |
| `forceUpdate`  | -                                   | Force update the calendar   |

## Slots

| Slot     | Props                                                   | Description            |
| -------- | ------------------------------------------------------- | ---------------------- |
| `header` | `{ currentTitle: string }`                              | Custom header content  |
| `event`  | `{ event, view, displayTime, isMultiDay, isContained }` | Custom event rendering |

## Styling

Customize the calendar appearance using CSS variables:

```css
:root {
   --calendar-primary-color: #3b82f6;
   --calendar-secondary-color: #10b981;
   --calendar-bg-color: #f9fafb;
   --calendar-text-color: #374151;
   --calendar-border-color: #e6e7eb;
   --calendar-hover-color: #f0f4f8;
   --calendar-date-label-size: 0.62em;
   --calendar-date-font-weight: 500;
   --calendar-day-header-font-size: 0.8rem;
   --calendar-current-time-color: #ef4444;
}
```

## Author

[safdar-azeem](https://github.com/safdar-azeem)
