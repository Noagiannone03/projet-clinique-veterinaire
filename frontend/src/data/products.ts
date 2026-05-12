import type { Product } from '../types';

export const products: Product[] = [
    {
        id: 'prod-1',
        name: 'Frontline Combo Chien L',
        category: 'medication',
        sku: 'MED-FL-001',
        stock: 25,
        minStock: 10,
        price: 32.50,
        unit: 'pipette',
        supplier: 'Boehringer Ingelheim',
    },
    {
        id: 'prod-2',
        name: 'Vermifuge Milbemax Chien',
        category: 'medication',
        sku: 'MED-VM-001',
        stock: 3,
        minStock: 15,
        price: 18.90,
        unit: 'boite 2 comprimes',
        supplier: 'Elanco',
    },
    {
        id: 'prod-3',
        name: 'Royal Canin Veterinary Renal',
        category: 'food',
        sku: 'FOOD-RC-001',
        stock: 8,
        minStock: 5,
        price: 89.00,
        unit: 'sac 7kg',
        supplier: 'Royal Canin',
    },
    {
        id: 'prod-4',
        name: 'Collier Seresto Chat',
        category: 'accessory',
        sku: 'ACC-SR-001',
        stock: 12,
        minStock: 8,
        price: 35.00,
        unit: 'unite',
        supplier: 'Bayer',
    },
    {
        id: 'prod-5',
        name: 'Shampoing Dermatologique',
        category: 'hygiene',
        sku: 'HYG-SH-001',
        stock: 0,
        minStock: 5,
        price: 22.50,
        unit: 'flacon 250ml',
        supplier: 'Virbac',
    },
    {
        id: 'prod-6',
        name: 'Complement Articulaire Flexadin',
        category: 'supplement',
        sku: 'SUP-FL-001',
        stock: 18,
        minStock: 10,
        price: 45.00,
        unit: 'boite 90 bouchees',
        supplier: 'Vetoquinol',
    },
    {
        id: 'prod-7',
        name: 'Antiparasitaire Advocate Chat',
        category: 'medication',
        sku: 'MED-AD-001',
        stock: 2,
        minStock: 10,
        price: 28.00,
        unit: 'pipette',
        supplier: 'Bayer',
    },
    {
        id: 'prod-8',
        name: 'Hills Prescription Diet i/d',
        category: 'food',
        sku: 'FOOD-HL-001',
        stock: 6,
        minStock: 4,
        price: 75.00,
        unit: 'sac 5kg',
        supplier: 'Hills',
    },
];

export const getLowStockProducts = (): Product[] => {
    return products.filter((p) => p.stock <= p.minStock);
};

export const getOutOfStockProducts = (): Product[] => {
    return products.filter((p) => p.stock === 0);
};
