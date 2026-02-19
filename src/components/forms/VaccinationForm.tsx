import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vaccinationSchema, type VaccinationFormData } from '../../schemas';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const vetOptions = [
    { value: 'Dr. Martin', label: 'Dr. Martin' },
    { value: 'Dr. Leroy', label: 'Dr. Leroy' },
];

interface VaccinationFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: VaccinationFormData) => void;
    patientName: string;
}

export function VaccinationForm({ isOpen, onClose, onSubmit, patientName }: VaccinationFormProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<VaccinationFormData>({
        resolver: zodResolver(vaccinationSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
        },
    });

    const handleFormSubmit = (data: VaccinationFormData) => {
        onSubmit(data);
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Vaccination - ${patientName}`} size="md">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <Input label="Nom du vaccin" error={errors.name?.message} {...register('name')} placeholder="Ex: Rage, CHPLR, Typhus-Coryza..." />
                <Input label="Date d'administration" type="date" error={errors.date?.message} {...register('date')} />
                <Input label="Prochaine dose" type="date" error={errors.nextDueDate?.message} {...register('nextDueDate')} />
                <Select label="Veterinaire" options={vetOptions} error={errors.veterinarian?.message} {...register('veterinarian')} />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
                    <Button type="submit">Enregistrer</Button>
                </div>
            </form>
        </Modal>
    );
}
