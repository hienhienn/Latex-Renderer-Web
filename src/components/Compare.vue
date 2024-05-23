<template>
  <vue-monaco-diff-editor
    theme="vs"
    :original="oldData.content"
    v-model:modified="code"
    :options="OPTIONS"
    @mount="handleMount"
    language="latex"
  />
  <a-button class="save-button" @click="onSave">Save</a-button>
</template>

<script lang="ts">
import { serviceAPI } from '@/services/API'
import { NotiError } from '@/services/notification'
import { Button, notification } from 'ant-design-vue'
import { defineComponent, h, ref, shallowRef } from 'vue'
import latexLang from '@/latex/latex-lang'

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
            type: props.oldData.type
          })
        })
        .catch((err) => {
          if (err.response.status == 400 && err.response.data.shaCodeError) {
            notification.open({
              message: 'File has been changed',
              description: 'Please update file before save!',
              btn: () =>
                h(
                  Button,
                  {
                    type: 'primary',
                    onClick: () => {
                      // emit('conflict', err.response.data)
                      notification.close(`updateFile${props.oldData.id}`)
                    }
                  },
                  { default: () => 'Update' }
                ),
              key: `updateFile${props.oldData.id}`
            })
          } else NotiError('Failed to create new file!')
        })
        .finally(() => {
          loading.value = false
        })
    }

    return {
      OPTIONS,
      handleMount,
      code,
      oldData: props.oldData,
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
