import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

export default {
  provideCompletionItems: () => {
    const suggestions = [
      {
        label: '\\begin',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '\\begin{${1:environment}}\n\t$0\n\\end{${1:environment}}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Begin environment'
      },
      {
        label: '\\section',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '\\section{${1:section name}}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Section'
      }
      // Add more suggestions as needed
    ]
    return { suggestions: suggestions }
  }
}
