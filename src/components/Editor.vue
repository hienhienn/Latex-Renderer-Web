<template>
  <div class="container-editor" :theme="theme">
    <div class="editor-control">
      <div>
        <a-button size="small" type="text" class="quick-btn" @click="() => onInsertText('textbf')">
          <bold-outlined />
        </a-button>
        <a-button size="small" type="text" class="quick-btn" @click="() => onInsertText('textit')">
          <italic-outlined />
        </a-button>
        <a-button
          size="small"
          type="text"
          class="quick-btn"
          @click="() => onInsertText('underline')"
        >
          <underline-outlined />
        </a-button>
        <a-divider
          type="vertical"
          orientationMargin="2px"
          style="height: 16px; background-color: #d9d5ec"
        />
        <a-button
          size="small"
          type="text"
          class="quick-btn"
          @click="() => onInsertList('enumerate')"
        >
          <ordered-list-outlined />
        </a-button>
        <a-button size="small" type="text" class="quick-btn" @click="() => onInsertList('itemize')">
          <unordered-list-outlined />
        </a-button>
        <a-button size="small" type="text" class="quick-btn" @click="onInsertTable">
          <table-outlined />
        </a-button>
        <a-button size="small" type="text" class="quick-btn" @click="onInsertFigure">
          <file-image-outlined />
        </a-button>
      </div>
      <div>
        <a-button
          type="primary"
          size="small"
          :disabled="isSave"
          @click="onSave"
          :loading="loading"
          v-if="!readonly"
        >
          <save-outlined />
        </a-button>
      </div>
    </div>
    <div style="position: absolute; left: 0; right: 0; top: 38px; bottom: 0">
      <vue-monaco-editor
        v-model:value="code"
        theme="vs-dark"
        @mount="handleMount"
        language="latex"
        :options="OPTIONS"
        :onChange="onChangeCode"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, h, ref, shallowRef, watch, computed, inject } from 'vue'
import { serviceAPI } from '@/services/API'
import { Button, notification } from 'ant-design-vue'
import { NotiError } from '@/services/notification'
import tokensProvider from '@/latex/tokens-provider'
import languageConfig from '@/latex/language-config'
import { getCompletionItemProvider } from '@/latex/completion-item-provider'
import {
  BoldOutlined,
  FileImageOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  SaveOutlined,
  TableOutlined,
  UnderlineOutlined,
  UnorderedListOutlined
} from '@ant-design/icons-vue'
import { DefaultEditorOptions } from '@/constant'

