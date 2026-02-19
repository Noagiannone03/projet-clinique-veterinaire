import { useMemo, useState } from 'react';
import { Header } from '../components/layout';
import { Button, Badge } from '../components/ui';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { AppointmentForm } from '../components/forms';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { Plus, Search, Stethoscope, CalendarClock, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Appointment } from '../types';
import { useClinicData } from '../context/clinicState';
import { useAuth } from '../context/AuthContext';
import type { AppointmentFormData } from '../schemas';

const statusLabel: Record<Appointment['status'], string> = {
    scheduled: 'Planifie', arrived: 'Arrive', 'in-progress': 'En cours', completed: 'Termine', cancelled: 'Annule',
};
const typeLabel: Record<Appointment['type'], string> = {
    consultation: 'Consultation', vaccination: 'Vaccination', surgery: 'Chirurgie', 'follow-up': 'Suivi', emergency: 'Urgence',
};

export function Appointments() {
    const { patients, appointments, addAppointment, updateAppointmentStatus, updateAppointmentSchedule, updateAppointment, cancelAppointment } = useClinicData();
    const { role } = useAuth();
    const toast = useToast();

    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [vetFilter, setVetFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewAppointment, setShowNewAppointment] = useState(false);
    const [showEditAppointment, setShowEditAppointment] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [pendingMove, setPendingMove] = useState<{ id: string; date: string; time: string; duration: number; revert: () => void; description: string } | null>(null);

    const filteredAppointments = useMemo(() => {
        return appointments.filter((a) => {
            const matchesVet = vetFilter === 'all' || a.veterinarian === vetFilter;
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || a.patientName.toLowerCase().includes(q) || a.ownerName.toLowerCase().includes(q);
            // For vets, filter to their own appointments by default
            const matchesRole = role !== 'veterinarian' || vetFilter !== 'all' || a.veterinarian === 'Dr. Martin';
            return matchesVet && matchesSearch && matchesRole;
        });
    }, [appointments, searchQuery, vetFilter, role]);

    const calendarEvents = filteredAppointments.map((a) => {
        const start = `${a.date}T${a.time}`;
        const [h, m] = a.time.split(':').map(Number);
        const end = new Date(`${a.date}T00:00:00`);
        end.setHours(h, m + a.duration, 0, 0);
        return {
            id: a.id, title: `${a.time} - ${a.patientName}`, start, end: end.toISOString(),
            classNames: [`fc-status-${a.status}`, `fc-type-${a.type}`],
            extendedProps: { type: a.type, veterinarian: a.veterinarian, status: a.status },
        };
    });

    const selectedAppointment = appointments.find((a) => a.id === selectedAppointmentId) ?? null;
    const dayAppointments = appointments.filter((a) => a.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

    const stats = {
        total: appointments.length,
        today: dayAppointments.length,
        inProgress: appointments.filter((a) => a.status === 'in-progress').length,
        emergency: appointments.filter((a) => a.type === 'emergency').length,
    };

    const applyMove = (id: string, startDate: Date, endDate: Date | null, revert: () => void) => {
        const date = format(startDate, 'yyyy-MM-dd');
        const time = format(startDate, 'HH:mm');
        const duration = endDate ? Math.max(Math.round((endDate.getTime() - startDate.getTime()) / 60000), 15) : 30;
        const apt = appointments.find((a) => a.id === id);
        if (!apt) { revert(); return; }

        setPendingMove({
            id, date, time, duration, revert,
            description: `Deplacer le RDV de ${apt.patientName} au ${format(startDate, 'dd/MM/yyyy')} a ${time} ?`,
        });
    };

    const confirmMove = () => {
        if (!pendingMove) return;
        const result = updateAppointmentSchedule(pendingMove.id, { date: pendingMove.date, time: pendingMove.time, duration: pendingMove.duration });
        if (!result.ok) {
            toast.error(result.message);
            pendingMove.revert();
        } else {
            toast.success('RDV deplace');
            setSelectedDate(pendingMove.date);
        }
        setPendingMove(null);
    };

    const cancelMove = () => {
        pendingMove?.revert();
        setPendingMove(null);
    };

    const handleNewAppointment = (data: AppointmentFormData) => {
        const patient = patients.find((p) => p.id === data.patientId);
        if (!patient) return;
        const result = addAppointment({
            patientId: data.patientId, patientName: patient.name,
            ownerName: `${patient.owner.firstName} ${patient.owner.lastName}`,
            species: patient.species, date: data.date, time: data.time,
            duration: Number(data.duration), type: data.type,
            veterinarian: data.veterinarian, notes: data.notes,
        });
        if (result.ok) toast.success('RDV cree');
        else toast.error(result.message);
    };

    const handleEditAppointment = (data: AppointmentFormData) => {
        if (!selectedAppointment) return;
        const patient = patients.find((p) => p.id === data.patientId);
        if (!patient) return;
        updateAppointment(selectedAppointment.id, {
            patientId: data.patientId, patientName: patient.name,
            ownerName: `${patient.owner.firstName} ${patient.owner.lastName}`,
            species: patient.species, date: data.date, time: data.time,
            duration: Number(data.duration), type: data.type,
            veterinarian: data.veterinarian, notes: data.notes,
        });
        toast.success('RDV modifie');
    };

    const handleCancel = () => {
        if (!selectedAppointment || !cancelReason) return;
        cancelAppointment(selectedAppointment.id, cancelReason);
        toast.success('RDV annule');
        setShowCancelDialog(false);
        setCancelReason('');
    };

    return (
        <div>
            <Header title="Rendez-vous" subtitle="Planning et gestion des rendez-vous" />

            <div className="p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"><p className="text-sm text-slate-500">Total RDV</p><p className="text-2xl font-bold text-slate-900">{stats.total}</p></div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"><p className="text-sm text-slate-500">Ce jour</p><p className="text-2xl font-bold text-primary-700">{stats.today}</p></div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"><p className="text-sm text-slate-500">En cours</p><p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p></div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"><p className="text-sm text-slate-500">Urgences</p><p className="text-2xl font-bold text-rose-600">{stats.emergency}</p></div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-500" />Planifie</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-600" />Arrive</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-600" />En cours</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-600" />Termine</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-600" />Annule</span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarClock className="w-5 h-5 text-primary-700" />
                                <p className="font-semibold text-slate-900">Calendrier</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input className="w-52 pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500" placeholder="Patient / proprietaire" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                </div>
                                <select className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white" value={vetFilter} onChange={(e) => setVetFilter(e.target.value)}>
                                    <option value="all">Tous vets</option>
                                    <option value="Dr. Martin">Dr. Martin</option>
                                    <option value="Dr. Leroy">Dr. Leroy</option>
                                </select>
                                {role !== 'director' && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewAppointment(true)}>Nouveau</Button>}
                            </div>
                        </div>
                        <div className="p-3">
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                                locale={frLocale}
                                initialView="timeGridWeek"
                                height="auto"
                                editable={role !== 'director'} selectable={role !== 'director'} selectMirror={role !== 'director'} eventDurationEditable={role !== 'director'} eventResizableFromStart={role !== 'director'}
                                allDaySlot={false} nowIndicator
                                slotMinTime="08:00:00" slotMaxTime="20:00:00"
                                firstDay={1} weekends={false}
                                headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek' }}
                                buttonText={{ today: "Aujourd'hui", day: 'Jour', week: 'Semaine', month: 'Mois', list: 'Liste' }}
                                events={calendarEvents}
                                select={(arg: DateSelectArg) => { setSelectedDate(format(arg.start, 'yyyy-MM-dd')); }}
                                eventClick={(arg: EventClickArg) => { setSelectedAppointmentId(arg.event.id); setSelectedDate(format(arg.event.start ?? new Date(), 'yyyy-MM-dd')); }}
                                eventDrop={(arg: EventDropArg) => applyMove(arg.event.id, arg.event.start!, arg.event.end, arg.revert)}
                                eventResize={(arg: EventResizeDoneArg) => applyMove(arg.event.id, arg.event.start!, arg.event.end, arg.revert)}
                                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Stethoscope className="w-4 h-4 text-primary-700" />
                                <p className="font-semibold text-slate-900">Detail RDV</p>
                            </div>
                            {selectedAppointment ? (
                                <div className="space-y-3">
                                    <div><p className="text-xs text-slate-500">Patient</p><p className="font-semibold text-slate-900">{selectedAppointment.patientName}</p></div>
                                    <div><p className="text-xs text-slate-500">Proprietaire</p><p className="text-sm text-slate-800">{selectedAppointment.ownerName}</p></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><p className="text-xs text-slate-500">Date</p><p className="text-sm">{selectedAppointment.date}</p></div>
                                        <div><p className="text-xs text-slate-500">Heure</p><p className="text-sm">{selectedAppointment.time}</p></div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant={selectedAppointment.status === 'completed' ? 'success' : selectedAppointment.status === 'cancelled' ? 'danger' : selectedAppointment.status === 'in-progress' ? 'warning' : 'neutral'}>{statusLabel[selectedAppointment.status]}</Badge>
                                        <Badge variant="info">{typeLabel[selectedAppointment.type]}</Badge>
                                    </div>
                                    {selectedAppointment.notes && <p className="text-xs text-slate-500 italic">{selectedAppointment.notes}</p>}

                                    {/* Workflow buttons */}
                                    {role !== 'director' && (
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                            {selectedAppointment.status === 'scheduled' && (
                                                <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(selectedAppointment.id, 'arrived')}>Arrive</Button>
                                            )}
                                            {selectedAppointment.status === 'arrived' && (
                                                <Button size="sm" onClick={() => updateAppointmentStatus(selectedAppointment.id, 'in-progress')}>Demarrer</Button>
                                            )}
                                            {selectedAppointment.status === 'in-progress' && (
                                                <Button size="sm" onClick={() => { updateAppointmentStatus(selectedAppointment.id, 'completed'); toast.success('RDV termine'); }}>Terminer</Button>
                                            )}
                                            {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                                                <>
                                                    <Button size="sm" variant="outline" onClick={() => setShowEditAppointment(true)}>Modifier</Button>
                                                    <Button size="sm" variant="danger" onClick={() => setShowCancelDialog(true)}>Annuler</Button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Cliquez sur un evenement pour voir les details</p>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <p className="font-semibold text-slate-900 mb-2">Liste du {selectedDate}</p>
                            <div className="space-y-2 max-h-56 overflow-auto">
                                {dayAppointments.length === 0 && <p className="text-sm text-slate-500">Aucun RDV</p>}
                                {dayAppointments.map((a) => (
                                    <button key={a.id} className={`w-full text-left p-2 rounded-lg border transition-colors ${selectedAppointmentId === a.id ? 'border-primary-300 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'}`} onClick={() => setSelectedAppointmentId(a.id)}>
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-slate-900 text-sm">{a.time} - {a.patientName}</p>
                                            <Badge variant={a.status === 'completed' ? 'success' : a.status === 'in-progress' ? 'warning' : a.status === 'cancelled' ? 'danger' : 'neutral'}>{statusLabel[a.status]}</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500">{a.veterinarian} - {typeLabel[a.type]}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AppointmentForm isOpen={showNewAppointment} onClose={() => setShowNewAppointment(false)} onSubmit={handleNewAppointment} defaultDate={selectedDate} />
            {selectedAppointment && (
                <AppointmentForm isOpen={showEditAppointment} onClose={() => setShowEditAppointment(false)} onSubmit={handleEditAppointment} appointment={selectedAppointment} />
            )}

            {/* Cancel dialog */}
            {selectedAppointment && showCancelDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelDialog(false)}>
                    <div className="fixed inset-0 bg-black/50" />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md z-10 p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Annuler le rendez-vous</h3>
                            <button onClick={() => setShowCancelDialog(false)} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">Motif d'annulation (obligatoire) :</p>
                        <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-200" rows={3} placeholder="Raison de l'annulation..." />
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Retour</Button>
                            <Button variant="danger" disabled={!cancelReason.trim()} onClick={handleCancel}>Confirmer l'annulation</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Drag confirm */}
            <ConfirmDialog
                isOpen={!!pendingMove}
                onClose={cancelMove}
                onConfirm={confirmMove}
                title="Deplacer le rendez-vous"
                message={pendingMove?.description || ''}
                confirmLabel="Deplacer"
                variant="warning"
            />
        </div>
    );
}
