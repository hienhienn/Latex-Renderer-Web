<template>
  <a-layout>
    <a-layout>
      <a-layout-sider width="250" style="background: #fff">
        <Directory :initData="files" @changeSelected="onChangeSelected" />
      </a-layout-sider>
      <a-layout style="padding: 0 8px">
        <a-layout-content>
          <div class="editor">
            <Editor
              v-if="fileOpen?.type === 'tex'"
              :initData="currentFile"
              @update:content="onUpdateContent"
            />
            <img
              v-if="fileOpen?.type === 'img' && currentFile?.content"
              :src="`${apiUrl}${currentFile?.content}`"
            />
          </div>
          <div class="editor-right">
            <a-button @click="onCompile" :loading="loading">Compile</a-button>
            <br/>
            <embed v-if="pdf" style="width: 100%; height: 100%" :src="`${apiUrl}${pdf}`" />
          </div>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue'
import {
  FolderOutlined,
  FileOutlined,
  FileImageOutlined,
  FolderAddFilled,
  FileAddFilled,
  FileImageFilled,
  FolderOpenOutlined
} from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import { serviceAPI } from '@/services/API'
import Directory from '@/components/Directory.vue'
import Editor from '@/components/Editor.vue'
import { NotiError } from '@/services/notification'

export default defineComponent({
  components: {
    FolderOutlined,
    FileOutlined,
    FileImageOutlined,
    FolderAddFilled,
    FileAddFilled,
    FileImageFilled,
    FolderOpenOutlined,
    Directory,
    Editor
  },
  setup() {
    const files = ref([])
    const route = useRoute()
    const loading = ref(false)
    const fileOpen = ref()
    const data = ref([])
    const currentFile = ref()
    const pdf = ref()

    onMounted(() => {
      loading.value = true
      serviceAPI
        .getFilesByVersionId(route.params.versionId)
        .then((res) => {
          files.value = res.data
        })
        .catch((err) => {
          console.log(err)
        })
        .finally(() => {
          loading.value = false
        })
    })

    const onChangeSelected = (event) => {
      fileOpen.value = event
      const idx = data.value.findIndex((e) => e.id === fileOpen.value.id)
      if (fileOpen.value?.id && idx === -1) {
        serviceAPI
          .getFile(fileOpen.value?.id)
          .then((res) => {
            currentFile.value = {
              id: res.data.id,
              content: res.data.content,
              path: res.data.path,
              name: res.data.name
            }
            data.value.push(currentFile.value)
          })
          .catch((err) => NotiError())
        return
      }
      if (fileOpen.value?.id && idx !== -1) {
        currentFile.value = data.value[idx]
      }
    }

    const onUpdateContent = (event) => {
      const idx = data.value.findIndex((e) => e.id === event.id)
      data.value[idx] = event
    }

    const onCompile = () => {
      if (loading.value) return
      const updateFiles = [currentFile.value]
      loading.value = true
      serviceAPI
        .compile(route.params.versionId, {
          updateFiles
        })
        .then((res) => {
          pdf.value = res.data
        })
        .catch()
        .finally(() => {
          loading.value = false
        })
    }

    return {
      files,
      onChangeSelected,
      fileOpen,
      apiUrl: import.meta.env.VITE_API_URL,
      currentFile,
      onUpdateContent,
      onCompile,
      loading,
      pdf
    }
  }
})
</script>

<style>
.logo {
  background-color: white;
  width: 48px;
  height: 48px;
  margin-top: 8px;
}

.row-search {
  width: 100%;
  flex-flow: nowrap;
  gap: 8px;
  margin-bottom: 16px;
}

.ant-layout-content {
  background: #f5f5f5;
  margin: 0;
  padding: 0;
  min-height: calc(100vh) !important;
  display: flex;
  gap: 8px;
}

div.editor {
  width: 50%;
  height: 100%;
  display: flex;
}

div.editor-right {
  width: 50%;
  height: 100%;
  background: white;
  /* display: grid; */
}

div.editor img {
  width: 100%;
  margin: auto;
}
</style>
