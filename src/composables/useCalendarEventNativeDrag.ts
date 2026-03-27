import { ref } from 'vue'
import type { CalendarEvent } from '../types'

// Global state to ensure styling applies across components
const isDraggingEvent = ref(false)
const draggedEventId = ref<string | null>(null)

export function useCalendarEventNativeDrag(emit: any, props?: any) {
   const startNativeDrag = (e: MouseEvent, event: CalendarEvent) => {
      // Ignore right clicks or clicks on resize handles
      if (e.button !== 0 || (e.target as HTMLElement).closest('.resize-handle')) {
         return
      }

      const wrapperEl = e.currentTarget as HTMLElement
      const targetEl = (wrapperEl.querySelector('.calendar-event') || wrapperEl) as HTMLElement
      const rect = targetEl.getBoundingClientRect()
      
      const startX = e.clientX
      const startY = e.clientY

      let hasStartedDragging = false
      let ghost: HTMLElement | null = null
      let offsetX = 0
      let offsetY = 0

      // Store last valid boundaries to prevent the event from escaping the calendar
      let lastValidLeft = rect.left
      let lastValidTop = rect.top
      let lastValidWidth = rect.width

      const onMouseMove = (moveEvt: MouseEvent) => {
         moveEvt.preventDefault() // Stop text selection

         // 1. Threshold Check: Don't start dragging unless moved 3px
         if (!hasStartedDragging) {
            const dx = Math.abs(moveEvt.clientX - startX)
            const dy = Math.abs(moveEvt.clientY - startY)
            
            if (dx > 3 || dy > 3) {
               hasStartedDragging = true

               offsetX = moveEvt.clientX - rect.left
               offsetY = moveEvt.clientY - rect.top

               // Create a visual ghost element
               ghost = targetEl.cloneNode(true) as HTMLElement
               ghost.style.position = 'fixed'
               ghost.style.margin = '0' 
               ghost.style.left = `${rect.left}px`
               ghost.style.top = `${rect.top}px`
               ghost.style.width = `${rect.width}px`
               ghost.style.height = `${rect.height}px`
               ghost.style.zIndex = '999999'
               ghost.style.opacity = '0.85'
               ghost.style.pointerEvents = 'none' // Crucial: lets mouse hit the grid below
               ghost.style.transform = 'scale(1)' 
               ghost.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)'
               // Add width to transition so it smoothly snaps to column sizes
               ghost.style.transition = 'top 0.05s ease-out, left 0.05s ease-out, width 0.05s ease-out'
               ghost.classList.add('is-ghost')
               
               document.body.appendChild(ghost)
               document.body.classList.add('calendar-is-dragging')

               isDraggingEvent.value = true
               draggedEventId.value = event.id
            }
         }

         // 2. Drag Logic with Perfect Visual Snapping & Boundary Constraints
         if (hasStartedDragging && ghost) {
            const dropTarget = document.elementFromPoint(moveEvt.clientX, moveEvt.clientY)
            
            const column = dropTarget?.closest('.week-grid-border') as HTMLElement
            const dayCell = dropTarget?.closest('.calendar-day') as HTMLElement
            const allDaySlot = dropTarget?.closest('.all-day-drop-zone') as HTMLElement

            if (column) {
               // WEEK/DAY VIEW: Constrain to time columns
               const columnRect = column.getBoundingClientRect()
               const hourHeight = props?.hourHeight || 60
               const snapPixels = (hourHeight / 60) * 15 
               
               const rawTop = moveEvt.clientY - offsetY
               const relativeY = rawTop - columnRect.top
               const snappedRelativeY = Math.round(relativeY / snapPixels) * snapPixels
               
               lastValidTop = columnRect.top + snappedRelativeY + 1
               
               // Constrain vertically so it cannot escape the top or bottom of the grid
               lastValidTop = Math.max(columnRect.top, Math.min(lastValidTop, columnRect.bottom - rect.height))
               
               // Snap strictly to the column width
               lastValidLeft = columnRect.left + 1
               lastValidWidth = columnRect.width - 2
            } else if (allDaySlot) {
               // ALL DAY VIEW: Constrain to all-day header blocks
               const slotRect = allDaySlot.getBoundingClientRect()
               lastValidTop = slotRect.top + 1
               lastValidLeft = slotRect.left + 1
               lastValidWidth = slotRect.width - 2
            } else if (dayCell) {
               // MONTH VIEW: Constrain to day cells
               const cellRect = dayCell.getBoundingClientRect()
               const rawTop = moveEvt.clientY - offsetY
               
               // Constrain strictly within the month day cell, leaving room for header
               lastValidTop = Math.max(cellRect.top + 25, Math.min(rawTop, cellRect.bottom - rect.height))
               lastValidLeft = cellRect.left + 1
               lastValidWidth = cellRect.width - 2
            }
            
            // If the user drags completely outside the calendar, the code above skips, 
            // and the ghost simply stays locked at the `lastValidLeft` / `lastValidTop`.
            // This ensures it NEVER escapes the calendar container!

            ghost.style.left = `${lastValidLeft}px`
            ghost.style.top = `${lastValidTop}px`
            ghost.style.width = `${lastValidWidth}px`
         }
      }

      const onMouseUp = (upEvt: MouseEvent) => {
         document.removeEventListener('mousemove', onMouseMove)
         document.removeEventListener('mouseup', onMouseUp)
         document.body.classList.remove('calendar-is-dragging')

         // Intercept rogue clicks immediately following the drag
         if (hasStartedDragging) {
            const preventClick = (evt: MouseEvent) => {
               evt.stopPropagation()
               evt.preventDefault()
               document.removeEventListener('click', preventClick, true)
            }
            document.addEventListener('click', preventClick, true)
            setTimeout(() => document.removeEventListener('click', preventClick, true), 100)
         } else {
            return // Was just a standard click, abort drag logic.
         }

         if (ghost) ghost.remove()
         
         // Delay state clearing slightly to fully protect the render loop
         setTimeout(() => {
            isDraggingEvent.value = false
            draggedEventId.value = null
         }, 50)

         const dropTarget = document.elementFromPoint(upEvt.clientX, upEvt.clientY)
         if (!dropTarget) return

         const timeSlot = dropTarget.closest('.calendar-time-slot')
         const dayCell = dropTarget.closest('.calendar-day')
         const allDaySlot = dropTarget.closest('.all-day-drop-zone')
         const dayHeader = dropTarget.closest('[data-day-date]')

         let newDateStr: string | null = null
         let newHour: number | null = null
         let newMinutes: number | null = null

         if (timeSlot) {
            newDateStr = timeSlot.getAttribute('data-col')
            const column = timeSlot.closest('.week-grid-border') as HTMLElement
            
            if (column) {
               const columnRect = column.getBoundingClientRect()
               const virtualTop = upEvt.clientY - offsetY
               const dropY = virtualTop - columnRect.top
               const hourHeight = props?.hourHeight || 60
               
               const exactMinutes = (dropY / hourHeight) * 60
               let totalSnappedMinutes = Math.round(exactMinutes / 15) * 15
               totalSnappedMinutes = Math.max(0, totalSnappedMinutes)

               let hour = Math.floor(totalSnappedMinutes / 60)
               let mins = totalSnappedMinutes % 60
               
               hour += (props?.startHour || 0)
               
               newHour = Math.min(23, Math.max(0, hour))
               newMinutes = mins
            }
         } else if (dayCell) {
            newDateStr = dayCell.getAttribute('data-col')
         } else if (allDaySlot) {
            newDateStr = allDaySlot.getAttribute('data-col')
         } else if (dayHeader) {
            newDateStr = dayHeader.getAttribute('data-day-date')
         }

         if (newDateStr) {
            const oldStart = new Date(event.start)
            const oldEnd = event.end ? new Date(event.end) : new Date(oldStart.getTime() + 60 * 60 * 1000)
            let durationMs = oldEnd.getTime() - oldStart.getTime()

            const [year, month, day] = newDateStr.split('-').map(Number)
            const newStart = new Date(year, month - 1, day)
            
            if (timeSlot && newHour !== null && newMinutes !== null) {
               newStart.setHours(newHour, newMinutes, 0, 0)
               const wasAllDay = durationMs >= 24 * 60 * 60 * 1000 || !event.end
               if (wasAllDay) {
                  durationMs = 60 * 60 * 1000
               }
            } else if (allDaySlot) {
               newStart.setHours(0, 0, 0, 0)
               durationMs = 24 * 60 * 60 * 1000
            } else {
               newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0)
            }

            const newEnd = new Date(newStart.getTime() + durationMs)
            const durationMins = durationMs / 60000

            if (oldStart.getTime() !== newStart.getTime() || oldEnd.getTime() !== newEnd.getTime()) {
               emit('eventUpdate', event.id, newStart.toISOString(), newEnd.toISOString(), durationMins)
            }
         }
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
   }

   return { startNativeDrag, isDraggingEvent, draggedEventId }
}
