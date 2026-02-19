import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema, type AppointmentFormData } from '../../schemas';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { useClinicData } from '../../context/clinicState';
import type { Appointment } from '../../types';

const typeOptions = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'surgery', label: 'Chirurgie' },
    { value: 'follow-up', label: 'Suivi' },
    { value: 'emergency', label: 'Urgence' },
];

const vetOptions = [
    { value: 'Dr. Martin', label: 'Dr. Martin' },
    { value: 'Dr. Leroy', label: 'Dr. Leroy' },
];

const durationOptions = [
    { value: '15', label: '15 min' },
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: '1h' },
    { value: '90', label: '1h30' },
    { value: '120', label: '2h' },
];

interface AppointmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AppointmentFormData) => void;
    appointment?: Appointment;
    defaultPatientId?: string;
    defaultDate?: string;
}

export function AppointmentForm({ isOpen, onClose, onSubmit, appointment, defaultPatientId, defaultDate }: AppointmentFormProps) {
    const { patients } = useClinicData();

    const patientOptions = patients.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.owner.lastName})`,
    }));

    const { register, handleSubmit, formState: { errors }, reset } = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: appointment ? {
            patientId: appointment.patientId,
            date: appointment.date,
            time: appointment.time,
            duration: appointment.duration,
            type: appointment.type,
            veterinarian: appointment.veterinarian,
            notes: appointment.notes || '',
        } : {
            patientId: defaultPatientId || '',
            date: defaultDate || new Date().toISOString().split('T')[0],
            duration: 30,
        },
    });

    const handleFormSubmit = (data: AppointmentFormData) => {
        onSubmit(data);
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={appointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'} size="md">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <Select label="Patient" options={patientOptions} placeholder="Selectionnez un patient" error={errors.patientId?.message} {...register('patientId')} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
                    <Input label="Heure" type="time" error={errors.time?.message} {...register('time')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Select label="Duree" options={durationOptions} error={errors.duration?.message} {...register('duration')} />
                    <Select label="Type" options={typeOptions} error={errors.type?.message} {...register('type')} />
                </div>
                <Select label="Veterinaire" options={vetOptions} error={errors.veterinarian?.message} {...register('veterinarian')} />
                <Textarea label="Notes" {...register('notes')} />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
                    <Button type="submit">{appointment ? 'Modifier' : 'Planifier'}</Button>
                </div>
            </form>
        </Modal>
    );
}
