
export const getLanguageForExtension = (extension?: string): string => {
  if (!extension) return 'plaintext';
  switch (extension.toLowerCase()) {
    case 'mod':
    case 'ctl':
    case 'phikl':
      return 'nonmem';
    case 'mlxtran':
      return 'monolix';
    case 'jl':
      return 'julia';
    case 'm':
    case 'sbproj':
    case 'qsp.mat':
    case 'mlx':
      return 'matlab';
    case 'r':
      return 'r';
    case 'py':
      return 'python';
    case 'cpp':
      return 'cpp';
    case 'csv':
    case 'xls':
    case 'xpt':
      return 'csv';
    case 'workflow':
      return 'json'; // Treat .workflow files as JSON for syntax highlighting
    case 'txt':
    case 'xlsx':
    case 'pptx':
      return 'plaintext';
    default:
      return 'plaintext';
  }
};

export const getEditorTheme = (language: string, _baseTheme?: 'light' | 'dark'): string => {
  const customLanguages = ['julia', 'matlab', 'monolix', 'nonmem', 'csv'];
  if (customLanguages.includes(language)) {
    return `${language}-dark`;
  }
  return 'vs-dark';
};

export const registerEditorShortcuts = (editor: any, monaco: any, actions: { onSave?: () => void }) => {
  if (actions.onSave) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      actions.onSave?.();
    });
  }
};
