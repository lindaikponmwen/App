export const monolixLanguageDefinition = {
  defaultToken: 'invalid',

  keywords: [
    'PK', 'EQUATION', 'DERIVATIVE', 'DESCRIPTION', 'EFFECT', 'INDIVIDUAL',
    'LONGITUDINAL', 'POPULATION', 'PRIOR', 'VARIABILITY', 'depot', 'pkmodel',
  ],

  typeKeywords: [
    'input', 'parameter', 'variable', 'table', 'DEFINITION', 'target', 'adm', 'trt', 'output', 'value', 'method', 'distribution', 'variance'
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
    '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
  ],

  symbols: /[=><!~?:&|+\-*/^%]+/,

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      [/<[A-Z_]+>/, 'tag'],
      [/\[[A-Z_]+\]/, 'metatag'],
      
      [/[a-zA-Z_][\w_]*/, {
        cases: {
          '@typeKeywords': 'keyword.type',
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],

      { include: '@whitespace' },
      [/[{}()[\]]/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],

      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/\d+/, 'number'],

      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
    ],
    
    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
    ],
  },
};

export const monolixTheme = {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
        { token: 'tag', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'metatag', foreground: '4ec9b0', fontStyle: 'bold' },
        { token: 'keyword', foreground: 'c586c0' },
        { token: 'keyword.type', foreground: '569cd6' },
        { token: 'identifier', foreground: '9cdcfe' },
        { token: 'operator', foreground: 'd4d4d4' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'invalid', foreground: 'ff6b6b' }
    ],
    colors: {},
};


export const monolixLightTheme = {
  base: 'vs' as const,
  inherit: true,
    rules: [
        { token: 'tag', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'metatag', foreground: '4ec9b0', fontStyle: 'bold' },
        { token: 'keyword', foreground: 'c586c0' },
        { token: 'keyword.type', foreground: '569cd6' },
        { token: 'identifier', foreground: '333333' },
        { token: 'operator', foreground: 'd4d4d4' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'invalid', foreground: 'ff6b6b' }
    ],
    colors: {},
};