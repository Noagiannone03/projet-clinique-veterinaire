import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Appointment, Invoice, Patient, Product, StockMovement, ActivityLogEntry, Payment, MedicalRecord, Vaccination, Alert } from '../types';
import { appointments as initialAppointments } from '../data/appointments';
import { invoices as rawInitialInvoices } from '../data/invoices';
import { products as initialProducts } from '../data/products';
import { patients as initialPatients } from '../data/patients';
import { ClinicStateContext, type NewAppointmentInput } from './clinicState';
import { storage } from '../services/storage';

// Migrate old invoices that don't have payments array
const initialInvoices: Invoice[] = rawInitialInvoices.map((inv) => ({
    ...inv,
    payments: (inv as Invoice).payments || [],
}));

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

function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadState<T>(key: string, fallback: T): T {
    return storage.get<T>(key) ?? fallback;
}

export function ClinicProvider({ children }: { children: ReactNode }) {
    const [patients, setPatients] = useState<Patient[]>(() => loadState('patients', initialPatients));
    const [appointments, setAppointments] = useState<Appointment[]>(() => loadState('appointments', initialAppointments));
    const [invoices, setInvoices] = useState<Invoice[]>(() => loadState('invoices', initialInvoices));
    const [products, setProducts] = useState<Product[]>(() => loadState('products', initialProducts));
    const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadState('stockMovements', []));
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() => loadState('activityLog', []));

    // Persist to localStorage
    useEffect(() => { storage.set('patients', patients); }, [patients]);
    useEffect(() => { storage.set('appointments', appointments); }, [appointments]);
    useEffect(() => { storage.set('invoices', invoices); }, [invoices]);
    useEffect(() => { storage.set('products', products); }, [products]);
    useEffect(() => { storage.set('stockMovements', stockMovements); }, [stockMovements]);
    useEffect(() => { storage.set('activityLog', activityLog); }, [activityLog]);

    const logActivity = useCallback((action: string, entity: string, entityId: string) => {
        const entry: ActivityLogEntry = {
            id: generateId('log'),
            action,
            entity,
            entityId,
            timestamp: new Date().toISOString(),
            userId: localStorage.getItem('vetcare_role') || 'unknown',
        };
        setActivityLog((prev) => [entry, ...prev].slice(0, 200));
    }, []);

    // ---- PATIENTS ----
    const addPatient = useCallback((data: Omit<Patient, 'id' | 'alerts' | 'vaccinations' | 'medicalHistory'>): Patient => {
        const newPatient: Patient = {
            ...data,
            id: generateId('pat'),
            alerts: [],
            vaccinations: [],
            medicalHistory: [],
        };
        setPatients((prev) => [...prev, newPatient]);
        logActivity('create', 'patient', newPatient.id);
        return newPatient;
    }, [logActivity]);

    const updatePatient = useCallback((id: string, data: Partial<Patient>) => {
        setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
        logActivity('update', 'patient', id);
    }, [logActivity]);

    const deletePatient = useCallback((id: string) => {
        setPatients((prev) => prev.filter((p) => p.id !== id));
        logActivity('delete', 'patient', id);
    }, [logActivity]);

    const addMedicalRecord = useCallback((patientId: string, record: Omit<MedicalRecord, 'id'>) => {
        const newRecord: MedicalRecord = { ...record, id: generateId('med') };
        setPatients((prev) =>
            prev.map((p) =>
                p.id === patientId ? { ...p, medicalHistory: [newRecord, ...p.medicalHistory] } : p
            )
        );
        logActivity('create', 'medicalRecord', newRecord.id);
    }, [logActivity]);

    const addVaccination = useCallback((patientId: string, vaccination: Omit<Vaccination, 'id'>) => {
        const newVac: Vaccination = { ...vaccination, id: generateId('vac') };
        setPatients((prev) =>
            prev.map((p) =>
                p.id === patientId ? { ...p, vaccinations: [...p.vaccinations, newVac] } : p
            )
        );
        logActivity('create', 'vaccination', newVac.id);
    }, [logActivity]);

    const addAlert = useCallback((patientId: string, alert: Omit<Alert, 'id'>) => {
        const newAlert: Alert = { ...alert, id: generateId('alt') };
        setPatients((prev) =>
            prev.map((p) =>
                p.id === patientId ? { ...p, alerts: [...p.alerts, newAlert] } : p
            )
        );
        logActivity('create', 'alert', newAlert.id);
    }, [logActivity]);

    const removeAlert = useCallback((patientId: string, alertId: string) => {
        setPatients((prev) =>
            prev.map((p) =>
                p.id === patientId ? { ...p, alerts: p.alerts.filter((a) => a.id !== alertId) } : p
            )
        );
    }, []);

    // ---- APPOINTMENTS ----
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

        const created: Appointment = {
            id: generateId('apt'),
            patientId: input.patientId || generateId('new'),
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

        setAppointments((prev) => [...prev, created]);
        logActivity('create', 'appointment', created.id);
        return { ok: true as const };
    }, [appointments, logActivity]);

    const updateAppointment = useCallback((id: string, data: Partial<Appointment>) => {
        setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
        logActivity('update', 'appointment', id);
    }, [logActivity]);

    const deleteAppointment = useCallback((id: string) => {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
        logActivity('delete', 'appointment', id);
    }, [logActivity]);

    const updateAppointmentStatus = useCallback((appointmentId: string, status: Appointment['status']) => {
        setAppointments((prev) =>
            prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
        );
    }, []);

    const updateAppointmentSchedule = useCallback(
        (appointmentId: string, patch: { date: string; time: string; duration?: number }) => {
            const current = appointments.find((a) => a.id === appointmentId);
            if (!current) return { ok: false as const, message: 'Rendez-vous introuvable.' };

            const duration = patch.duration ?? current.duration;
            const isConflict = hasConflict(appointments, {
                id: appointmentId,
                date: patch.date,
                time: patch.time,
                duration,
                veterinarian: current.veterinarian,
            });

            if (isConflict) return { ok: false as const, message: 'Conflit detecte avec un autre rendez-vous.' };

            setAppointments((prev) =>
                prev.map((a) =>
                    a.id === appointmentId ? { ...a, date: patch.date, time: patch.time, duration } : a
                )
            );
            return { ok: true as const };
        },
        [appointments]
    );

    const cancelAppointment = useCallback((id: string, reason: string) => {
        setAppointments((prev) =>
            prev.map((a) =>
                a.id === id ? { ...a, status: 'cancelled' as const, cancellationReason: reason } : a
            )
        );
        logActivity('cancel', 'appointment', id);
    }, [logActivity]);

    // ---- PRODUCTS ----
    const addProduct = useCallback((data: Omit<Product, 'id'>): Product => {
        const newProduct: Product = { ...data, id: generateId('prod') };
        setProducts((prev) => [...prev, newProduct]);
        logActivity('create', 'product', newProduct.id);
        return newProduct;
    }, [logActivity]);

    const updateProduct = useCallback((id: string, data: Partial<Product>) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
        logActivity('update', 'product', id);
    }, [logActivity]);

    const deleteProduct = useCallback((id: string) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        logActivity('delete', 'product', id);
    }, [logActivity]);

    const adjustProductStock = useCallback((productId: string, delta: number, reason: StockMovement['reason'] = 'reception', note?: string) => {
        setProducts((prev) =>
            prev.map((p) =>
                p.id === productId ? { ...p, stock: Math.max(p.stock + delta, 0) } : p
            )
        );
        const movement: StockMovement = {
            id: generateId('sm'),
            productId,
            delta,
            reason,
            date: new Date().toISOString().split('T')[0],
            note,
        };
        setStockMovements((prev) => [movement, ...prev]);
    }, []);

    // ---- INVOICES ----
    const addInvoice = useCallback((data: Omit<Invoice, 'id' | 'invoiceNumber' | 'payments' | 'status' | 'subtotal' | 'tax' | 'total' | 'lines'> & { lines: { description: string; quantity: number; unitPrice: number }[] }): Invoice => {
        const lines = data.lines.map((l) => ({
            id: generateId('line'),
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            total: l.quantity * l.unitPrice,
        }));
        const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
        const tax = Math.round(subtotal * 0.2 * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;
        const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;

        const newInvoice: Invoice = {
            ...data,
            id: generateId('inv'),
            invoiceNumber,
            lines,
            subtotal,
            tax,
            total,
            status: 'pending',
            payments: [],
        };

        setInvoices((prev) => [...prev, newInvoice]);
        logActivity('create', 'invoice', newInvoice.id);
        return newInvoice;
    }, [invoices.length, logActivity]);

    const updateInvoice = useCallback((id: string, data: Partial<Invoice>) => {
        setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
        logActivity('update', 'invoice', id);
    }, [logActivity]);

    const recordPayment = useCallback((invoiceId: string, paymentData: Omit<Payment, 'id' | 'invoiceId'>) => {
        const payment: Payment = {
            id: generateId('pay'),
            invoiceId,
            ...paymentData,
        };

        setInvoices((prev) =>
            prev.map((inv) => {
                if (inv.id !== invoiceId) return inv;
                const payments = [...inv.payments, payment];
                const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                const status = totalPaid >= inv.total ? 'paid' : 'partial';

                let paymentPlan = inv.paymentPlan;
                if (paymentPlan) {
                    const paidInstallments = Math.min(
                        paymentPlan.paidInstallments + 1,
                        paymentPlan.totalInstallments
                    );
                    paymentPlan = { ...paymentPlan, paidInstallments };
                }

                return { ...inv, payments, status, paymentPlan };
            })
        );
        logActivity('payment', 'invoice', invoiceId);
    }, [logActivity]);

    const recordInvoicePayment = useCallback((invoiceId: string) => {
        setInvoices((prev) =>
            prev.map((invoice) => {
                if (invoice.id !== invoiceId || invoice.status === 'paid') return invoice;

                if (invoice.paymentPlan) {
                    const paidInstallments = Math.min(
                        invoice.paymentPlan.paidInstallments + 1,
                        invoice.paymentPlan.totalInstallments
                    );
                    const isFullyPaid = paidInstallments >= invoice.paymentPlan.totalInstallments;
                    return {
                        ...invoice,
                        status: isFullyPaid ? 'paid' : 'partial',
                        paymentPlan: { ...invoice.paymentPlan, paidInstallments },
                    };
                }

                return { ...invoice, status: 'paid' };
            })
        );
    }, []);

    const value = useMemo(
        () => ({
            patients,
            appointments,
            invoices,
            products,
            stockMovements,
            activityLog,
            addPatient,
            updatePatient,
            deletePatient,
            addMedicalRecord,
            addVaccination,
            addAlert,
            removeAlert,
            addAppointment,
            updateAppointment,
            deleteAppointment,
            updateAppointmentStatus,
            updateAppointmentSchedule,
            cancelAppointment,
            addProduct,
            updateProduct,
            deleteProduct,
            adjustProductStock,
            addInvoice,
            updateInvoice,
            recordPayment,
            recordInvoicePayment,
        }),
        [
            patients, appointments, invoices, products, stockMovements, activityLog,
            addPatient, updatePatient, deletePatient, addMedicalRecord, addVaccination, addAlert, removeAlert,
            addAppointment, updateAppointment, deleteAppointment, updateAppointmentStatus, updateAppointmentSchedule, cancelAppointment,
            addProduct, updateProduct, deleteProduct, adjustProductStock,
            addInvoice, updateInvoice, recordPayment, recordInvoicePayment,
        ]
    );

    return <ClinicStateContext.Provider value={value}>{children}</ClinicStateContext.Provider>;
}
