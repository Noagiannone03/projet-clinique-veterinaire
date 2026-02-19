import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { medicalRecordSchema, type MedicalRecordFormData } from '../../schemas';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Plus, Trash2 } from 'lucide-react';

const typeOptions = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'surgery', label: 'Chirurgie' },
    { value: 'emergency', label: 'Urgence' },
    { value: 'follow-up', label: 'Suivi' },
];

const vetOptions = [
    { value: 'Dr. Martin', label: 'Dr. Martin' },
    { value: 'Dr. Leroy', label: 'Dr. Leroy' },
];

interface MedicalRecordFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: MedicalRecordFormData) => void;
    patientName: string;
}

export function MedicalRecordForm({ isOpen, onClose, onSubmit, patientName }: MedicalRecordFormProps) {
    const { register, handleSubmit, control, formState: { errors }, reset } = useForm<MedicalRecordFormData>({
        resolver: zodResolver(medicalRecordSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            prescriptions: [],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'prescriptions' });

    const handleFormSubmit = (data: MedicalRecordFormData) => {
        onSubmit(data);
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Nouvelle consultation - ${patientName}`} size="lg">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
                    <Select label="Type" options={typeOptions} error={errors.type?.message} {...register('type')} />
                    <Select label="Veterinaire" options={vetOptions} error={errors.veterinarian?.message} {...register('veterinarian')} />
                </div>

                <Input label="Diagnostic" error={errors.diagnosis?.message} {...register('diagnosis')} />
                <Textarea label="Traitement" error={errors.treatment?.message} {...register('treatment')} />
                <Textarea label="Notes" error={errors.notes?.message} {...register('notes')} />

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-700">Prescriptions</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => append({ medication: '', dosage: '', frequency: '', duration: '', instructions: '' })}
                        >
                            Ajouter
                        </Button>
                    </div>
                    {fields.map((field, index) => (
                        <div key={field.id} className="border border-slate-200 rounded-lg p-4 mb-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600">Prescription {index + 1}</span>
                                <button type="button" onClick={() => remove(index)} className="text-rose-500 hover:text-rose-700">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input label="Medicament" {...register(`prescriptions.${index}.medication`)} />
                                <Input label="Dosage" {...register(`prescriptions.${index}.dosage`)} />
                                <Input label="Frequence" {...register(`prescriptions.${index}.frequency`)} />
                                <Input label="Duree" {...register(`prescriptions.${index}.duration`)} />
                                <Input label="Instructions" {...register(`prescriptions.${index}.instructions`)} className="sm:col-span-2" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
                    <Button type="submit">Enregistrer</Button>
                </div>
            </form>
        </Modal>
    );
}
