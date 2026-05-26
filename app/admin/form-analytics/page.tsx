"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { AdminGate, adminFetchHeaders } from "@/components/admin/AdminGate";

// ─── types ────────────────────────────────────────────────────────────────────

interface FunnelStep {
  step: string;
  entered: number;
  completed: number;
  dropOff: number;
  dropOffPct: number;
  completionRate: number;
  backNavigations: number;
  avgTimeMs: number | null;
}

interface SessionCounts {
  started: number;
  inProgress: number;
  abandoned: number;
  completed: number;
  failed: number;
}

interface SessionData {
  total: number;
  counts: SessionCounts;
  reEngagedCount: number;
}

interface FieldStat {
  field: string;
  step: string | null;
  count: number;
}

interface FieldData {
  fieldErrors: FieldStat[];
  fieldEdits: FieldStat[];
}

interface TimeMetrics {
  avgCompletionMs: number | null;
  p75Ms: number;
  p90Ms: number;
  outlierCount: number;
  completedSessions: number;
  stepAvgTimes: { step: string; avgMs: number; sampleSize: number }[];
}

interface DeviceStat {
  device: string;
  total: number;
  completed: number;
  dropOff: number;
}
interface BrowserStat {
  browser: string;
  total: number;
  completed: number;
  dropOff: number;
}
interface DeviceData {
  devices: DeviceStat[];
  browsers: BrowserStat[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtMs(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const PALETTE = ["#0d9488", "#f97316", "#6366f1", "#ec4899", "#eab308", "#14b8a6", "#8b5cf6"];
const RED_ORANGE = "#f97316";
const TEAL = "#0d9488";

// ─── date range picker ────────────────────────────────────────────────────────

type Range = "1d" | "7d" | "30d" | "custom";

function DateRangeFilter({
  range, from, to, onChange,
}: {
  range: Range;
  from: string;
  to: string;
  onChange: (r: Range, f?: string, t?: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["1d", "7d", "30d"] as const).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            range === r
              ? "bg-teal-600 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          }`}
        >
          {r === "1d" ? "Today" : r === "7d" ? "Last 7 days" : "Last 30 days"}
        </button>
      ))}
      <button
        onClick={() => onChange("custom")}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          range === "custom"
            ? "bg-teal-600 text-white"
            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        }`}
      >
        Custom
      </button>
      {range === "custom" && (
        <>
          <input
            type="date"
            value={from}
            onChange={(e) => onChange("custom", e.target.value, to)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          />
          <span className="text-slate-400 dark:text-slate-500">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => onChange("custom", from, e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          />
        </>
      )}
    </div>
  );
}

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── section card ─────────────────────────────────────────────────────────────

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className}`}>
      <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── loading / empty states ───────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="size-7 animate-spin rounded-full border-2 border-slate-200 border-t-teal-500" />
    </div>
  );
}

function Empty() {
  return <p className="py-8 text-center text-sm text-slate-400">No data for this period.</p>;
}

// ─── funnel chart ─────────────────────────────────────────────────────────────

