import type { Appointment } from '../types';

export const appointmentTypeLabel: Record<Appointment['type'], string> = {
    consultation: 'Consultation',
    vaccination: 'Vaccination',
    surgery: 'Chirurgie',
    'follow-up': 'Suivi',
    emergency: 'Urgence',
};

export const appointmentTypeAccent: Record<Appointment['type'], string> = {
    consultation: 'bg-primary-100 text-primary-700',
    vaccination: 'bg-emerald-100 text-emerald-700',
    surgery: 'bg-secondary-100 text-secondary-700',
    'follow-up': 'bg-amber-100 text-amber-700',
    emergency: 'bg-rose-100 text-rose-700',
};

export const appointmentStatusLabel: Record<Appointment['status'], string> = {
    scheduled: 'Planifié',
    arrived: 'Arrivé',
    'in-progress': 'En consultation',
    completed: 'Terminé',
    cancelled: 'Annulé',
};

export const appointmentStatusVariant: Record<Appointment['status'], 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
    scheduled: 'info',
    arrived: 'warning',
    'in-progress': 'warning',
    completed: 'success',
    cancelled: 'danger',
};

export const pipelineStatuses: Appointment['status'][] = ['scheduled', 'arrived', 'in-progress', 'completed'];

export function getNextStatus(status: Appointment['status']): Appointment['status'] | null {
    if (status === 'scheduled') return 'arrived';
    if (status === 'arrived') return 'in-progress';
    if (status === 'in-progress') return 'completed';
    return null;
}
