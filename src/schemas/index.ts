import { z } from 'zod';

export const ownerSchema = z.object({
    firstName: z.string().min(2, 'Le prenom doit contenir au moins 2 caracteres'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caracteres'),
    email: z.string().email('Email invalide'),
    phone: z.string().min(10, 'Numero de telephone invalide'),
    address: z.string().min(5, 'Adresse requise'),
});

export const patientSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other'], { required_error: 'Espece requise' }),
    breed: z.string().min(1, 'La race est requise'),
    birthDate: z.string().min(1, 'Date de naissance requise'),
    weight: z.coerce.number().positive('Le poids doit etre positif'),
    color: z.string().min(1, 'La couleur est requise'),
    microchip: z.string().optional(),
    owner: ownerSchema,
});

export const appointmentSchema = z.object({
    patientId: z.string().min(1, 'Patient requis'),
    date: z.string().min(1, 'Date requise'),
    time: z.string().min(1, 'Heure requise'),
    duration: z.coerce.number().min(15, 'Duree minimum 15 minutes').max(240, 'Duree maximum 4 heures'),
    type: z.enum(['consultation', 'vaccination', 'surgery', 'follow-up', 'emergency'], { required_error: 'Type requis' }),
    veterinarian: z.string().min(1, 'Veterinaire requis'),
    notes: z.string().optional(),
});

export const productSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    category: z.enum(['medication', 'food', 'accessory', 'hygiene', 'supplement'], { required_error: 'Categorie requise' }),
    sku: z.string().min(1, 'Le SKU est requis'),
    stock: z.coerce.number().min(0, 'Le stock ne peut pas etre negatif'),
    minStock: z.coerce.number().min(0, 'Le seuil minimum ne peut pas etre negatif'),
    price: z.coerce.number().positive('Le prix doit etre positif'),
    unit: z.string().min(1, 'L\'unite est requise'),
    supplier: z.string().min(1, 'Le fournisseur est requis'),
    expiryDate: z.string().optional(),
});

export const invoiceLineSchema = z.object({
    description: z.string().min(1, 'Description requise'),
    quantity: z.coerce.number().min(1, 'Quantite minimum 1'),
    unitPrice: z.coerce.number().positive('Prix unitaire requis'),
});

export const invoiceSchema = z.object({
    patientId: z.string().min(1, 'Patient requis'),
    dueDate: z.string().min(1, 'Date d\'echeance requise'),
    lines: z.array(invoiceLineSchema).min(1, 'Au moins une ligne est requise'),
});

export const medicalRecordSchema = z.object({
    date: z.string().min(1, 'Date requise'),
    type: z.enum(['consultation', 'surgery', 'emergency', 'follow-up'], { required_error: 'Type requis' }),
    diagnosis: z.string().min(1, 'Diagnostic requis'),
    treatment: z.string().min(1, 'Traitement requis'),
    notes: z.string().optional(),
    veterinarian: z.string().min(1, 'Veterinaire requis'),
    prescriptions: z.array(z.object({
        medication: z.string().min(1, 'Medicament requis'),
        dosage: z.string().min(1, 'Dosage requis'),
        frequency: z.string().min(1, 'Frequence requise'),
        duration: z.string().min(1, 'Duree requise'),
        instructions: z.string().optional(),
    })).optional().default([]),
});

export const vaccinationSchema = z.object({
    name: z.string().min(1, 'Nom du vaccin requis'),
    date: z.string().min(1, 'Date requise'),
    nextDueDate: z.string().min(1, 'Date prochaine dose requise'),
    veterinarian: z.string().min(1, 'Veterinaire requis'),
});

export const paymentSchema = z.object({
    amount: z.coerce.number().positive('Le montant doit etre positif'),
    method: z.enum(['card', 'cash', 'check', 'transfer'], { required_error: 'Methode de paiement requise' }),
    date: z.string().min(1, 'Date requise'),
});

export const stockAdjustmentSchema = z.object({
    delta: z.coerce.number().refine((v) => v !== 0, 'La quantite ne peut pas etre zero'),
    reason: z.enum(['sale', 'reception', 'loss', 'counter_sale'], { required_error: 'Raison requise' }),
    note: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;
export type VaccinationFormData = z.infer<typeof vaccinationSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;
