<template>
  <div class="container-editor">
    <div class="editor-control">
      <a-button type="link" size="small" @click="() => (rename = true)" v-if="!rename">
        {{ initData.name }}
      </a-button>
      <div class="editor-input" v-if="rename">
        <a-input v-model:value="newName" />
        <close-circle-outlined @click="() => (rename = false)" />
        <check-circle-outlined @click="onRename" />
      </div>
      <a-button type="primary" :disabled="isSave" @click="onSave" :loading="loading">Save</a-button>
    </div>
    <div style="width: 100%; min-height: calc(100vh - 64px)">
      <vue-monaco-editor
        v-model:value="code"
        theme="vs"
        width="100%"
        height="calc(100vh - 64px)"
        @mount="handleMount"
        language="latex"
        :options="OPTIONS"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, h, onBeforeUnmount, ref, shallowRef, watch, watchEffect } from 'vue'
import { serviceAPI } from '@/services/API'
import { Button, notification } from 'ant-design-vue'
import { NotiError } from '@/services/notification'
import latexLang from '@/latex/latex-lang'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  components: {
    CheckCircleOutlined,
    CloseCircleOutlined
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
    }
  },
  emits: ['update:save', 'conflict', 'update:files'],
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
    const initContent = ref(props.initData.content)
    const id = ref(props.initData.id)
    const isSave = ref()
    const loading = ref(false)
    const code = ref(props.initData.localContent || props.initData.content)
    const rename = ref(false)
    const newName = ref(props.initData.name.split('.')[0])

    const editorRef = shallowRef()
    const handleMount = (editor, monaco) => {
      monaco.languages.register({ id: 'latex' })
      monaco.languages.setMonarchTokensProvider('latex', latexLang as any)
      editorRef.value = editor
    }

    onBeforeUnmount(() => {
      if (id.value && initContent.value !== code.value) {
        localStorage.setItem(id.value, code.value)
      } else {
        localStorage.removeItem(id.value)
      }
    })

    watch(
      () => [props.initData.id],
      () => {
        if (id.value && initContent.value !== code.value) {
          localStorage.setItem(id.value, code.value)
        } else {
          localStorage.removeItem(id.value)
        }
        id.value = props.initData.id
        code.value = props.initData.localContent || props.initData.content
        initContent.value = props.initData.content
      }
    )

    watchEffect(() => {
      if (code.value !== props.initData.content) isSave.value = false
      else isSave.value = true
    })

    const onSave = () => {
      if (loading.value) return
      loading.value = true
      serviceAPI
        .updateFile(id.value, {
          path: props.initData.path,
          content: code.value,
          shaCode: props.initData.shaCode
        })
        .then((res) => {
          emit('update:save', {
            id: props.initData.id,
            name: props.initData.name,
            path: props.initData.path,
            content: code.value,
            shaCode: res.data.shaCode,
            type: props.initData.type
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
                      emit('conflict', err.response.data)
                      notification.close(`updateFile${id.value}`)
                    }
                  },
                  { default: () => 'Update' }
                ),
              key: `updateFile${id.value}`
            })
          } else NotiError('Failed to create new file!')
        })
        .finally(() => {
          loading.value = false
        })
    }

    const onRename = () => {
      let tmp = props.initData.path.split('/')
      tmp.pop()
      const newPath = tmp.join('/') + newName.value + '.tex'

      serviceAPI
        .renameFile(props.initData.id, {
          name: newName.value + '.tex',
          path: newPath
        })
        .then((res) => {
          emit('update:save', {
            ...props.initData,
            name: newName.value + '.tex',
            path: newPath,
          })
          emit('update:files')
          rename.value = false
        })
        .catch((err) => {
          if (err.response.status == 400) {
            notification.open({
              message: 'File has been changed',
              description: 'Please update file before save!',
              btn: () =>
                h(
                  Button,
                  {
                    type: 'primary',
                    onClick: () => {
                      emit('update:files')
                      notification.close(`updateFile${id.value}`)
                    }
                  },
                  { default: () => 'Update' }
                ),
              key: `updateFile${id.value}`
            })
          } else NotiError('Failed to create new file!')
        })
        .finally(() => {
          loading.value = false
        })
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
      onRename
    }
  }
})
</script>
<style>
.container-editor {
  width: 100%;
  height: 100%;
  background: white;
  display: grid;
  gap: 16px;
}

.editor-control {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ant-button {
  margin-bottom: 16px !important;
}

.ant-input {
  width: 200px;
}

.editor-input {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
