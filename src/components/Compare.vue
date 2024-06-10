<template>
  <vue-monaco-diff-editor
    theme="vs"
    :original="oldData.content"
    v-model:modified="code"
    :options="OPTIONS"
    @mount="handleMount"
    language="latex"
  />
  <a-button type="primary" class="save-button" @click="onSave">Save</a-button>
</template>

<script lang="ts">
import { serviceAPI } from '@/services/API'
import { NotiError } from '@/services/notification'
import { Button, notification } from 'ant-design-vue'
import { defineComponent, h, ref, shallowRef, watch } from 'vue'
import latexLang from '@/latex/tokens-provider'

export default defineComponent({
  props: {
    oldData: {
      type: Object,
      default: {}
    }
  },
  emits: ['update:save'],
  setup(props, { emit }) {
    const OPTIONS = {
      automaticLayout: true,
      formatOnType: true,
      formatOnPaste: true,
      autoClosingBrackets: 'always',
      scrollBeyondLastLine: false,
      wordWrap: 'wordWrapColumn',
      wordWrapColumn: 80
    }

    const code = ref(localStorage.getItem(props.oldData.id))
    const loading = ref(false)
    let to

    const diffEditorRef = shallowRef()
    const handleMount = (diffEditor, monaco) => {
      monaco.languages.register({ id: 'latex' })
      monaco.languages.setMonarchTokensProvider('latex', latexLang as any)
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
            if (!localStorage.getItem(`sha-${props.oldData.id}`)) {
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

    return {
      OPTIONS,
      handleMount,
      code,
      onSave
    }
  }
})
</script>

<style>
.save-button {
  position: absolute;
  z-index: 10;
  bottom: 16px;
  right: 40px;
}
</style>
