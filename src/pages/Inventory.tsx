import { useState } from 'react';
import { Header } from '../components/layout';
import { Button, Badge, SearchInput } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { ProductForm, StockAdjustmentForm } from '../components/forms';
import { Plus, AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import type { Product } from '../types';
import { getLowStockProducts, getOutOfStockProducts, useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import type { ProductFormData, StockAdjustmentFormData } from '../schemas';

const categoryLabels: Record<Product['category'], string> = {
    medication: 'Medicament', food: 'Alimentation', accessory: 'Accessoire', hygiene: 'Hygiene', supplement: 'Complement',
};

const categoryColors: Record<Product['category'], string> = {
    medication: 'danger', food: 'warning', accessory: 'info', hygiene: 'success', supplement: 'neutral',
};

export function Inventory() {
    const { products, addProduct, updateProduct, deleteProduct, adjustProductStock } = useClinicData();
    const { role } = useAuth();
    const toast = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [showNewProduct, setShowNewProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

    const lowStockCount = getLowStockProducts(products).length;
    const outOfStockCount = getOutOfStockProducts(products).length;

    const filtered = products.filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
        const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
        const matchesStock = stockFilter === 'all'
            || (stockFilter === 'low' && p.stock <= p.minStock && p.stock > 0)
            || (stockFilter === 'out' && p.stock === 0)
            || (stockFilter === 'ok' && p.stock > p.minStock);
        return matchesSearch && matchesCat && matchesStock;
    });

    const canManage = role === 'assistant';

    const handleAddProduct = (data: ProductFormData) => {
        addProduct(data);
        toast.success('Produit ajoute');
    };

    const handleEditProduct = (data: ProductFormData) => {
        if (!editingProduct) return;
        updateProduct(editingProduct.id, data);
        toast.success('Produit modifie');
        setEditingProduct(null);
    };

    const handleStockAdjust = (data: StockAdjustmentFormData) => {
        if (!adjustingProduct) return;
        adjustProductStock(adjustingProduct.id, data.delta, data.reason, data.note);
        toast.success('Stock ajuste');
        setAdjustingProduct(null);
    };

    const handleCounterSale = (product: Product) => {
        adjustProductStock(product.id, -1, 'counter_sale', 'Vente comptoir');
        toast.success(`Vente de ${product.name} enregistree`);
    };

    return (
        <div>
            <Header title="Inventaire" subtitle={`${products.length} produits`} />

            <div className="p-4 sm:p-8">
                {(lowStockCount > 0 || outOfStockCount > 0) && (
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <div className="flex flex-wrap gap-4">
                                {outOfStockCount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="danger">{outOfStockCount}</Badge>
                                        <span className="text-sm text-rose-700 font-medium">produit(s) en rupture</span>
                                    </div>
                                )}
                                {lowStockCount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="warning">{lowStockCount}</Badge>
                                        <span className="text-sm text-amber-700 font-medium">stock(s) bas</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Rechercher un produit..." className="w-full sm:w-80" />
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm">
                            <option value="all">Toutes categories</option>
                            <option value="medication">Medicaments</option>
                            <option value="food">Alimentation</option>
                            <option value="accessory">Accessoires</option>
                            <option value="hygiene">Hygiene</option>
                            <option value="supplement">Complements</option>
                        </select>
                        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm">
                            <option value="all">Tous stocks</option>
                            <option value="ok">Stock OK</option>
                            <option value="low">Stock bas</option>
                            <option value="out">Rupture</option>
                        </select>
                    </div>
                    {canManage && (
                        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewProduct(true)}>Ajouter produit</Button>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600">Produit</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600">Categorie</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600">Stock</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600">Prix</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600">Fournisseur</th>
                                    {canManage && <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((product) => {
                                    const isOut = product.stock === 0;
                                    const isLow = product.stock <= product.minStock && product.stock > 0;
                                    return (
                                        <tr
                                            key={product.id}
                                            className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${canManage ? 'cursor-pointer' : ''}`}
                                            onClick={canManage ? () => setEditingProduct(product) : undefined}
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Package className="w-5 h-5 text-slate-500" /></div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{product.name}</p>
                                                        <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={categoryColors[product.category] as 'success' | 'warning' | 'danger' | 'info' | 'neutral'}>{categoryLabels[product.category]}</Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>{product.stock}</span>
                                                    <span className="text-slate-400">/</span>
                                                    <span className="text-slate-500">{product.minStock}</span>
                                                    {isOut && <Badge variant="danger">Rupture</Badge>}
                                                    {isLow && <Badge variant="warning">Bas</Badge>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-medium text-slate-900">{product.price.toFixed(2)} EUR</span>
                                                <span className="text-slate-400 text-xs ml-1">/ {product.unit}</span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500">{product.supplier}</td>
                                            {canManage && (
                                                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => setAdjustingProduct(product)}>Ajuster</Button>
                                                        <Button variant="outline" size="sm" icon={<ShoppingCart className="w-3.5 h-3.5" />} onClick={() => handleCounterSale(product)} disabled={product.stock === 0}>Vente</Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500">Aucun produit trouve</p>
                        </div>
                    )}
                </div>
            </div>

            <ProductForm isOpen={showNewProduct} onClose={() => setShowNewProduct(false)} onSubmit={handleAddProduct} />
            {editingProduct && (
                <ProductForm isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} onSubmit={handleEditProduct} product={editingProduct} />
            )}
            {adjustingProduct && (
                <StockAdjustmentForm isOpen={!!adjustingProduct} onClose={() => setAdjustingProduct(null)} onSubmit={handleStockAdjust} productName={adjustingProduct.name} currentStock={adjustingProduct.stock} />
            )}
        </div>
    );
}
