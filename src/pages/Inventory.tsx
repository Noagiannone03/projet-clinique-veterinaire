import { useState } from 'react';
import { Header } from '../components/layout';
import { Search, Plus, Package, AlertTriangle, Minus } from 'lucide-react';
import type { Product } from '../types';
import {
    getLowStockProducts,
    getOutOfStockProducts,
    useClinicData,
} from '../context/clinicState';

const categoryLabels = {
    medication: 'Medicament',
    food: 'Alimentation',
    accessory: 'Accessoire',
    hygiene: 'Hygiene',
    supplement: 'Complement',
};

const categoryColors = {
    medication: 'bg-rose-100 text-rose-700',
    food: 'bg-amber-100 text-amber-700',
    accessory: 'bg-sky-100 text-sky-700',
    hygiene: 'bg-emerald-100 text-emerald-700',
    supplement: 'bg-purple-100 text-purple-700',
};

interface ProductRowProps {
    product: Product;
    onAdjustStock: (productId: string, delta: number) => void;
}

function ProductRow({ product, onAdjustStock }: ProductRowProps) {
    const isOutOfStock = product.stock === 0;
    const isLowStock = product.stock <= product.minStock && product.stock > 0;

    return (
        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                    </div>
                </div>
            </td>
            <td className="py-4 px-4">
                <span className={`badge ${categoryColors[product.category]}`}>
                    {categoryLabels[product.category]}
                </span>
            </td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                    <span
                        className={`font-bold ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                            }`}
                    >
                        {product.stock}
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-500">{product.minStock}</span>
                    {isOutOfStock && (
                        <span className="badge-danger ml-2">Rupture</span>
                    )}
                    {isLowStock && (
                        <span className="badge-warning ml-2">Stock bas</span>
                    )}
                </div>
            </td>
            <td className="py-4 px-4">
                <span className="font-medium text-slate-900">{product.price.toFixed(2)} EUR</span>
                <span className="text-slate-400 text-sm ml-1">/ {product.unit}</span>
            </td>
            <td className="py-4 px-4 text-slate-500 text-sm">{product.supplier}</td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                    <button
                        className="btn-outline text-sm py-1.5 px-2"
                        onClick={() => onAdjustStock(product.id, -1)}
                        disabled={product.stock === 0}
                        aria-label="Sortie de stock"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        className="btn-outline text-sm py-1.5 px-2"
                        onClick={() => onAdjustStock(product.id, 1)}
                        aria-label="Entree de stock"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button className="btn-outline text-sm py-1.5" onClick={() => onAdjustStock(product.id, 5)}>
                        Commander
                    </button>
                </div>
            </td>
        </tr>
    );
}

export function Inventory() {
    const { products, adjustProductStock } = useClinicData();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [stockFilter, setStockFilter] = useState<string>('all');

    const lowStockCount = getLowStockProducts(products).length;
    const outOfStockCount = getOutOfStockProducts(products).length;

    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            searchQuery === '' ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

        const matchesStock =
            stockFilter === 'all' ||
            (stockFilter === 'low' && p.stock <= p.minStock && p.stock > 0) ||
            (stockFilter === 'out' && p.stock === 0) ||
            (stockFilter === 'ok' && p.stock > p.minStock);

        return matchesSearch && matchesCategory && matchesStock;
    });

    return (
        <div>
            <Header title="Inventaire" subtitle={`${products.length} produits`} />

            <div className="p-8">
                {(lowStockCount > 0 || outOfStockCount > 0) && (
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200">
                        <div className="flex items-center gap-6">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                            <div className="flex gap-6">
                                {outOfStockCount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="badge-danger">{outOfStockCount}</span>
                                        <span className="text-rose-700 font-medium">produit(s) en rupture</span>
                                    </div>
                                )}
                                {lowStockCount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="badge-warning">{lowStockCount}</span>
                                        <span className="text-amber-700 font-medium">stock(s) bas</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-10 w-80"
                            />
                        </div>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="input w-48"
                        >
                            <option value="all">Toutes categories</option>
                            <option value="medication">Medicaments</option>
                            <option value="food">Alimentation</option>
                            <option value="accessory">Accessoires</option>
                            <option value="hygiene">Hygiene</option>
                            <option value="supplement">Complements</option>
                        </select>

                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="input w-40"
                        >
                            <option value="all">Tous stocks</option>
                            <option value="ok">Stock OK</option>
                            <option value="low">Stock bas</option>
                            <option value="out">Rupture</option>
                        </select>
                    </div>

                    <button className="btn-primary">
                        <Plus className="w-4 h-4" />
                        Ajouter produit
                    </button>
                </div>

                <div className="card overflow-hidden p-0">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Produit</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Categorie</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Stock</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Prix</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Fournisseur</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <ProductRow key={product.id} product={product} onAdjustStock={adjustProductStock} />
                            ))}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500">Aucun produit trouve</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
