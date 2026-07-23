
import { AppState } from '../types';
import { INITIAL_DATASETS } from './datasets';

export const DEFAULT_APP_STATE: AppState = {
  selectedDatasetId: INITIAL_DATASETS[0].id,
  datasets: INITIAL_DATASETS,
  activeCategory: null,
  activeInstanceId: null,
  viewMode: 'plot',
  isAddMenuOpen: false,
  isInstancesPanelOpen: false,
  isTerminalOpen: false,
  activePlotUrl: null,
  instances: [],
  // Fix: Added missing 'workflows' property to comply with the AppState interface
  workflows: []
};
