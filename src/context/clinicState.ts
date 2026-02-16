import { createContext, useContext } from 'react';
import type { Appointment, Invoice, Patient, Product } from '../types';

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
  appointments: Appointment[];
  invoices: Invoice[];
  products: Product[];
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  updateAppointmentSchedule: (
    appointmentId: string,
    patch: { date: string; time: string; duration?: number }
  ) => { ok: true } | { ok: false; message: string };
  addAppointment: (input: NewAppointmentInput) => { ok: true } | { ok: false; message: string };
  recordInvoicePayment: (invoiceId: string) => void;
  adjustProductStock: (productId: string, delta: number) => void;
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
  appointments.filter((appointment) => appointment.date === date).sort((a, b) => a.time.localeCompare(b.time));

export const getPendingInvoices = (invoices: Invoice[]): Invoice[] =>
  invoices.filter((invoice) => invoice.status === 'pending' || invoice.status === 'partial');

export const getOverdueInvoices = (invoices: Invoice[]): Invoice[] =>
  invoices.filter((invoice) => invoice.status === 'overdue');

export const getLowStockProducts = (products: Product[]): Product[] =>
  products.filter((product) => product.stock <= product.minStock);

export const getOutOfStockProducts = (products: Product[]): Product[] =>
  products.filter((product) => product.stock === 0);

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
