import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { SearchInput, Button, Badge, EmptyState } from '../components/ui';
import { Dog, Cat, Bird, Rabbit, AlertTriangle, ChevronRight, Syringe, Plus, LayoutGrid, List, PawPrint } from 'lucide-react';
import { useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { PatientForm } from '../components/forms';
import type { Patient } from '../types';
import type { PatientFormData } from '../schemas';

const speciesIcons = { dog: Dog, cat: Cat, bird: Bird, rabbit: Rabbit, other: Dog };
const speciesColors = {
    dog: 'bg-amber-100 text-amber-700',
    cat: 'bg-purple-100 text-purple-700',
    bird: 'bg-sky-100 text-sky-700',
    rabbit: 'bg-pink-100 text-pink-700',
    other: 'bg-slate-100 text-slate-700',
};

function hasUpcomingVaccination(patient: Patient, days: number): boolean {
    const now = new Date();
    const target = new Date();
    target.setDate(target.getDate() + days);
    return patient.vaccinations.some((v) => {
        const due = new Date(v.nextDueDate);
        return due >= now && due <= target;
    });
}

function PatientCard({ patient }: { patient: Patient }) {
    const Icon = speciesIcons[patient.species];
    const hasHighAlert = patient.alerts.some((a) => a.severity === 'high');
    const vaccineDueSoon = hasUpcomingVaccination(patient, 60);

    return (
        <Link
            to={`/patients/${patient.id}`}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow animate-fade-in"
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${speciesColors[patient.species]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                    {hasHighAlert && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                </div>
                <p className="text-sm text-slate-500">{patient.breed}</p>
                <p className="text-xs text-slate-400 mt-0.5">{patient.owner.firstName} {patient.owner.lastName}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
                {patient.alerts.length > 0 && (
                    <Badge variant={hasHighAlert ? 'danger' : 'warning'}>
                        {patient.alerts.length} alerte{patient.alerts.length > 1 ? 's' : ''}
                    </Badge>
                )}
                {vaccineDueSoon && (
                    <Badge variant="info">
                        <Syringe className="w-3 h-3" /> Rappel
                    </Badge>
                )}
                <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
        </Link>
    );
}

export function Patients() {
    const { patients, addPatient } = useClinicData();
    const { role } = useAuth();
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [speciesFilter, setSpeciesFilter] = useState('all');
    const [criticalOnly, setCriticalOnly] = useState(false);
    const [vaccinationDueOnly, setVaccinationDueOnly] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showNewPatient, setShowNewPatient] = useState(false);
    const [page, setPage] = useState(1);

    const pageSize = viewMode === 'grid' ? 12 : 20;

    const filtered = patients.filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            p.name.toLowerCase().includes(q) ||
            p.owner.lastName.toLowerCase().includes(q) ||
            p.breed.toLowerCase().includes(q) ||
            p.microchip?.toLowerCase().includes(q);
        const matchesSpecies = speciesFilter === 'all' || p.species === speciesFilter;
        const matchesCritical = !criticalOnly || p.alerts.some((a) => a.severity === 'high');
        const matchesVac = !vaccinationDueOnly || hasUpcomingVaccination(p, 60);
        return matchesSearch && matchesSpecies && matchesCritical && matchesVac;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleCreatePatient = (data: PatientFormData) => {
        addPatient({
            name: data.name,
            species: data.species,
            breed: data.breed,
            birthDate: data.birthDate,
            weight: data.weight,
            color: data.color,
            microchip: data.microchip,
            owner: { id: `own-${Date.now()}`, ...data.owner },
        });
        toast.success('Patient cree avec succes');
    };

    return (
        <div>
            <Header title="Patients" subtitle={`${patients.length} patients enregistres`} />

            <div className="p-4 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <SearchInput value={searchQuery} onChange={(v) => { setSearchQuery(v); setPage(1); }} placeholder="Rechercher par nom, race, proprietaire, micropuce..." className="w-full sm:w-80" />
                        <select value={speciesFilter} onChange={(e) => { setSpeciesFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">
                            <option value="all">Toutes especes</option>
                            <option value="dog">Chiens</option>
                            <option value="cat">Chats</option>
                            <option value="bird">Oiseaux</option>
                            <option value="rabbit">Lapins</option>
                            <option value="other">Autres</option>
                        </select>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                            <input type="checkbox" checked={criticalOnly} onChange={(e) => setCriticalOnly(e.target.checked)} className="rounded border-slate-300 text-primary-600" />
                            Alertes critiques
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                            <input type="checkbox" checked={vaccinationDueOnly} onChange={(e) => setVaccinationDueOnly(e.target.checked)} className="rounded border-slate-300 text-primary-600" />
                            Rappels vaccins
                        </label>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:bg-slate-50'}`}>
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:bg-slate-50'}`}>
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                        {(role === 'assistant' || role === 'veterinarian') && (
                            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewPatient(true)}>
                                Nouveau patient
                            </Button>
                        )}
                    </div>
                </div>

                {paginated.length === 0 ? (
                    <EmptyState icon={<PawPrint className="w-8 h-8" />} title="Aucun patient trouve" description="Modifiez vos filtres ou creez un nouveau patient" actionLabel={role !== 'director' ? 'Nouveau patient' : undefined} onAction={() => setShowNewPatient(true)} />
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginated.map((p) => <PatientCard key={p.id} patient={p} />)}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-slate-200 bg-slate-50">
                                <th className="text-left py-3 px-4 font-medium text-slate-600">Patient</th>
                                <th className="text-left py-3 px-4 font-medium text-slate-600">Espece</th>
                                <th className="text-left py-3 px-4 font-medium text-slate-600">Race</th>
                                <th className="text-left py-3 px-4 font-medium text-slate-600">Proprietaire</th>
                                <th className="text-left py-3 px-4 font-medium text-slate-600">Alertes</th>
                            </tr></thead>
                            <tbody>
                                {paginated.map((p) => (
                                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => window.location.href = `/patients/${p.id}`}>
                                        <td className="py-3 px-4 font-medium text-slate-900">{p.name}</td>
                                        <td className="py-3 px-4"><Badge variant="neutral">{p.species}</Badge></td>
                                        <td className="py-3 px-4 text-slate-600">{p.breed}</td>
                                        <td className="py-3 px-4 text-slate-600">{p.owner.firstName} {p.owner.lastName}</td>
                                        <td className="py-3 px-4">
                                            {p.alerts.length > 0 && (
                                                <Badge variant={p.alerts.some((a) => a.severity === 'high') ? 'danger' : 'warning'}>
                                                    {p.alerts.length}
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Precedent</Button>
                        <span className="px-4 py-2 text-sm text-slate-600">{page} / {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
                    </div>
                )}
            </div>

            <PatientForm isOpen={showNewPatient} onClose={() => setShowNewPatient(false)} onSubmit={handleCreatePatient} />
        </div>
    );
}
