import '@testing-library/jest-dom'

// cmdk (used by shadcn Command) uses ResizeObserver internally; jsdom doesn't implement it
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// cmdk calls scrollIntoView on items during keyboard navigation; jsdom doesn't implement it
window.HTMLElement.prototype.scrollIntoView = function () {}

// Radix UI Popover uses pointer capture APIs not present in jsdom
window.HTMLElement.prototype.hasPointerCapture = function () {
  return false
}
window.HTMLElement.prototype.setPointerCapture = function () {}
window.HTMLElement.prototype.releasePointerCapture = function () {}
