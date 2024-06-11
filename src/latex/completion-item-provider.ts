export const getCompletionItemProvider = (monaco) => ({
  provideCompletionItems: function (model, position) {
    const suggestions = [
      {
        label: '\\begin{document}',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '\\begin{document}\n\t$0\n\\end{document}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Begin document environment'
      },
      {
        label: '\\section{}',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '\\section{$1}\n',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Section'
      },
      {
        label: '\\subsection{}',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '\\subsection{$1}\n',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Subsection'
      },
      {
        label: '\\textbf{}',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '\\textbf{$1}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Bold text'
      },
      {
        label: '\\emph{}',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '\\emph{$1}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Italic text'
      }
    ]
    return { suggestions: suggestions }
  }
})
