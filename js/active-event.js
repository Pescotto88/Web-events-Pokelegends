// js/active-event.js

// 1. Import your active event module here
import { initWhackEvent } from './events/whack-event.js';

// 2. Export it as the active runner
export function loadActiveEvent() {
  initWhackEvent();
}
