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

export type AgentsStatusResponse = {
  updatedAt: string;
  agents: {
    name: string;
    role: string;
    busy: boolean;
    health: "healthy" | "problem";
    currentTask?: string;
  }[];
};

const API_URL = process.env.NEXT_PUBLIC_CONTROLLER_URL || "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed (${res.status})`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function fetchSnapshot(): Promise<SnapshotDTO> {
  return request<SnapshotDTO>("/snapshot", { cache: "no-store" });
}

export async function fetchAgentsStatus(): Promise<AgentsStatusResponse> {
  return request<AgentsStatusResponse>("/agents/status", { cache: "no-store" });
}

export async function sendHeartbeat(agentId: AgentId, status: AgentDTO["status"]) {
  return request(`/agents/${agentId}/heartbeat`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export type CreateTaskPayload = {
  title: string;
  agentId: AgentId;
  priority?: TaskDTO["priority"];
  dueAt?: string;
  notes?: string;
};

export async function createTask(payload: CreateTaskPayload) {
  return request("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTask(
  taskId: string,
  payload: Partial<Pick<TaskDTO, "state" | "priority" | "notes" | "dueAt">>
) {
  return request(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function postEvent(payload: { text: string; tone?: EventDTO["tone"]; agentId?: AgentId }) {
  return request("/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
