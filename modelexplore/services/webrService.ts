
import { WebR } from 'https://webr.r-wasm.org/latest/webr.mjs';
import eventBus from '../utils/eventBus';
import { arrayToCsv } from '../utils/csvUtils';

class WebRService {
  private webR: any = null;
  private initialized = false;
  private corePackagesInstalled = false;

  async init() {
    if (this.initialized) return this.webR;
    
    console.log('WebR: Initializing singleton instance...');
    eventBus.dispatch('webr-status', { status: 'loading', message: 'Initializing R Engine...' });
    
    try {
      this.webR = new WebR();
      await this.webR.init();
      this.initialized = true;
      
      eventBus.dispatch('webr-status', { status: 'loading', message: 'Installing core libraries (ggplot2, table1, knitr)...' });
      await this.webR.installPackages(['ggplot2', 'dplyr', 'jsonlite', 'table1', 'knitr']);
      
      // Explicitly load the libraries so they are available immediately
      eventBus.dispatch('webr-status', { status: 'loading', message: 'Loading R libraries into memory...' });
      await this.webR.evalRVoid('library(ggplot2); library(dplyr); library(jsonlite); library(table1); library(knitr)');
      
      this.corePackagesInstalled = true;
      
      // Default plot device
      await this.webR.evalRVoid('webr::canvas(width=800, height=600)');
      
      eventBus.dispatch('webr-status', { status: 'ready', message: 'Engine Ready' });
      eventBus.dispatch('webr-ready', this.webR);
      return this.webR;
    } catch (error) {
      console.error('WebR Init Error:', error);
      eventBus.dispatch('webr-status', { status: 'error', message: 'Engine Initialization Failed' });
      throw error;
    }
  }

  async mountDataset(name: string, data: any[]) {
    if (!this.initialized || !this.webR) return;
    
    try {
      let csvContent = arrayToCsv(data);
      if (!csvContent && data && data.length === 0) {
        csvContent = "empty_dataset\n"; 
      }

      const encoder = new TextEncoder();
      const uint8Data = encoder.encode(csvContent);
      const fsPath = name.startsWith('/') ? name : `/${name}`;
      
      await this.webR.FS.writeFile(fsPath, uint8Data);
      
      await this.webR.evalRVoid(`
        plot_data <- read.csv("${fsPath}", stringsAsFactors = FALSE, check.names = FALSE)
      `);
      
      eventBus.dispatch('webr-dataset-mounted', { name });
    } catch (error: any) {
      console.error('WebR Mounting Error:', error);
    }
  }

  getWebR() {
    return this.webR;
  }

  isReady() {
    return this.initialized && this.corePackagesInstalled;
  }
}

const webrService = new WebRService();
export default webrService;
