// Script to be run in browser console to clear localStorage and reload
localStorage.removeItem('patients');
localStorage.removeItem('appointments');
localStorage.removeItem('invoices');
localStorage.removeItem('products');
localStorage.removeItem('stockMovements');
localStorage.removeItem('activityLog');
window.location.reload();
