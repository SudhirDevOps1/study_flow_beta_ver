import type { StudySession, Subject } from "@/types/models";

export interface BackupPayload {
  exportedAt: string;
  app: "FlowTrack";
  subjects: Subject[];
  sessions: StudySession[];
}

export function exportData(payload: BackupPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "study-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<BackupPayload> {
  const text = await file.text();
  const parsed = JSON.parse(text) as BackupPayload;
  if (parsed.app !== "FlowTrack") {
    throw new Error("Invalid FlowTrack backup file");
  }
  return parsed;
}
