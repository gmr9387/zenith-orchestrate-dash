import Dexie, { Table } from "dexie";

export interface TutorialStep {
  id?: number;
  tutorialId: string;
  ts: number;
  kind: "click" | "keydown" | "mutation" | "note";
  selector?: string;
  key?: string;
  snapshotDataUrl?: string;
  title?: string;
}

export interface TutorialDoc {
  id: string; // uuid
  title: string;
  createdAt: number;
  updatedAt: number;
  stepCount: number;
}

class AppDB extends Dexie {
  tutorials!: Table<TutorialDoc, string>;
  steps!: Table<TutorialStep, number>;
  constructor() {
    super("zilliance-app");
    this.version(1).stores({
      tutorials: "id, updatedAt, createdAt, title",
      steps: "++id, tutorialId, ts",
    });
  }
}

export const db = new AppDB();

