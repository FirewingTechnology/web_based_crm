import { apiClient } from './client';
import { Booking, BookingCreateInput } from '../types/booking';

export const bookingsApi = {
  getBookings: async (params?: { status?: string; assigned_executive_id?: number; my_bookings_only?: boolean }): Promise<Booking[]> => {
    const res = await apiClient.get<Booking[]>('/bookings', { params });
    return res.data;
  },
  getBooking: async (id: number): Promise<Booking> => {
    const res = await apiClient.get<Booking>(`/bookings/${id}`);
    return res.data;
  },
  createBooking: async (data: BookingCreateInput): Promise<Booking> => {
    const res = await apiClient.post<Booking>('/bookings', data);
    return res.data;
  },
  updateBooking: async (id: number, data: { status?: string; notes?: string }): Promise<Booking> => {
    const res = await apiClient.put<Booking>(`/bookings/${id}`, data);
    return res.data;
  },
};
