// Script to be run in browser console to clear localStorage and reload
const legacyKeys = [
    'patients',
    'appointments',
    'invoices',
    'products',
    'stockMovements',
    'activityLog',
    'prescriptionOrders',
];

legacyKeys.forEach((key) => {
    localStorage.removeItem(key);
});

legacyKeys.forEach((key) => {
    localStorage.removeItem(`vetcare_${key}`);
});

localStorage.removeItem('vetcare_user_name');
localStorage.removeItem('vetcare_role');
localStorage.removeItem('vetcare_version');

window.location.reload();
