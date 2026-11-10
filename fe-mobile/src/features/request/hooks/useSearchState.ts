import { RADAR_DOTS, SEARCH_STEPS, STEP_SECONDS } from '../constants/request.constants';

/** Pure function: given elapsed seconds, what should the radar show? */
export function getSearchState(elapsed: number) {
  const stepIndex = Math.min(Math.floor(elapsed / STEP_SECONDS), SEARCH_STEPS.length - 1);
  const found = RADAR_DOTS.filter((d) => elapsed >= d.at);
  const notified = Math.min(3 + found.length * 2 + Math.floor(elapsed / 2), 24);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return { step: SEARCH_STEPS[stepIndex], stepIndex, found, notified, clock: `${mm}:${ss}` };
}
