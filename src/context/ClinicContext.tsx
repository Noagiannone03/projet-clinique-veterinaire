import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
    PrescriptionOrder,
    PrescriptionOrderLine,
} from '../types';
import { appointments as initialAppointments } from '../data/appointments';
import { invoices as rawInitialInvoices } from '../data/invoices';
import { products as initialProducts } from '../data/products';
import { patients as initialPatients } from '../data/patients';
import { ClinicStateContext, type NewAppointmentInput } from './clinicState';
import { storage } from '../services/storage';

function getInvoicePaidAmount(invoice: Pick<Invoice, 'total' | 'status' | 'payments' | 'paymentPlan'>): number {
    const paidByPayments = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paidByPlan = invoice.paymentPlan
        ? invoice.paymentPlan.paidInstallments * invoice.paymentPlan.installmentAmount
        : 0;
    const legacyPaidFallback = invoice.status === 'paid' && paidByPayments === 0 && paidByPlan === 0
        ? invoice.total
        : 0;
    return Math.min(Math.max(paidByPayments, paidByPlan, legacyPaidFallback), invoice.total);
}

function computeInvoiceStatus(
    invoice: Pick<Invoice, 'total' | 'dueDate'>,
    amountPaid: number
): Invoice['status'] {
    if (amountPaid >= invoice.total) return 'paid';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(`${invoice.dueDate}T00:00:00`);
    if (!Number.isNaN(dueDate.getTime()) && dueDate < today) {
        return 'overdue';
    }

    if (amountPaid > 0) return 'partial';
    return 'pending';
}

function normalizeInvoice(invoice: Invoice): Invoice {
    const lines = invoice.lines.map((line) => ({
        ...line,
        lineType: line.lineType ?? (line.productId ? 'product' : 'service'),
    }));
    const baseInvoice: Invoice = {
        ...invoice,
        source: invoice.source ?? (invoice.sourceAppointmentId ? 'consultation' : 'manual'),
        payments: invoice.payments || [],
        lines,
    };
    const amountPaid = getInvoicePaidAmount(baseInvoice);
    return {
        ...baseInvoice,
        status: computeInvoiceStatus(baseInvoice, amountPaid),
    };
}

function normalizeInvoices(list: Invoice[]): Invoice[] {
    return list.map((invoice) => normalizeInvoice(invoice));
}

