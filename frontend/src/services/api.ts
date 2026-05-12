import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export const apiService = {
    // Auth
    login: async (email: string, password: string) => {
        const response = await api.post('/login', { email, password });
        return response.data;
    },
    logout: async () => {
        await api.post('/logout');
    },

    // Dashboard
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    // Products
    getProducts: async () => {
        const response = await api.get('/products');
        return response.data;
    },

    // Appointments
    getAppointments: async () => {
        const response = await api.get('/appointments');
        return response.data;
    },

    // Patients
    getPatients: async () => {
        const response = await api.get('/patients');
        return response.data;
    },

    // Invoices
    getInvoices: async () => {
        const response = await api.get('/invoices');
        return response.data;
    },
};

export default api;
