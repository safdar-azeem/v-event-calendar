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
               ghost.style.left = `${moveEvt.clientX - offsetX}px`
               ghost.style.top = `${moveEvt.clientY - offsetY}px`
               ghost.style.width = `${rect.width}px`
               ghost.style.height = `${rect.height}px`
               ghost.style.zIndex = '999999'
               ghost.style.opacity = '0.85'
               ghost.style.pointerEvents = 'none' 
               ghost.style.transform = 'scale(1)' 
               ghost.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)'
               ghost.style.transition = 'top 0.05s ease-out, left 0.05s ease-out'
               ghost.classList.add('is-ghost')
               
               document.body.appendChild(ghost)
               document.body.classList.add('calendar-is-dragging')

               isDraggingEvent.value = true
               draggedEventId.value = event.id
            }
         }

         // 2. Drag Logic with Perfect Visual Snapping
         if (hasStartedDragging && ghost) {
            let rawLeft = moveEvt.clientX - offsetX
            let rawTop = moveEvt.clientY - offsetY

            const dropTarget = document.elementFromPoint(moveEvt.clientX, moveEvt.clientY)
            const column = dropTarget?.closest('.week-grid-border') as HTMLElement

            if (column) {
               const columnRect = column.getBoundingClientRect()
               const hourHeight = props?.hourHeight || 60
               const snapPixels = (hourHeight / 60) * 15 
               
               const relativeY = rawTop - columnRect.top
               const snappedRelativeY = Math.round(relativeY / snapPixels) * snapPixels
               
               rawTop = columnRect.top + snappedRelativeY + 1
            }

            ghost.style.left = `${rawLeft}px`
            ghost.style.top = `${rawTop}px`
         }
      }

      const onMouseUp = (upEvt: MouseEvent) => {
         document.removeEventListener('mousemove', onMouseMove)
         document.removeEventListener('mouseup', onMouseUp)
         document.body.classList.remove('calendar-is-dragging')

         // SENIOR FIX: If the user dragged, a rogue `click` event will be fired natively by the browser
         // exactly at this coordinate immediately after `mouseup`. We MUST intercept and kill it 
         // in the capture phase so it doesn't hit the grid and spawn a new event.
         if (hasStartedDragging) {
            const preventClick = (evt: MouseEvent) => {
               evt.stopPropagation()
               evt.preventDefault()
               document.removeEventListener('click', preventClick, true)
            }
            document.addEventListener('click', preventClick, true)
            // Safety cleanup just in case the browser swallows the click
            setTimeout(() => document.removeEventListener('click', preventClick, true), 100)
         } else {
            return // Was just a standard click, abort drag logic.
         }

         const ghostRect = ghost?.getBoundingClientRect()

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