function FunnelSection({ data }: { data: FunnelStep[] }) {
  if (!data.length) return <Empty />;

  // Sort by step order (alphabetical is fallback; ideally by step number embedded in name)
  const sorted = [...data].sort((a, b) => b.entered - a.entered);

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="step" type="category" width={160} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(val, name) => [val, name === "entered" ? "Entered" : "Completed"]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="entered" name="Entered" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
          <Bar dataKey="completed" name="Completed" fill={TEAL} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="pb-2 pr-4">Step</th>
              <th className="pb-2 pr-4 text-right">Entered</th>
              <th className="pb-2 pr-4 text-right">Completed</th>
              <th className="pb-2 pr-4 text-right">Drop-off</th>
              <th className="pb-2 pr-4 text-right">Drop-off %</th>
              <th className="pb-2 pr-4 text-right">Completion %</th>
              <th className="pb-2 pr-4 text-right">Avg time</th>
              <th className="pb-2 text-right">Back-navs</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.step} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/30">
                <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">{row.step}</td>
                <td className="py-2 pr-4 text-right text-slate-600 dark:text-slate-400">{row.entered}</td>
                <td className="py-2 pr-4 text-right text-slate-600 dark:text-slate-400">{row.completed}</td>
                <td className="py-2 pr-4 text-right text-slate-600 dark:text-slate-400">{row.dropOff}</td>
                <td className="py-2 pr-4 text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.dropOffPct >= 50
                        ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : row.dropOffPct >= 25
                          ? "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    }`}
                  >
                    {row.dropOffPct}%
                  </span>
                </td>
                <td className="py-2 pr-4 text-right text-slate-600 dark:text-slate-400">{row.completionRate}%</td>
                <td className="py-2 pr-4 text-right text-slate-500 dark:text-slate-500">{fmtMs(row.avgTimeMs)}</td>
                <td className="py-2 text-right text-slate-500 dark:text-slate-500">{row.backNavigations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── session pie ──────────────────────────────────────────────────────────────

const SESSION_COLORS: Record<string, string> = {
  completed: "#0d9488",
  inProgress: "#6366f1",
  started: "#94a3b8",
  abandoned: "#f97316",
  failed: "#ef4444",
};
const SESSION_LABELS: Record<string, string> = {
  completed: "Completed",
  inProgress: "In Progress",
  started: "Started",
  abandoned: "Abandoned",
  failed: "Failed",
};

function SessionSection({ data }: { data: SessionData }) {
  const pieData = Object.entries(data.counts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: SESSION_LABELS[key] ?? key, value, key }));

  if (pieData.length === 0) return <Empty />;

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row">
      <ResponsiveContainer width={240} height={240}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
            {pieData.map((entry) => (
              <Cell key={entry.key} fill={SESSION_COLORS[entry.key] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [v, ""]} contentStyle={{ fontSize: 12 }} />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {Object.entries(data.counts).map(([key, count]) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ background: SESSION_COLORS[key] ?? "#94a3b8" }}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">{SESSION_LABELS[key] ?? key}</span>
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{count}</span>
          </div>
        ))}
        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">Re-engaged sessions</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{data.reEngagedCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── field errors chart ───────────────────────────────────────────────────────

function FieldSection({ data }: { data: FieldData }) {
  const top10Errors = data.fieldErrors.slice(0, 10);
  if (!top10Errors.length) return <Empty />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={top10Errors} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="field" type="category" width={140} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v) => [v, "Error count"]}
          labelFormatter={(label) => {
            const found = top10Errors.find((f) => f.field === label);
            return found?.step ? `${label} (${found.step})` : label;
          }}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="count" name="Errors" fill={RED_ORANGE} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── device / browser charts ──────────────────────────────────────────────────

