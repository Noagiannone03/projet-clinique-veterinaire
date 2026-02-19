import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema, type PatientFormData } from '../../schemas';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { Patient } from '../../types';

const speciesOptions = [
    { value: 'dog', label: 'Chien' },
    { value: 'cat', label: 'Chat' },
    { value: 'bird', label: 'Oiseau' },
    { value: 'rabbit', label: 'Lapin' },
    { value: 'other', label: 'Autre' },
];

interface PatientFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PatientFormData) => void;
    patient?: Patient;
}

export function PatientForm({ isOpen, onClose, onSubmit, patient }: PatientFormProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
        defaultValues: patient ? {
            name: patient.name,
            species: patient.species,
            breed: patient.breed,
            birthDate: patient.birthDate,
            weight: patient.weight,
            color: patient.color,
            microchip: patient.microchip || '',
            owner: {
                firstName: patient.owner.firstName,
                lastName: patient.owner.lastName,
                email: patient.owner.email,
                phone: patient.owner.phone,
                address: patient.owner.address,
            },
        } : undefined,
    });

    const handleFormSubmit = (data: PatientFormData) => {
        onSubmit(data);
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={patient ? 'Modifier le patient' : 'Nouveau patient'} size="lg">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Informations de l'animal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Nom" error={errors.name?.message} {...register('name')} />
                        <Select label="Espece" options={speciesOptions} error={errors.species?.message} {...register('species')} />
                        <Input label="Race" error={errors.breed?.message} {...register('breed')} />
                        <Input label="Date de naissance" type="date" error={errors.birthDate?.message} {...register('birthDate')} />
                        <Input label="Poids (kg)" type="number" step="0.1" error={errors.weight?.message} {...register('weight')} />
                        <Input label="Couleur" error={errors.color?.message} {...register('color')} />
                        <Input label="Micropuce" error={errors.microchip?.message} {...register('microchip')} className="sm:col-span-2" />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Proprietaire</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Prenom" error={errors.owner?.firstName?.message} {...register('owner.firstName')} />
                        <Input label="Nom" error={errors.owner?.lastName?.message} {...register('owner.lastName')} />
                        <Input label="Email" type="email" error={errors.owner?.email?.message} {...register('owner.email')} />
                        <Input label="Telephone" error={errors.owner?.phone?.message} {...register('owner.phone')} />
                        <Input label="Adresse" error={errors.owner?.address?.message} {...register('owner.address')} className="sm:col-span-2" />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
                    <Button type="submit">{patient ? 'Modifier' : 'Creer le patient'}</Button>
                </div>
            </form>
        </Modal>
    );
}
