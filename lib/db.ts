import Dexie, { Table } from "dexie";

export interface FileData {
  timestamp: string;
}

export class MySubClassedDexie extends Dexie {
  FILE_DATA!: Table<FileData>;

  constructor() {
    super("/data");

    this.version(2.1).stores({
      FILE_DATA: ",timestamp",
    });
  }
}

export const db = new MySubClassedDexie();