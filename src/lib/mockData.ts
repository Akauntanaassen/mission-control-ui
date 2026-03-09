export type AgentState = {
  id: "launch" | "offer" | "presale";
  name: string;
  role: string;
  status: "focus" | "idle" | "blocked" | "handoff";
  currentTask: string;
  due: string;
  mood: string;
  color: string;
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
