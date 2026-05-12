import axios from 'axios';
import type { Appointment, Invoice, InvoiceLineInput, Patient, Payment, Product, Vaccination, MedicalRecord } from '../types';
import type { NewAppointmentInput } from '../context/clinicState';

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
    createProduct: async (product: Omit<Product, 'id'>) => {
        const response = await api.post('/products', product);
        return response.data as Product;
    },
    updateProduct: async (id: string, data: Partial<Product>) => {
        const response = await api.put(`/products/${id}`, data);
        return response.data as Product;
    },
    deleteProduct: async (id: string) => {
        await api.delete(`/products/${id}`);
    },

    // Appointments
    getAppointments: async () => {
        const response = await api.get('/appointments');
        return response.data;
    },
    createAppointment: async (appointment: NewAppointmentInput) => {
        const response = await api.post('/appointments', appointment);
        return response.data as Appointment;
    },
    updateAppointment: async (id: string, data: Partial<Appointment>) => {
        const response = await api.put(`/appointments/${id}`, data);
        return response.data as Appointment;
    },
    deleteAppointment: async (id: string) => {
        await api.delete(`/appointments/${id}`);
    },

    // Patients
    getPatients: async () => {
        const response = await api.get('/patients');
        return response.data;
    },
    createPatient: async (patient: Omit<Patient, 'id' | 'alerts' | 'vaccinations' | 'medicalHistory'>) => {
        const response = await api.post('/patients', patient);
        return response.data as Patient;
    },
    updatePatient: async (id: string, data: Partial<Patient>) => {
        const response = await api.put(`/patients/${id}`, data);
        return response.data as Patient;
    },
    deletePatient: async (id: string) => {
        await api.delete(`/patients/${id}`);
    },
    createMedicalRecord: async (patientId: string, record: Omit<MedicalRecord, 'id'>) => {
        const response = await api.post(`/patients/${patientId}/medical-records`, record);
        return response.data as Patient;
    },
    createVaccination: async (patientId: string, vaccination: Omit<Vaccination, 'id'>) => {
        const response = await api.post(`/patients/${patientId}/vaccinations`, vaccination);
        return response.data as Patient;
    },

    // Invoices
    getInvoices: async () => {
        const response = await api.get('/invoices');
        return response.data;
    },
    createInvoice: async (
        invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'payments' | 'status' | 'subtotal' | 'tax' | 'total' | 'lines'> & {
            lines: InvoiceLineInput[];
        }
    ) => {
        const response = await api.post('/invoices', invoice);
        return response.data as Invoice;
    },
    updateInvoice: async (id: string, data: Partial<Invoice> | { lines: InvoiceLineInput[] }) => {
        const response = await api.put(`/invoices/${id}`, data);
        return response.data as Invoice;
    },
    recordPayment: async (invoiceId: string, payment: Omit<Payment, 'id' | 'invoiceId'>) => {
        const response = await api.post(`/invoices/${invoiceId}/payments`, payment);
        return response.data as Invoice;
    },
};

export default api;
