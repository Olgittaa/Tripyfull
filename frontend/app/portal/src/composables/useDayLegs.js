import { computed } from 'vue';
import { api } from '@tripyfull/core';
import { toast } from '@tripyfull/ui';
import { buildLegs, legMode, legTotals, mapSegments, TRAVEL_FIELDS } from '@/plan/stops.js';

/**
 * The legs between a day's stops, as the server keeps them on each stop
 * (travelSeconds, travelMeters, travelGeometry …) and recomputes only when the
 * order, a pin or the mode changes. Nothing is routed from the browser: this
 * reads what came with the stops and, on a mode change, saves the choice and
 * takes the freshly routed leg from the same answer.
 *
 * @param activities  ref of the day's stops in order
 * @param reload      re-reads the day from the server when a save goes wrong
 */
export function useDayLegs({ activities, reload }) {
  const dayLegs = computed(() => buildLegs(activities.value));

  // activity id -> its outgoing leg { mode, data } (data: undefined = unknown, null = no route)
  const legInfoByActivity = computed(() => {
    const m = {};
    for (const l of dayLegs.value) m[l.fromId] = { mode: l.mode, data: l.data };
    return m;
  });

  const mapLegs = computed(() => mapSegments(activities.value, dayLegs.value));
  const routeTotal = computed(() => legTotals(dayLegs.value));

  // Latest requested mode per activity: quick repeated toggles are last-write-wins,
  // and stale settlements (or a reorder replacing the array) can't desync the UI.
  const pendingModeSaves = new Map(); // activity id -> mode of the newest in-flight PATCH
  const setLegMode = async (a, mode) => {
    if (legMode(a) === mode) return;
    const id = a.id;
    pendingModeSaves.set(id, mode);
    a.travelModeToNext = mode; // optimistic — the row shows "…" until the server answers
    a.travelKnown = false;
    try {
      const res = await api.patch(`/api/activities/${id}`, { travelModeToNext: mode });
      if (pendingModeSaves.get(id) !== mode) return; // superseded by a newer click
      pendingModeSaves.delete(id);
      // re-apply to the current object — the array may have been replaced meanwhile
      const cur = activities.value.find((x) => x.id === id);
      if (cur) for (const k of TRAVEL_FIELDS) cur[k] = res.data[k]; // the server routed the new leg too
    } catch {
      if (pendingModeSaves.get(id) !== mode) return; // a newer click owns the state now
      pendingModeSaves.delete(id);
      toast.danger('Error', 'Failed to save travel mode');
      reload(); // resync from the server instead of guessing a revert
    }
  };

  return { dayLegs, legInfoByActivity, mapLegs, routeTotal, setLegMode };
}
