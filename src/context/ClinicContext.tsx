import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { Appointment, Invoice, Product } from '../types';
import { appointments as initialAppointments } from '../data/appointments';
import { invoices as initialInvoices } from '../data/invoices';
import { products as initialProducts } from '../data/products';
import { ClinicStateContext, type NewAppointmentInput } from './clinicState';

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const updateAppointmentStatus = useCallback((appointmentId: string, status: Appointment['status']) => {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, status } : appointment
      )
    );
  }, []);

  const addAppointment = useCallback((input: NewAppointmentInput) => {
    const isConflict = appointments.some(
      (appointment) =>
        appointment.date === input.date &&
        appointment.time === input.time &&
        appointment.veterinarian === input.veterinarian &&
        appointment.status !== 'cancelled'
    );

    if (isConflict) {
      return { ok: false as const, message: 'Conflit de planning sur ce creneau.' };
    }

    const createdAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: input.patientId || `new-${Date.now()}`,
      patientName: input.patientName,
      ownerName: input.ownerName,
      species: input.species,
      date: input.date,
      time: input.time,
      duration: input.duration,
      type: input.type,
      status: 'scheduled',
      veterinarian: input.veterinarian,
      notes: input.notes,
    };

    setAppointments((current) => [...current, createdAppointment]);
    return { ok: true as const };
  }, [appointments]);

  const recordInvoicePayment = useCallback((invoiceId: string) => {
    setInvoices((current) =>
      current.map((invoice) => {
        if (invoice.id !== invoiceId || invoice.status === 'paid') {
          return invoice;
        }

        if (invoice.paymentPlan) {
          const paidInstallments = Math.min(
            invoice.paymentPlan.paidInstallments + 1,
            invoice.paymentPlan.totalInstallments
          );
          const isFullyPaid = paidInstallments >= invoice.paymentPlan.totalInstallments;

          return {
            ...invoice,
            status: isFullyPaid ? 'paid' : 'partial',
            paymentPlan: {
              ...invoice.paymentPlan,
              paidInstallments,
            },
          };
        }

        return { ...invoice, status: 'paid' };
      })
    );
  }, []);

  const adjustProductStock = useCallback((productId: string, delta: number) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(product.stock + delta, 0) }
          : product
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      appointments,
      invoices,
      products,
      updateAppointmentStatus,
      addAppointment,
      recordInvoicePayment,
      adjustProductStock,
    }),
    [
      appointments,
      invoices,
      products,
      updateAppointmentStatus,
      addAppointment,
      recordInvoicePayment,
      adjustProductStock,
    ]
  );

  return <ClinicStateContext.Provider value={value}>{children}</ClinicStateContext.Provider>;
}
