<template>
  <div class="title-path" :theme="theme">
    {{ oldData.path }}
    <a-tooltip title="Save" :mouseEnterDelay="0.3">
      <a-button type="primary" size="small" @click="onSave">
        <SaveOutlined />
      </a-button>
    </a-tooltip>
  </div>
  <vue-monaco-diff-editor
    :theme="theme === 'light' ? 'vs' : 'vs-dark'"
    :original="oldData.content"
    v-model:modified="code"
    :options="OPTIONS"
    @mount="handleMount"
    language="latex"
    style="height: calc(100vh - 102px)"
  />
</template>

<script lang="ts">
import { serviceAPI } from '@/services/API'
import { NotiError } from '@/services/notification'
import { Button, notification } from 'ant-design-vue'
import { defineComponent, h, inject, ref, shallowRef, watch, watchEffect } from 'vue'
import tokensProvider from '@/latex/tokens-provider'
import languageConfig from '@/latex/language-config'
import { getCompletionItemProvider } from '@/latex/completion-item-provider'
import { DefaultEditorOptions } from '@/constant'
import { SaveOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  components: {
    SaveOutlined
  },
  props: {
    oldData: {
      type: Object,
      default: {}
    },
    editorOptions: {
      type: Object,
      default: DefaultEditorOptions
    }
  },
  emits: ['update:save'],
  setup(props, { emit }) {
    const theme = inject('theme')
    const OPTIONS = {
      automaticLayout: true,
      formatOnType: true,
      formatOnPaste: true,
      scrollBeyondLastLine: false,
      quickSuggestions: true,
      matchBrackets: false,
      glyphMargin: true,
      ...props.editorOptions
    }
    const code = ref(localStorage.getItem(props.oldData.id))
    const loading = ref(false)
    let to
    const diffEditorRef = shallowRef()
    const handleMount = (diffEditor, monaco) => {
      monaco.languages.register({ id: 'latex' })
      monaco.languages.setMonarchTokensProvider('latex', tokensProvider as any)
      monaco.languages.setLanguageConfiguration('latex', languageConfig as any)
      monaco.languages.registerCompletionItemProvider('latex', getCompletionItemProvider(monaco))
      diffEditorRef.value = diffEditor
    }
    const onSave = () => {
      if (loading.value) return
      loading.value = true
      serviceAPI
        .updateFile(props.oldData.id, {
          content: code.value,
          shaCode: props.oldData.shaCode
        })
        .then((res) => {
          emit('update:save', {
            id: props.oldData.id,
            name: props.oldData.name,
            path: props.oldData.path,
            content: code.value,
            shaCode: res.data.shaCode,
            localShaCode: res.data.shaCode,
            type: props.oldData.type
          })
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
                      notification.close(`updateFile${props.oldData.id}`)
                    }
                  },
                  { default: () => 'Update' }
                ),
              key: `updateFile${props.oldData.id}`
            })
          } else NotiError('Failed to update this file!')
        })
        .finally(() => {
          loading.value = false
        })
    }

    watch(
      () => [code.value],
      () => {
        to && clearTimeout(to)
        to = setTimeout(() => {
          if (code.value !== props.oldData.content) {
            localStorage.setItem(props.oldData.id, code.value || '')
            if (!localStorage.hasOwnProperty(`sha-${props.oldData.id}`) && props.oldData.shaCode) {
              localStorage.setItem(`sha-${props.oldData.id}`, props.oldData.shaCode)
            }
          } else {
            localStorage.removeItem(props.oldData.id)
            localStorage.removeItem(`sha-${props.oldData.id}`)
          }
        }, 1000)
        return () => clearTimeout(to)
      }
    )

    watch(
      () => [props.oldData.id],
      () => (code.value = localStorage.getItem(props.oldData.id))
    )

    watch(
      () => [props.editorOptions],
      () => {
        diffEditorRef.value.updateOptions(props.editorOptions)
      }
    )

    return {
      OPTIONS,
      handleMount,
      code,
      onSave,
      theme
    }
  }
})
</script>

<style lang="scss">
@import '@/variable.scss';

@mixin apply-theme($theme) {
  $text-secondary: map-get($theme, text-secondary);

  color: $text-secondary;
}

.save-button {
  position: absolute;
  z-index: 10;
  bottom: 16px;
  right: 40px;
}

.title-path {
  &[theme='light'] {
    @include apply-theme($theme-light);
  }
  &[theme='dark'] {
    @include apply-theme($theme-dark);
  }
  /* color: $text-secondary; */
  background: rgba(109, 91, 208, 0.09);
  height: 38px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  justify-content: space-between;
}
</style>