export default defineComponent({
  components: {
    BoldOutlined,
    ItalicOutlined,
    UnderlineOutlined,
    UnorderedListOutlined,
    OrderedListOutlined,
    TableOutlined,
    FileImageOutlined,
    SaveOutlined
  },
  props: {
    initData: {
      type: Object,
      default: () => {
        return {
          content: '',
          id: ''
        }
      }
    },
    readonly: {
      type: Boolean,
      default: false
    },
    editorOptions: {
      type: Object,
      default: DefaultEditorOptions
    }
  },
  emits: ['update:save', 'conflict', 'update:files', 'update:code'],
  setup(props, { emit }) {
    const theme = inject('theme')
    const OPTIONS = {
      automaticLayout: true,
      formatOnType: true,
      formatOnPaste: true,
      scrollBeyondLastLine: false,
      quickSuggestions: true,
      readOnly: props.readonly,
      matchBrackets: false,
      ...props.editorOptions
    }
    const isSave = computed(() => code.value === props.initData.content)
    const loading = ref(false)
    const code = ref(props.initData.localContent || props.initData.content)
    const rename = ref(false)
    const newName = ref(props.initData.name.split('.')[0])
    let to
    let shaCode = props.initData.localShaCode

    const editorRef = shallowRef()
    const handleMount = (editor, monaco) => {
      monaco.languages.register({ id: 'latex' })
      monaco.languages.setMonarchTokensProvider('latex', tokensProvider as any)
      monaco.languages.setLanguageConfiguration('latex', languageConfig as any)
      monaco.languages.registerCompletionItemProvider('latex', getCompletionItemProvider(monaco))
      editorRef.value = editor
    }

    watch(
      () => [props.initData],
      ([newValue]) => {
        code.value = newValue.localContent || newValue.content
      }
    )

    watch(
      () => [props.editorOptions],
      () => {
        editorRef.value.updateOptions(props.editorOptions)
      }
    )

    const onSave = () => {
      if (loading.value) return
      loading.value = true
      serviceAPI
        .updateFile(props.initData.id, {
          content: code.value,
          shaCode: shaCode
        })
        .then((res) => {
          emit('update:save', {
            id: props.initData.id,
            name: props.initData.name,
            path: props.initData.path,
            content: code.value,
            localShaCode: res.data.shaCode,
            shaCode: res.data.shaCode,
            type: props.initData.type,
            oldShaCode: shaCode
          })
          shaCode = res.data.shaCode
        })
        .catch((err) => {
          if (err.response.status == 400) {
            notification.error({
              message: 'File has been changed',
              description: 'Please update file before save!',
              btn: () =>
                h(
                  Button,
                  {
                    type: 'primary',
                    onClick: () => {
                      emit('conflict', err.response.data)
                      notification.close(`updateFile${props.initData.id}`)
                    }
                  },
                  { default: () => 'Update' }
                ),
              key: `updateFile${props.initData.id}`
            })
          } else NotiError('Failed to update this file!')
        })
        .finally(() => {
          loading.value = false
        })
    }

    const onChangeCode = () => {
      emit('update:code', {
        id: props.initData.id,
        isSave: isSave.value
      })
      to && clearTimeout(to)
      to = setTimeout(() => {
        if (code.value !== props.initData.content) {
          localStorage.setItem(props.initData.id, code.value)
          if (!localStorage.getItem(`sha-${props.initData.id}`)) {
            localStorage.setItem(`sha-${props.initData.id}`, props.initData.shaCode)
          }
        } else {
          localStorage.removeItem(props.initData.id)
          localStorage.removeItem(`sha-${props.initData.id}`)
          shaCode = props.initData.shaCode
        }
      }, 500)
      return () => clearTimeout(to)
    }

    const onInsertText = (style: string) => {
      if (editorRef.value) {
        const selections = editorRef.value.getSelections()
        console.log(selections)
        const op = selections.map((selection) => {
          const text = editorRef.value.getModel().getValueInRange(selection)
          console.log(text)
          return {
            range: {
              startLineNumber: selection?.startLineNumber || 1,
              startColumn: selection?.startColumn || 1,
              endLineNumber: selection?.endLineNumber || 1,
              endColumn: selection?.endColumn || 1
            },
            text: `\\${style}{${text}}`,
            forceMoveMarkers: false
          }
        })

        editorRef.value.executeEdits('my-source', op)

        if (selections.length === 1) {
          const newSelection = editorRef.value.getSelection()
          console.log(newSelection)
          editorRef.value.focus()
          editorRef.value.setPosition({
            lineNumber: newSelection?.startLineNumber || 1,
            column: newSelection?.endColumn - 1 || style.length + 3
          })
          if (
            newSelection.startLineNumber !== newSelection.endLineNumber ||
            newSelection.startColumn !== newSelection.endColumn
          )
            editorRef.value.setSelection({
              selectionStartLineNumber: newSelection?.startLineNumber || 1,
              selectionStartColumn:
                newSelection?.startColumn + style.length + 2 || 3 + style.length,
              positionLineNumber: newSelection?.endLineNumber || 1,
              positionColumn: newSelection?.endColumn - 1 || 1
            })
        }
      }
    }

    const onInsertList = (style: string) => {
      if (editorRef.value) {
        const selection = editorRef.value.getSelection()
        const text = editorRef.value.getModel().getValueInRange(selection)
        let items = text.split('\r\n').map((e) => `\t\\item ${e}`)
        if (items.length == 0) items.push('')

        const op = {
          range: {
            startLineNumber: selection?.startLineNumber || 1,
            startColumn: selection?.startColumn || 1,
            endLineNumber: selection?.endLineNumber || 1,
            endColumn: selection?.endColumn || 1
          },
          text: `\\begin{${style}}\r\n${items.join('\r\n')}\r\n\\end{${style}}`,
          forceMoveMarkers: false
        }
        console.log(selection)
        editorRef.value.executeEdits('my-source', [op])
        editorRef.value.focus()
        editorRef.value.setPosition({
          lineNumber: selection?.startLineNumber + items.length || 1 + items.length,
          column: selection?.endColumn + 7 || style.length + 3
        })
      }
    }

    const onInsertTable = () => {
      if (editorRef.value) {
        const selection = editorRef.value.getSelection()
        const op = {
          range: {
            startLineNumber: selection?.startLineNumber || 1,
            startColumn: selection?.startColumn || 1,
            endLineNumber: selection?.endLineNumber || 1,
            endColumn: selection?.endColumn || 1
          },
          text: `\\begin{table}\r\n\t\\centering\r\n\t\\begin{tabular}\r\n\t\t\r\n\t\\end{tabular}\r\n\t\\caption{Caption}\r\n\t\\label{tab:my_label}\r\n\\end{table}`,
          forceMoveMarkers: false
        }
        console.log(selection)
        editorRef.value.executeEdits('my-source', [op])
        editorRef.value.focus()
        editorRef.value.setPosition({
          lineNumber: selection?.startLineNumber + 3 || 4,
          column: 3
        })
      }
    }

    const onInsertFigure = () => {
      if (editorRef.value) {
        const selection = editorRef.value.getSelection()
        const op = {
          range: {
            startLineNumber: selection?.startLineNumber || 1,
            startColumn: selection?.startColumn || 1,
            endLineNumber: selection?.endLineNumber || 1,
            endColumn: selection?.endColumn || 1
          },
          text: `\\begin{figure}\r\n\t\\centering\r\n\t\\includegraphics[]{}\r\n\t\\caption{Caption}\r\n\t\\label{fig:enter-label}\r\n\\end{figure}`,
          forceMoveMarkers: false
        }
        console.log(selection)
        editorRef.value.executeEdits('my-source', [op])
        editorRef.value.focus()
      }
    }

    return {
      isSave,
      onSave,
      handleMount,
      code,
      loading,
      OPTIONS,
      rename,
      newName,
      onChangeCode,
      onInsertText,
      onInsertList,
      onInsertTable,
      onInsertFigure,
      theme
    }
  }
})
</script>
<style lang="scss">
@import '@/variable.scss';

@mixin apply-theme($theme) {
  $color-border: map-get($theme, color-border);
  $color-background: map-get($theme, color-background);
  $text-secondary: map-get($theme, text-secondary);

  background: $color-background;

  .editor-control .quick-btn {
    color: $text-secondary
  }
}

.container-editor {
  &[theme='light'] {
    @include apply-theme($theme-light)
  }

  &[theme='dark'] {
    @include apply-theme($theme-dark)
  }

  width: 100%;
  height: 100%;
  gap: 16px;

  .editor-control {
    background: rgba(109, 91, 208, 0.09);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    top: 0;
    height: 38px;
    padding: 0 8px;

    .quick-btn {
      padding: 0 4px;
    }
  }

  .ant-button {
    margin-bottom: 16px !important;
  }

  .editor-input {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}
</style>
