<template>
  <a-layout>
    <a-layout>
      <a-layout-sider width="250" style="background: #fff">
        <Directory
          :initData="files"
          @changeSelected="onChangeSelected"
          @update:files="onUpdateFiles"
          :shaCode="shaCode"
        />
      </a-layout-sider>
      <a-layout style="padding: 0 8px">
        <a-layout-content v-if="!isConflict">
          <div class="editor">
            <Editor
              v-if="currentFile?.type === 'tex'"
              :initData="currentFile"
              @update:save="onSaveFile"
              @conflict="onConflict"
              @update:files="onUpdateFiles"
            />
            <img
              v-if="currentFile?.type === 'img' && currentFile?.content"
              :src="`${apiUrl}/${currentFile?.content}`"
            />
            <div v-if="currentFile == null">Select 1 file</div>
          </div>
          <div class="editor-right">
            <div class="editor-btns">
              <a-button>Save this version</a-button>
              <a-button type="primary" @click="onCompile" :loading="loading">Compile</a-button>
            </div>
            <br />
            <embed
              v-show="pdf"
              style="width: 100%; height: calc(100% - 64px)"
              :src="apiUrl + pdf + '#toolbar=0'"
              :key="show"
            />
          </div>
        </a-layout-content>
        <a-layout-content v-if="isConflict" style="display: grid">
          <div class="container-conflict" v-for="item in conflictFiles">
            <div class="title-path">{{ item.path }}</div>
            <div class="compare-editor">
              <Compare :oldData="item" @update:save="onSaveFile" />
            </div>
          </div>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script>
import { computed, defineComponent, onMounted, ref } from 'vue'
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
import Compare from '@/components/Compare.vue'

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
    Editor,
    Compare
  },
  setup() {
    const files = ref([])
    const version = ref()
    const route = useRoute()
    const loading = ref(false)
    const loadingVersion = ref(false)
    const currentFile = ref()
    const data = ref([])
    const pdf = ref()
    const shaCode = ref()
    const conflictFiles = ref([])
    const isConflict = computed(() => conflictFiles.value && conflictFiles.value.length > 0)
    const code = 'v-code' + Math.random().toString(16).slice(2)
    const show = ref(Math.random() * 1000)
    
    window.addEventListener('beforeunload', function (event) {
      
    })

    onMounted(() => {
      loading.value = true
      serviceAPI
        .getFilesByVersionId(route.params.versionId)
        .then((res) => {
          files.value = res.data.files
          shaCode.value = res.data.shaCode
        })
        .catch((err) => {
          console.log(err)
        })
        .finally(() => {
          loading.value = false
        })
      serviceAPI
        .getVersionById(route.params.versionId)
        .then((res) => {
          version.value = res.data
        })
        .catch((err) => {
          console.log(err)
        })
      serviceAPI
        .compile(route.params.versionId)
        .then((res) => (pdf.value = res.data))
        .catch()
    })

    const onChangeSelected = (event) => {
      if (event == null) {
        currentFile.value = null
        return
      }
      const idx = data.value.findIndex((e) => e.id === event.id)
      if (idx === -1) {
        serviceAPI
          .getFile(event.id)
          .then((res) => {
            currentFile.value = res.data
            if (localStorage.getItem(event.id))
              currentFile.value.localContent = localStorage.getItem(event.id)
            data.value.push(currentFile.value)
          })
          .catch((err) => NotiError())
        return
      }
      if (idx !== -1) {
        currentFile.value = data.value.find((e) => e.id === event.id)
        if (localStorage.getItem(event.id)) {
          currentFile.value.localContent = localStorage.getItem(event.id)
          data.value[idx].localContent = localStorage.getItem(event.id)
        } else {
          delete currentFile.value.localContent
          delete data.value[idx].localContent
        }
      }
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
          show.value = Math.random() * 1000
        })
        .catch()
        .finally(() => {
          loading.value = false
        })
    }

    const onUpdateFiles = () => {
      serviceAPI
        .getFilesByVersionId(route.params.versionId)
        .then((res) => {
          files.value = res.data.files
          shaCode.value = res.data.shaCode
        })
        .catch((err) => {
          console.log(err)
        })
    }

    const onSaveFile = (event) => {
      // const idx = data.value.findIndex((e) => e.id === event.id)
      // if (idx > -1) {
      currentFile.value = event
      data.value[idx] = event
      localStorage.removeItem(event.id)
      // }
      const idConflict = conflictFiles.value.findIndex((e) => e.id === event.id)
      if (idConflict > -1) conflictFiles.value.splice(idConflict, 1)
    }

    const onConflict = (event) => {
      conflictFiles.value = [event]
    }

    const onSaveVersion = () => {
      // serviceAPI.saveVersion(version.value.projectId, {
      //   files: files.
      // })
    }
    return {
      show,
      files,
      onChangeSelected,
      currentFile,
      apiUrl: import.meta.env.VITE_API_URL,
      currentFile,
      onCompile,
      loading,
      pdf,
      onUpdateFiles,
      shaCode,
      onSaveFile,
      conflictFiles,
      isConflict,
      onConflict,
      loadingVersion,
      onSaveVersion
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
  padding: 8px 16px;
}

.editor-btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

div.editor img {
  width: 100%;
  margin: auto;
}

.title-path {
  width: 100%;
  background: white;
  padding: 4px 16px;
}

.container-conflict {
  width: 100%;
  position: relative;
}

.compare-editor {
  height: calc(100% - 32px);
  margin-bottom: 20px;
}
</style>
