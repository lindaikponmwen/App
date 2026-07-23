import { juliaLanguageDefinition, juliaTheme, juliaLightTheme } from './julia';
import { matlabLanguageDefinition, matlabTheme, matlabLightTheme } from './matlab';
import { monolixLanguageDefinition, monolixTheme, monolixLightTheme } from './monolix';
import { nonmemLanguageDefinition, nonmemTheme, nonmemLightTheme } from './nonmem';
import { csvLanguageDefinition, csvTheme, csvLightTheme } from './csv';

let setupDone = false;

export function setupMonaco(monaco: any) {
  if (setupDone) {
    return;
  }
  
  // Julia
  monaco.languages.register({ id: 'julia' });
  monaco.languages.setMonarchTokensProvider('julia', juliaLanguageDefinition);
  monaco.editor.defineTheme('julia-dark', juliaTheme);
  monaco.editor.defineTheme('julia-light', juliaLightTheme);

  // MATLAB
  monaco.languages.register({ id: 'matlab' });
  monaco.languages.setMonarchTokensProvider('matlab', matlabLanguageDefinition);
  monaco.editor.defineTheme('matlab-dark', matlabTheme);
  monaco.editor.defineTheme('matlab-light', matlabLightTheme);
  
  // Monolix
  monaco.languages.register({ id: 'monolix' });
  monaco.languages.setMonarchTokensProvider('monolix', monolixLanguageDefinition);
  monaco.editor.defineTheme('monolix-dark', monolixTheme);
  monaco.editor.defineTheme('monolix-light', monolixLightTheme);
  
  // NONMEM
  monaco.languages.register({ id: 'nonmem' });
  monaco.languages.setMonarchTokensProvider('nonmem', nonmemLanguageDefinition);
  monaco.editor.defineTheme('nonmem-dark', nonmemTheme);
  monaco.editor.defineTheme('nonmem-light', nonmemLightTheme);

  // CSV
  monaco.languages.register({ id: 'csv' });
  monaco.languages.setMonarchTokensProvider('csv', csvLanguageDefinition);
  monaco.editor.defineTheme('csv-dark', csvTheme);
  monaco.editor.defineTheme('csv-light', csvLightTheme);

  setupDone = true;
}