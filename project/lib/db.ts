
import Dexie, { Table } from 'dexie';
import { FileNode } from '../src/contexts/FileContext';
import { currentUser, currentProject } from '../src/data/appConfig';

export type StoredFileNode = Omit<FileNode, 'children'> & { 
  parentId: string | null;
  is_synced?: boolean;
  last_synced_at?: string | null;
  db_id?: string;
};

// Create a unique database name for each project to ensure data isolation.
const dbName = `DrLeveyAIFileSystem_user${currentUser.id}_project${currentProject.id}`;

class FileDB extends Dexie {
  // The table within each project-specific database will be named 'files'.
  files!: Table<StoredFileNode, string>;

  constructor() {
    super(dbName);
    // Updated schema to include is_synced for efficient querying
    // Version 3: added db_id
    (this as Dexie).version(3).stores({
      files: 'id, parentId, is_synced, db_id',
    });
  }
}

const db = new FileDB();

export const getNode = async (id: string): Promise<StoredFileNode | undefined> => {
  return db.files.get(id);
};

export const getAllNodes = async (): Promise<StoredFileNode[]> => {
  return db.files.toArray();
};

export const putNode = async (node: StoredFileNode): Promise<void> => {
  await db.files.put(node);
};

export const putNodes = async (nodes: StoredFileNode[]): Promise<void> => {
  await db.files.bulkPut(nodes);
};

export const deleteNodes = async (ids: string[]): Promise<void> => {
  await db.files.bulkDelete(ids);
};

export const clearStore = async (): Promise<void> => {
  await db.files.clear();
};

export const findChildNode = async (parentId: string, name: string): Promise<StoredFileNode | undefined> => {
  return db.files.where('parentId').equals(parentId).filter(node => node.name === name).first();
};
