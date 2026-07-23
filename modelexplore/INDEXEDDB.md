
# Storage & Persistence Architecture

This application utilizes **IndexedDB** as its primary storage engine, abstracted through the **Dexie.js** library. This architecture is designed to support high-performance data exploration, allowing for the storage of large pharmacometric datasets that would otherwise exceed browser `localStorage` limits.

## Database Schema: `DrLeveyAIFileSystem`

The database name is generated dynamically per project and user (e.g., `DrLeveyAIFileSystem_user6_project15_sddsfsdf`), ensuring isolated storage environments. It consists of four primary tables, optimized for fast retrieval and reactive UI updates:

| Table | Key | Description |
| :--- | :--- | :--- |
| `datasets` | `id` | Stores raw DataRecords, column metadata, and the pipeline used to derive the dataset. |
| `instances` | `id` | Contains individual plot/table configurations, the generated R code, and cached visualization URLs. |
| `workflows` | `id` | Stores "Analytical Pipelines" which are sequences of chart types for batch execution. |
| `appSettings` | `id` | A singleton (ID: 0) persisting user preferences like the active dataset, terminal state, and view mode. |

## Key Mechanisms

### 1. Reactive Data Flow
The application uses `dexie-react-hooks` to implement an observer pattern. The `useLiveQuery` hook allows React components to bind directly to database queries. When data is modified (e.g., via the R console or the AI assistant), the UI updates instantly across the workspace.

### 2. Transactional Integrity
All batch operations, such as cloning an analysis or migrating data, are wrapped in **Dexie transactions**. This ensures that if an error occurs during a complex update, the database rolls back to a stable state, preventing workspace corruption.

### 3. Storage Migration
To maintain backward compatibility, the `services/db.ts` module includes a `migrateFromLocalStorage` function. This service:
1. Detects legacy `localStorage` data.
2. Atomically copies the data into IndexedDB tables.
3. Clears the `localStorage` to free up synchronous browser memory.

### 4. Database Seeding
On the first run (or after a "Clear Browser Data" action), the application automatically detects the absence of settings and datasets. It then hydrates the database with the `INITIAL_DATASETS` (e.g., `pkpd_study_001.csv`) and creates the default `appSettings` singleton.

## Advantages over LocalStorage
- **Capacity**: Can store hundreds of megabytes of CSV data compared to the 5MB limit of `localStorage`.
- **Performance**: Asynchronous API prevents blocking the main UI thread during large reads/writes.
- **Complexity**: Supports indexing on multiple fields (like `type` or `createdAt`), enabling fast filtering and sorting within the UI.