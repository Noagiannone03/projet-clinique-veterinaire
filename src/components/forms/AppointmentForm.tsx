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
import { AlertTriangle, Clock, UserCheck, User, Calendar, AlertCircle } from 'lucide-react';
import { useState } from 'react';

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
    onSubmit: (data: AppointmentFormData, force?: boolean) => void | { ok: boolean; message?: string; conflict?: Appointment };
    appointment?: Appointment;
    defaultPatientId?: string;
    defaultDate?: string;
}

export function AppointmentForm({ isOpen, onClose, onSubmit, appointment, defaultPatientId, defaultDate }: AppointmentFormProps) {
    const { patients } = useClinicData();
    const [conflictError, setConflictError] = useState<{ message: string; appointment: Appointment } | null>(null);

    const patientOptions = patients.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.owner.lastName})`,
    }));

    const { register, handleSubmit, formState: { errors }, reset, setValue, getValues } = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema) as any,
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

    const handleFormSubmit = async (data: AppointmentFormData, force = false) => {
        setConflictError(null);
        const result = await Promise.resolve(onSubmit(data, force));
        if (result && !result.ok) {
            if (result.conflict) {
                setConflictError({ message: result.message || 'Conflit de planning', appointment: result.conflict });
            }
            return;
        }
        reset();
        onClose();
    };

    const handleClose = () => {
        setConflictError(null);
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={appointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'} size="md">
            <form onSubmit={handleSubmit((data) => handleFormSubmit(data, false))} className="space-y-4">
                {conflictError && (
                    <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-200">
                                <AlertTriangle className="h-4 w-4 text-rose-700" />
                            </div>
                            <h3 className="font-bold text-rose-900">{conflictError.message}</h3>
                        </div>
                        <div className="rounded-lg bg-white p-3 border border-rose-100 flex flex-col gap-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rendez-vous existant :</p>
                            <div className="flex items-center gap-2 text-sm text-slate-900">
                                <User className="h-4 w-4 text-slate-400" />
                                <span className="font-semibold">{conflictError.appointment.patientName}</span>
                                <span className="text-slate-500 text-xs">({conflictError.appointment.ownerName})</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span>{conflictError.appointment.time} ({conflictError.appointment.duration} min)</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <UserCheck className="h-4 w-4 text-slate-400" />
                                <span>{conflictError.appointment.veterinarian}</span>
                            </div>
                        </div>

                        {/* Smart Actions */}
                        <div className="mt-3 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const conflictEnd = new Date(`${conflictError.appointment.date}T${conflictError.appointment.time}:00`);
                                    conflictEnd.setMinutes(conflictEnd.getMinutes() + conflictError.appointment.duration);
                                    const newTime = `${String(conflictEnd.getHours()).padStart(2, '0')}:${String(conflictEnd.getMinutes()).padStart(2, '0')}`;
                                    setValue('time', newTime);
                                    setConflictError(null);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
                            >
                                <Calendar className="h-4 w-4" />
                                Décaler après ça
                            </button>

                            <button
                                type="button"
                                onClick={() => handleFormSubmit(getValues(), true)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                            >
                                <AlertCircle className="h-4 w-4" />
                                Forcer et superposer
                            </button>
                        </div>
                    </div>
                )}
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
                    <Button variant="outline" type="button" onClick={handleClose}>Annuler</Button>
                    <Button type="submit">{appointment ? 'Modifier' : 'Planifier'}</Button>
                </div>
            </form>
        </Modal>
    );
}
