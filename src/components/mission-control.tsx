"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createTask,
  fetchSnapshot,
  fetchAgentsStatus,
  postEvent,
  sendHeartbeat,
  type AgentDTO,
  type AgentId,
  type AgentsStatusResponse,
  type SnapshotDTO,
  type TaskDTO,
} from "@/lib/api";
import {
  agents as fallbackAgents,
  eventLog as fallbackEvents,
  wallDisplays,
  mockTasks,
} from "@/lib/mockData";

const TASK_COLUMNS: { key: TaskDTO["state"]; label: string }[] = [
  { key: "queued", label: "Queued" },
  { key: "running", label: "In Flight" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

const STATUS_LABEL: Record<AgentDTO["status"], string> = {
  focus: "On task",
  idle: "Standing by",
  blocked: "Blocked",
  handoff: "Hand-off",
};

export function MissionControl() {
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [agentStatus, setAgentStatus] = useState<AgentsStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskAgent, setTaskAgent] = useState<AgentId>("launch");
  const [taskPriority, setTaskPriority] = useState<TaskDTO["priority"]>(
    "medium"
  );
  const [taskDue, setTaskDue] = useState<string>("");

  const [eventText, setEventText] = useState("");
  const [eventTone, setEventTone] = useState<"info" | "alert" | "success">(
    "info"
  );
  const [eventAgent, setEventAgent] = useState<AgentId | "">("");

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionState, setActionState] = useState<"idle" | "running">("idle");

  const dataAgents = snapshot?.agents ?? fallbackAgents;
  const dataEvents = snapshot?.events ?? fallbackEvents;
  const dataTasks = snapshot?.tasks ?? mockTasks;

  const selectedAgent = useMemo(
    () => dataAgents.find((agent) => agent.id === activeAgent) ?? dataAgents[0],
    [activeAgent, dataAgents]
  );

  useEffect(() => {
    if (!activeAgent && dataAgents.length > 0) {
      setActiveAgent(dataAgents[0].id);
    }
  }, [activeAgent, dataAgents]);

  const refreshSnapshot = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchSnapshot();
      setSnapshot(data);
      setLastRefresh(new Date());
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

  useEffect(() => {
    const loadStatus = async () => {
      try {
        setStatusError(null);
        const data = await fetchAgentsStatus();
        setAgentStatus(data);
      } catch (err) {
        setStatusError((err as Error).message);
      } finally {
        setStatusLoading(false);
      }
    };
    loadStatus();
    const interval = setInterval(loadStatus, 1000 * 15);
    return () => clearInterval(interval);
  }, []);

  const groupedTasks = useMemo(() => {
    return TASK_COLUMNS.map((column) => ({
      ...column,
      items: dataTasks.filter((task) => task.state === column.key),
    }));
  }, [dataTasks]);

  const handleHeartbeat = async (status: AgentDTO["status"]) => {
    if (!selectedAgent) return;
    setActionState("running");
    setActionMessage(null);
    try {
      await sendHeartbeat(selectedAgent.id, status);
      setActionMessage(`Heartbeat sent (${selectedAgent.name} → ${status}).`);
      await refreshSnapshot();
    } catch (err) {
      setActionMessage((err as Error).message);
    } finally {
      setActionState("idle");
    }
  };

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskTitle.trim()) {
      setActionMessage("Task title required.");
      return;
    }
    setActionState("running");
    setActionMessage(null);
    try {
      await createTask({
        title: taskTitle.trim(),
        agentId: taskAgent,
        priority: taskPriority,
        dueAt: taskDue ? new Date(taskDue).toISOString() : undefined,
      });
      setTaskTitle("");
      setTaskDue("");
      setActionMessage("Task created.");
      await refreshSnapshot();
    } catch (err) {
      setActionMessage((err as Error).message);
    } finally {
      setActionState("idle");
    }
  };

  const handleEventSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!eventText.trim()) {
      setActionMessage("Event text required.");
      return;
    }
    setActionState("running");
    setActionMessage(null);
    try {
      await postEvent({
        text: eventText.trim(),
        tone: eventTone,
        agentId: eventAgent || undefined,
      });
      setEventText("");
      setEventAgent("");
      setEventTone("info");
      setActionMessage("Event logged.");
      await refreshSnapshot();
    } catch (err) {
      setActionMessage((err as Error).message);
    } finally {
      setActionState("idle");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#04060f] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(30,80,255,0.35),_transparent_55%)]" />
      <div className="absolute inset-0 bg-grid opacity-40" />

      <main className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <p className="tracking-[0.35em] text-xs uppercase text-slate-400">
            InSky Mission Control
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold text-white">Launch Room</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase text-slate-300">
              <span className="rounded-full border border-slate-700 px-3 py-1">
                {error ? "Controller Offline" : "Controller Linked"}
              </span>
              <span className="rounded-full border border-slate-700 px-3 py-1">
                {loading
                  ? "Syncing…"
                  : lastRefresh
                  ? `Refreshed ${lastRefresh.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Waiting for feed"}
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

        <section className="rounded-3xl border border-slate-800 bg-[#050917] p-5">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Agent Status</h3>
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {statusLoading
                ? "Loading"
                : statusError
                ? "Unavailable"
                : agentStatus?.updatedAt
                ? `Updated ${new Date(agentStatus.updatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : ""}
            </span>
          </header>
          {statusError && (
            <p className="text-sm text-rose-300">{statusError}</p>
          )}
          {!statusError && (
            <div className="grid gap-3 md:grid-cols-2">
              {agentStatus?.agents.map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{agent.name}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        {agent.role}
                      </p>
                    </div>
                    <div className="text-right text-xs uppercase">
                      <span
                        className={`mr-2 rounded-full px-2 py-0.5 ${
                          agent.busy
                            ? "bg-amber-400/20 text-amber-200"
                            : "bg-emerald-400/20 text-emerald-200"
                        }`}
                      >
                        {agent.busy ? "Busy" : "Idle"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          agent.health === "healthy"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-rose-500/20 text-rose-200"
                        }`}
                      >
                        {agent.health === "healthy" ? "Healthy" : "Problem"}
                      </span>
                    </div>
                  </div>
                  {agent.currentTask && (
                    <p className="mt-2 text-sm text-slate-200">
                      {agent.currentTask}
                    </p>
                  )}
                </div>
              ))}
              {statusLoading && (
                <p className="text-sm text-slate-400">Loading agent status…</p>
              )}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <article className="rounded-[32px] border border-slate-800 bg-[#050817]/95 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Office Stage</h2>
                <p className="text-xs text-slate-400">
                  {loading ? "Syncing feed…" : "Live controller snapshot"}
                  {error && (
                    <span className="ml-2 text-rose-300">Offline: {error}</span>
                  )}
                </p>
              </div>
              <button
                onClick={refreshSnapshot}
                className="rounded-full border border-cyan-400/60 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200 hover:bg-cyan-500/10"
              >
                Refresh
              </button>
            </header>

            <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-b from-[#0d1325] to-[#070b14] p-6">
              <div className="pointer-events-none absolute inset-6 rounded-[24px] border border-cyan-400/10" />
              <div className="absolute inset-x-10 top-8 flex justify-between text-[10px] uppercase tracking-[0.3em] text-slate-500">
                <span>Launch Timeline</span>
                <span>Offer Readiness</span>
                <span>Pipeline</span>
              </div>
              <div className="absolute inset-x-10 top-12 flex gap-5 text-xs text-cyan-200/70">
                <div className="h-1 w-full rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: "65%" }} />
                </div>
                <div className="h-1 w-full rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: "78%" }} />
                </div>
                <div className="h-1 w-full rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: "45%" }} />
                </div>
              </div>

              <div className="mt-16 grid gap-6 md:grid-cols-3">
                {dataAgents.map((agent) => (
                  <AgentDesk
                    key={agent.id}
                    agent={agent}
                    isActive={selectedAgent?.id === agent.id}
                    onSelect={() => setActiveAgent(agent.id)}
                  />
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-slate-800/70 bg-[#050910]/80 p-4 text-xs text-slate-400">
                <p className="uppercase tracking-[0.3em] text-slate-500">Message board</p>
                <div className="mt-2 space-y-1">
                  {dataEvents.slice(0, 3).map((event) => (
                    <p key={event.id} className="flex items-center justify-between">
                      <span>{event.text}</span>
                      <span className="text-slate-600">{event.time}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[32px] border border-slate-800 bg-[#0b1020] p-6">
            <h3 className="text-lg font-semibold text-white">Desk Console</h3>
            {selectedAgent ? (
              <div className="mt-4 space-y-4 text-sm text-slate-200">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    {selectedAgent.name}
                  </p>
                  <p className="text-base text-white">{selectedAgent.currentTask}</p>
                  <p className="text-slate-400">
                    {STATUS_LABEL[selectedAgent.status]} · {selectedAgent.due}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Heartbeat
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["focus", "idle", "blocked", "handoff"] as AgentDTO["status"][]).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => handleHeartbeat(status)}
                          disabled={actionState === "running"}
                          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition ${
                            selectedAgent.status === status
                              ? "border-cyan-400 text-cyan-200"
                              : "border-slate-700 text-slate-400 hover:border-cyan-300 hover:text-white"
                          }`}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <form onSubmit={handleTaskSubmit} className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Queue task
                  </p>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Task title"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2 text-xs">
                    <select
                      value={taskAgent}
                      onChange={(e) => setTaskAgent(e.target.value as AgentId)}
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"
                    >
                      {dataAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as TaskDTO["priority"])}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <input
                    type="datetime-local"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={actionState === "running"}
                    className="w-full rounded-xl bg-cyan-500/90 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-950 hover:bg-cyan-400"
                  >
                    Add task
                  </button>
                </form>

                <form onSubmit={handleEventSubmit} className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Log event
                  </p>
                  <textarea
                    value={eventText}
                    onChange={(e) => setEventText(e.target.value)}
                    placeholder="Delivery posted / blocker raised / LOI logged"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                    rows={3}
                  />
                  <div className="flex flex-wrap gap-2 text-xs">
                    <select
                      value={eventTone}
                      onChange={(e) => setEventTone(e.target.value as typeof eventTone)}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"
                    >
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="alert">Alert</option>
                    </select>
                    <select
                      value={eventAgent}
                      onChange={(e) => setEventAgent(e.target.value as AgentId | "")}
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"
                    >
                      <option value="">Broadcast</option>
                      {dataAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={actionState === "running"}
                    className="w-full rounded-xl bg-emerald-500/90 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-950 hover:bg-emerald-400"
                  >
                    Push to ticker
                  </button>
                </form>

                {actionMessage && (
                  <p className="text-xs text-cyan-200">{actionMessage}</p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Select a desk to activate the console.
              </p>
            )}
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <article className="rounded-3xl border border-slate-800 bg-[#050917] p-5">
            <header className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Task Flow</h3>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Drag coming soon
              </span>
            </header>
            <div className="grid gap-4 md:grid-cols-4">
              {groupedTasks.map((column) => (
                <div
                  key={column.key}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    {column.label} ({column.items.length})
                  </p>
                  <div className="mt-2 space-y-2 text-sm text-slate-200">
                    {column.items.length === 0 && (
                      <p className="text-slate-500">No tasks</p>
                    )}
                    {column.items.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-xl border border-slate-800/70 bg-slate-950/40 px-3 py-2"
                      >
                        <p>{task.title}</p>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                          {task.agentId}
                        </p>
                        {task.dueAt && (
                          <p className="text-[11px] text-slate-500">
                            Due {new Date(task.dueAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-[#050a14] p-5">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Event Ticker</h3>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Live
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
                      {item.agentId?.toUpperCase() ?? "ALL"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{item.time}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

function AgentDesk({
  agent,
  isActive,
  onSelect,
}: {
  agent: AgentDTO;
  isActive: boolean;
  onSelect: () => void;
}) {
  const lampColor =
    agent.status === "focus"
      ? "bg-cyan-400"
      : agent.status === "blocked"
      ? "bg-rose-500"
      : agent.status === "handoff"
      ? "bg-amber-400"
      : "bg-slate-500";

  return (
    <button
      onClick={onSelect}
      className={`group relative h-56 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/40 p-4 text-left shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
        isActive ? "ring-2 ring-cyan-400" : ""
      }`}
    >
      <div className="absolute inset-x-0 bottom-4 h-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-70" />
      <div className="flex items-center justify-between text-xs text-slate-400">
        <p className="uppercase tracking-[0.4em] text-slate-500">{agent.name}</p>
        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase">
          {STATUS_LABEL[agent.status]}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-md border border-slate-800 bg-slate-900">
          <div className={`absolute inset-x-2 top-2 h-2 rounded-full ${lampColor} blur-sm`} />
          <div className="absolute bottom-1 left-1 h-6 w-6 rounded-full bg-gradient-to-b from-slate-200 to-slate-500 opacity-80" />
          <div className="absolute bottom-0 right-2 h-3 w-6 rounded-t-lg bg-slate-700" />
        </div>
        <div className="flex-1 text-sm text-slate-100">
          <p>{agent.currentTask}</p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
            {agent.due}
          </p>
        </div>
      </div>
      <div className="mt-4 h-20 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
        <p>Mood: {agent.mood}</p>
        <p>Last heartbeat: {agent.lastHeartbeat ?? "–"}</p>
      </div>
    </button>
  );
}
