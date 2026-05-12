import type { Invoice, RevenueData } from '../types';

export const invoices: Invoice[] = [
    {
        id: 'inv-1',
        invoiceNumber: 'FAC-2026-0001',
        patientId: 'pat-1',
        patientName: 'Max',
        ownerName: 'Jean Dupont',
        date: '2026-01-15',
        dueDate: '2026-01-30',
        lines: [
            { id: 'line-1', description: 'Consultation generale', quantity: 1, unitPrice: 45.00, total: 45.00 },
            { id: 'line-2', description: 'Traitement otite Easotic', quantity: 1, unitPrice: 28.50, total: 28.50 },
        ],
        subtotal: 73.50,
        tax: 14.70,
        total: 88.20,
        status: 'paid',
        payments: [],
    },
    {
        id: 'inv-2',
        invoiceNumber: 'FAC-2026-0002',
        patientId: 'pat-3',
        patientName: 'Rocky',
        ownerName: 'Pierre Bernard',
        date: '2026-01-10',
        dueDate: '2026-02-10',
        lines: [
            { id: 'line-3', description: 'Consultation suivi dysplasie', quantity: 1, unitPrice: 55.00, total: 55.00 },
            { id: 'line-4', description: 'Radiographie bassin', quantity: 2, unitPrice: 85.00, total: 170.00 },
            { id: 'line-5', description: 'Previcox 227mg x30', quantity: 1, unitPrice: 65.00, total: 65.00 },
        ],
        subtotal: 290.00,
        tax: 58.00,
        total: 348.00,
        status: 'partial',
        paymentPlan: {
            totalInstallments: 3,
            paidInstallments: 1,
            installmentAmount: 116.00,
            nextPaymentDate: '2026-02-10',
        },
        payments: [],
    },
    {
        id: 'inv-3',
        invoiceNumber: 'FAC-2026-0003',
        patientId: 'pat-2',
        patientName: 'Minou',
        ownerName: 'Marie Martin',
        date: '2025-12-20',
        dueDate: '2026-01-05',
        lines: [
            { id: 'line-6', description: 'Sterilisation chatte', quantity: 1, unitPrice: 180.00, total: 180.00 },
            { id: 'line-7', description: 'Anesthesie generale', quantity: 1, unitPrice: 45.00, total: 45.00 },
            { id: 'line-8', description: 'Hospitalisation jour', quantity: 1, unitPrice: 35.00, total: 35.00 },
        ],
        subtotal: 260.00,
        tax: 52.00,
        total: 312.00,
        status: 'overdue',
        payments: [],
    },
    {
        id: 'inv-4',
        invoiceNumber: 'FAC-2026-0004',
        patientId: 'pat-5',
        patientName: 'Luna',
        ownerName: 'Jean Dupont',
        date: '2026-01-18',
        dueDate: '2026-02-02',
        lines: [
            { id: 'line-9', description: 'Vaccination Typhus-Coryza-Leucose', quantity: 1, unitPrice: 75.00, total: 75.00 },
        ],
        subtotal: 75.00,
        tax: 15.00,
        total: 90.00,
        status: 'pending',
        payments: [],
    },
];

export const revenueData: RevenueData[] = [
    { month: 'Fev', revenue: 28500, target: 30000 },
    { month: 'Mar', revenue: 32000, target: 30000 },
    { month: 'Avr', revenue: 29800, target: 30000 },
    { month: 'Mai', revenue: 35200, target: 32000 },
    { month: 'Jun', revenue: 31500, target: 32000 },
    { month: 'Jul', revenue: 28000, target: 32000 },
    { month: 'Aou', revenue: 25500, target: 28000 },
    { month: 'Sep', revenue: 33000, target: 32000 },
    { month: 'Oct', revenue: 36500, target: 35000 },
    { month: 'Nov', revenue: 38200, target: 35000 },
    { month: 'Dec', revenue: 42000, target: 38000 },
    { month: 'Jan', revenue: 39500, target: 40000 },
];

export const getOverdueInvoices = (): Invoice[] => {
    return invoices.filter((i) => i.status === 'overdue');
};

export const getPendingInvoices = (): Invoice[] => {
    return invoices.filter((i) => i.status === 'pending' || i.status === 'partial');
};

export const getTotalRevenue = (): number => {
    return invoices
        .filter((i) => i.status === 'paid' || i.status === 'partial')
        .reduce((sum, i) => sum + i.total, 0);
};
