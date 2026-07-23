export const csvLanguageDefinition = {
  defaultToken: 'invalid',
  
  tokenizer: {
    root: [
      // Quoted strings, handling escaped quotes
      [/"([^"\\]|\\.)*"/, 'string'],
      
      // Numbers (integers, floats, scientific notation)
      [/[+-]?\d*\.\d+([eE][+-]?\d+)?/, 'number.float'],
      [/[+-]?\d+/, 'number'],
      
      // Delimiter
      [/,/, 'delimiter.csv'],
      
      // Any other characters are treated as plain text/identifiers
      [/[^,"]+/, 'identifier']
    ],
  },
};

export const csvTheme = {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'delimiter.csv', foreground: 'd4d4d4' },
        { token: 'identifier', foreground: '9cdcfe' },
        { token: 'invalid', foreground: 'ff6b6b' },
    ],
    colors: {},
};

export const csvLightTheme = {
    base: 'vs' as const,
    inherit: true,
    rules: [
        { token: 'string', foreground: 'a31515' },
        { token: 'number', foreground: '098658' },
        { token: 'delimiter.csv', foreground: '000000' },
        { token: 'identifier', foreground: '001080' },
        { token: 'invalid', foreground: 'ff0000' },
    ],
    colors: {},
};
