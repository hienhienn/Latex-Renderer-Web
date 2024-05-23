/* eslint-disable */

/**
 * Custom language definition from https://microsoft.github.io/monaco-editor/monarch.html
 * (in Monarch format)
 */
export default {
  defaultToken: '',
  tokenPostfix: '.tex',

  variableKeywords: [
    '\\documentclass',
    '\\begin',
    '\\end',
    '\\label',
    '\\ref',
    '\\cite',
    '\\bibliography',
    '\\bibliographystyle'
  ],

  // Define the LaTeX language keywords and commands
  keywords: [
    '\\documentclass',
    '\\usepackage',
    '\\begin',
    '\\end',
    '\\section',
    '\\subsection',
    '\\subsubsection',
    '\\paragraph',
    '\\subparagraph',
    '\\title',
    '\\author',
    '\\date',
    '\\maketitle',
    '\\tableofcontents',
    '\\listoffigures',
    '\\listoftables',
    '\\part',
    '\\chapter',
    '\\appendix',
    '\\bibliography',
    '\\bibliographystyle',
    '\\cite',
    '\\label',
    '\\ref',
    '\\textbf',
    '\\textit',
    '\\underline',
    '\\item'
  ],

  // Define tokenizer
  tokenizer: {
    root: [
      { include: '@whitespace' },
      { include: '@comments' },
      // Match LaTeX commands
      [
        /(\\[a-zA-Z_]+)/,
        {
          cases: {
            '@variableKeywords': {
              token: 'keyword',
              next: '@keywordParameter'
            },
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }
      ],
      // Match math environments
      [/\$\$/, 'constant', '@mathDouble'],
      [/\$/, 'constant', '@mathSingle'],
      [/\\\[/, 'constant', '@mathDisplay'],
      [/\\\]/, 'constant', '@pop'],
      [/\\\(/, 'constant', '@mathDisplayRoundBr'],
      [/\\\)/, 'constant', '@pop'],
      [/[{}()\[\]]/, '@brackets']
    ],

    whitespace: [
      [/[ \t\r\n]+/, ''],
      [/%.*/, 'comment']
    ],

    comments: [[/%.*/, 'comment']],

    keywordParameter: [
      [/\{/, { token: 'delimiter.bracket', next: '@parameter' }],
      ['[^\\{]', { token: '@rematch', next: '@pop' }]
    ],

    parameter: [
      [/[^\}]+/, 'string'],
      [/\}/, { token: 'delimiter.bracket', next: '@pop' }]
    ],

    mathDouble: [
      [/[^\$]+/, 'constant'],
      [/\$\$/, 'constant', '@pop']
    ],

    mathSingle: [
      [/[^\$]+/, 'constant'],
      [/\$/, 'constant', '@pop']
    ],

    mathDisplay: [
      [/[^\\\]]+/, 'constant'],
      [/\\\]/, 'constant', '@pop']
    ],

    mathDisplayRoundBr: [
      [/[^\\\)]+/, 'constant'],
      [/\\\)/, 'constant', '@pop']
    ],

    stringDouble: [
      [/[^"]+/, 'string'],
      [/"/, 'string', '@pop']
    ],

    stringSingle: [
      [/[^']+/, 'string'],
      [/'/, 'string', '@pop']
    ]
  }
}
