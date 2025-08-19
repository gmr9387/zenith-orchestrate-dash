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

export interface TutorialMedia {
  id: string; // tutorialId
  mimeType: string;
  createdAt: number;
  blob: Blob;
}

class AppDB extends Dexie {
  tutorials!: Table<TutorialDoc, string>;
  steps!: Table<TutorialStep, number>;
  media!: Table<TutorialMedia, string>;
  constructor() {
    super("zilliance-app");
    this.version(1).stores({
      tutorials: "id, updatedAt, createdAt, title",
      steps: "++id, tutorialId, ts",
    });
    this.version(2).stores({
      tutorials: "id, updatedAt, createdAt, title",
      steps: "++id, tutorialId, ts",
      media: "id",
    });
  }
}

export const db = new AppDB();

