import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
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
