export type AgentState = {
  id: "launch" | "offer" | "presale" | "systems" | "systems";
  name: string;
  role: string;
  status: "focus" | "idle" | "blocked" | "handoff";
  currentTask: string;
  due: string;
  mood: string;
  color: string;
  lastHeartbeat: string;
};

export type WallDisplay = {
  id: string;
  title: string;
  value: string;
  detail: string;
};

export type EventLog = {
  id: string;
  time: string;
  text: string;
  agentId?: AgentState["id"];
  tone?: "info" | "alert" | "success";
};

export const agents: AgentState[] = [
  {
    id: "launch",
    name: "Launch Producer",
    role: "Mission run-of-show",
    status: "focus",
    currentTask: "Edit DARPA teaser cut",
    due: "Due 22:00",
    mood: "Locked in",
    color: "from-orange-400 to-pink-500",
    lastHeartbeat: "19:44",
  },
  {
    id: "offer",
    name: "Offer Engineer",
    role: "Package offers",
    status: "handoff",
    currentTask: "Price modeling v2",
    due: "Review 09:00",
    mood: "Awaiting feedback",
    color: "from-sky-400 to-indigo-500",
    lastHeartbeat: "19:41",
  },
  {
    id: "presale",
    name: "Presale Navigator",
    role: "Pipeline & LOIs",
    status: "idle",
    currentTask: "Lock Tier-A outreach",
    due: "Next touch 10:00",
    mood: "Queued",
    color: "from-emerald-400 to-lime-500",
    lastHeartbeat: "19:32",
  },
  {
    id: "systems",
    name: "Systems Engineer",
    role: "Test & Telemetry",
    status: "focus",
    currentTask: "Document PPA-CF usage + telemetry plan",
    due: "Field packet draft",
    mood: "Methodical",
    color: "from-teal-400 to-cyan-500",
    lastHeartbeat: "19:35",
  },
];

export const wallDisplays: WallDisplay[] = [
  {
    id: "timeline",
    title: "Launch Timeline",
    value: "T-12 days",
    detail: "Spin tests lock tomorrow",
  },
  {
    id: "offers",
    title: "Offer Readiness",
    value: "78%",
    detail: "Legal Ops FAQ pending",
  },
  {
    id: "pipeline",
    title: "Presale Pipeline",
    value: "6 active",
    detail: "+2 LOI drafts",
  },
];

export const eventLog: EventLog[] = [
  {
    id: "evt-1",
    time: "19:24",
    text: "Launch Producer uploaded raw FLIR pack.",
    agentId: "launch",
    tone: "info",
  },
  {
    id: "evt-2",
    time: "19:31",
    text: "Offer Engineer flagged pricing delta.",
    agentId: "offer",
    tone: "alert",
  },
  {
    id: "evt-3",
    time: "19:33",
    text: "Presale Navigator booked GeoInfra intro.",
    agentId: "presale",
    tone: "success",
  },
];

export const mockTasks = [
  {
    id: "task-1",
    title: "Cut 30s DARPA teaser",
    agentId: "launch",
    state: "running",
    priority: "high",
    dueAt: "2026-03-09T22:00:00Z",
  },
  {
    id: "task-2",
    title: "Legal Ops FAQ pass",
    agentId: "offer",
    state: "queued",
    priority: "medium",
    dueAt: "2026-03-10T15:00:00Z",
  },
  {
    id: "task-3",
    title: "GeoInfra intro follow-up",
    agentId: "presale",
    state: "queued",
    priority: "low",
    dueAt: "2026-03-09T17:00:00Z",
  },
];
