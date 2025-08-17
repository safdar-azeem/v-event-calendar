src/App.vue

<script setup lang="ts">
import { ref } from 'vue'
import CalendarView from './components/CalendarView.vue'
import type { CalendarEvent, CalendarView as CalendarViewType } from './types/index'
import sampleEvents from './sampleEvents'

const currentView = ref<CalendarViewType>('month')
const selectedDate = ref(new Date())

const calendarRef = ref()

const handleEventClick = (event: CalendarEvent) => {
   console.log('Event clicked:', event)
   alert(`Event: ${event.title}\nTime: ${new Date(event.start).toLocaleString()}`)
}

const handleEventCreate = (date: Date, start: string, end?: string, duration?: number) => {
   console.log('handleEventCreate with duration :>> ', duration)
   const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: 'New Event',
      start: start,
      end: end,
      duration: duration,
      backgroundColor: '#8b5cf6',
      textColor: '#ffffff',
      description: 'A new event',
   }
   sampleEvents.value.push(newEvent)
   console.log('Event created:', newEvent)
}

const handleDayClick = (date: Date) => {
   selectedDate.value = date
   console.log('Day clicked:', date)
}

const handleDateChange = (date: Date) => {
   console.log('Date changed to:', date)
}

const handleEventUpdate = (eventId: string, start: string, end?: string, duration?: number) => {
   const eventIndex = sampleEvents.value.findIndex((e) => e.id === eventId)
   if (eventIndex !== -1) {
      sampleEvents.value[eventIndex] = {
         ...sampleEvents.value[eventIndex],
         start,
         end,
         duration,
      }
      console.log('Event updated with duration:', eventId, start, end, duration)
   }
}

const setView = (view: CalendarViewType) => {
   if (calendarRef.value) {
      currentView.value = view
      calendarRef.value.setView(view)
   }
}

const goToToday = () => {
   if (calendarRef.value) {
      calendarRef.value.goToToday()
   }
}

const goToPrevious = () => {
   if (calendarRef.value) {
      calendarRef.value.goToPrevious()
   }
}

const goToNext = () => {
   if (calendarRef.value) {
      calendarRef.value.goToNext()
   }
}
</script>

<template>
   <div class="calendar-app">
      <div class="calendar-container">
         <div class="calendar-wrapper">
            <!-- Calendar Component -->
            <div class="dark">
               <CalendarView
                  ref="calendarRef"
                  :events="sampleEvents"
                  :initial-view="currentView"
                  :allow-event-creation="true"
                  :allow-event-editing="true"
                  :max-events-per-day="3"
                  :show-week-numbers="false"
                  :config="{
                     timeFormat: '12h',
                  }"
                  @event-click="handleEventClick"
                  @event-create="handleEventCreate"
                  @day-click="handleDayClick"
                  @date-change="handleDateChange"
                  @event-update="handleEventUpdate"
                  class="calendar-content">
                  <template #header="{ currentTitle }">
                     <!-- Calendar Header -->
                     <div class="calendar-header">
                        <div class="header-content">
                           <div class="view-buttons">
                              <button
                                 @click="setView('month')"
                                 :class="{ active: currentView === 'month' }">
                                 Month
                              </button>
                              <button
                                 @click="setView('week')"
                                 :class="{ active: currentView === 'week' }">
                                 Week
                              </button>
                              <button
                                 @click="setView('date')"
                                 :class="{ active: currentView === 'date' }">
                                 Day
                              </button>
                           </div>
                           <h2>{{ currentTitle }}</h2>
                           <div class="navigation-buttons">
                              <button @click="goToPrevious" class="nav-button">
                                 <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                       stroke-linecap="round"
                                       stroke-linejoin="round"
                                       stroke-width="2"
                                       d="M15 19l-7-7 7-7" />
                                 </svg>
                              </button>
                              <button @click="goToToday" class="today-button">Today</button>
                              <button @click="goToNext" class="nav-button">
                                 <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                       stroke-linecap="round"
                                       stroke-linejoin="round"
                                       stroke-width="2"
                                       d="M9 5l7 7-7 7" />
                                 </svg>
                              </button>
                           </div>
                        </div>
                     </div>
                  </template>
               </CalendarView>
            </div>
         </div>
      </div>
   </div>
</template>

<style scoped>
* {
   margin: 0px;
   padding: 0px;
}

.calendar-app {
   min-height: 100vh;
}

.calendar-container {
   max-width: 1180px;
   margin: 10px auto;
}

.calendar-wrapper {
   border-radius: 12px;
   height: 100%;
   display: flex;
   flex-direction: column;
   /* border: 1px solid #e5e7eb; */
   overflow: hidden;
}

.calendar-content {
   border: 1px solid #e6e7eb;
   overflow: hidden;
   border-radius: 12px;
}

.calendar-header {
   border-bottom: 1px solid #e5e7eb;
   padding: 16px;
   /* background-color: #fff; */
}

.header-content {
   display: flex;
   align-items: center;
   justify-content: space-between;
}

.view-buttons {
   display: flex;
   gap: 5px;
}

.view-buttons button {
   height: 30px;
   padding: 0 10px;
   font-size: 14px;
   font-weight: 600;
   border-radius: 8px;
   background-color: transparent;
   color: #374151;
   transition: all 0.2s ease;
}

.view-buttons button.active {
   background-color: #3b82f6;
   color: #ffffff;
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.view-buttons button:hover:not(.active) {
   background-color: #f3f4f6;
   color: #2563eb;
}

.header-content h2 {
   font-size: 20px;
   font-weight: 600;
   color: #1f2937;
}

.navigation-buttons {
   display: flex;
   align-items: center;
   border-radius: 8px;
   background-color: #ffffff;
}

.nav-button {
   height: 30px;
   padding: 0 8px;
   color: #4b5563;
   background-color: transparent;
   transition: all 0.2s ease;
   display: flex;
   align-items: center;
   justify-content: center;
}

.nav-button:hover {
   color: #1f2937;
   background-color: #f3f4f6;
}

.nav-button:first-child {
   border-radius: 8px 0 0 8px;
}

.nav-button:last-child {
   border-radius: 0 8px 8px 0;
}

button {
   border: 1px solid #afafaf;
}

.today-button {
   height: 30px;
   padding: 0 10px;
   font-weight: 500;
   color: #4b5563;
   background-color: transparent;
   border-left: 1px solid #e5e7eb;
   border-right: 1px solid #e5e7eb;
   transition: all 0.2s ease;
}

.today-button:hover {
   color: #2563eb;
   background-color: #f3f4f6;
}

.icon {
   width: 20px;
   height: 20px;
}
</style>
