export type AgentId = "launch" | "offer" | "presale";

export type AgentDTO = {
  id: AgentId;
  name: string;
  role: string;
  status: "focus" | "idle" | "blocked" | "handoff";
  currentTask: string;
  due: string;
  mood: string;
  color: string;
  lastHeartbeat: string;
};

export type TaskDTO = {
  id: string;
  title: string;
  agentId: AgentId;
  state: "queued" | "running" | "review" | "done" | "blocked";
  priority: "low" | "medium" | "high";
  dueAt?: string;
  notes?: string;
};

export type EventDTO = {
  id: string;
  time: string;
  text: string;
  tone?: "info" | "alert" | "success";
  agentId?: AgentId;
};

export type SnapshotDTO = {
  agents: AgentDTO[];
  tasks: TaskDTO[];
  events: EventDTO[];
};

const API_URL = process.env.NEXT_PUBLIC_CONTROLLER_URL || "http://localhost:4000";

export async function fetchSnapshot(): Promise<SnapshotDTO> {
  const res = await fetch(`${API_URL}/snapshot`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load snapshot (${res.status})`);
  }
  return res.json();
}
