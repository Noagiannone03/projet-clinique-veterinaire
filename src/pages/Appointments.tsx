import { useMemo, useState } from 'react';
import { Header } from '../components/layout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { AlertCircle, CalendarClock, CheckCircle, Clock3, Plus, Search, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import type { Appointment } from '../types';
import { useClinicData } from '../context/clinicState';

const statusLabel: Record<Appointment['status'], string> = {
  scheduled: 'Planifie',
  arrived: 'Arrive',
  'in-progress': 'En cours',
  completed: 'Termine',
  cancelled: 'Annule',
};

const typeLabel: Record<Appointment['type'], string> = {
  consultation: 'Consultation',
  vaccination: 'Vaccination',
  surgery: 'Chirurgie',
  'follow-up': 'Suivi',
  emergency: 'Urgence',
};

const statusClass: Record<Appointment['status'], string> = {
  scheduled: 'badge-neutral',
  arrived: 'badge-info',
  'in-progress': 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-danger',
};

export function Appointments() {
  const {
    appointments,
    addAppointment,
    updateAppointmentStatus,
    updateAppointmentSchedule,
  } = useClinicData();

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(
    appointments[0]?.id ?? null
  );
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-20');
  const [vetFilter, setVetFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    ownerName: '',
    species: 'dog' as Appointment['species'],
    date: '2026-01-20',
    time: '10:00',
    duration: 30,
    type: 'consultation' as Appointment['type'],
    veterinarian: 'Dr. Martin',
    notes: '',
  });

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesVet = vetFilter === 'all' || appointment.veterinarian === vetFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesVet && matchesSearch;
    });
  }, [appointments, searchQuery, vetFilter]);

  const calendarEvents = filteredAppointments.map((appointment) => {
    const start = `${appointment.date}T${appointment.time}`;
    const [hours, minutes] = appointment.time.split(':').map(Number);
    const endDate = new Date(`${appointment.date}T00:00:00`);
    endDate.setHours(hours, minutes + appointment.duration, 0, 0);

    return {
      id: appointment.id,
      title: `${appointment.time} - ${appointment.patientName}`,
      start,
      end: endDate.toISOString(),
      classNames: [`fc-status-${appointment.status}`, `fc-type-${appointment.type}`],
      extendedProps: {
        ownerName: appointment.ownerName,
        type: appointment.type,
        veterinarian: appointment.veterinarian,
        status: appointment.status,
      },
    };
  });

  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null;

  const dayAppointments = appointments
    .filter((appointment) => appointment.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const stats = {
    total: appointments.length,
    today: dayAppointments.length,
    inProgress: appointments.filter((appointment) => appointment.status === 'in-progress').length,
    emergency: appointments.filter((appointment) => appointment.type === 'emergency').length,
  };

  const applyCalendarMove = (
    appointmentId: string,
    startDate: Date,
    endDate: Date | null,
    revert: () => void
  ) => {
    const date = format(startDate, 'yyyy-MM-dd');
    const time = format(startDate, 'HH:mm');
    const duration = endDate ? Math.max(Math.round((endDate.getTime() - startDate.getTime()) / 60000), 15) : 30;

    const result = updateAppointmentSchedule(appointmentId, { date, time, duration });

    if (!result.ok) {
      setErrorMessage(result.message);
      revert();
      return;
    }

    setErrorMessage('');
    setSelectedDate(date);
    setSelectedAppointmentId(appointmentId);
  };

  const handleEventDrop = (arg: EventDropArg) => {
    applyCalendarMove(arg.event.id, arg.event.start ?? new Date(), arg.event.end, arg.revert);
  };

  const handleEventResize = (arg: EventResizeDoneArg) => {
    applyCalendarMove(arg.event.id, arg.event.start ?? new Date(), arg.event.end, arg.revert);
  };

  const handleDateSelect = (arg: DateSelectArg) => {
    const selected = format(arg.start, 'yyyy-MM-dd');
    const selectedTime = format(arg.start, 'HH:mm');
    const selectedDuration = Math.max(Math.round((arg.end.getTime() - arg.start.getTime()) / 60000), 15);

    setSelectedDate(selected);
    setNewAppointment((current) => ({
      ...current,
      date: selected,
      time: selectedTime,
      duration: selectedDuration,
    }));
  };

  const handleEventClick = (arg: EventClickArg) => {
    setSelectedAppointmentId(arg.event.id);
    setSelectedDate(format(arg.event.start ?? new Date(), 'yyyy-MM-dd'));
  };

  const handleCreateAppointment = () => {
    if (!newAppointment.patientName || !newAppointment.ownerName) {
      setErrorMessage('Le nom du patient et du proprietaire sont obligatoires.');
      return;
    }

    const result = addAppointment(newAppointment);

    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    setErrorMessage('');
    setNewAppointment((current) => ({
      ...current,
      patientName: '',
      ownerName: '',
      notes: '',
    }));
  };

  return (
    <div>
      <Header title="Rendez-vous" subtitle="Planning intelligent et ergonomique" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-slate-500">Total RDV</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">Jour selectionne</p>
            <p className="text-2xl font-bold text-primary-700">{stats.today}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">En cours</p>
            <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">Urgences</p>
            <p className="text-2xl font-bold text-rose-600">{stats.emergency}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="card border-rose-200 bg-rose-50 text-rose-700 py-3 px-4">{errorMessage}</div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 card p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary-700" />
                <p className="font-semibold text-slate-900">Calendrier interactif</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="input pl-9 w-52"
                    placeholder="Patient / proprietaire"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select className="input w-40" value={vetFilter} onChange={(e) => setVetFilter(e.target.value)}>
                  <option value="all">Tous vets</option>
                  <option value="Dr. Martin">Dr. Martin</option>
                  <option value="Dr. Leroy">Dr. Leroy</option>
                </select>
              </div>
            </div>

            <div className="p-3">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                locale={frLocale}
                initialView="timeGridWeek"
                height="auto"
                editable
                selectable
                selectMirror
                eventDurationEditable
                eventResizableFromStart
                allDaySlot={false}
                nowIndicator
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                firstDay={1}
                weekends={false}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek',
                }}
                buttonText={{
                  today: 'Aujourd\'hui',
                  day: 'Jour',
                  week: 'Semaine',
                  month: 'Mois',
                  list: 'Liste',
                }}
                events={calendarEvents}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="w-4 h-4 text-primary-700" />
                <p className="font-semibold text-slate-900">Detail RDV</p>
              </div>

              {selectedAppointment ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Patient</p>
                    <p className="font-semibold text-slate-900">{selectedAppointment.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Proprietaire</p>
                    <p className="text-slate-800">{selectedAppointment.ownerName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-slate-500">Date</p>
                      <p className="text-slate-800">{selectedAppointment.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Heure</p>
                      <p className="text-slate-800">{selectedAppointment.time}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className={statusClass[selectedAppointment.status]}>{statusLabel[selectedAppointment.status]}</span>
                    <span className="badge-info">{typeLabel[selectedAppointment.type]}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedAppointment.status === 'scheduled' && (
                      <button
                        className="btn-outline text-sm py-1.5"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'arrived')}
                      >
                        Marquer arrive
                      </button>
                    )}
                    {selectedAppointment.status === 'arrived' && (
                      <button
                        className="btn-primary text-sm py-1.5"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'in-progress')}
                      >
                        Demarrer
                      </button>
                    )}
                    {selectedAppointment.status === 'in-progress' && (
                      <button
                        className="btn-primary text-sm py-1.5"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'completed')}
                      >
                        Terminer
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Clique un evenement pour afficher son detail.</p>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="w-4 h-4 text-primary-700" />
                <p className="font-semibold text-slate-900">Nouveau RDV rapide</p>
              </div>
              <div className="space-y-2">
                <input
                  className="input"
                  placeholder="Patient"
                  value={newAppointment.patientName}
                  onChange={(e) => setNewAppointment((current) => ({ ...current, patientName: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Proprietaire"
                  value={newAppointment.ownerName}
                  onChange={(e) => setNewAppointment((current) => ({ ...current, ownerName: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="input"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment((current) => ({ ...current, date: e.target.value }))}
                  />
                  <input
                    type="time"
                    className="input"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment((current) => ({ ...current, time: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="input"
                    value={newAppointment.veterinarian}
                    onChange={(e) => setNewAppointment((current) => ({ ...current, veterinarian: e.target.value }))}
                  >
                    <option value="Dr. Martin">Dr. Martin</option>
                    <option value="Dr. Leroy">Dr. Leroy</option>
                  </select>
                  <select
                    className="input"
                    value={newAppointment.type}
                    onChange={(e) =>
                      setNewAppointment((current) => ({ ...current, type: e.target.value as Appointment['type'] }))
                    }
                  >
                    <option value="consultation">Consultation</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="surgery">Chirurgie</option>
                    <option value="follow-up">Suivi</option>
                    <option value="emergency">Urgence</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={15}
                    step={15}
                    className="input"
                    value={newAppointment.duration}
                    onChange={(e) =>
                      setNewAppointment((current) => ({ ...current, duration: Number(e.target.value) }))
                    }
                  />
                  <select
                    className="input"
                    value={newAppointment.species}
                    onChange={(e) =>
                      setNewAppointment((current) => ({ ...current, species: e.target.value as Appointment['species'] }))
                    }
                  >
                    <option value="dog">Chien</option>
                    <option value="cat">Chat</option>
                    <option value="rabbit">Lapin</option>
                    <option value="bird">Oiseau</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <button className="btn-primary w-full mt-2" onClick={handleCreateAppointment}>
                  <Plus className="w-4 h-4" />
                  Ajouter au planning
                </button>
              </div>
            </div>

            <div className="card">
              <p className="font-semibold text-slate-900 mb-2">Liste du {selectedDate}</p>
              <div className="space-y-2 max-h-56 overflow-auto">
                {dayAppointments.length === 0 && <p className="text-sm text-slate-500">Aucun RDV.</p>}
                {dayAppointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 border border-slate-200"
                    onClick={() => setSelectedAppointmentId(appointment.id)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900 text-sm">
                        {appointment.time} - {appointment.patientName}
                      </p>
                      {appointment.status === 'in-progress' ? (
                        <Clock3 className="w-4 h-4 text-amber-600" />
                      ) : appointment.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{appointment.veterinarian} - {typeLabel[appointment.type]}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
