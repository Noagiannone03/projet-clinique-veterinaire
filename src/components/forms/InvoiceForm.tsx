import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema, type InvoiceFormData } from '../../schemas';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useClinicData } from '../../context/clinicState';
import { Trash2, ShoppingCart, Stethoscope, Search, Package } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface InvoiceFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: InvoiceFormData) => void;
    defaultPatientId?: string;
    defaultLines?: InvoiceFormData['lines'];
}

const createDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
};

const normalizeInitialLines = (defaultLines?: InvoiceFormData['lines']): InvoiceFormData['lines'] => {
    if (!defaultLines || defaultLines.length === 0) {
        return [{ lineType: 'service', description: '', quantity: 1, unitPrice: 0 }];
    }
    return defaultLines.map((line) => ({
        lineType: line.lineType ?? (line.productId ? 'product' : 'service'),
        productId: line.productId,
        description: line.description,
        quantity: Math.max(1, Number(line.quantity) || 1),
        unitPrice: Number(line.unitPrice) || 0,
    }));
};

export function InvoiceForm({ isOpen, onClose, onSubmit, defaultPatientId, defaultLines }: InvoiceFormProps) {
    const { patients, products } = useClinicData();
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    const patientOptions = patients.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.owner.firstName} ${p.owner.lastName})`,
    }));

    const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            patientId: defaultPatientId || '',
            dueDate: createDefaultDueDate(),
            lines: normalizeInitialLines(defaultLines),
        },
    });

    useEffect(() => {
        if (!isOpen) return;
        reset({
            patientId: defaultPatientId || '',
            dueDate: createDefaultDueDate(),
            lines: normalizeInitialLines(defaultLines),
        });
        setShowProductPicker(false);
        setProductSearch('');
    }, [defaultLines, defaultPatientId, isOpen, reset]);

    const { fields, append, remove, update } = useFieldArray({ control, name: 'lines' });
    const lines = watch('lines') ?? [];
    const subtotal = lines.reduce((sum, l) => sum + (l.quantity || 0) * (l.unitPrice || 0), 0);
    const serviceSubtotal = lines.reduce((sum, l) => (
        (l.lineType ?? 'service') === 'service'
            ? sum + (l.quantity || 0) * (l.unitPrice || 0)
            : sum
    ), 0);
    const productSubtotal = lines.reduce((sum, l) => (
        (l.lineType ?? 'service') === 'product'
            ? sum + (l.quantity || 0) * (l.unitPrice || 0)
            : sum
    ), 0);
    const tax = Math.round(subtotal * 0.2 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const addProductLine = (product: typeof products[0]) => {
        const existingIndex = lines.findIndex((line) => line.productId === product.id);
        if (existingIndex >= 0) {
            const currentQty = Number(lines[existingIndex]?.quantity) || 1;
            update(existingIndex, {
                ...lines[existingIndex],
                quantity: currentQty + 1,
            });
            setShowProductPicker(false);
            setProductSearch('');
            return;
        }
        append({
            lineType: 'product',
            productId: product.id,
            description: product.name,
            quantity: 1,
            unitPrice: product.price,
        });
        setShowProductPicker(false);
        setProductSearch('');
    };

    const serviceRows = useMemo(
        () => fields
            .map((field, index) => ({ field, index, lineType: lines[index]?.lineType ?? 'service' }))
            .filter((line) => line.lineType !== 'product'),
        [fields, lines]
    );

    const productRows = useMemo(
        () => fields
            .map((field, index) => ({ field, index, lineType: lines[index]?.lineType ?? 'service' }))
            .filter((line) => line.lineType === 'product'),
        [fields, lines]
    );

    const filteredProducts = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        return products
            .filter((product) => product.stock > 0)
            .filter((product) => (
                !q ||
                product.name.toLowerCase().includes(q) ||
                product.sku.toLowerCase().includes(q)
            ));
    }, [productSearch, products]);

    const handleFormSubmit = (data: InvoiceFormData) => {
        onSubmit(data);
        reset({
            patientId: defaultPatientId || '',
            dueDate: createDefaultDueDate(),
            lines: normalizeInitialLines(defaultLines),
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle facture" size="xl">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Patient" options={patientOptions} placeholder="Selectionnez un patient" error={errors.patientId?.message} {...register('patientId')} />
                    <Input label="Echeance" type="date" error={errors.dueDate?.message} {...register('dueDate')} />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-700">Lignes de facture</h3>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                icon={<ShoppingCart className="w-4 h-4" />}
                                onClick={() => setShowProductPicker(!showProductPicker)}
                            >
                                Produit
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                icon={<Stethoscope className="w-4 h-4" />}
                                onClick={() => append({ lineType: 'service', description: '', quantity: 1, unitPrice: 0 })}
                            >
                                Prestation
                            </Button>
                        </div>
                    </div>

                    {showProductPicker && (
                        <div className="border border-slate-200 rounded-lg p-3 mb-3 max-h-40 overflow-y-auto">
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 mb-2">
                                <Search className="w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder="Chercher un produit..."
                                    className="w-full border-0 p-0 text-sm focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => addProductLine(product)}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm flex justify-between items-center"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p>{product.name}</p>
                                                <p className="text-xs text-slate-400">{product.sku} · {product.stock} {product.unit}</p>
                                            </div>
                                        </div>
                                        <span className="text-slate-500">{product.price.toFixed(2)} EUR</span>
                                    </button>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <p className="text-xs text-slate-400 py-2 text-center">Aucun produit trouve</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mb-4 rounded-xl border border-slate-200 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                            Prestations
                        </p>
                        {serviceRows.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">Aucune prestation ajoutee</p>
                        ) : (
                            serviceRows.map(({ field, index }) => (
                                <div key={field.id} className="flex items-end gap-3 mb-3">
                                    <input type="hidden" {...register(`lines.${index}.lineType`)} />
                                    <input type="hidden" {...register(`lines.${index}.productId`)} />
                                    <div className="flex-1">
                                        <Input
                                            label={index === serviceRows[0].index ? 'Description' : undefined}
                                            {...register(`lines.${index}.description`)}
                                        />
                                    </div>
                                    <div className="w-20">
                                        <Input
                                            label={index === serviceRows[0].index ? 'Qte' : undefined}
                                            type="number"
                                            min="1"
                                            {...register(`lines.${index}.quantity`)}
                                        />
                                    </div>
                                    <div className="w-28">
                                        <Input
                                            label={index === serviceRows[0].index ? 'Prix unit.' : undefined}
                                            type="number"
                                            step="0.01"
                                            {...register(`lines.${index}.unitPrice`)}
                                        />
                                    </div>
                                    <div className="w-24 text-right">
                                        {index === serviceRows[0].index && <p className="text-sm font-medium text-slate-700 mb-1.5">Total</p>}
                                        <p className="py-2.5 text-sm font-medium text-slate-700">
                                            {((lines[index]?.quantity || 0) * (lines[index]?.unitPrice || 0)).toFixed(2)} EUR
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="pb-2.5 text-rose-400 hover:text-rose-600"
                                        disabled={fields.length <= 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mb-4 rounded-xl border border-slate-200 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                            Produits
                        </p>
                        {productRows.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">Aucun produit ajoute</p>
                        ) : (
                            productRows.map(({ field, index }) => {
                                const product = products.find((p) => p.id === lines[index]?.productId);
                                return (
                                    <div key={field.id} className="flex items-end gap-3 mb-3">
                                        <input type="hidden" {...register(`lines.${index}.lineType`)} />
                                        <input type="hidden" {...register(`lines.${index}.productId`)} />
                                        <div className="flex-1">
                                            <Input
                                                label={index === productRows[0].index ? 'Produit' : undefined}
                                                {...register(`lines.${index}.description`)}
                                                readOnly
                                                className="bg-slate-50"
                                            />
                                            {product && (
                                                <p className="mt-1 text-xs text-slate-400">
                                                    SKU: {product.sku} · Stock: {product.stock} {product.unit}
                                                </p>
                                            )}
                                        </div>
                                        <div className="w-20">
                                            <Input
                                                label={index === productRows[0].index ? 'Qte' : undefined}
                                                type="number"
                                                min="1"
                                                {...register(`lines.${index}.quantity`)}
                                            />
                                        </div>
                                        <div className="w-28">
                                            <Input
                                                label={index === productRows[0].index ? 'Prix unit.' : undefined}
                                                type="number"
                                                step="0.01"
                                                {...register(`lines.${index}.unitPrice`)}
                                            />
                                        </div>
                                        <div className="w-24 text-right">
                                            {index === productRows[0].index && <p className="text-sm font-medium text-slate-700 mb-1.5">Total</p>}
                                            <p className="py-2.5 text-sm font-medium text-slate-700">
                                                {((lines[index]?.quantity || 0) * (lines[index]?.unitPrice || 0)).toFixed(2)} EUR
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="pb-2.5 text-rose-400 hover:text-rose-600"
                                            disabled={fields.length <= 1}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {errors.lines?.message && <p className="text-sm text-rose-600">{errors.lines.message}</p>}
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Prestations HT</span>
                        <span>{serviceSubtotal.toFixed(2)} EUR</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Produits HT</span>
                        <span>{productSubtotal.toFixed(2)} EUR</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Sous-total HT</span>
                        <span>{subtotal.toFixed(2)} EUR</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>TVA (20%)</span>
                        <span>{tax.toFixed(2)} EUR</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-2">
                        <span>Total TTC</span>
                        <span>{total.toFixed(2)} EUR</span>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
                    <Button type="submit">Creer la facture</Button>
                </div>
            </form>
        </Modal>
    );
}
