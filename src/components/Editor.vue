<template>
  <div class="container-editor">
    <div class="editor-control">
      <div>
        {{ initData.name }}
      </div>
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
        :onChange="onChangeCode"
      />
    </div>
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  h,
  ref,
  shallowRef,
  watch,
  computed
} from 'vue'
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
      monaco.languages.setMonarchTokensProvider('latex', latexLang as any)
      editorRef.value = editor
    }

    watch(
      () => [props.initData],
      ([newValue]) => {
        code.value = newValue.localContent || newValue.content
      }
    )

    console.log(props.initData)

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
            type: props.initData.type
          })
          shaCode = res.data.shaCode
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
            path: newPath
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
                      notification.close(`updateFile${props.initData.id}`)
                    }
                  },
                  { default: () => 'Update' }
                ),
              key: `updateFile${props.initData.id}`
            })
          } else NotiError('Failed to create new file!')
        })
        .finally(() => {
          loading.value = false
        })
    }

    const onChangeCode = (value) => {
      to && clearTimeout(to)
      to = setTimeout(() => {
        if (code.value !== props.initData.content) {
          localStorage.setItem(props.initData.id, code.value)
          if(!localStorage.getItem(`sha-${props.initData.id}`)) {
            localStorage.setItem(`sha-${props.initData.id}`, props.initData.shaCode)
          }
        } else {
          localStorage.removeItem(props.initData.id)
          localStorage.removeItem(`sha-${props.initData.id}`)
          shaCode = props.initData.shaCode
        }
      }, 1000)
      return () => clearTimeout(to)
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
      onRename,
      onChangeCode
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
