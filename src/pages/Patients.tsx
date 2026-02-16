import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { Search, Filter, Plus, Dog, Cat, Bird, Rabbit, AlertTriangle, ChevronRight, Syringe } from 'lucide-react';
import { patients } from '../data/patients';
import type { Patient } from '../types';

const speciesIcons = {
    dog: Dog,
    cat: Cat,
    bird: Bird,
    rabbit: Rabbit,
    other: Dog,
};

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

    return patient.vaccinations.some((vaccination) => {
        const due = new Date(vaccination.nextDueDate);
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
            className="card card-hover flex items-center gap-4 animate-fade-in"
        >
            <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${speciesColors[patient.species]
                    }`}
            >
                <Icon className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                    {hasHighAlert && (
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                    )}
                </div>
                <p className="text-sm text-slate-500">{patient.breed}</p>
                <p className="text-xs text-slate-400 mt-1">
                    {patient.owner.firstName} {patient.owner.lastName}
                </p>
            </div>

            <div className="flex flex-col items-end gap-1">
                {patient.alerts.length > 0 && (
                    <span className={patient.alerts.some((a) => a.severity === 'high') ? 'badge-danger' : 'badge-warning'}>
                        {patient.alerts.length} alerte{patient.alerts.length > 1 ? 's' : ''}
                    </span>
                )}
                {vaccineDueSoon && (
                    <span className="badge-info inline-flex items-center gap-1">
                        <Syringe className="w-3 h-3" />
                        Rappel proche
                    </span>
                )}
                <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
        </Link>
    );
}

export function Patients() {
    const [searchQuery, setSearchQuery] = useState('');
    const [speciesFilter, setSpeciesFilter] = useState<string>('all');
    const [criticalOnly, setCriticalOnly] = useState(false);
    const [vaccinationDueOnly, setVaccinationDueOnly] = useState(false);

    const filteredPatients = patients.filter((p) => {
        const matchesSearch =
            searchQuery === '' ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.owner.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.breed.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSpecies = speciesFilter === 'all' || p.species === speciesFilter;
        const matchesCritical = !criticalOnly || p.alerts.some((alert) => alert.severity === 'high');
        const matchesVaccination = !vaccinationDueOnly || hasUpcomingVaccination(p, 60);

        return matchesSearch && matchesSpecies && matchesCritical && matchesVaccination;
    });

    return (
        <div>
            <Header title="Patients" subtitle={`${patients.length} patients enregistres`} />

            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un patient..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-10 w-80"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={speciesFilter}
                                onChange={(e) => setSpeciesFilter(e.target.value)}
                                className="input w-40"
                            >
                                <option value="all">Toutes especes</option>
                                <option value="dog">Chiens</option>
                                <option value="cat">Chats</option>
                                <option value="bird">Oiseaux</option>
                                <option value="rabbit">Lapins</option>
                                <option value="other">Autres</option>
                            </select>
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={criticalOnly}
                                onChange={(e) => setCriticalOnly(e.target.checked)}
                            />
                            Alertes critiques
                        </label>

                        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={vaccinationDueOnly}
                                onChange={(e) => setVaccinationDueOnly(e.target.checked)}
                            />
                            Rappels vaccins (60j)
                        </label>
                    </div>

                    <button className="btn-primary">
                        <Plus className="w-4 h-4" />
                        Nouveau patient
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map((patient) => (
                        <PatientCard key={patient.id} patient={patient} />
                    ))}
                </div>

                {filteredPatients.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-500">Aucun patient trouve</p>
                    </div>
                )}
            </div>
        </div>
    );
}