function DeviceSection({ data }: { data: DeviceData }) {
  if (!data.devices.length && !data.browsers.length) return <Empty />;

  const devicePie = data.devices.map((d, i) => ({
    name: d.device.charAt(0).toUpperCase() + d.device.slice(1),
    value: d.total,
    fill: PALETTE[i % PALETTE.length],
  }));

  const browserPie = data.browsers.map((b, i) => ({
    name: b.browser,
    value: b.total,
    fill: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div>
        <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">By Device</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={devicePie} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
              {devicePie.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [v, "Sessions"]} contentStyle={{ fontSize: 12 }} />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 space-y-1">
          {data.devices.map((d) => (
            <div key={d.device} className="flex justify-between text-sm">
              <span className="capitalize text-slate-600 dark:text-slate-400">{d.device}</span>
              <span className="text-slate-500 dark:text-slate-500">
                {d.total} total · {d.completed} completed
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">By Browser</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={browserPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
              {browserPie.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [v, "Sessions"]} contentStyle={{ fontSize: 12 }} />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 space-y-1">
          {data.browsers.map((b) => (
            <div key={b.browser} className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">{b.browser}</span>
              <span className="text-slate-500 dark:text-slate-500">
                {b.total} total · {b.completed} completed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── main dashboard ───────────────────────────────────────────────────────────

function AuthLoadingShell() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="size-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
    </div>
  );
}

async function fetchAnalytics<T>(url: string, opts: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) {
    const message = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
    const err = new Error(message);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return data as T;
}

function FormAnalyticsContent() {
  const [range, setRange] = useState<Range>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    const to = new Date();
    const from = new Date(Date.now() - 7 * 864e5);
    setCustomTo(to.toISOString().slice(0, 10));
    setCustomFrom(from.toISOString().slice(0, 10));
  }, []);

  const [funnel, setFunnel]       = useState<FunnelStep[] | null>(null);
  const [sessions, setSessions]   = useState<SessionData | null>(null);
  const [fields, setFields]       = useState<FieldData | null>(null);
  const [timeData, setTimeData]   = useState<TimeMetrics | null>(null);
  const [devices, setDevices]     = useState<DeviceData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const buildQs = useCallback(() => {
    const p = new URLSearchParams({ range });
    if (range === "custom") {
      p.set("from", customFrom);
      p.set("to", customTo);
    }
    return p.toString();
  }, [range, customFrom, customTo]);

  const fetchAll = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);

    const qs = buildQs();
    const opts = { ...adminFetchHeaders(), signal: ctrl.signal };

    try {
      const [f, s, fi, t, d] = await Promise.all([
        fetchAnalytics<{ funnel?: FunnelStep[] }>(`/api/admin/analytics/funnel?${qs}`, opts),
        fetchAnalytics<SessionData>(`/api/admin/analytics/sessions?${qs}`, opts),
        fetchAnalytics<FieldData>(`/api/admin/analytics/fields?${qs}`, opts),
        fetchAnalytics<TimeMetrics>(`/api/admin/analytics/time-metrics?${qs}`, opts),
        fetchAnalytics<DeviceData>(`/api/admin/analytics/devices?${qs}`, opts),
      ]);
      setFunnel(f.funnel ?? []);
      setSessions(s);
      setFields(fi);
      setTimeData(t);
      setDevices(d);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const status = (e as Error & { status?: number }).status;
      if (status === 401) {
        setError("Session expired. Please sign in again.");
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [buildQs]);

  useEffect(() => {
    fetchAll();
  }, [range, customFrom, customTo, fetchAll]);

  const handleRangeChange = (r: Range, f?: string, t?: string) => {
    setRange(r);
    if (f) setCustomFrom(f);
    if (t) setCustomTo(t);
  };

  const handleExport = () => {
    const qs = buildQs();
    const a = document.createElement("a");
    a.href = `/api/admin/analytics/export?${qs}`;
    a.click();
  };

  const totalSessions = sessions?.total ?? 0;
  const completedSessions = sessions?.counts.completed ?? 0;
  const overallRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col pb-16">
      {/* header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Form Analytics</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Funnel behaviour, drop-offs &amp; field errors</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateRangeFilter range={range} from={customFrom} to={customTo} onChange={handleRangeChange} />
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-6 pt-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        )}

        {/* stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Sessions" value={totalSessions} />
          <StatCard label="Completed" value={completedSessions} sub={`${overallRate}% overall rate`} />
          <StatCard label="Avg Completion Time" value={fmtMs(timeData?.avgCompletionMs)} />
          <StatCard
            label="Re-engaged"
            value={sessions?.reEngagedCount ?? "—"}
            sub="returned after 30 min gap"
          />
        </div>

        {/* session status */}
        <Card title="Session States">
          {loading ? <Spinner /> : sessions ? <SessionSection data={sessions} /> : <Empty />}
        </Card>

        {/* funnel */}
        <Card title="Funnel Overview — Step-by-step Drop-off">
          {loading ? <Spinner /> : funnel ? <FunnelSection data={funnel} /> : <Empty />}
        </Card>

        {/* time metrics */}
        {!loading && timeData && (
          <Card title="Time Metrics">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg completion</p>
                <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{fmtMs(timeData.avgCompletionMs)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">75th percentile</p>
                <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{fmtMs(timeData.p75Ms)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">90th percentile</p>
                <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{fmtMs(timeData.p90Ms)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Outlier sessions</p>
                <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{timeData.outlierCount}</p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">above 90th pct</p>
              </div>
            </div>

            {timeData.stepAvgTimes.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">Avg time per step</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={timeData.stepAvgTimes} margin={{ left: 0, right: 20, top: 5, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="step" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tickFormatter={(v) => fmtMs(v)} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v) => [fmtMs(typeof v === "number" ? v : null), "Avg time"]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="avgMs" name="Avg time" fill={TEAL} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        )}
        {loading && <Card title="Time Metrics"><Spinner /></Card>}

        {/* field errors */}
        <Card title="Field Validation Error Frequency (top 10 fields)">
          {loading ? <Spinner /> : fields ? <FieldSection data={fields} /> : <Empty />}
        </Card>

        {/* device & browser */}
        <Card title="Device &amp; Browser Breakdown">
          {loading ? <Spinner /> : devices ? <DeviceSection data={devices} /> : <Empty />}
        </Card>
      </div>
    </div>
  );
}

export default function FormAnalyticsPage() {
  return (
    <AdminGate>
      {() => <FormAnalyticsContent />}
    </AdminGate>
  );
}
