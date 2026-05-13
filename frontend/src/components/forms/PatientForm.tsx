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
    onSubmit: (data: PatientFormData) => void | Promise<void>;
    patient?: Patient;
}

export function PatientForm({ isOpen, onClose, onSubmit, patient }: PatientFormProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema) as any,
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
                processingConsent: patient.owner.processingConsent ?? true,
                marketingConsent: patient.owner.marketingConsent ?? false,
                contactOpposition: patient.owner.contactOpposition ?? false,
                gdprNotes: patient.owner.gdprNotes ?? '',
            },
        } : {
            owner: {
                processingConsent: true,
                marketingConsent: false,
                contactOpposition: false,
                gdprNotes: '',
            },
        },
    });

    const handleFormSubmit = async (data: PatientFormData) => {
        await onSubmit(data);
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

                <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">RGPD et preferences client</h3>
                    <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                        <label className="flex items-start gap-3 text-sm text-slate-700">
                            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" {...register('owner.processingConsent')} />
                            <span>Le client a ete informe du traitement de ses donnees pour la gestion du dossier, des rendez-vous, du suivi veterinaire et de la facturation.</span>
                        </label>
                        <label className="flex items-start gap-3 text-sm text-slate-700">
                            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" {...register('owner.marketingConsent')} />
                            <span>Le client accepte de recevoir des rappels ou informations non strictement necessaires au suivi du dossier.</span>
                        </label>
                        <label className="flex items-start gap-3 text-sm text-slate-700">
                            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" {...register('owner.contactOpposition')} />
                            <span>Le client s'oppose aux contacts non indispensables.</span>
                        </label>
                        <Input label="Note RGPD interne" error={errors.owner?.gdprNotes?.message} {...register('owner.gdprNotes')} />
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
