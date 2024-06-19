<template>
  <a-modal v-model:open="openRef" title="Upload new file" okText="Save" :footer="null">
    <a-tabs v-model:activeKey="activeKey" size="small">
      <a-tab-pane key="img" tab="Image"></a-tab-pane>
      <a-tab-pane key="tex" tab="Text file"></a-tab-pane>
    </a-tabs>
    <br />
    <a-upload-dragger
      v-model:fileList="formState.file"
      name="file"
      listType="picture"
      accept="image/*"
      :maxCount="5"
      :multiple="true"
      :customRequest="uploadImage"
      @remove="onRemove"
      v-if="activeKey === 'img'"
    >
      <p class="ant-upload-drag-icon">
        <inbox-outlined></inbox-outlined>
      </p>
      <p class="ant-upload-text">Click or drag file to this area to upload</p>
      <p class="ant-upload-hint">
        Support for a single or bulk upload.This area only accept image files.
      </p>
    </a-upload-dragger>

    <a-upload-dragger
      v-model:fileList="formStateTex.file"
      name="file"
      accept=".tex,.txt,.bib"
      :maxCount="5"
      :multiple="true"
      :customRequest="createFile"
      @remove="onRemove"
      v-if="activeKey === 'tex'"
    >
      <p class="ant-upload-drag-icon">
        <inbox-outlined></inbox-outlined>
      </p>
      <p class="ant-upload-text">Click or drag file to this area to upload</p>
      <p class="ant-upload-hint">
        Support for a single or bulk upload.This area only accept .tex, .txt, .bib file.
      </p>
    </a-upload-dragger>
  </a-modal>
</template>

<script>
import { defineComponent, reactive, ref, watchEffect } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import { serviceAPI } from '@/services/API'
import { NotiError } from '@/services/notification'

export default defineComponent({
  components: {
    InboxOutlined
  },
  emits: ['update:open', 'update:files'],
  props: {
    open: {
      type: Boolean,
      default: false
    },
    files: {
      type: Object,
      default: {}
    },
    selectedKeys: {
      type: Array,
      default: []
    },
    listFile: {
      type: Array,
      default: []
    }
  },
  setup(props, { emit }) {
    const activeKey = ref('img')
    const openRef = ref(props.open)
    const route = useRoute()
    const formState = reactive({
      name: '',
      file: null
    })
    const formStateTex = reactive({
      name: '',
      file: null
    })

    watchEffect(() => {
      emit('update:open', openRef.value)
      if (openRef.value == false) {
        Object.assign(formState, { name: '', file: null })
        Object.assign(formStateTex, { name: '', file: null })
      }
    })

    watchEffect(() => {
      if (props.open == true) openRef.value = props.open
    })

    const uploadImage = ({ onSuccess, onError, file, onProgress }) => {
      let parts = props.selectedKeys[0]?.split('/') || []
      if (parts.length > 0 && parts[parts.length - 1].includes('.')) parts.pop()
      parts.push(file.name)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)
      formData.append('versionId', route.params.versionId)
      formData.append('path', parts.join('/'))

      serviceAPI
        .uploadFile(formData, {
          onUploadProgress: (event) => {
            onProgress({ percent: (event.loaded / event.total) * 100 }, file)
          }
        })
        .then(() => {
          onSuccess(file)
          emit('update:files')
        })
        .catch((err) => {
          onError({ event: err })
          NotiError(err.response.data.message || 'Failed to create new file!')
        })
    }

    const createFile = ({ onSuccess, onError, file, onProgress, data }) => {
      let parts = props.selectedKeys[0]?.split('/') || []
      if (parts.length > 0 && parts[parts.length - 1].includes('.')) parts.pop()
      parts.push(file.name)

      const reader = new FileReader(file)
      reader.onload = (event) => {
        const content = event.target.result

        serviceAPI
          .createFile({
            name: file.name,
            versionId: route.params.versionId,
            path: parts.join('/'),
            content: content
          })
          .then(() => {
            onSuccess(file)
            emit('update:files')
          })
          .catch((err) => {
            onError({ event: err })
            NotiError(err.response.data.message || 'Failed to create new file!')
          })
      }

      reader.onerror = () => {
        onError()
      }
      reader.readAsText(file)
    }

    const onRemove = (file) => {
      if (file.error) return

      let parts = props.selectedKeys[0]?.split('/') || []
      if (parts.length > 0 && parts[parts.length - 1].includes('.')) parts.pop()
      parts.push(file.originFileObj.name)
      const f = props.listFile.find((e) => e.path === parts.join('/'))
      serviceAPI
        .deleteFile(f.id)
        .then(() => emit('update:files'))
        .catch(() => NotiError('failed'))
    }

    return {
      formState,
      formStateTex,
      openRef,
      uploadImage,
      createFile,
      onRemove,
      activeKey
    }
  }
})
</script>
