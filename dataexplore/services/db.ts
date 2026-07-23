
// Fix: Use named import for Dexie to ensure proper class extension and access to base methods like version() and transaction()
import { Dexie, type Table } from 'dexie';
import { AppState, ChartInstance, Workflow, DatasetConfig, ChartType, ViewMode } from '../types';
import { DEFAULT_APP_STATE } from '../data/initialData';
import { currentUser, currentProject } from '../data/config';

const STORAGE_KEY = 'data_explorer_pro_v4_storage';

// Define a simplified AppState for settings storage
export interface AppSettings {
  id?: number; // Use a static ID like 0 for a singleton settings object
  selectedDatasetId: string;
  activeCategory: ChartType | null;
  activeInstanceId: string | null;
  viewMode: ViewMode;
  isInstancesPanelOpen: boolean;
  isTerminalOpen: boolean;
}

// Fix: Extending Dexie now correctly inherits methods after fixing the import
export class DataExplorerDB extends Dexie {
  instances!: Table<ChartInstance>;
  workflows!: Table<Workflow>;
  datasets!: Table<DatasetConfig>;
  appSettings!: Table<AppSettings>;

  constructor() {
    const dbName = `DrLeveyAIFileSystem_user${currentUser.id}_project${currentProject.id}_${currentProject.uniqueDataId}`;
    super(dbName);
    // Fix: version() is now recognized as a property of the base Dexie class
    this.version(1).stores({
      instances: '&id, type, name, createdAt', // &id means 'id' is the primary key and unique
      workflows: '&id, name, createdAt',
      datasets: '&id, name, createdAt',
      appSettings: 'id', // Simple primary key for our singleton settings object
    });
  }
}

export const db = new DataExplorerDB();

/**
 * A one-time migration function to move data from localStorage to IndexedDB.
 */
export async function migrateFromLocalStorage() {
  const hasBeenMigrated = await db.appSettings.count() > 0;
  const oldData = localStorage.getItem(STORAGE_KEY);

  if (hasBeenMigrated || !oldData) {
    if (oldData) {
      console.log('Old localStorage data found but migration already complete. Removing old data.');
      localStorage.removeItem(STORAGE_KEY);
    }
    return;
  }

  console.log('Starting migration from localStorage to IndexedDB...');

  try {
    const parsedState: AppState = JSON.parse(oldData);
    
    // Fix: transaction() is now recognized as a property of the base Dexie class
    await db.transaction('rw', db.instances, db.workflows, db.datasets, db.appSettings, async () => {
      // Bulk add data to their respective tables
      if (parsedState.instances?.length) {
        await db.instances.bulkPut(parsedState.instances);
      }
      if (parsedState.workflows?.length) {
        await db.workflows.bulkPut(parsedState.workflows);
      }
      if (parsedState.datasets?.length) {
        await db.datasets.bulkPut(parsedState.datasets);
      }

      // Store the settings part of the state
      await db.appSettings.put({
        id: 0,
        selectedDatasetId: parsedState.selectedDatasetId,
        activeCategory: parsedState.activeCategory,
        activeInstanceId: parsedState.activeInstanceId,
        viewMode: parsedState.viewMode,
        isInstancesPanelOpen: parsedState.isInstancesPanelOpen,
        isTerminalOpen: parsedState.isTerminalOpen,
      });
    });

    console.log('Migration successful! Removing old localStorage data.');
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to migrate data from localStorage:', error);
    // Do not remove old data if migration fails
  }
}
