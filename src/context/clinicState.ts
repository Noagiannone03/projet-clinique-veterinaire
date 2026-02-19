import { createContext, useContext } from 'react';
import type {
    Appointment,
    Invoice,
    InvoiceLineInput,
    Patient,
    Product,
    StockMovement,
    ActivityLogEntry,
    Payment,
    MedicalRecord,
    Vaccination,
    Alert,
} from '../types';

export interface NewAppointmentInput {
    patientId?: string;
    patientName: string;
    ownerName: string;
    species: Appointment['species'];
    date: string;
    time: string;
    duration: number;
    type: Appointment['type'];
    veterinarian: string;
    notes?: string;
}

export interface ClinicContextValue {
    // Data
    patients: Patient[];
    appointments: Appointment[];
    invoices: Invoice[];
    products: Product[];
    stockMovements: StockMovement[];
    activityLog: ActivityLogEntry[];

    // Patients CRUD
    addPatient: (patient: Omit<Patient, 'id' | 'alerts' | 'vaccinations' | 'medicalHistory'>) => Patient;
    updatePatient: (id: string, data: Partial<Patient>) => void;
    deletePatient: (id: string) => void;
    addMedicalRecord: (patientId: string, record: Omit<MedicalRecord, 'id'>) => void;
    addVaccination: (patientId: string, vaccination: Omit<Vaccination, 'id'>) => void;
    addAlert: (patientId: string, alert: Omit<Alert, 'id'>) => void;
    removeAlert: (patientId: string, alertId: string) => void;

    // Appointments CRUD
    addAppointment: (input: NewAppointmentInput) => { ok: true } | { ok: false; message: string };
    updateAppointment: (id: string, data: Partial<Appointment>) => void;
    deleteAppointment: (id: string) => void;
    updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
    updateAppointmentSchedule: (
        appointmentId: string,
        patch: { date: string; time: string; duration?: number }
    ) => { ok: true } | { ok: false; message: string };
    cancelAppointment: (id: string, reason: string) => void;

    // Products CRUD
    addProduct: (product: Omit<Product, 'id'>) => Product;
    updateProduct: (id: string, data: Partial<Product>) => void;
    deleteProduct: (id: string) => void;
    adjustProductStock: (productId: string, delta: number, reason?: StockMovement['reason'], note?: string) => void;

    // Invoices CRUD
    addInvoice: (
        invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'payments' | 'status' | 'subtotal' | 'tax' | 'total' | 'lines'> & {
            lines: InvoiceLineInput[];
        }
    ) => Invoice;
    updateInvoice: (id: string, data: Partial<Invoice>) => void;
    recordPayment: (invoiceId: string, payment: Omit<Payment, 'id' | 'invoiceId'>) => void;
    recordInvoicePayment: (invoiceId: string) => void;
}

export const ClinicStateContext = createContext<ClinicContextValue | undefined>(undefined);

export function useClinicData() {
    const context = useContext(ClinicStateContext);
    if (!context) {
        throw new Error('useClinicData must be used inside ClinicProvider');
    }
    return context;
}

export const getAppointmentsByDate = (appointments: Appointment[], date: string): Appointment[] =>
    appointments.filter((a) => a.date === date).sort((a, b) => a.time.localeCompare(b.time));

export const getPendingInvoices = (invoices: Invoice[]): Invoice[] =>
    invoices.filter((i) => i.status === 'pending' || i.status === 'partial');

export const getOverdueInvoices = (invoices: Invoice[]): Invoice[] =>
    invoices.filter((i) => i.status === 'overdue');

export const getLowStockProducts = (products: Product[]): Product[] =>
    products.filter((p) => p.stock > 0 && p.stock <= p.minStock);

export const getOutOfStockProducts = (products: Product[]): Product[] =>
    products.filter((p) => p.stock === 0);

export const getVaccinationDueSoonCount = (patients: Patient[], days = 60): number => {
    const now = new Date();
    const target = new Date();
    target.setDate(target.getDate() + days);

    return patients.filter((patient) =>
        patient.vaccinations.some((vaccination) => {
            const dueDate = new Date(vaccination.nextDueDate);
            return dueDate >= now && dueDate <= target;
        })
    ).length;
};
