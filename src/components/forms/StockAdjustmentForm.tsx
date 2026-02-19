import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockAdjustmentSchema, type StockAdjustmentFormData } from '../../schemas';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';

const reasonOptions = [
    { value: 'reception', label: 'Reception de commande' },
    { value: 'sale', label: 'Vente' },
    { value: 'counter_sale', label: 'Vente comptoir' },
    { value: 'loss', label: 'Perte / Casse' },
];

interface StockAdjustmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StockAdjustmentFormData) => void;
    productName: string;
    currentStock: number;
}

export function StockAdjustmentForm({ isOpen, onClose, onSubmit, productName, currentStock }: StockAdjustmentFormProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<StockAdjustmentFormData>({
        resolver: zodResolver(stockAdjustmentSchema),
    });

    const handleFormSubmit = (data: StockAdjustmentFormData) => {
        onSubmit(data);
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Ajuster le stock - ${productName}`} size="sm">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <p className="text-sm text-slate-600">Stock actuel : <strong>{currentStock}</strong></p>
                <Input
                    label="Quantite (+ ou -)"
                    type="number"
                    error={errors.delta?.message}
                    {...register('delta')}
                    placeholder="Ex: 10 ou -5"
                />
                <Select label="Raison" options={reasonOptions} error={errors.reason?.message} {...register('reason')} />
                <Textarea label="Note (optionnel)" {...register('note')} />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
                    <Button type="submit">Ajuster</Button>
                </div>
            </form>
        </Modal>
    );
}
