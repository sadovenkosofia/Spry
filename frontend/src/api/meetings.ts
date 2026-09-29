import type { Meeting, MeetingCreate } from "@/types/meeting";

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (Array.isArray(body?.detail) && body.detail.length > 0) {
      return body.detail.map((d: { msg: string }) => d.msg).join("; ");
    }
  } catch {
    // fall through to the generic message
  }
  return `Request failed (${response.status})`;
}

export async function listMeetings(): Promise<Meeting[]> {
  const response = await fetch("/api/meetings");
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json();
}

export async function createMeeting(input: MeetingCreate): Promise<Meeting> {
  const response = await fetch("/api/meetings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json();
}
