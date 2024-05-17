<template>
  <div style="width: 100%; min-height: 100vh">
    <a-button v-if="!isSave" @click="onSave" :loading="loading">Save</a-button>
    <div style="width: 100%; min-height: calc(100vh - 40px)">
      <vue-monaco-editor
        v-model:value="code"
        theme="vs"
        width="100%"
        height="calc(100vh - 40px)"
        @mount="handleMount"
        language="latex"
      />
    </div>
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  h,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  watchEffect
} from 'vue'
import { serviceAPI } from '@/services/API'
import { Button, notification } from 'ant-design-vue'
import { NotiError } from '@/services/notification'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { LatexLang } from '@/latex-lang/index'

export default defineComponent({
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
  emits: ['update:save', 'conflict'],
  setup(props, { emit }) {
    const initContent = ref(props.initData.content)
    const id = ref(props.initData.id)
    const isSave = ref()
    const loading = ref(false)
    const code = ref(props.initData.localContent || props.initData.content)

    const editorRef = shallowRef()
    const handleMount = (editor) => {
      editorRef.value = editor
      editor.val
    }

    onBeforeMount(() => {
      monaco.languages.register({ id: 'latex' })
      monaco.languages.setMonarchTokensProvider('latex', LatexLang as any)
    })

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

    return {
      isSave,
      onSave,
      handleMount,
      code,
      loading
    }
  }
})
</script>