const initialInvoices: Invoice[] = normalizeInvoices(rawInitialInvoices as Invoice[]);

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const getConflict = (
    appointments: Appointment[],
    candidate: { id?: string; date: string; time: string; duration: number; veterinarian: string }
): Appointment | undefined => {
    const start = timeToMinutes(candidate.time);
    const end = start + candidate.duration;

    return appointments.find((appointment) => {
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

function getCurrentActor(): string {
    return localStorage.getItem('vetcare_user_name')
        || localStorage.getItem('vetcare_role')
        || 'Utilisateur inconnu';
}

function toSafeQuantity(quantity: number): number {
    if (!Number.isFinite(quantity)) return 1;
    return Math.max(1, Math.round(quantity));
}

function normalizePrescriptionOrders(list: PrescriptionOrder[]): PrescriptionOrder[] {
    return list.map((order) => ({
        ...order,
        status: order.status ?? 'pending',
        printedCount: order.printedCount ?? 0,
        lines: order.lines.map((line) => ({
            ...line,
            id: line.id || generateId('rxl'),
            quantity: toSafeQuantity(line.quantity),
        })),
    }));
}

function parsePrescriptionQuantity(text: string): number {
    const match = text.replace(',', '.').match(/\d+(\.\d+)?/);
    if (!match) return 1;
    return toSafeQuantity(Math.ceil(Number(match[0])));
}

function buildInitialPrescriptionOrders(
    seedPatients: Patient[],
    seedProducts: Product[]
): PrescriptionOrder[] {
    const productIdByName = new Map(seedProducts.map((p) => [p.name.toLowerCase(), p.id]));
    const orders: PrescriptionOrder[] = [];
    let serial = 1;

    seedPatients.forEach((patient) => {
        const ownerName = `${patient.owner.firstName} ${patient.owner.lastName}`;
        patient.medicalHistory
            .filter((record) => record.prescriptions.length > 0)
            .forEach((record) => {
                const lines: PrescriptionOrderLine[] = record.prescriptions.map((prescription) => ({
                    id: generateId('rxl'),
                    medication: prescription.medication,
                    dosage: prescription.dosage,
                    frequency: prescription.frequency,
                    duration: prescription.duration,
                    instructions: prescription.instructions,
                    quantity: parsePrescriptionQuantity(prescription.dosage),
                    productId: productIdByName.get(prescription.medication.toLowerCase()),
                }));

                const year = Number.isNaN(new Date(record.date).getTime())
                    ? new Date().getFullYear()
                    : new Date(record.date).getFullYear();
                const timestamp = `${record.date}T18:00:00.000Z`;

                orders.push({
                    id: generateId('rx'),
                    prescriptionNumber: `ORD-${year}-${String(serial).padStart(4, '0')}`,
                    patientId: patient.id,
                    patientName: patient.name,
                    ownerName,
                    veterinarian: record.veterinarian,
                    issueDate: record.date,
                    diagnosis: record.diagnosis,
                    notes: record.notes,
                    status: 'dispensed',
                    lines,
                    sourceMedicalRecordId: record.id,
                    dispensedAt: timestamp,
                    dispensedBy: 'Historique',
                    lastPrintedAt: timestamp,
                    printedCount: 1,
                });
                serial += 1;
            });
    });

    return orders.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}

const initialPrescriptionOrders: PrescriptionOrder[] = normalizePrescriptionOrders(
    buildInitialPrescriptionOrders(initialPatients, initialProducts)
);

export function ClinicProvider({ children }: { children: ReactNode }) {
    const [patients, setPatients] = useState<Patient[]>(() => loadState('patients', initialPatients));
    const [appointments, setAppointments] = useState<Appointment[]>(() => loadState('appointments', initialAppointments));
    const [invoices, setInvoices] = useState<Invoice[]>(() =>
        normalizeInvoices(loadState('invoices', initialInvoices))
    );
    const [products, setProducts] = useState<Product[]>(() => loadState('products', initialProducts));
    const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadState('stockMovements', []));
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() => loadState('activityLog', []));
    const [prescriptionOrders, setPrescriptionOrders] = useState<PrescriptionOrder[]>(() =>
        normalizePrescriptionOrders(loadState('prescriptionOrders', initialPrescriptionOrders))
    );

    // Persist to localStorage
    useEffect(() => { storage.set('patients', patients); }, [patients]);
    useEffect(() => { storage.set('appointments', appointments); }, [appointments]);
    useEffect(() => { storage.set('invoices', invoices); }, [invoices]);
    useEffect(() => { storage.set('products', products); }, [products]);
    useEffect(() => { storage.set('stockMovements', stockMovements); }, [stockMovements]);
    useEffect(() => { storage.set('activityLog', activityLog); }, [activityLog]);
    useEffect(() => { storage.set('prescriptionOrders', prescriptionOrders); }, [prescriptionOrders]);

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
        const newRecord: MedicalRecord = {
            ...record,
            id: generateId('med'),
            prescriptions: record.prescriptions.map((prescription) => ({
                ...prescription,
                id: prescription.id || generateId('presc'),
            })),
        };
        setPatients((prev) =>
            prev.map((p) =>
                p.id === patientId ? { ...p, medicalHistory: [newRecord, ...p.medicalHistory] } : p
            )
        );
        logActivity('create', 'medicalRecord', newRecord.id);
        return newRecord;
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
    const addAppointment = useCallback((input: NewAppointmentInput, force = false) => {
        if (!force) {
            const conflict = getConflict(appointments, {
                date: input.date,
                time: input.time,
                duration: input.duration,
                veterinarian: input.veterinarian,
            });

            if (conflict) {
                return { ok: false as const, message: 'Conflit de planning sur ce créneau.', conflict };
            }
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

    const updateAppointment = useCallback((id: string, data: Partial<Appointment>, force = false) => {
        const current = appointments.find((a) => a.id === id);
        if (!current) return { ok: false as const, message: 'Rendez-vous introuvable.' };

        if (!force && (data.date || data.time || data.duration || data.veterinarian)) {
            const conflict = getConflict(appointments, {
                id,
                date: data.date ?? current.date,
                time: data.time ?? current.time,
                duration: data.duration ?? current.duration,
                veterinarian: data.veterinarian ?? current.veterinarian,
            });

            if (conflict) {
                return { ok: false as const, message: 'Conflit de planning sur ce créneau.', conflict };
            }
        }

        setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
        logActivity('update', 'appointment', id);
        return { ok: true as const };
    }, [appointments, logActivity]);

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
            const conflict = getConflict(appointments, {
                id: appointmentId,
                date: patch.date,
                time: patch.time,
                duration,
                veterinarian: current.veterinarian,
            });

            if (conflict) return { ok: false as const, message: 'Conflit détecté avec un autre rendez-vous.', conflict };

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
    const addInvoice = useCallback((
        data: Omit<Invoice, 'id' | 'invoiceNumber' | 'payments' | 'status' | 'subtotal' | 'tax' | 'total' | 'lines'> & {
            lines: InvoiceLineInput[];
        }
    ): Invoice => {
        if (data.sourceAppointmentId) {
            const existing = invoices.find((invoice) => invoice.sourceAppointmentId === data.sourceAppointmentId);
            if (existing) return existing;
        }

        const lines = data.lines.map((l) => ({
            id: generateId('line'),
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            total: l.quantity * l.unitPrice,
            lineType: l.lineType ?? 'service',
            productId: l.productId,
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
            source: data.source ?? 'manual',
            status: 'pending',
            payments: [],
        };
        const normalizedInvoice = normalizeInvoice(newInvoice);

        setInvoices((prev) => [...prev, normalizedInvoice]);
        logActivity('create', 'invoice', normalizedInvoice.id);
        return normalizedInvoice;
    }, [invoices, logActivity]);

    const updateInvoice = useCallback((id: string, data: Partial<Invoice>) => {
        setInvoices((prev) =>
            prev.map((invoice) => (
                invoice.id === id ? normalizeInvoice({ ...invoice, ...data }) : invoice
            ))
        );
        logActivity('update', 'invoice', id);
    }, [logActivity]);

    const updateInvoiceData = useCallback((id: string, newLines: InvoiceLineInput[]) => {
        setInvoices((prev) =>
            prev.map((invoice) => {
                if (invoice.id !== id) return invoice;

                const lines = newLines.map((l) => ({
                    id: generateId('line'),
                    description: l.description,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    total: l.quantity * l.unitPrice,
                    lineType: l.lineType ?? 'service',
                    productId: l.productId,
                }));
                const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
                const tax = Math.round(subtotal * 0.2 * 100) / 100;
                const total = Math.round((subtotal + tax) * 100) / 100;

                return normalizeInvoice({
                    ...invoice,
                    lines,
                    subtotal,
                    tax,
                    total,
                });
            })
        );
        logActivity('update', 'invoice', id);
    }, [logActivity]);

    const recordPayment = useCallback((invoiceId: string, paymentData: Omit<Payment, 'id' | 'invoiceId'>) => {
        setInvoices((prev) =>
            prev.map((inv) => {
                if (inv.id !== invoiceId) return inv;

                const alreadyPaid = getInvoicePaidAmount(inv);
                const remaining = Math.max(inv.total - alreadyPaid, 0);
                const amountToApply = Math.min(Math.max(paymentData.amount, 0), remaining);
                if (amountToApply <= 0) return inv;

                const payment: Payment = {
                    id: generateId('pay'),
                    invoiceId,
                    ...paymentData,
                    amount: amountToApply,
                };

                const payments = [...inv.payments, payment];
                const totalPaid = getInvoicePaidAmount({ ...inv, payments });

                let paymentPlan = inv.paymentPlan;
                if (paymentPlan) {
                    const paidInstallments = Math.min(Math.floor(totalPaid / paymentPlan.installmentAmount), paymentPlan.totalInstallments);
                    paymentPlan = { ...paymentPlan, paidInstallments };
                }

                const status = computeInvoiceStatus(inv, totalPaid);
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
                    const totalPaid = Math.min(
                        paidInstallments * invoice.paymentPlan.installmentAmount,
                        invoice.total
                    );
                    return {
                        ...invoice,
                        status: computeInvoiceStatus(invoice, totalPaid),
                        paymentPlan: { ...invoice.paymentPlan, paidInstallments },
                    };
                }

                return { ...invoice, status: computeInvoiceStatus(invoice, invoice.total) };
            })
        );
    }, []);

    // ---- PRESCRIPTIONS ----
    const createPrescriptionOrder = useCallback((data: {
        patientId: string;
        patientName: string;
        ownerName: string;
        veterinarian: string;
        issueDate: string;
        diagnosis?: string;
        notes?: string;
        lines: Omit<PrescriptionOrderLine, 'id'>[];
        sourceAppointmentId?: string;
        sourceMedicalRecordId?: string;
    }): PrescriptionOrder => {
        if (data.sourceAppointmentId) {
            const existing = prescriptionOrders.find((order) => order.sourceAppointmentId === data.sourceAppointmentId);
            if (existing) return existing;
        }

        const issueYear = Number.isNaN(new Date(data.issueDate).getTime())
            ? new Date().getFullYear()
            : new Date(data.issueDate).getFullYear();
        const yearPrefix = `ORD-${issueYear}-`;
        const yearlyCount = prescriptionOrders.filter((order) => order.prescriptionNumber.startsWith(yearPrefix)).length;

        const createdOrder: PrescriptionOrder = {
            id: generateId('rx'),
            prescriptionNumber: `${yearPrefix}${String(yearlyCount + 1).padStart(4, '0')}`,
            patientId: data.patientId,
            patientName: data.patientName,
            ownerName: data.ownerName,
            veterinarian: data.veterinarian,
            issueDate: data.issueDate,
            diagnosis: data.diagnosis,
            notes: data.notes,
            status: 'pending',
            lines: data.lines.map((line) => ({
                ...line,
                id: generateId('rxl'),
                quantity: toSafeQuantity(line.quantity),
            })),
            sourceAppointmentId: data.sourceAppointmentId,
            sourceMedicalRecordId: data.sourceMedicalRecordId,
            printedCount: 0,
        };

        setPrescriptionOrders((prev) => [createdOrder, ...prev]);
        logActivity('create', 'prescriptionOrder', createdOrder.id);
        return createdOrder;
    }, [prescriptionOrders, logActivity]);

    const markPrescriptionAsPrinted = useCallback((prescriptionOrderId: string) => {
        const printedAt = new Date().toISOString();
        setPrescriptionOrders((prev) =>
            prev.map((order) => (
                order.id === prescriptionOrderId
                    ? { ...order, printedCount: order.printedCount + 1, lastPrintedAt: printedAt }
                    : order
            ))
        );
        logActivity('print', 'prescriptionOrder', prescriptionOrderId);
    }, [logActivity]);

    const markPrescriptionAsPrepared = useCallback((prescriptionOrderId: string) => {
        const current = prescriptionOrders.find((order) => order.id === prescriptionOrderId);
        if (!current || current.status !== 'pending') return;

        setPrescriptionOrders((prev) =>
            prev.map((order) => (
                order.id === prescriptionOrderId
                    ? {
                        ...order,
                        status: 'prepared',
                        preparedAt: new Date().toISOString(),
                        preparedBy: getCurrentActor(),
                    }
                    : order
            ))
        );
        logActivity('prepare', 'prescriptionOrder', prescriptionOrderId);
    }, [prescriptionOrders, logActivity]);

    const markPrescriptionAsDispensed = useCallback((prescriptionOrderId: string) => {
        const current = prescriptionOrders.find((order) => order.id === prescriptionOrderId);
        if (!current) return { ok: false as const, message: 'Ordonnance introuvable.' };
        if (current.status === 'cancelled') return { ok: false as const, message: 'Ordonnance annulee.' };
        if (current.status === 'dispensed') return { ok: false as const, message: 'Ordonnance deja delivree.' };

        const requiredByProduct = new Map<string, number>();
        current.lines.forEach((line) => {
            if (!line.productId) return;
            requiredByProduct.set(line.productId, (requiredByProduct.get(line.productId) ?? 0) + toSafeQuantity(line.quantity));
        });

        for (const [productId, required] of requiredByProduct.entries()) {
            const product = products.find((p) => p.id === productId);
            if (!product) continue;
            if (product.stock < required) {
                return {
                    ok: false as const,
                    message: `Stock insuffisant pour ${product.name} (${product.stock} disponible, ${required} requis).`,
                };
            }
        }

        for (const [productId, quantity] of requiredByProduct.entries()) {
            adjustProductStock(
                productId,
                -quantity,
                'prescription',
                `Delivrance ordonnance ${current.prescriptionNumber} - ${current.patientName}`
            );
        }

        setPrescriptionOrders((prev) =>
            prev.map((order) => (
                order.id === prescriptionOrderId
                    ? {
                        ...order,
                        status: 'dispensed',
                        dispensedAt: new Date().toISOString(),
                        dispensedBy: getCurrentActor(),
                    }
                    : order
            ))
        );
        logActivity('dispense', 'prescriptionOrder', prescriptionOrderId);
        return { ok: true as const };
    }, [prescriptionOrders, products, adjustProductStock, logActivity]);

    const cancelPrescriptionOrder = useCallback((prescriptionOrderId: string, reason?: string) => {
        const current = prescriptionOrders.find((order) => order.id === prescriptionOrderId);
        if (!current || current.status === 'dispensed') return;

        setPrescriptionOrders((prev) =>
            prev.map((order) => (
                order.id === prescriptionOrderId
                    ? {
                        ...order,
                        status: 'cancelled',
                        cancellationReason: reason,
                    }
                    : order
            ))
        );
        logActivity('cancel', 'prescriptionOrder', prescriptionOrderId);
    }, [prescriptionOrders, logActivity]);

    const value = useMemo(
        () => ({
            patients,
            appointments,
            invoices,
            products,
            stockMovements,
            activityLog,
            prescriptionOrders,
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
            updateInvoiceData,
            recordPayment,
            recordInvoicePayment,
            createPrescriptionOrder,
            markPrescriptionAsPrinted,
            markPrescriptionAsPrepared,
            markPrescriptionAsDispensed,
            cancelPrescriptionOrder,
        }),
        [
            patients, appointments, invoices, products, stockMovements, activityLog, prescriptionOrders,
            addPatient, updatePatient, deletePatient, addMedicalRecord, addVaccination, addAlert, removeAlert,
            addAppointment, updateAppointment, deleteAppointment, updateAppointmentStatus, updateAppointmentSchedule, cancelAppointment,
            addProduct, updateProduct, deleteProduct, adjustProductStock,
            addInvoice, updateInvoice, updateInvoiceData, recordPayment, recordInvoicePayment,
            createPrescriptionOrder, markPrescriptionAsPrinted, markPrescriptionAsPrepared, markPrescriptionAsDispensed, cancelPrescriptionOrder,
        ]
    );

    return <ClinicStateContext.Provider value={value}>{children}</ClinicStateContext.Provider>;
}
