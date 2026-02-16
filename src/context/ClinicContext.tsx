import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { Appointment, Invoice, Product } from '../types';
import { appointments as initialAppointments } from '../data/appointments';
import { invoices as initialInvoices } from '../data/invoices';
import { products as initialProducts } from '../data/products';
import { ClinicStateContext, type NewAppointmentInput } from './clinicState';

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const hasConflict = (
  appointments: Appointment[],
  candidate: { id?: string; date: string; time: string; duration: number; veterinarian: string }
): boolean => {
  const start = timeToMinutes(candidate.time);
  const end = start + candidate.duration;

  return appointments.some((appointment) => {
    if (
      appointment.id === candidate.id ||
      appointment.status === 'cancelled' ||
      appointment.date !== candidate.date ||
      appointment.veterinarian !== candidate.veterinarian
    ) {
      return false;
    }

    const existingStart = timeToMinutes(appointment.time);
    const existingEnd = existingStart + appointment.duration;

    return start < existingEnd && end > existingStart;
  });
};

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
    const isConflict = hasConflict(appointments, {
      date: input.date,
      time: input.time,
      duration: input.duration,
      veterinarian: input.veterinarian,
    });

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

  const updateAppointmentSchedule = useCallback(
    (appointmentId: string, patch: { date: string; time: string; duration?: number }) => {
      const currentAppointment = appointments.find((appointment) => appointment.id === appointmentId);
      if (!currentAppointment) {
        return { ok: false as const, message: 'Rendez-vous introuvable.' };
      }

      const duration = patch.duration ?? currentAppointment.duration;
      const isConflict = hasConflict(appointments, {
        id: appointmentId,
        date: patch.date,
        time: patch.time,
        duration,
        veterinarian: currentAppointment.veterinarian,
      });

      if (isConflict) {
        return { ok: false as const, message: 'Conflit detecte avec un autre rendez-vous.' };
      }

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, date: patch.date, time: patch.time, duration }
            : appointment
        )
      );

      return { ok: true as const };
    },
    [appointments]
  );

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
      updateAppointmentSchedule,
      addAppointment,
      recordInvoicePayment,
      adjustProductStock,
    }),
    [
      appointments,
      invoices,
      products,
      updateAppointmentStatus,
      updateAppointmentSchedule,
      addAppointment,
      recordInvoicePayment,
      adjustProductStock,
    ]
  );

  return <ClinicStateContext.Provider value={value}>{children}</ClinicStateContext.Provider>;
}
