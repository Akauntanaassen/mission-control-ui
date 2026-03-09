"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSnapshot, type SnapshotDTO } from "@/lib/api";
import { agents as fallbackAgents, eventLog as fallbackEvents, wallDisplays } from "@/lib/mockData";

type ViewMode = "office" | "tasks";

export function MissionControl() {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("office");
  const [snapshot, setSnapshot] = useState<SnapshotDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dataAgents = snapshot?.agents ?? fallbackAgents;
  const dataEvents = snapshot?.events ?? fallbackEvents;

  const selectedAgent = useMemo(
    () => dataAgents.find((agent) => agent.id === activeAgent),
    [activeAgent, dataAgents]
  );

  const refreshSnapshot = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchSnapshot();
      setSnapshot(data);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSnapshot();
    const interval = setInterval(refreshSnapshot, 1000 * 15);
    return () => clearInterval(interval);
  }, [refreshSnapshot]);

  return (
    <div className="relative min-h-screen bg-[#060812] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(38,94,255,0.35),_transparent_55%)]" />
      <div className="absolute inset-0 bg-grid opacity-50" />

      <main className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <p className="tracking-[0.35em] text-xs uppercase text-slate-400">
            InSky Mission Control
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold text-white">
              DARPA Launch Room
            </h1>
            <div className="flex gap-2 text-xs uppercase text-slate-300">
              <span className="rounded-full border border-slate-700 px-3 py-1">
                Tether Lab · Online
              </span>
              <span className="rounded-full border border-slate-700 px-3 py-1">
                Feed synced 19:44 ET
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {wallDisplays.map((panel) => (
            <article
              key={panel.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-[0_15px_40px_rgba(0,0,0,0.35)]"
            >
              <p className="text-xs uppercase tracking-widest text-slate-400">
                {panel.title}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {panel.value}
              </p>
              <p className="text-sm text-slate-400">{panel.detail}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[32px] border border-slate-800 bg-[#0b0f1d] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Office View</h2>
              <div className="text-xs text-slate-400">
                {loading ? "Syncing…" : "Live feed"}
                {error && (
                  <span className="ml-2 text-rose-300">Offline: {error}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs uppercase text-slate-400">
              <button
                onClick={refreshSnapshot}
                className="rounded-full border border-slate-700 px-3 py-1 text-[11px] uppercase tracking-widest hover:border-cyan-400 hover:text-white"
              >
                Refresh
              </button>
              <button
                onClick={() => setViewMode("office")}
                className={`rounded-full border px-3 py-1 ${
                  viewMode === "office"
                    ? "border-cyan-400 text-white"
                    : "border-transparent"
                }`}
              >
                Office
              </button>
              <button
                onClick={() => setViewMode("tasks")}
                className={`rounded-full border px-3 py-1 ${
                  viewMode === "tasks"
                    ? "border-cyan-400 text-white"
                    : "border-transparent"
                }`}
              >
                Task grid
              </button>
            </div>
          </div>

          {viewMode === "office" ? (
            <div className="grid gap-4 md:grid-cols-3">
              {dataAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setActiveAgent(agent.id)}
                  className={`relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br ${
                    agent.color
                  }/20 px-4 py-6 text-left shadow-[0_15px_50px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-1 hover:border-cyan-300/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    activeAgent === agent.id ? "ring-2 ring-cyan-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-200">
                        {agent.name}
                      </p>
                      <p className="text-sm text-slate-100/80">{agent.role}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] uppercase ${
                        agent.status === "focus"
                          ? "bg-cyan-400/20 text-cyan-200"
                          : agent.status === "blocked"
                          ? "bg-rose-500/20 text-rose-200"
                          : agent.status === "handoff"
                          ? "bg-amber-400/20 text-amber-100"
                          : "bg-slate-400/20 text-slate-100"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <p className="mt-6 text-lg font-semibold text-white">
                    {agent.currentTask}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-100/80">
                    <span>{agent.due}</span>
                    <span>{agent.mood}</span>
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_55%)]" />
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {dataAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/50 p-4"
                >
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    {agent.name}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    <li>
                      <span className="text-slate-500">Now:</span> {agent.currentTask}
                    </li>
                    <li>
                      <span className="text-slate-500">Due:</span> {agent.due}
                    </li>
                    <li>
                      <span className="text-slate-500">Status:</span> {agent.status}
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <article className="rounded-3xl border border-slate-800 bg-[#0d101f] p-5">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Event Ticker</h3>
              <span className="text-xs uppercase tracking-widest text-slate-500">
                Live feed
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {dataEvents.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/30 px-3 py-2 ${
                    item.tone === "alert"
                      ? "border-rose-500/40"
                      : item.tone === "success"
                      ? "border-emerald-500/40"
                      : ""
                  }`}
                >
                  <div>
                    <p className="text-slate-100">{item.text}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      {item.agentId?.toUpperCase()}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{item.time}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-950 p-5 text-sm">
            <h3 className="text-lg font-semibold text-white">Desk Signal</h3>
            {selectedAgent ? (
              <div className="mt-4 space-y-2 text-slate-200">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {selectedAgent.name}
                </p>
                <p>Current task: {selectedAgent.currentTask}</p>
                <p>Due: {selectedAgent.due}</p>
                <p>Status: {selectedAgent.status}</p>
              </div>
            ) : (
              <p className="mt-4 text-slate-400">
                Select a desk to see live context.
              </p>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
