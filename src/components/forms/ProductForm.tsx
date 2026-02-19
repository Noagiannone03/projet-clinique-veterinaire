import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '../../schemas';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { Product } from '../../types';

const categoryOptions = [
    { value: 'medication', label: 'Medicament' },
    { value: 'food', label: 'Alimentation' },
    { value: 'accessory', label: 'Accessoire' },
    { value: 'hygiene', label: 'Hygiene' },
    { value: 'supplement', label: 'Complement' },
];

interface ProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ProductFormData) => void;
    product?: Product;
}

export function ProductForm({ isOpen, onClose, onSubmit, product }: ProductFormProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: product ? {
            name: product.name,
            category: product.category,
            sku: product.sku,
            stock: product.stock,
            minStock: product.minStock,
            price: product.price,
            unit: product.unit,
            supplier: product.supplier,
            expiryDate: product.expiryDate || '',
        } : undefined,
    });

    const handleFormSubmit = (data: ProductFormData) => {
        onSubmit(data);
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Modifier le produit' : 'Nouveau produit'} size="md">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <Input label="Nom du produit" error={errors.name?.message} {...register('name')} />
                <div className="grid grid-cols-2 gap-4">
                    <Select label="Categorie" options={categoryOptions} error={errors.category?.message} {...register('category')} />
                    <Input label="SKU" error={errors.sku?.message} {...register('sku')} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <Input label="Stock" type="number" error={errors.stock?.message} {...register('stock')} />
                    <Input label="Seuil minimum" type="number" error={errors.minStock?.message} {...register('minStock')} />
                    <Input label="Prix (EUR)" type="number" step="0.01" error={errors.price?.message} {...register('price')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Unite" error={errors.unit?.message} {...register('unit')} placeholder="Ex: boite, pipette, sac..." />
                    <Input label="Fournisseur" error={errors.supplier?.message} {...register('supplier')} />
                </div>
                <Input label="Date de peremption" type="date" error={errors.expiryDate?.message} {...register('expiryDate')} />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
                    <Button type="submit">{product ? 'Modifier' : 'Ajouter'}</Button>
                </div>
            </form>
        </Modal>
    );
}
