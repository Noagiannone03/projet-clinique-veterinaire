// User & Auth Types
export type Role = 'director' | 'veterinarian' | 'assistant';

export interface User {
    id: string;
    name: string;
    role: Role;
    description: string;
    icon: string;
}

// Patient Types
export interface Owner {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
}

export interface Patient {
    id: string;
    name: string;
    species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
    breed: string;
    birthDate: string;
    weight: number;
    color: string;
    microchip?: string;
    owner: Owner;
    alerts: Alert[];
    vaccinations: Vaccination[];
    medicalHistory: MedicalRecord[];
}

export interface Alert {
    id: string;
    type: 'behavioral' | 'medical' | 'allergy';
    severity: 'low' | 'medium' | 'high';
    description: string;
}

export interface Vaccination {
    id: string;
    name: string;
    date: string;
    nextDueDate: string;
    veterinarian: string;
}

export interface MedicalRecord {
    id: string;
    date: string;
    type: 'consultation' | 'surgery' | 'emergency' | 'follow-up';
    diagnosis: string;
    treatment: string;
    notes: string;
    veterinarian: string;
    prescriptions: Prescription[];
}

export interface Prescription {
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

// Appointment Types
export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    ownerName: string;
    species: Patient['species'];
    date: string;
    time: string;
    duration: number;
    type: 'consultation' | 'vaccination' | 'surgery' | 'follow-up' | 'emergency';
    status: 'scheduled' | 'arrived' | 'in-progress' | 'completed' | 'cancelled';
    veterinarian: string;
    notes?: string;
    cancellationReason?: string;
}

// Inventory Types
export interface Product {
    id: string;
    name: string;
    category: 'medication' | 'food' | 'accessory' | 'hygiene' | 'supplement';
    sku: string;
    stock: number;
    minStock: number;
    price: number;
    unit: string;
    supplier: string;
    expiryDate?: string;
}

export interface StockMovement {
    id: string;
    productId: string;
    delta: number;
    reason: 'sale' | 'reception' | 'loss' | 'counter_sale' | 'prescription';
    date: string;
    note?: string;
}

// Billing Types
export interface InvoiceLine {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Payment {
    id: string;
    invoiceId: string;
    amount: number;
    method: 'card' | 'cash' | 'check' | 'transfer';
    date: string;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    patientId: string;
    patientName: string;
    ownerName: string;
    date: string;
    dueDate: string;
    lines: InvoiceLine[];
    subtotal: number;
    tax: number;
    total: number;
    status: 'paid' | 'pending' | 'overdue' | 'partial';
    payments: Payment[];
    paymentPlan?: PaymentPlan;
}

export interface PaymentPlan {
    totalInstallments: number;
    paidInstallments: number;
    installmentAmount: number;
    nextPaymentDate: string;
}

// Activity Log
export interface ActivityLogEntry {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    timestamp: string;
    userId: string;
}

// Dashboard Types
export interface KPI {
    label: string;
    value: string | number;
    change?: number;
    changeType?: 'increase' | 'decrease';
    icon: string;
    link?: string;
}

export interface RevenueData {
    month: string;
    revenue: number;
    target: number;
}
