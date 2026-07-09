import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api.js';

export const useTripStore = defineStore('trips', () => {
  const trips = ref([]);
  const currentTrip = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const tripsByStatus = (status) =>
    status === 'ALL' ? trips.value : trips.value.filter(t => t.status === status);

  async function fetchAll() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/api/trips');
      trips.value = res.data;
    } catch (e) {
      error.value = 'Failed to load trips';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchById(id) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get(`/api/trips/${id}`);
      currentTrip.value = res.data;
      return res.data;
    } catch (e) {
      error.value = 'Failed to load trip';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function create(data) {
    const res = await api.post('/api/trips', data);
    trips.value.unshift(res.data);
    return res.data;
  }

  async function update(id, data) {
    const res = await api.patch(`/api/trips/${id}`, data);
    const idx = trips.value.findIndex(t => t.id === id);
    if (idx !== -1) trips.value[idx] = res.data;
    if (currentTrip.value?.id === id) currentTrip.value = res.data;
    return res.data;
  }

  async function reschedule(id, data) {
    const res = await api.post(`/api/trips/${id}/reschedule`, data);
    const idx = trips.value.findIndex(t => t.id === id);
    if (idx !== -1) trips.value[idx] = res.data;
    if (currentTrip.value?.id === id) currentTrip.value = res.data;
    return res.data;
  }

  async function remove(id) {
    await api.delete(`/api/trips/${id}`);
    trips.value = trips.value.filter(t => t.id !== id);
    if (currentTrip.value?.id === id) currentTrip.value = null;
  }

  return { trips, currentTrip, loading, error, tripsByStatus, fetchAll, fetchById, create, update, reschedule, remove };
});
