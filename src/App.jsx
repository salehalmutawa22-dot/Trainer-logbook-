import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Dumbbell, Plus, ChevronRight, Check, Lock, X, Trash2, Users, User,
  ArrowLeft, Flame, Pencil, MessageSquare, Bookmark, Apple, Scale, Save,
} from "lucide-react";

const STORAGE_KEY = "pt-app-data";
const PLATE = { red: "#D2402C", blue: "#2D5FA8", yellow: "#E8B924", green: "#4C8C4A" };

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

function emptyData() {
  return {
    trainerPin: null,
    clients: [],
    programs: {},
    logs: {},
    templates: [],
    nutrition: { targets: {}, logs: {} },
    bodyStats: {},
  };
}

function normalize(loaded) {
  const base = emptyData();
  if (!loaded) return base;
  return {
    ...base,
    ...loaded,
    templates: loaded.templates || [],
    nutrition: {
      targets: (loaded.nutrition && loaded.nutrition.targets) || {},
      logs: (loaded.nutrition && loaded.nutrition.logs) || {},
    },
    bodyStats: loaded.bodyStats || {},
  };
}

async function loadData() {
  try {
    const res = await fetch("/api/data");
    if (!res.ok) return emptyData();
    const json = await res.json();
    return normalize(json);
  } catch {
    return emptyData();
  }
}
async function saveData(data) {
  try {
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.error("save failed", e);
  }
}

/* ---------- shared atoms ---------- */

function Fonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
      .f-display { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.01em; }
      .f-body { font-family: 'Inter', sans-serif; }
      .f-mono { font-family: 'IBM Plex Mono', monospace; }
    `}</style>
  );
}

function Card({ children, style }) {
  return (
    <div className="f-body" style={{ background: "#F5F2EA", borderRadius: 4, padding: 20, boxShadow: "0 1px 0 rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.25)", ...style }}>
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", style, disabled, type = "button" }) {
  const variants = {
    primary: { background: "#D2402C", color: "#F5F2EA" },
    secondary: { background: "transparent", color: "#1B1B1D", border: "1.5px solid #1B1B1D" },
    dark: { background: "#1B1B1D", color: "#F5F2EA" },
    ghost: { background: "transparent", color: "#6B6B66" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="f-display" style={{
      fontSize: 15, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase",
      padding: "12px 20px", borderRadius: 3, border: "none", cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      width: "100%", ...variants[variant], ...style,
    }}>
      {children}
    </button>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="f-body" style={{ display: "block", marginBottom: 14 }}>
      {label && <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B66", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>}
      <input {...props} style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", fontSize: 16, borderRadius: 3, border: "1.5px solid #D8D4C6", background: "#fff", fontFamily: "inherit" }} />
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="f-body" style={{ display: "block", marginBottom: 14 }}>
      {label && <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B66", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>}
      <textarea {...props} rows={props.rows || 2} style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", fontSize: 15, borderRadius: 3, border: "1.5px solid #D8D4C6", background: "#fff", fontFamily: "inherit", resize: "vertical" }} />
    </label>
  );
}

function PRStamp() {
  return (
    <span className="f-display" style={{ display: "inline-block", fontSize: 12, fontWeight: 800, color: PLATE.red, border: `2px solid ${PLATE.red}`, borderRadius: 4, padding: "1px 6px", transform: "rotate(-4deg)", letterSpacing: "0.05em" }}>
      PR
    </span>
  );
}

function Screen({ children }) {
  return (
    <div className="f-body" style={{ minHeight: 560, background: "#1B1B1D", backgroundImage: "radial-gradient(ellipse at top, #232224 0%, #1B1B1D 70%)", padding: "28px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>{children}</div>
    </div>
  );
}

function TopBar({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#F5F2EA", padding: 4 }}><ArrowLeft size={22} /></button>}
        <h1 className="f-display" style={{ color: "#F5F2EA", fontSize: 28, fontWeight: 800, margin: 0 }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "#141415", borderRadius: 4, padding: 4 }}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} className="f-display" style={{
          flex: 1, padding: "9px 4px", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em",
          border: "none", borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          background: active === t.key ? "#F5F2EA" : "transparent", color: active === t.key ? "#1B1B1D" : "#8A8983",
        }}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- helpers ---------- */

function exerciseHistory(logs, exerciseId) {
  const rows = [];
  for (const session of logs) {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId);
    if (!entry) continue;
    const best = entry.sets.reduce((m, s) => Math.max(m, Number(s.weight) || 0), 0);
    const volume = entry.sets.reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0);
    rows.push({ date: session.date, best, volume });
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}
function isPR(history, idx) {
  if (idx === 0) return history[idx].best > 0;
  const priorMax = Math.max(...history.slice(0, idx).map((h) => h.best), 0);
  return history[idx].best > priorMax;
}
function calcStreak(dates) {
  const set = new Set(dates);
  let count = 0;
  let cur = new Date();
  if (!set.has(cur.toISOString().slice(0, 10))) cur.setDate(cur.getDate() - 1);
  while (set.has(cur.toISOString().slice(0, 10))) { count++; cur.setDate(cur.getDate() - 1); }
  return count;
}
function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function StreakRow({ logs }) {
  const dates = new Set(logs.map((l) => l.date));
  const streak = calcStreak(logs.map((l) => l.date));
  const days = last7Days();
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Flame size={20} color={streak > 0 ? PLATE.yellow : "#C9C7BE"} />
          <span className="f-display" style={{ fontSize: 20, fontWeight: 800 }}>{streak}</span>
          <span className="f-body" style={{ fontSize: 13, color: "#6B6B66" }}>day streak</span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {days.map((d) => (
            <div key={d} title={d} style={{ width: 16, height: 16, borderRadius: 3, background: dates.has(d) ? PLATE.green : "#E4E0D4" }} />
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ---------- Session edit form (used for today + editing past sessions) ---------- */

function SessionForm({ entries, note, onChange, onNoteChange }) {
  const updateSet = (exerciseId, i, field, value) => {
    onChange(entries.map((e) => e.exerciseId !== exerciseId ? e : { ...e, sets: e.sets.map((s, idx) => idx === i ? { ...s, [field]: value } : s) }));
  };
  return (
    <>
      {entries.map((entry) => (
        <Card key={entry.exerciseId} style={{ marginBottom: 12 }}>
          <span className="f-display" style={{ fontSize: 17, fontWeight: 700, display: "block", marginBottom: 10 }}>{entry.exerciseName}</span>
          {entry.sets.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className="f-mono" style={{ fontSize: 12, color: "#6B6B66", width: 44 }}>Set {i + 1}</span>
              <input type="number" value={s.reps} onChange={(e) => updateSet(entry.exerciseId, i, "reps", e.target.value)} placeholder="reps" style={{ width: 70, padding: "8px 10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, borderRadius: 3, border: "1.5px solid #D8D4C6" }} />
              <span className="f-mono" style={{ color: "#6B6B66" }}>×</span>
              <input type="number" value={s.weight} onChange={(e) => updateSet(entry.exerciseId, i, "weight", e.target.value)} placeholder="wt" style={{ width: 70, padding: "8px 10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, borderRadius: 3, border: "1.5px solid #D8D4C6" }} />
            </div>
          ))}
        </Card>
      ))}
      <Card style={{ marginBottom: 12 }}>
        <TextArea label="Session note (how it felt, injuries, etc.)" value={note} onChange={(e) => onNoteChange(e.target.value)} placeholder="Optional note…" />
      </Card>
    </>
  );
}

function summarizeEntries(entries) {
  return entries.map((e) => `${e.exerciseName} ${e.sets.length}×${e.sets[0]?.reps || "?"}`).join(", ");
}

/* ---------- Training Progress tab (shared by trainer + client) ---------- */

function TrainingProgressTab({ data, onSaveData, clientId, role }) {
  const program = data.programs[clientId] || [];
  const logs = data.logs[clientId] || [];
  const [selectedExercise, setSelectedExercise] = useState(program[0]?.id || null);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editEntries, setEditEntries] = useState([]);
  const [editNote, setEditNote] = useState("");
  const [feedbackDraft, setFeedbackDraft] = useState({});

  const history = selectedExercise ? exerciseHistory(logs, selectedExercise) : [];
  const chartData = history.map((h) => ({ label: fmtDate(h.date), best: h.best }));
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  const startEdit = (log) => {
    setEditingLogId(log.id);
    setEditEntries(JSON.parse(JSON.stringify(log.entries)));
    setEditNote(log.note || "");
  };
  const saveEdit = async (log) => {
    const nextLogs = logs.map((l) => l.id === log.id ? { ...l, entries: editEntries, note: editNote } : l);
    await onSaveData({ ...data, logs: { ...data.logs, [clientId]: nextLogs } });
    setEditingLogId(null);
  };
  const deleteLog = async (log) => {
    const nextLogs = logs.filter((l) => l.id !== log.id);
    await onSaveData({ ...data, logs: { ...data.logs, [clientId]: nextLogs } });
  };
  const saveFeedback = async (log) => {
    const text = feedbackDraft[log.id] ?? log.feedback ?? "";
    const nextLogs = logs.map((l) => l.id === log.id ? { ...l, feedback: text } : l);
    await onSaveData({ ...data, logs: { ...data.logs, [clientId]: nextLogs } });
  };

  return (
    <>
      <StreakRow logs={logs} />

      {program.length === 0 ? (
        <Card style={{ textAlign: "center", color: "#6B6B66", marginBottom: 16 }}><p style={{ margin: 0 }}>No exercises programmed yet.</p></Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
            {program.map((ex) => (
              <button key={ex.id} onClick={() => setSelectedExercise(ex.id)} className="f-body" style={{ whiteSpace: "nowrap", padding: "8px 14px", borderRadius: 20, border: "1.5px solid " + (selectedExercise === ex.id ? PLATE.blue : "#3A3937"), background: selectedExercise === ex.id ? PLATE.blue : "transparent", color: "#F5F2EA", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {ex.name}
              </button>
            ))}
          </div>
          <Card style={{ marginBottom: 16 }}>
            {chartData.length === 0 ? (
              <p className="f-body" style={{ color: "#6B6B66", textAlign: "center" }}>No sessions logged for this exercise yet.</p>
            ) : (
              <>
                <span className="f-display" style={{ fontSize: 14, fontWeight: 700, color: "#6B6B66", textTransform: "uppercase", letterSpacing: "0.05em" }}>Best weight per session</span>
                <div style={{ height: 190, marginTop: 8 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D4" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: "Inter" }} />
                      <YAxis tick={{ fontSize: 11, fontFamily: "Inter" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="best" stroke={PLATE.red} strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {history.map((h, i) => (
                    <span key={h.date} className="f-mono" style={{ fontSize: 12, background: "#EFEBDF", borderRadius: 3, padding: "4px 8px", display: "flex", alignItems: "center", gap: 6 }}>
                      {fmtDate(h.date)}: {h.best} {isPR(history, i) && <PRStamp />}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>
        </>
      )}

      <span className="f-display" style={{ color: "#F5F2EA", fontSize: 16, fontWeight: 700, display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Session history</span>
      {sortedLogs.length === 0 && <Card style={{ textAlign: "center", color: "#6B6B66" }}><p style={{ margin: 0 }}>No sessions logged yet.</p></Card>}
      {sortedLogs.map((log) => (
        <Card key={log.id} style={{ marginBottom: 10 }}>
          {editingLogId === log.id ? (
            <>
              <span className="f-mono" style={{ fontSize: 12, color: "#6B6B66" }}>{fmtDate(log.date)}</span>
              <SessionForm entries={editEntries} note={editNote} onChange={setEditEntries} onNoteChange={setEditNote} />
              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={() => saveEdit(log)}><Save size={15} /> Save</Button>
                <Button variant="secondary" onClick={() => setEditingLogId(null)}>Cancel</Button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span className="f-display" style={{ fontSize: 16, fontWeight: 700 }}>{fmtDate(log.date)}</span>
                  <p className="f-body" style={{ fontSize: 13, color: "#6B6B66", margin: "3px 0 0" }}>{summarizeEntries(log.entries)}</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Pencil size={16} style={{ cursor: "pointer" }} color="#6B6B66" onClick={() => startEdit(log)} />
                  <Trash2 size={16} style={{ cursor: "pointer" }} color={PLATE.red} onClick={() => deleteLog(log)} />
                </div>
              </div>
              {log.note && <p className="f-body" style={{ fontSize: 13, fontStyle: "italic", color: "#4A4944", marginTop: 8, marginBottom: 0 }}>"{log.note}"</p>}
              {log.feedback && (
                <div style={{ marginTop: 10, background: "#EFEBDF", borderRadius: 3, padding: "8px 10px", display: "flex", gap: 8 }}>
                  <MessageSquare size={15} color={PLATE.blue} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span className="f-body" style={{ fontSize: 13 }}>{log.feedback}</span>
                </div>
              )}
              {role === "trainer" && (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    value={feedbackDraft[log.id] ?? log.feedback ?? ""}
                    onChange={(e) => setFeedbackDraft({ ...feedbackDraft, [log.id]: e.target.value })}
                    placeholder="Add coach feedback…"
                    rows={1}
                    style={{ width: "100%", boxSizing: "border-box", fontSize: 13, padding: "8px 10px", borderRadius: 3, border: "1.5px solid #D8D4C6", fontFamily: "inherit" }}
                  />
                  <button onClick={() => saveFeedback(log)} className="f-display" style={{ marginTop: 6, background: "none", border: "none", color: PLATE.blue, fontSize: 12, fontWeight: 700, textTransform: "uppercase", cursor: "pointer", padding: 0 }}>Save feedback</button>
                </div>
              )}
            </>
          )}
        </Card>
      ))}
    </>
  );
}

/* ---------- Nutrition tab (shared by trainer + client) ---------- */

function NutritionTab({ data, onSaveData, clientId, role }) {
  const target = data.nutrition.targets[clientId] || {};
  const nutLogs = data.nutrition.logs[clientId] || [];
  const stats = data.bodyStats[clientId] || [];

  const [t, setT] = useState({ calories: target.calories || "", protein: target.protein || "", carbs: target.carbs || "", fat: target.fat || "" });
  const [n, setN] = useState({ calories: "", protein: "", carbs: "", fat: "", note: "" });
  const [s, setS] = useState({ weight: "", waist: "", chest: "", hips: "", arms: "", thighs: "", note: "", photoUrl: "" });

  const saveTarget = async () => {
    await onSaveData({ ...data, nutrition: { ...data.nutrition, targets: { ...data.nutrition.targets, [clientId]: { calories: Number(t.calories) || 0, protein: Number(t.protein) || 0, carbs: Number(t.carbs) || 0, fat: Number(t.fat) || 0 } } } });
  };
  const addNutritionLog = async () => {
    if (!n.calories) return;
    const entry = { id: uid(), date: todayISO(), calories: Number(n.calories) || 0, protein: Number(n.protein) || 0, carbs: Number(n.carbs) || 0, fat: Number(n.fat) || 0, note: n.note };
    const others = nutLogs.filter((l) => l.date !== todayISO());
    const next = [...others, entry].sort((a, b) => a.date.localeCompare(b.date));
    await onSaveData({ ...data, nutrition: { ...data.nutrition, logs: { ...data.nutrition.logs, [clientId]: next } } });
    setN({ calories: "", protein: "", carbs: "", fat: "", note: "" });
  };
  const addBodyStat = async () => {
    if (!s.weight) return;
    const entry = { id: uid(), date: todayISO(), weight: Number(s.weight) || 0, waist: s.waist, chest: s.chest, hips: s.hips, arms: s.arms, thighs: s.thighs, note: s.note, photoUrl: s.photoUrl };
    const others = stats.filter((x) => x.date !== todayISO());
    const next = [...others, entry].sort((a, b) => a.date.localeCompare(b.date));
    await onSaveData({ ...data, bodyStats: { ...data.bodyStats, [clientId]: next } });
    setS({ weight: "", waist: "", chest: "", hips: "", arms: "", thighs: "", note: "", photoUrl: "" });
  };
  const deleteBodyStat = async (id) => {
    await onSaveData({ ...data, bodyStats: { ...data.bodyStats, [clientId]: stats.filter((x) => x.id !== id) } });
  };
  const deleteNutritionLog = async (id) => {
    await onSaveData({ ...data, nutrition: { ...data.nutrition, logs: { ...data.nutrition.logs, [clientId]: nutLogs.filter((x) => x.id !== id) } } });
  };

  const calChart = nutLogs.map((l) => ({ label: fmtDate(l.date), calories: l.calories }));
  const weightChart = stats.map((x) => ({ label: fmtDate(x.date), weight: x.weight }));

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Apple size={18} color={PLATE.green} />
          <span className="f-display" style={{ fontSize: 16, fontWeight: 700 }}>Daily targets</span>
        </div>
        {role === "trainer" ? (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><Input label="Calories" type="number" value={t.calories} onChange={(e) => setT({ ...t, calories: e.target.value })} /></div>
              <div style={{ flex: 1 }}><Input label="Protein g" type="number" value={t.protein} onChange={(e) => setT({ ...t, protein: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><Input label="Carbs g" type="number" value={t.carbs} onChange={(e) => setT({ ...t, carbs: e.target.value })} /></div>
              <div style={{ flex: 1 }}><Input label="Fat g" type="number" value={t.fat} onChange={(e) => setT({ ...t, fat: e.target.value })} /></div>
            </div>
            <Button onClick={saveTarget} variant="secondary">Save targets</Button>
          </>
        ) : target.calories ? (
          <p className="f-mono" style={{ fontSize: 14, margin: 0 }}>{target.calories} kcal · {target.protein}p / {target.carbs}c / {target.fat}f</p>
        ) : (
          <p className="f-body" style={{ fontSize: 13, color: "#6B6B66", margin: 0 }}>Your trainer hasn't set targets yet.</p>
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <span className="f-display" style={{ fontSize: 16, fontWeight: 700, display: "block", marginBottom: 10 }}>Log today's intake</span>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><Input label="Calories" type="number" value={n.calories} onChange={(e) => setN({ ...n, calories: e.target.value })} /></div>
          <div style={{ flex: 1 }}><Input label="Protein g" type="number" value={n.protein} onChange={(e) => setN({ ...n, protein: e.target.value })} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><Input label="Carbs g" type="number" value={n.carbs} onChange={(e) => setN({ ...n, carbs: e.target.value })} /></div>
          <div style={{ flex: 1 }}><Input label="Fat g" type="number" value={n.fat} onChange={(e) => setN({ ...n, fat: e.target.value })} /></div>
        </div>
        <TextArea label="Note" value={n.note} onChange={(e) => setN({ ...n, note: e.target.value })} placeholder="How did eating go today?" />
        <Button onClick={addNutritionLog}><Plus size={15} /> Log intake</Button>
      </Card>

      {calChart.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <span className="f-display" style={{ fontSize: 14, fontWeight: 700, color: "#6B6B66", textTransform: "uppercase", letterSpacing: "0.05em" }}>Calorie trend</span>
          <div style={{ height: 170, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D4" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: "Inter" }} />
                <YAxis tick={{ fontSize: 11, fontFamily: "Inter" }} />
                <Tooltip />
                {target.calories ? <ReferenceLine y={target.calories} stroke={PLATE.blue} strokeDasharray="4 4" /> : null}
                <Line type="monotone" dataKey="calories" stroke={PLATE.green} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {nutLogs.slice().reverse().map((l) => (
              <span key={l.id} className="f-mono" style={{ fontSize: 11, background: "#EFEBDF", borderRadius: 3, padding: "3px 7px", display: "flex", alignItems: "center", gap: 5 }}>
                {fmtDate(l.date)}: {l.calories}kcal
                <X size={11} style={{ cursor: "pointer" }} onClick={() => deleteNutritionLog(l.id)} />
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Scale size={18} color={PLATE.blue} />
          <span className="f-display" style={{ fontSize: 16, fontWeight: 700 }}>Body stats</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><Input label="Weight" type="number" value={s.weight} onChange={(e) => setS({ ...s, weight: e.target.value })} /></div>
          <div style={{ flex: 1 }}><Input label="Waist" value={s.waist} onChange={(e) => setS({ ...s, waist: e.target.value })} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><Input label="Chest" value={s.chest} onChange={(e) => setS({ ...s, chest: e.target.value })} /></div>
          <div style={{ flex: 1 }}><Input label="Hips" value={s.hips} onChange={(e) => setS({ ...s, hips: e.target.value })} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><Input label="Arms" value={s.arms} onChange={(e) => setS({ ...s, arms: e.target.value })} /></div>
          <div style={{ flex: 1 }}><Input label="Thighs" value={s.thighs} onChange={(e) => setS({ ...s, thighs: e.target.value })} /></div>
        </div>
        <Input label="Progress photo link (optional)" value={s.photoUrl} onChange={(e) => setS({ ...s, photoUrl: e.target.value })} placeholder="Paste a link (Google Photos, etc.)" />
        <TextArea label="Note" value={s.note} onChange={(e) => setS({ ...s, note: e.target.value })} />
        <Button onClick={addBodyStat} variant="dark"><Plus size={15} /> Log body stats</Button>
      </Card>

      {weightChart.length > 0 && (
        <Card>
          <span className="f-display" style={{ fontSize: 14, fontWeight: 700, color: "#6B6B66", textTransform: "uppercase", letterSpacing: "0.05em" }}>Weight trend</span>
          <div style={{ height: 170, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D4" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: "Inter" }} />
                <YAxis tick={{ fontSize: 11, fontFamily: "Inter" }} domain={["auto", "auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke={PLATE.blue} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 10 }}>
            {stats.slice().reverse().map((x) => (
              <div key={x.id} className="f-body" style={{ fontSize: 12, color: "#4A4944", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderTop: "1px solid #E4E0D4" }}>
                <span>{fmtDate(x.date)} · {x.weight}{x.waist ? ` · waist ${x.waist}` : ""}{x.photoUrl ? " · 📷" : ""}</span>
                <Trash2 size={13} color={PLATE.red} style={{ cursor: "pointer" }} onClick={() => deleteBodyStat(x.id)} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

/* ---------- role select ---------- */

function RoleSelect({ onPick }) {
  return (
    <Screen>
      <div style={{ textAlign: "center", marginBottom: 36, marginTop: 20 }}>
        <Dumbbell size={34} color={PLATE.red} style={{ marginBottom: 10 }} />
        <h1 className="f-display" style={{ color: "#F5F2EA", fontSize: 40, fontWeight: 800, margin: 0 }}>LOGBOOK</h1>
        <p className="f-body" style={{ color: "#8A8983", fontSize: 14, margin: "6px 0 0" }}>Program clients. Log sessions. Track every PR.</p>
      </div>
      <Card style={{ marginBottom: 14 }}>
        <button onClick={() => onPick("trainer")} className="f-body" style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}><Users size={22} color="#1B1B1D" /><span style={{ fontSize: 17, fontWeight: 600, color: "#1B1B1D" }}>I'm the trainer</span></span>
          <ChevronRight color="#6B6B66" />
        </button>
      </Card>
      <Card>
        <button onClick={() => onPick("client")} className="f-body" style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}><User size={22} color="#1B1B1D" /><span style={{ fontSize: 17, fontWeight: 600, color: "#1B1B1D" }}>I'm a client</span></span>
          <ChevronRight color="#6B6B66" />
        </button>
      </Card>
    </Screen>
  );
}

/* ---------- trainer auth ---------- */

function TrainerAuth({ data, onSaveData, onIn, onHome }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const isNew = !data.trainerPin;

  const submit = async () => {
    if (isNew) {
      if (pin.length < 4) return setError("PIN must be at least 4 digits.");
      if (pin !== confirm) return setError("PINs don't match.");
      await onSaveData({ ...data, trainerPin: pin });
      onIn();
    } else {
      if (pin !== data.trainerPin) return setError("Wrong PIN.");
      onIn();
    }
  };

  return (
    <Screen>
      <TopBar title={isNew ? "Set Up" : "Trainer Login"} onBack={onHome} />
      <Card>
        <p className="f-body" style={{ fontSize: 14, color: "#6B6B66", marginTop: 0 }}>{isNew ? "Create a PIN to protect your roster and programs." : "Enter your PIN to continue."}</p>
        <Input label="PIN" type="password" inputMode="numeric" value={pin} onChange={(e) => { setPin(e.target.value); setError(""); }} placeholder="••••" />
        {isNew && <Input label="Confirm PIN" type="password" inputMode="numeric" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} placeholder="••••" />}
        {error && <p style={{ color: PLATE.red, fontSize: 13, marginTop: -6 }}>{error}</p>}
        <Button onClick={submit} style={{ marginTop: 6 }}><Lock size={16} /> {isNew ? "Create & continue" : "Log in"}</Button>
      </Card>
    </Screen>
  );
}

/* ---------- trainer dashboard ---------- */

function TrainerDashboard({ data, onSaveData, onHome, onOpenClient }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const addClient = async () => {
    if (!name.trim()) return setError("Enter a name.");
    if (pin.length < 4) return setError("Client PIN must be at least 4 digits.");
    const client = { id: uid(), name: name.trim(), pin };
    await onSaveData({ ...data, clients: [...data.clients, client], programs: { ...data.programs, [client.id]: [] }, logs: { ...data.logs, [client.id]: [] } });
    setAdding(false); setName(""); setPin(""); setError("");
  };

  return (
    <Screen>
      <TopBar title="Roster" onBack={onHome} right={
        <button onClick={() => setAdding(true)} style={{ background: PLATE.red, border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Plus color="#F5F2EA" size={20} />
        </button>
      } />
      {adding && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="f-display" style={{ fontSize: 18, fontWeight: 700 }}>New client</span>
            <X size={18} style={{ cursor: "pointer" }} onClick={() => setAdding(false)} />
          </div>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" />
          <Input label="Client PIN (they'll use this to log in)" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="e.g. 1234" />
          {error && <p style={{ color: PLATE.red, fontSize: 13 }}>{error}</p>}
          <Button onClick={addClient}>Add client</Button>
        </Card>
      )}
      {data.clients.length === 0 && !adding && (
        <Card style={{ textAlign: "center", color: "#6B6B66" }}><p className="f-body" style={{ margin: 0 }}>No clients yet. Add your first one to build them a program.</p></Card>
      )}
      {data.clients.map((c) => {
        const logs = data.logs[c.id] || [];
        const lastSession = logs.length ? fmtDate(logs[logs.length - 1].date) : "No sessions yet";
        return (
          <Card key={c.id} style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
            <button onClick={() => onOpenClient(c.id)} style={{ width: "100%", background: "none", border: "none", padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}>
              <span>
                <span className="f-display" style={{ display: "block", fontSize: 20, fontWeight: 700, color: "#1B1B1D" }}>{c.name}</span>
                <span className="f-body" style={{ fontSize: 13, color: "#6B6B66" }}>Last session: {lastSession}</span>
              </span>
              <ChevronRight color="#6B6B66" />
            </button>
          </Card>
        );
      })}
    </Screen>
  );
}

/* ---------- trainer: program tab (with templates) ---------- */

function ProgramTab({ data, onSaveData, clientId }) {
  const program = data.programs[clientId] || [];
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState(10);
  const [exWeight, setExWeight] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const addExercise = async () => {
    if (!exName.trim()) return;
    const ex = { id: uid(), name: exName.trim(), sets: Number(exSets) || 1, reps: Number(exReps) || 1, targetWeight: Number(exWeight) || 0 };
    await onSaveData({ ...data, programs: { ...data.programs, [clientId]: [...program, ex] } });
    setExName(""); setExSets(3); setExReps(10); setExWeight("");
  };
  const removeExercise = async (id) => {
    await onSaveData({ ...data, programs: { ...data.programs, [clientId]: program.filter((e) => e.id !== id) } });
  };
  const saveTemplate = async () => {
    if (!templateName.trim() || program.length === 0) return;
    const tpl = { id: uid(), name: templateName.trim(), exercises: program.map(({ name, sets, reps, targetWeight }) => ({ name, sets, reps, targetWeight })) };
    await onSaveData({ ...data, templates: [...data.templates, tpl] });
    setSavingTemplate(false); setTemplateName("");
  };
  const loadTemplate = async (tpl) => {
    const existingNames = new Set(program.map((e) => e.name));
    const toAdd = tpl.exercises.filter((e) => !existingNames.has(e.name)).map((e) => ({ ...e, id: uid() }));
    await onSaveData({ ...data, programs: { ...data.programs, [clientId]: [...program, ...toAdd] } });
  };
  const deleteTemplate = async (id) => {
    await onSaveData({ ...data, templates: data.templates.filter((t) => t.id !== id) });
  };

  return (
    <>
      {data.templates.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Bookmark size={16} color={PLATE.yellow} />
            <span className="f-display" style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Templates</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.templates.map((tpl) => (
              <span key={tpl.id} className="f-body" style={{ fontSize: 13, background: "#EFEBDF", borderRadius: 20, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => loadTemplate(tpl)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>{tpl.name}</button>
                <X size={12} style={{ cursor: "pointer" }} onClick={() => deleteTemplate(tpl.id)} />
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <span className="f-display" style={{ fontSize: 16, fontWeight: 700, display: "block", marginBottom: 10 }}>Add exercise</span>
        <Input label="Exercise" value={exName} onChange={(e) => setExName(e.target.value)} placeholder="e.g. Back Squat" />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Input label="Sets" type="number" value={exSets} onChange={(e) => setExSets(e.target.value)} /></div>
          <div style={{ flex: 1 }}><Input label="Reps" type="number" value={exReps} onChange={(e) => setExReps(e.target.value)} /></div>
          <div style={{ flex: 1 }}><Input label="Target wt" type="number" value={exWeight} onChange={(e) => setExWeight(e.target.value)} /></div>
        </div>
        <Button onClick={addExercise}><Plus size={16} /> Add to program</Button>
      </Card>

      {program.length === 0 ? (
        <Card style={{ textAlign: "center", color: "#6B6B66", marginBottom: 16 }}><p style={{ margin: 0 }}>No exercises assigned yet.</p></Card>
      ) : program.map((ex) => (
        <Card key={ex.id} style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="f-body" style={{ fontWeight: 600, fontSize: 15 }}>{ex.name}</div>
            <div className="f-mono" style={{ fontSize: 13, color: "#6B6B66" }}>{ex.sets} × {ex.reps} @ {ex.targetWeight || "—"}</div>
          </div>
          <Trash2 size={17} color={PLATE.red} style={{ cursor: "pointer" }} onClick={() => removeExercise(ex.id)} />
        </Card>
      ))}

      {program.length > 0 && (
        savingTemplate ? (
          <Card>
            <Input label="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Beginner Full Body" />
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={saveTemplate}>Save template</Button>
              <Button variant="secondary" onClick={() => setSavingTemplate(false)}>Cancel</Button>
            </div>
          </Card>
        ) : (
          <Button variant="secondary" onClick={() => setSavingTemplate(true)}><Bookmark size={15} /> Save as template</Button>
        )
      )}
    </>
  );
}

/* ---------- trainer: client detail ---------- */

function ClientDetail({ data, onSaveData, clientId, onBack }) {
  const [tab, setTab] = useState("program");
  const client = data.clients.find((c) => c.id === clientId);

  return (
    <Screen>
      <TopBar title={client?.name || "Client"} onBack={onBack} />
      <TabBar
        tabs={[
          { key: "program", label: "Program" },
          { key: "progress", label: "Training", icon: <Dumbbell size={14} /> },
          { key: "nutrition", label: "Nutrition", icon: <Apple size={14} /> },
        ]}
        active={tab} onChange={setTab}
      />
      {tab === "program" && <ProgramTab data={data} onSaveData={onSaveData} clientId={clientId} />}
      {tab === "progress" && <TrainingProgressTab data={data} onSaveData={onSaveData} clientId={clientId} role="trainer" />}
      {tab === "nutrition" && <NutritionTab data={data} onSaveData={onSaveData} clientId={clientId} role="trainer" />}
    </Screen>
  );
}

/* ---------- client auth ---------- */

function ClientAuth({ data, onIn, onHome }) {
  const [clientId, setClientId] = useState(data.clients[0]?.id || "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const client = data.clients.find((c) => c.id === clientId);
    if (!client) return setError("Ask your trainer to add you first.");
    if (pin !== client.pin) return setError("Wrong PIN.");
    onIn(clientId);
  };

  return (
    <Screen>
      <TopBar title="Client Login" onBack={onHome} />
      <Card>
        {data.clients.length === 0 ? (
          <p className="f-body" style={{ color: "#6B6B66" }}>No clients have been added yet. Ask your trainer to set you up.</p>
        ) : (
          <>
            <label className="f-body" style={{ display: "block", marginBottom: 14 }}>
              <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B66", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your name</span>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", fontSize: 16, borderRadius: 3, border: "1.5px solid #D8D4C6", background: "#fff", fontFamily: "inherit" }}>
                {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <Input label="PIN" type="password" inputMode="numeric" value={pin} onChange={(e) => { setPin(e.target.value); setError(""); }} placeholder="••••" />
            {error && <p style={{ color: PLATE.red, fontSize: 13, marginTop: -6 }}>{error}</p>}
            <Button onClick={submit}><Lock size={16} /> Log in</Button>
          </>
        )}
      </Card>
    </Screen>
  );
}

/* ---------- client home ---------- */

function TodayTab({ data, onSaveData, clientId }) {
  const program = data.programs[clientId] || [];
  const logs = data.logs[clientId] || [];
  const todaysLog = logs.find((l) => l.date === todayISO());
  const [entries, setEntries] = useState(() =>
    todaysLog ? todaysLog.entries : program.map((ex) => ({
      exerciseId: ex.id, exerciseName: ex.name,
      sets: Array.from({ length: ex.sets }, () => ({ reps: ex.reps, weight: ex.targetWeight || "" })),
    }))
  );
  const [note, setNote] = useState(todaysLog?.note || "");
  const [saved, setSaved] = useState(!!todaysLog);

  const logWorkout = async () => {
    const other = logs.filter((l) => l.date !== todayISO());
    const nextLogs = [...other, { id: todaysLog?.id || uid(), date: todayISO(), entries, note, feedback: todaysLog?.feedback }].sort((a, b) => a.date.localeCompare(b.date));
    await onSaveData({ ...data, logs: { ...data.logs, [clientId]: nextLogs } });
    setSaved(true);
  };

  if (program.length === 0) {
    return <Card style={{ textAlign: "center", color: "#6B6B66" }}><p style={{ margin: 0 }}>Your trainer hasn't assigned a program yet.</p></Card>;
  }

  return (
    <>
      <SessionForm entries={entries} note={note} onChange={(e) => { setEntries(e); setSaved(false); }} onNoteChange={(v) => { setNote(v); setSaved(false); }} />
      <Button onClick={logWorkout} style={{ marginTop: 4 }}>
        {saved ? <><Check size={16} /> Saved for today</> : "Log today's workout"}
      </Button>
    </>
  );
}

function ClientHome({ data, onSaveData, clientId, onHome }) {
  const [tab, setTab] = useState("today");
  const client = data.clients.find((c) => c.id === clientId);

  return (
    <Screen>
      <TopBar title={`Hey, ${client?.name?.split(" ")[0] || ""}`} onBack={onHome} />
      <TabBar
        tabs={[
          { key: "today", label: "Today" },
          { key: "progress", label: "Training", icon: <Dumbbell size={14} /> },
          { key: "nutrition", label: "Nutrition", icon: <Apple size={14} /> },
        ]}
        active={tab} onChange={setTab}
      />
      {tab === "today" && <TodayTab data={data} onSaveData={onSaveData} clientId={clientId} />}
      {tab === "progress" && <TrainingProgressTab data={data} onSaveData={onSaveData} clientId={clientId} role="client" />}
      {tab === "nutrition" && <NutritionTab data={data} onSaveData={onSaveData} clientId={clientId} role="client" />}
    </Screen>
  );
}

/* ---------- root ---------- */

export default function App() {
  const [data, setData] = useState(null);
  const [route, setRoute] = useState({ view: "select" });

  useEffect(() => { loadData().then(setData); }, []);

  const persist = async (next) => {
    setData(next);
    await saveData(next);
  };

  if (!data) {
    return <Screen><p className="f-body" style={{ color: "#8A8983", textAlign: "center", marginTop: 60 }}>Loading…</p></Screen>;
  }

  return (
    <>
      <Fonts />
      {route.view === "select" && <RoleSelect onPick={(r) => setRoute({ view: r === "trainer" ? "trainerAuth" : "clientAuth" })} />}
      {route.view === "trainerAuth" && <TrainerAuth data={data} onSaveData={persist} onIn={() => setRoute({ view: "trainerDash" })} onHome={() => setRoute({ view: "select" })} />}
      {route.view === "trainerDash" && <TrainerDashboard data={data} onSaveData={persist} onHome={() => setRoute({ view: "select" })} onOpenClient={(id) => setRoute({ view: "clientDetail", id })} />}
      {route.view === "clientDetail" && <ClientDetail data={data} onSaveData={persist} clientId={route.id} onBack={() => setRoute({ view: "trainerDash" })} />}
      {route.view === "clientAuth" && <ClientAuth data={data} onIn={(id) => setRoute({ view: "clientHome", id })} onHome={() => setRoute({ view: "select" })} />}
      {route.view === "clientHome" && <ClientHome data={data} onSaveData={persist} clientId={route.id} onHome={() => setRoute({ view: "select" })} />}
    </>
  );
}
