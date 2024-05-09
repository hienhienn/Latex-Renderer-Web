<script lang="ts">
import { VAceEditor } from 'vue3-ace-editor'
import 'ace-builds/src-noconflict/mode-latex'
import 'ace-builds/src-noconflict/theme-chrome'
import 'ace-builds/src-noconflict/ext-language_tools'
import { defineComponent, ref, watch } from 'vue'
import { serviceAPI } from '@/services/API'

export default defineComponent({
  components: {
    VAceEditor
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
  emits: ['update:content'],
  setup(props, { emit }) {
    const value = ref(props.initData.content)
    const initContent = ref(props.initData.content)
    const id = ref(props.initData.id)

    watch(
      () => [props.initData.id],
      () => {
        if (id.value && initContent.value !== value.value) {
          const content = value.value;
          const idTmp = id.value
          serviceAPI
            .updateFile(id.value, {
              content: content
            })
            .then(() => {
              emit('update:content', {
                id: idTmp,
                content: content
              })
            })
            .catch(() => {})
        }
        id.value = props.initData.id
        value.value = props.initData.content
        initContent.value = props.initData.content
      }
    )

    return {
      value
    }
  }
})
</script>
<template>
  <v-ace-editor
    ref="latexEditor"
    v-model:value="value"
    ini
    lang="latex"
    theme="chrome"
    style="min-height: 100%; width: 100%"
    :options="{
      useWorker: true,
      fontSize: 18,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      enableSnippets: true
    }"
  />
</template>
