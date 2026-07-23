export const matlabLanguageDefinition = {
  defaultToken: 'invalid',
  
  keywords: [
    'if', 'else', 'elseif', 'end', 'for', 'while', 'switch', 'case', 'otherwise',
    'try', 'catch', 'function', 'return', 'global', 'persistent', 'break', 'continue',
    'classdef', 'properties', 'methods', 'events', 'enumeration',
  ],

  operators: [
    '=', '>', '<', '~', '==', '<=', '>=', '~=', '&&', '||',
    '+', '-', '*', '/', '\\', '^', '.*', './', '.\\', '.^',
    '&', '|', ':',
  ],

  // common functions
  builtinFunctions: [
    'disp', 'plot', 'figure', 'title', 'xlabel', 'ylabel', 'legend', 'grid', 'hold',
    'zeros', 'ones', 'eye', 'rand', 'randn', 'size', 'length', 'numel', 'linspace', 'logspace',
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log', 'log10', 'sqrt', 'abs',
    'sum', 'mean', 'std', 'var', 'min', 'max', 'find', 'sort', 'reshape', 'transpose',
    'inv', 'det', 'eig', 'svd', 'fft', 'ifft',
  ],

  symbols: /[=><~&|+\-*/\\^:]+/,

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // comments
      [/%\{/, 'comment', '@commentBlock'],
      [/%(.*)$/, 'comment'],

      // strings
      [/'/, 'string', '@string'],

      // identifiers and keywords
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@builtinFunctions': 'keyword.function',
          '@default': 'identifier'
        }
      }],
      
      // whitespace
      { include: '@whitespace' },

      // delimiters and operators
      [/[{}()\[\]]/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],

      // numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/\d+/, 'number'],
    ],

    commentBlock: [
      [/[^%]+/, 'comment'],
      [/%\}/, 'comment', '@pop'],
      [/%/, 'comment']
    ],

    string: [
      [/[^']+/, 'string'],
      [/''/, 'string.escape'],
      [/'/, 'string', '@pop']
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
    ],
  },
};

export const matlabTheme = {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c586c0' },
        { token: 'keyword.function', foreground: 'dcdcaa' },
        { token: 'identifier', foreground: '9cdcfe' },
        { token: 'operator', foreground: 'd4d4d4' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'string.escape', foreground: 'd7ba7d' },
        { token: 'invalid', foreground: 'ff6b6b' },
    ],
    colors: {},
};


export const matlabLightTheme = {
    base: 'vs' as const,
    inherit: true,
    rules: [
        { token: 'comment', foreground: '787272', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c586c0' },
        { token: 'keyword.function', foreground: '2c16d9' },
        { token: 'identifier', foreground: '333333' },
        { token: 'operator', foreground: 'd4d4d4' },
        { token: 'number', foreground: '3f9512' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'string.escape', foreground: 'd7ba7d' },
        { token: 'invalid', foreground: 'ff6b6b' },
    ],
    colors: {},
};