export const juliaLanguageDefinition = {
  defaultToken: 'invalid',
  
  keywords: [
    'if', 'else', 'elseif', 'end', 'for', 'while', 'try', 'catch', 'finally',
    'function', 'return', 'global', 'local', 'const', 'break', 'continue',
    'module', 'using', 'import', 'export', 'struct', 'mutable', 'begin', 'do',
    'let', 'quote', 'macro', 'abstract', 'primitive', 'type',
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
    '&&', '||', '+', '-', '*', '/', '\\', '^', '%',
    '+=', '-=', '*=', '/=', '\\=', '^=', '%=', '÷=',
    '<<', '>>', '>>>', '->', '=>', '::', '...', '.',
  ],

  // common functions & macros
  builtins: [
    'println', 'print', 'sqrt', 'sin', 'cos', 'tan', 'exp', 'log', 'log10',
    'abs', 'sum', 'mean', 'std', 'var', 'min', 'max', 'findfirst', 'sort',
    'push!', 'pop!', 'length', 'size', 'ones', 'zeros', 'rand',
    'typeof', 'isa', 'supertype', 'subtypes',
    '@printf', '@assert', '@time', '@show',
  ],
  
  typeKeywords: [
    'Int', 'Int8', 'Int16', 'Int32', 'Int64', 'Int128',
    'UInt', 'UInt8', 'UInt16', 'UInt32', 'UInt64', 'UInt128',
    'Float16', 'Float32', 'Float64',
    'Bool', 'Char', 'String', 'Symbol', 'Array', 'Vector', 'Matrix',
    'Dict', 'Set', 'Tuple', 'Any', 'Nothing', 'Missing',
  ],

  constants: ['true', 'false', 'nothing', 'missing', 'pi', 'Inf', 'NaN'],

  symbols: /[=><!~?:&|+\-*/\\^%]+/,

  escapes: /\\(?:[abfnrtv"'\\]|x[0-9A-Fa-f]{1,2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // comments
      [/#[^=].*$/, 'comment'],
      [/#=/, 'comment', '@commentBlock'],

      // strings
      [/"/, 'string', '@string_double'],
      [/"""/, 'string', '@string_double_triple'],
      [/'/, 'string.character'],

      // macros
      [/@[a-zA-Z_]\w*/, 'metatag'],

      // identifiers and keywords
      [/[a-zA-Z_]\w*[!]?/, {
        cases: {
          '@keywords': 'keyword',
          '@builtins': 'keyword.function',
          '@typeKeywords': 'keyword.type',
          '@constants': 'keyword',
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
      [/0x[0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],
    ],

    commentBlock: [
      [/[^=#]+/, 'comment'],
      [/=#/, 'comment', '@pop'],
      [/[=#]/, 'comment']
    ],

    string_double: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, 'string', '@pop']
    ],

    string_double_triple: [
        [/[^"]+/, 'string'],
        [/"""/, 'string', '@pop']
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
    ],
  },
};

export const juliaTheme = {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c586c0' },
        { token: 'keyword.function', foreground: 'dcdcaa' },
        { token: 'keyword.type', foreground: '4ec9b0' },
        { token: 'metatag', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'identifier', foreground: '9cdcfe' },
        { token: 'operator', foreground: 'd4d4d4' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'string.escape', foreground: 'd7ba7d' },
        { token: 'string.character', foreground: 'ce9178' },
        { token: 'invalid', foreground: 'ff6b6b' },
    ],
    colors: {},
};

export const juliaLightTheme = {
    base: 'vs' as const,
    inherit: true,
    rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000ff' },
        { token: 'keyword.function', foreground: '795e26' },
        { token: 'keyword.type', foreground: '267f99' },
        { token: 'metatag', foreground: '0000ff', fontStyle: 'bold' },
        { token: 'identifier', foreground: '000000' },
        { token: 'operator', foreground: '000000' },
        { token: 'number', foreground: '098658' },
        { token: 'string', foreground: 'a31515' },
        { token: 'string.escape', foreground: '267f99' },
        { token: 'string.character', foreground: 'a31515' },
        { token: 'invalid', foreground: 'ff0000' },
    ],
    colors: {},
};