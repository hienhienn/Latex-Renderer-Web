const snippet2 = [
  {
    caption: '\\begin{document}',
    snippet: '\\begin{document}\n\t$0\n\\end{document}'
  },
  {
    caption: '\\begin{enumerate}',
    snippet: '\\begin{enumerate}\n\t\\item $0\n\\end{enumerate}'
  },
  {
    caption: '\\begin{itemize}',
    snippet: '\\begin{itemize}\n\t\\item $0\n\\end{itemize}'
  },
  {
    caption: '\\begin{table}',
    snippet:
      '\\begin{table}\r\n\t\\centering\r\n\t\\begin{tabular}\r\n\t\t\r\n\t\\end{tabular}\r\n\t\\caption{Caption}\r\n\t\\label{tab:my_label}\r\n\\end{table}'
  },
  {
    caption: '\\begin{figure}',
    snippet:
      '\\begin{figure}\r\n\t\\centering\r\n\t\\includegraphics[]{}\r\n\t\\caption{Caption}\r\n\t\\label{fig:enter-label}\r\n\\end{figure}'
  }
]

import snippet from './snippet.json'

export const getCompletionItemProvider = (monaco) => ({
  provideCompletionItems: function (model, position) {
    const suggestions = [...snippet, ...snippet2].map((e) => ({
      label: e.caption,
      insertText: e.snippet,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    }))
    return { suggestions: suggestions }
  }
})

// const snippet = [
//   {
//     label: '\\documentclass{}',
//     insertText: '\\documentclass{$0}'
//   },
//   {
//     label: '\\documentclass[]{}',
//     insertText: '\\documentclass[$0]{}'
//   },
//   {
//     label: '\\usepackage{}',
//     insertText: '\\usepackage{$0}'
//   },
//   {
//     label: '\\usepackage[]{}',
//     insertText: '\\usepackage[$0]{}'
//   },
//   {
//     label: '\\begin{}',
//     insertText: '\\begin{$0}\n\t\n\\end{$0}'
//   },
//   {
//     label: '\\begin{document}',
//     insertText: '\\begin{document}\n\t$0\n\\end{document}'
//   },
//   {
//     label: '\\section{}',
//     insertText: '\\section{$1}'
//   },
//   {
//     label: '\\subsection{}',
//     insertText: '\\subsection{$1}'
//   },
//   {
//     label: '\\textbf{}',
//     insertText: '\\textbf{$1}'
//   },
//   {
//     label: '\\emph{}',
//     insertText: '\\emph{$1}'
//   },
//   {
//     label: '\\item',
//     insertText: '\\item'
//   },
//   {
//     label: '\\cite{}',
//     insertText: '\\cite{$1}'
//   },
//   {
//     label: '\\label{}',
//     insertText: '\\label{$1}'
//   },
//   {
//     label: '\\includegraphics[]{}',
//     insertText: '\\includegraphics[$0]{}'
//   },
//   {
//     label: '\\frac{}{}',
//     insertText: '\\frac{$0}{}'
//   }
// ]
