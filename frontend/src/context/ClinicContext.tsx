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
// Removed initial data imports
import { ClinicStateContext, type NewAppointmentInput } from './clinicState';
import { apiService } from '../services/api';

function getInvoicePaidAmount(invoice: Pick<Invoice, 'total' | 'status' | 'payments' | 'paymentPlan'>): number {
    const paidByPayments = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
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

// Removed initialInvoices normalization

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

function getCurrentActor(): string {
    return localStorage.getItem('vetcare_user_name')
        || localStorage.getItem('vetcare_role')
        || 'Utilisateur inconnu';
}

function toSafeQuantity(quantity: number): number {
    if (!Number.isFinite(quantity)) return 1;
    return Math.max(1, Math.round(quantity));
}

export function ClinicProvider({ children }: { children: ReactNode }) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
    const [prescriptionOrders, setPrescriptionOrders] = useState<PrescriptionOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pts, apts, invs, prods] = await Promise.all([
                    apiService.getPatients(),
                    apiService.getAppointments(),
                    apiService.getInvoices(),
                    apiService.getProducts(),
                ]);
                setPatients(pts);
                setAppointments(apts);
                setInvoices(invs.map(normalizeInvoice));
                setProducts(prods);
                
                const orders: PrescriptionOrder[] = [];
                pts.forEach((p: Patient) => {
                    p.medicalHistory?.forEach((m: MedicalRecord) => {
                        if (!m.prescriptions || m.prescriptions.length === 0) return;
                        const firstPrescription = m.prescriptions[0];
                        orders.push({
                            id: `rx-${m.id}`,
                            prescriptionNumber: `ORD-${m.date.slice(0, 4)}-${String(orders.length + 1).padStart(4, '0')}`,
                            patientId: p.id,
                            patientName: p.name,
                            ownerName: `${p.owner.firstName} ${p.owner.lastName}`,
                            veterinarian: m.veterinarian,
                            issueDate: m.date,
                            diagnosis: m.diagnosis,
                            notes: m.notes,
                            status: firstPrescription.status ?? 'pending',
                            sourceMedicalRecordId: m.id,
                            printedCount: firstPrescription.printedCount ?? 0,
                            lastPrintedAt: firstPrescription.lastPrintedAt,
                            preparedAt: firstPrescription.preparedAt,
                            preparedBy: firstPrescription.preparedBy,
                            dispensedAt: firstPrescription.dispensedAt,
                            dispensedBy: firstPrescription.dispensedBy,
                            cancellationReason: firstPrescription.cancellationReason,
                            lines: m.prescriptions.map((prescription) => ({
                                id: prescription.id,
                                medication: prescription.medication,
                                dosage: prescription.dosage,
                                frequency: prescription.frequency,
                                duration: prescription.duration,
                                instructions: prescription.instructions,
                                quantity: 1,
                            })),
                        });
                    });
                });
                setPrescriptionOrders(orders);
            } catch (error) {
                console.error('Failed to fetch data from API', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
    const addPatient = useCallback(async (data: Omit<Patient, 'id' | 'alerts' | 'vaccinations' | 'medicalHistory'>): Promise<Patient> => {
        const newPatient = await apiService.createPatient(data);
        setPatients((prev) => [...prev, newPatient]);
        logActivity('create', 'patient', newPatient.id);
        return newPatient;
    }, [logActivity]);

    const updatePatient = useCallback(async (id: string, data: Partial<Patient>) => {
        const updated = await apiService.updatePatient(id, data);
        setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)));
        logActivity('update', 'patient', id);
    }, [logActivity]);

    const deletePatient = useCallback(async (id: string) => {
        await apiService.deletePatient(id);
        setPatients((prev) => prev.filter((p) => p.id !== id));
        logActivity('delete', 'patient', id);
    }, [logActivity]);

    const updatePatientGdpr = useCallback(async (id: string, data: {
        processingConsent?: boolean;
        marketingConsent?: boolean;
        contactOpposition?: boolean;
        gdprNotes?: string;
    }) => {
        const updated = await apiService.updatePatientGdpr(id, data);
        setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)));
        logActivity('gdpr_update', 'patient', id);
    }, [logActivity]);

    const exportPatientGdpr = useCallback(async (id: string) => {
        const exported = await apiService.exportPatientGdpr(id);
        logActivity('gdpr_export', 'patient', id);
        return exported;
    }, [logActivity]);

    const anonymizePatientOwner = useCallback(async (id: string) => {
        const updated = await apiService.anonymizePatientOwner(id);
        setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)));
        logActivity('gdpr_anonymize_owner', 'patient', id);
    }, [logActivity]);

    const addMedicalRecord = useCallback(async (patientId: string, record: Omit<MedicalRecord, 'id'>): Promise<MedicalRecord> => {
        const newRecord: MedicalRecord = {
            ...record,
            id: generateId('med'),
            prescriptions: record.prescriptions.map((prescription) => ({
                ...prescription,
                id: prescription.id || generateId('presc'),
            })),
        };
        const updatedPatient = await apiService.createMedicalRecord(patientId, record);
        setPatients((prev) => prev.map((p) => (p.id === patientId ? updatedPatient : p)));
        logActivity('create', 'medicalRecord', newRecord.id);
        return updatedPatient.medicalHistory[0] ?? newRecord;
    }, [logActivity]);

    const addVaccination = useCallback(async (patientId: string, vaccination: Omit<Vaccination, 'id'>) => {
        const updatedPatient = await apiService.createVaccination(patientId, vaccination);
        setPatients((prev) => prev.map((p) => (p.id === patientId ? updatedPatient : p)));
        logActivity('create', 'vaccination', patientId);
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
    const addAppointment = useCallback(async (input: NewAppointmentInput, force = false) => {
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

        const created = await apiService.createAppointment(input);
        setAppointments((prev) => [...prev, created]);
        logActivity('create', 'appointment', created.id);
        return { ok: true as const };
    }, [appointments, logActivity]);

    const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>, force = false) => {
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

        const updated = await apiService.updateAppointment(id, data);
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
        logActivity('update', 'appointment', id);
        return { ok: true as const };
    }, [appointments, logActivity]);

    const deleteAppointment = useCallback(async (id: string) => {
        await apiService.deleteAppointment(id);
        setAppointments((prev) => prev.filter((a) => a.id !== id));
        logActivity('delete', 'appointment', id);
    }, [logActivity]);

    const updateAppointmentStatus = useCallback(async (appointmentId: string, status: Appointment['status']) => {
        const updated = await apiService.updateAppointment(appointmentId, { status });
        setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? updated : a)));
    }, []);

    const updateAppointmentSchedule = useCallback(
        async (appointmentId: string, patch: { date: string; time: string; duration?: number }) => {
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

            const updated = await apiService.updateAppointment(appointmentId, { date: patch.date, time: patch.time, duration });
            setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? updated : a)));
            return { ok: true as const };
        },
        [appointments]
    );

    const cancelAppointment = useCallback(async (id: string, reason: string) => {
        const updated = await apiService.updateAppointment(id, { status: 'cancelled', cancellationReason: reason });
        setAppointments((prev) => prev.map((a) => (a.id === id ? { ...updated, cancellationReason: reason } : a)));
        logActivity('cancel', 'appointment', id);
    }, [logActivity]);

    // ---- PRODUCTS ----
    const addProduct = useCallback(async (data: Omit<Product, 'id'>): Promise<Product> => {
        const newProduct = await apiService.createProduct(data);
        setProducts((prev) => [...prev, newProduct]);
        logActivity('create', 'product', newProduct.id);
        return newProduct;
    }, [logActivity]);

    const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
        const updated = await apiService.updateProduct(id, data);
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        logActivity('update', 'product', id);
    }, [logActivity]);

    const deleteProduct = useCallback(async (id: string) => {
        await apiService.deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        logActivity('delete', 'product', id);
    }, [logActivity]);

    const adjustProductStock = useCallback(async (productId: string, delta: number, reason: StockMovement['reason'] = 'reception', note?: string) => {
        const current = products.find((p) => p.id === productId);
        if (!current) return;
        const updated = await apiService.updateProduct(productId, { stock: Math.max(current.stock + delta, 0) });
        setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
        const movement: StockMovement = {
            id: generateId('sm'),
            productId,
            delta,
            reason,
            date: new Date().toISOString().split('T')[0],
            note,
        };
        setStockMovements((prev) => [movement, ...prev]);
    }, [products]);

    // ---- INVOICES ----
    const addInvoice = useCallback(async (
        data: Omit<Invoice, 'id' | 'invoiceNumber' | 'payments' | 'status' | 'subtotal' | 'tax' | 'total' | 'lines'> & {
            lines: InvoiceLineInput[];
        }
    ): Promise<Invoice> => {
        if (data.sourceAppointmentId) {
            const existing = invoices.find((invoice) => invoice.sourceAppointmentId === data.sourceAppointmentId);
            if (existing) return existing;
        }
        const normalizedInvoice = normalizeInvoice(await apiService.createInvoice(data));

        setInvoices((prev) => [...prev, normalizedInvoice]);
        logActivity('create', 'invoice', normalizedInvoice.id);
        return normalizedInvoice;
    }, [invoices, logActivity]);

    const updateInvoice = useCallback(async (id: string, data: Partial<Invoice>) => {
        const updated = normalizeInvoice(await apiService.updateInvoice(id, data));
        setInvoices((prev) => prev.map((invoice) => (invoice.id === id ? updated : invoice)));
        logActivity('update', 'invoice', id);
    }, [logActivity]);

    const updateInvoiceData = useCallback(async (id: string, newLines: InvoiceLineInput[]) => {
        const updated = normalizeInvoice(await apiService.updateInvoice(id, { lines: newLines }));
        setInvoices((prev) => prev.map((invoice) => (invoice.id === id ? updated : invoice)));
        logActivity('update', 'invoice', id);
    }, [logActivity]);

    const recordPayment = useCallback(async (invoiceId: string, paymentData: Omit<Payment, 'id' | 'invoiceId'>) => {
        const updated = normalizeInvoice(await apiService.recordPayment(invoiceId, paymentData));
        setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? updated : inv)));
        logActivity('payment', 'invoice', invoiceId);
    }, [logActivity]);

    const recordInvoicePayment = useCallback(async (invoiceId: string) => {
        const invoice = invoices.find((entry) => entry.id === invoiceId);
        if (!invoice || invoice.status === 'paid') return;
        await recordPayment(invoiceId, {
            amount: Math.max(invoice.total - getInvoicePaidAmount(invoice), 0),
            method: 'card',
            date: new Date().toISOString().split('T')[0],
        });
    }, [invoices, recordPayment]);

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

    const markPrescriptionAsPrinted = useCallback(async (prescriptionOrderId: string) => {
        await apiService.markPrescriptionPrinted(prescriptionOrderId);
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

    const markPrescriptionAsPrepared = useCallback(async (prescriptionOrderId: string) => {
        const current = prescriptionOrders.find((order) => order.id === prescriptionOrderId);
        if (!current || current.status !== 'pending') return;

        const actor = getCurrentActor();
        await apiService.markPrescriptionPrepared(prescriptionOrderId, actor);
        setPrescriptionOrders((prev) =>
            prev.map((order) => (
                order.id === prescriptionOrderId
                    ? {
                        ...order,
                        status: 'prepared',
                        preparedAt: new Date().toISOString(),
                        preparedBy: actor,
                    }
                    : order
            ))
        );
        logActivity('prepare', 'prescriptionOrder', prescriptionOrderId);
    }, [prescriptionOrders, logActivity]);

    const markPrescriptionAsDispensed = useCallback(async (prescriptionOrderId: string) => {
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
            await adjustProductStock(
                productId,
                -quantity,
                'prescription',
                `Delivrance ordonnance ${current.prescriptionNumber} - ${current.patientName}`
            );
        }

        const actor = getCurrentActor();
        await apiService.markPrescriptionDispensed(prescriptionOrderId, actor);
        setPrescriptionOrders((prev) =>
            prev.map((order) => (
                order.id === prescriptionOrderId
                    ? {
                        ...order,
                        status: 'dispensed',
                        dispensedAt: new Date().toISOString(),
                        dispensedBy: actor,
                    }
                    : order
            ))
        );
        logActivity('dispense', 'prescriptionOrder', prescriptionOrderId);
        return { ok: true as const };
    }, [prescriptionOrders, products, adjustProductStock, logActivity]);

    const cancelPrescriptionOrder = useCallback(async (prescriptionOrderId: string, reason?: string) => {
        const current = prescriptionOrders.find((order) => order.id === prescriptionOrderId);
        if (!current || current.status === 'dispensed') return;

        await apiService.cancelPrescriptionOrder(prescriptionOrderId, reason);
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
            loading,
            addPatient,
            updatePatient,
            deletePatient,
            updatePatientGdpr,
            exportPatientGdpr,
            anonymizePatientOwner,
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
            addPatient, updatePatient, deletePatient, updatePatientGdpr, exportPatientGdpr, anonymizePatientOwner,
            addMedicalRecord, addVaccination, addAlert, removeAlert,
            addAppointment, updateAppointment, deleteAppointment, updateAppointmentStatus, updateAppointmentSchedule, cancelAppointment,
            addProduct, updateProduct, deleteProduct, adjustProductStock,
            addInvoice, updateInvoice, updateInvoiceData, recordPayment, recordInvoicePayment,
            createPrescriptionOrder, markPrescriptionAsPrinted, markPrescriptionAsPrepared, markPrescriptionAsDispensed, cancelPrescriptionOrder,
        ]
    );

    return <ClinicStateContext.Provider value={value}>{children}</ClinicStateContext.Provider>;
}
