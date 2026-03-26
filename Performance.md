# Vue 3 Performance Directives

When writing, refactoring, or reviewing Vue 3 code in this project, you MUST strictly adhere to the following performance optimization rules. Do not generate code that violates these directives unless explicitly overridden by the user.

---

## 🛑 STRICT BANS & FORBIDDEN PATTERNS

### 1. The Deep Proxy Trap

**NEVER** store Vue component definitions, large static config objects, or 3rd-party class instances (Chart.js, Maps, DOM refs) inside a plain `ref()` or `reactive()`.

- **Why:** Vue's deep proxy traversal will recursively walk the entire object tree, spiking CPU and memory on every render cycle.
- **REQUIRED FIX:** Always wrap them in `markRaw()`.

```typescript
import { markRaw, ref } from 'vue'

// FORBIDDEN
const activeComponent = ref(MyComponent)
const chart = ref(new Chart(...))

// MANDATORY
const activeComponent = ref(markRaw(MyComponent))
const chart = ref(markRaw(new Chart(...)))

```

---

## ⚡ MANDATORY OPTIMIZATION PATTERNS

### 1. GPU Layer Promotion for Heavy Containers

When generating scrollable containers, modal bodies, or side panels, you MUST promote them to their own compositor layer to isolate hover/focus repaints from the rest of the DOM.

- **MANDATORY CSS:**

```css
.scrollable-container,
.modal-body {
  will-change: transform;
  contain: layout style;
}
```

### 2. V-DOM Diff Bounding with `v-memo`

When generating a `<template v-for>` loop that renders lists of forms, tables, or complex components, you MUST apply `v-memo` to skip diffing unchanged rows.

- **Rules:** The memo array must contain the specific item and any external state (e.g., selection state) that affects the row.

```vue
<tr
  v-for="row in rows"
  :key="row.id"
  v-memo="[row, selectedIds.has(row.id), isHovered === row.id]">...</tr>
```

### 3. Shallow Reactivity for Large Datasets

If generating code that fetches or stores large arrays of objects (e.g., data tables) where individual properties are not mutated reactively (only the whole array is replaced), you MUST use `shallowRef()`.

```typescript
import { shallowRef } from 'vue'

// MANDATORY FOR LARGE DATA SETS
const tableData = shallowRef([])
tableData.value = await fetchHugeList()
```

### 4. Static Subtree Hoisting

When generating large SVGs, complex static footers, or massive text blocks that do not depend on reactive state, apply `v-once`.

```vue
<div v-once class="heavy-static-wrapper">
  <svg>...</svg>
</div>
```

### 5. Memory Leak Prevention

If your generated code instantiates an event listener (`window.addEventListener`), an interval (`setInterval`), an observer (`IntersectionObserver`), or a 3rd-party library instance, you MUST generate the corresponding cleanup code in `onUnmounted`.

### 7. The `backdrop-filter` Ban

**NEVER** generate CSS containing `backdrop-filter: blur()` for Modals, Drawers, Popovers, Dropdowns, or any overlay with nested interactive elements.

- **Why:** It forces the browser GPU to re-composite the entire viewport on every frame (including child hover/focus states), causing severe input lag.
- **REQUIRED FIX:** Always use plain semi-transparent backgrounds.

```css
/* FORBIDDEN */
.modal-overlay {
  backdrop-filter: blur(4px);
}

/* MANDATORY REPLACEMENT */
.modal-overlay {
  background-color: rgba(0, 0, 0, 0.4);
}
```

---

## 🤖 AGENT COMPLIANCE CHECKLIST

Before outputting code, silently run this check:

1. Did I accidentally use `backdrop-filter: blur()`? (If yes, rewrite to `rgba()`).
2. Am I passing a Component instance to a reactive state? (If yes, add `markRaw()`).
3. Is this a `v-for` loop with complex children? (If yes, add `v-memo`).
4. Is this a modal/scrollable container? (If yes, add `will-change: transform; contain: layout style;`).
5. Am I fetching or storing a massive dataset that only gets replaced, not deeply mutated? (If yes, use `shallowRef()` instead of `ref()`).
6. Am I rendering a heavy, non-reactive block of HTML or a large SVG? (If yes, add `v-once`).
7. Am I importing a Modal, Drawer, or heavy 3rd-party wrapper that isn't visible on initial load? (If yes, use `defineAsyncComponent`).
8. Did I initialize a listener, observer, or 3rd-party instance? (If yes, generate the `onUnmounted` cleanup).
