import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema, type InvoiceFormData } from '../../schemas';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useClinicData } from '../../context/clinicState';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

interface InvoiceFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: InvoiceFormData) => void;
    defaultPatientId?: string;
}

export function InvoiceForm({ isOpen, onClose, onSubmit, defaultPatientId }: InvoiceFormProps) {
    const { patients, products } = useClinicData();
    const [showProductPicker, setShowProductPicker] = useState(false);

    const patientOptions = patients.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.owner.firstName} ${p.owner.lastName})`,
    }));

    const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            patientId: defaultPatientId || '',
            dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 15); return d.toISOString().split('T')[0]; })(),
            lines: [{ description: '', quantity: 1, unitPrice: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
    const lines = watch('lines');
    const subtotal = lines.reduce((sum, l) => sum + (l.quantity || 0) * (l.unitPrice || 0), 0);
    const tax = Math.round(subtotal * 0.2 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const addProductLine = (product: typeof products[0]) => {
        append({ description: product.name, quantity: 1, unitPrice: product.price });
        setShowProductPicker(false);
    };

    const handleFormSubmit = (data: InvoiceFormData) => {
        onSubmit(data);
        reset();
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
                                icon={<Plus className="w-4 h-4" />}
                                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                            >
                                Ligne
                            </Button>
                        </div>
                    </div>

                    {showProductPicker && (
                        <div className="border border-slate-200 rounded-lg p-3 mb-3 max-h-40 overflow-y-auto">
                            <p className="text-xs text-slate-500 mb-2">Cliquez sur un produit pour l'ajouter</p>
                            <div className="space-y-1">
                                {products.filter((p) => p.stock > 0).map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => addProductLine(product)}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm flex justify-between items-center"
                                    >
                                        <span>{product.name}</span>
                                        <span className="text-slate-500">{product.price.toFixed(2)} EUR</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-3 mb-3">
                            <div className="flex-1">
                                <Input label={index === 0 ? 'Description' : undefined} {...register(`lines.${index}.description`)} />
                            </div>
                            <div className="w-20">
                                <Input label={index === 0 ? 'Qte' : undefined} type="number" min="1" {...register(`lines.${index}.quantity`)} />
                            </div>
                            <div className="w-28">
                                <Input label={index === 0 ? 'Prix unit.' : undefined} type="number" step="0.01" {...register(`lines.${index}.unitPrice`)} />
                            </div>
                            <div className="w-24 text-right">
                                {index === 0 && <p className="text-sm font-medium text-slate-700 mb-1.5">Total</p>}
                                <p className="py-2.5 text-sm font-medium text-slate-700">
                                    {((lines[index]?.quantity || 0) * (lines[index]?.unitPrice || 0)).toFixed(2)} EUR
                                </p>
                            </div>
                            <button type="button" onClick={() => remove(index)} className="pb-2.5 text-rose-400 hover:text-rose-600" disabled={fields.length <= 1}>
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {errors.lines?.message && <p className="text-sm text-rose-600">{errors.lines.message}</p>}
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
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
