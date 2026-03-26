import type { CalendarEvent } from '../types'

export function isEventAllDay(event: CalendarEvent): boolean {
   if (!event.start || !event.end) {
      return false
   }
   const startDate = new Date(event.start)
   const endDate = new Date(event.end)
   const diff = endDate.getTime() - startDate.getTime()
   const hours = diff / (1000 * 60 * 60)
   return hours >= 24
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
   (...args: Parameters<T>): void
   cancel: () => void
}

/**
 * Creates a debounced function that delays invoking the provided function until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * Exposes a `cancel` method to clear the pending execution.
 */
export function debounce<T extends (...args: any[]) => void>(
   func: T,
   wait: number
): DebouncedFunction<T> {
   let timeout: ReturnType<typeof setTimeout> | null = null

   const debounced = function (this: any, ...args: Parameters<T>) {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
   } as DebouncedFunction<T>

   debounced.cancel = () => {
      if (timeout) {
         clearTimeout(timeout)
         timeout = null
      }
   }

   return debounced
}
