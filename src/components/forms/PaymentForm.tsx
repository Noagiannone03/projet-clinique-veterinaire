import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentSchema, type PaymentFormData } from '../../schemas';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useEffect } from 'react';

const methodOptions = [
    { value: 'card', label: 'Carte bancaire' },
    { value: 'cash', label: 'Especes' },
    { value: 'check', label: 'Cheque' },
    { value: 'transfer', label: 'Virement' },
];

interface PaymentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PaymentFormData) => void;
    invoiceNumber: string;
    remainingAmount: number;
}

export function PaymentForm({ isOpen, onClose, onSubmit, invoiceNumber, remainingAmount }: PaymentFormProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: remainingAmount,
            method: 'card',
            date: new Date().toISOString().split('T')[0],
        },
    });

    useEffect(() => {
        if (!isOpen) return;
        reset({
            amount: remainingAmount,
            method: 'card',
            date: new Date().toISOString().split('T')[0],
        });
    }, [isOpen, remainingAmount, reset, invoiceNumber]);

    const handleFormSubmit = (data: PaymentFormData) => {
        onSubmit(data);
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Encaissement - ${invoiceNumber}`} size="sm">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <p className="text-sm text-slate-600">
                    Montant restant : <strong className="text-slate-900">{remainingAmount.toFixed(2)} EUR</strong>
                </p>
                <Input label="Montant" type="number" step="0.01" min="0.01" max={remainingAmount} error={errors.amount?.message} {...register('amount')} />
                <Select label="Methode de paiement" options={methodOptions} error={errors.method?.message} {...register('method')} />
                <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
                    <Button type="submit">Encaisser</Button>
                </div>
            </form>
        </Modal>
    );
}
