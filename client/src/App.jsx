import { useEffect, useMemo, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

const emptyForm = {
  clientName: "",
  serviceType: "",
  date: "",
  timeSlot: ""
};

function todayIso() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monthIso(date) {
  return date.slice(0, 7);
}

function buildCalendarDays(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const days = [];

  for (let i = 0; i < startWeekday; i += 1) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  return days;
}

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [form, setForm] = useState({ ...emptyForm, date: todayIso() });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serviceTypes, setServiceTypes] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [month, setMonth] = useState(monthIso(todayIso()));
  const [monthAppointments, setMonthAppointments] = useState([]);
  const [view, setView] = useState("schedule");

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);
  const today = todayIso();

  async function loadOptions() {
    try {
      const res = await fetch(`${API_BASE}/api/appointments/meta/options`);
      if (!res.ok) return;
      const data = await res.json();
      setServiceTypes(data.serviceTypes || []);
      setTimeSlots(data.timeSlots || []);
    } catch {
      setServiceTypes([]);
      setTimeSlots([]);
    }
  }

  async function loadAppointments(date) {
    setLoading(true);
    setError("");
    try {
      const query = date ? `?date=${date}` : "";
      const res = await fetch(`${API_BASE}/api/appointments${query}`);
      if (!res.ok) throw new Error("Falha ao carregar agendamentos");
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      setError(err.message || "Falha ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  }

  async function loadMonthAppointments(monthValue) {
    try {
      const res = await fetch(`${API_BASE}/api/appointments?month=${monthValue}`);
      if (!res.ok) throw new Error("Falha ao carregar calendário");
      const data = await res.json();
      setMonthAppointments(data);
    } catch {
      setMonthAppointments([]);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAppointments(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (month) {
      loadMonthAppointments(month);
    }
  }, [month]);

  function updateField(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "date") {
        setSelectedDate(value);
      }
      return next;
    });
  }

  function startEdit(appointment) {
    setEditingId(appointment._id);
    setForm({
      clientName: appointment.clientName || "",
      serviceType: appointment.serviceType || "",
      date: appointment.date || todayIso(),
      timeSlot: appointment.timeSlot || ""
    });
    setSelectedDate(appointment.date || todayIso());
  }

  function resetForm() {
    setEditingId(null);
    const today = todayIso();
    setForm({ ...emptyForm, date: today });
    setSelectedDate(today);
  }

  async function submitForm(e) {
    e.preventDefault();
    setError("");

    const payload = {
      clientName: form.clientName.trim(),
      serviceType: form.serviceType,
      date: selectedDate,
      timeSlot: form.timeSlot
    };

    if (!payload.clientName || !payload.serviceType || !payload.date || !payload.timeSlot) {
      setError("Preencha todos os campos");
      return;
    }

    if (payload.date < today) {
      setError("Não é permitido agendar em dias anteriores");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/appointments${isEditing ? `/${editingId}` : ""}`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (res.status === 409) throw new Error("Horário indisponível");
      if (!res.ok) throw new Error("Falha ao salvar agendamento");
      await res.json();
      resetForm();
      await loadAppointments(payload.date);
      await loadMonthAppointments(monthIso(payload.date));
    } catch (err) {
      setError(err.message || "Falha ao salvar agendamento");
    }
  }

  async function deleteAppointment(id) {
    if (!confirm("Remover este agendamento?")) return;
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/appointments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover agendamento");
      await loadAppointments(selectedDate);
      await loadMonthAppointments(month);
    } catch (err) {
      setError(err.message || "Falha ao remover agendamento");
    }
  }

  const bookedSlots = useMemo(() => {
    return new Set(appointments.map((appointment) => appointment.timeSlot));
  }, [appointments]);

  const calendarDays = useMemo(() => buildCalendarDays(month), [month]);
  const monthMap = useMemo(() => {
    return monthAppointments.reduce((acc, appointment) => {
      const key = appointment.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(appointment);
      return acc;
    }, {});
  }, [monthAppointments]);

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Barbearia • Agendamentos</p>
          <h1>Agenda de Cortes</h1>
          <p className="subhead">
            Selecione o serviço, escolha o horário disponível e confirme o cliente.
          </p>
        </div>
        <div className="status">
          {view === "schedule" ? (
            <button className="secondary" type="button" onClick={() => setView("dashboard")}>
              Dashboard
            </button>
          ) : (
            <button className="secondary" type="button" onClick={() => setView("schedule")}>
              Voltar
            </button>
          )}
          <span className={`pill ${loading ? "busy" : "ready"}`}>
            {loading ? "Carregando" : "Disponível"}
          </span>
          <span className="pill outline">{appointments.length} agendados</span>
        </div>
      </header>

      <main className="content">
        {view === "schedule" ? (
          <>
            <section className="panel">
              <h2>{isEditing ? "Editar Agendamento" : "Novo Agendamento"}</h2>
              <form className="form" onSubmit={submitForm}>
                <label>
                  Nome do cliente
                  <input
                    name="clientName"
                    value={form.clientName}
                    onChange={updateField}
                    placeholder="Digite o nome"
                    required
                  />
                </label>
                <label>
                  Data
                  <input
                    name="date"
                    type="date"
                    min={today}
                    value={form.date}
                    onChange={updateField}
                  />
                </label>
                <div className="button-group">
                  <span className="label">Serviço</span>
                  <div className="button-row">
                    {serviceTypes.map((service) => (
                      <button
                        key={service}
                        type="button"
                        className={`chip ${form.serviceType === service ? "selected" : ""}`}
                        onClick={() => setForm((prev) => ({ ...prev, serviceType: service }))}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="button-group">
                  <span className="label">Horários disponíveis (30 min)</span>
                  <div className="slot-grid">
                    {timeSlots.map((slot) => {
                      const isBooked = bookedSlots.has(slot) && form.timeSlot !== slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          className={`slot ${form.timeSlot === slot ? "selected" : ""}`}
                          onClick={() => setForm((prev) => ({ ...prev, timeSlot: slot }))}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="actions">
                  <button className="primary" type="submit">
                    {isEditing ? "Atualizar" : "Agendar"}
                  </button>
                  {isEditing && (
                    <button className="secondary" type="button" onClick={resetForm}>
                      Cancelar
                    </button>
                  )}
                </div>
                {error && <p className="error">{error}</p>}
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Agendamentos do dia</h2>
              </div>
              <div className="list">
                {appointments.map((appointment) => (
                  <article key={appointment._id} className="card">
                    <div>
                      <h3>{appointment.clientName}</h3>
                      <p>{appointment.serviceType}</p>
                      <span className="meta">
                        {appointment.date} • {appointment.timeSlot}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button className="secondary" onClick={() => startEdit(appointment)}>
                        Editar
                      </button>
                      <button className="danger" onClick={() => deleteAppointment(appointment._id)}>
                        Remover
                      </button>
                    </div>
                  </article>
                ))}
                {!appointments.length && !loading && (
                  <p className="muted">Nenhum agendamento para este dia.</p>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="panel calendar">
              <div className="panel-header">
                <h2>Dashboard de Agenda</h2>
                <input
                  className="month-input"
                  type="month"
                  value={month}
                  min={monthIso(today)}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
              <div className="calendar-grid">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((weekday) => (
                  <span key={weekday} className="calendar-header">
                    {weekday}
                  </span>
                ))}
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="calendar-cell empty" />;
                  }
                  const items = monthMap[date] || [];
                  return (
                    <button
                      key={date}
                      type="button"
                      className={`calendar-cell ${date === selectedDate ? "active" : ""}`}
                      onClick={() => {
                        setSelectedDate(date);
                        setForm((prev) => ({ ...prev, date }));
                      }}
                    >
                      <span className="calendar-day">{Number(date.slice(-2))}</span>
                      <span className="calendar-count">
                        {items.length ? `${items.length} agend.` : "Livre"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Agendamentos do dia selecionado</h2>
              </div>
              <div className="list">
                {appointments.map((appointment) => (
                  <article key={appointment._id} className="card">
                    <div>
                      <h3>{appointment.clientName}</h3>
                      <p>{appointment.serviceType}</p>
                      <span className="meta">
                        {appointment.date} • {appointment.timeSlot}
                      </span>
                    </div>
                  </article>
                ))}
                {!appointments.length && !loading && (
                  <p className="muted">Nenhum agendamento para este dia.</p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
