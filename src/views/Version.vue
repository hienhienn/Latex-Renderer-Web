<template>
  <a-layout>
    <a-layout-header class="custom-header">
      <div>
        <div style="line-height: 24px; font-weight: bold">
          {{ version?.version.project.name }} - {{ version?.version.description }}
        </div>
        <div style="line-height: 24px">{{ version?.version.modifiedTime }}</div>
      </div>
      <a-space>
        <a-radio-group>
          <a-radio-button>Main Version</a-radio-button>
          <a-radio-button @click="showDrawer">{{ version?.listVersion.length }}</a-radio-button>
        </a-radio-group>
      </a-space>
    </a-layout-header>
    <a-layout>
      <a-drawer
        title="Version History"
        placement="right"
        :closable="false"
        :open="open"
        @close="onClose"
      >
        <div
          v-for="item in version?.listVersion"
          class="version-div"
          @click="() => clickVersion(item)"
        >
          <p class="title-version">{{ item?.isMainVersion ? 'Main version' : item.description }}</p>
          <p>{{ item.modifiedTime }} by {{ item.editor.username }}</p>
        </div>
      </a-drawer>
      <a-layout-sider width="250" style="background: #fff">
        <Directory :initData="files" :readonly="true" @changeSelected="onChangeSelected" />
      </a-layout-sider>
      <a-layout style="padding: 0 8px">
        <a-layout-content>
          <div class="editor">
            <Editor v-if="currentFile?.type === 'tex'" :initData="currentFile" :readonly="true" />
            <img
              v-if="currentFile?.type === 'img' && currentFile?.content"
              :src="`${apiUrl}/${currentFile?.content}`"
            />
            <div v-if="currentFile == null">Select 1 file</div>
          </div>
          <div class="editor-right">
            <embed
              v-show="pdf"
              style="width: 100%; height: calc(100% - 64px)"
              :src="apiUrl + pdf + '#toolbar=0'"
            />
          </div>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script>
import { computed, defineComponent, h, onMounted, ref } from 'vue'
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
import router from '@/router'

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
    const version = ref()
    const route = useRoute()
    const loading = ref(false)
    const loadingVersion = ref(false)
    const currentFile = ref()
    const pdf = ref()
    const open = ref(false)

    const showDrawer = () => {
      open.value = true
    }

    const onClose = () => {
      open.value = false
    }

    onMounted(() => {
      loading.value = true
      serviceAPI
        .getFilesByVersionId(route.params.versionId)
        .then((res) => {
          files.value = res.data.map((e) => {
            e.localShaCode = e.shaCode
            return e
          })
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
    })

    const onChangeSelected = (event) => {
      if (event == null) {
        currentFile.value = null
        return
      }
      const idx = files.value.findIndex((e) => e.id === event.id)
      if (localStorage.getItem(event.id)) {
        files.value[idx].localContent = localStorage.getItem(event.id)
        files.value[idx].localShaCode = localStorage.getItem(`sha-${event.id}`)
      } else {
        delete files.value[idx].localContent
        files.value[idx].localShaCode = files.value[idx].shaCode
      }
      currentFile.value = files.value[idx]
    }

    const clickVersion = (v) => {
      if (v.isMainVersion) {
        router.push(`/project/${v.id}`)
        return
      }
      router.push(`/version/${v.id}`)
    }

    return {
      files,
      onChangeSelected,
      apiUrl: import.meta.env.VITE_API_URL,
      currentFile,
      loading,
      pdf,
      loadingVersion,
      version,
      open,
      showDrawer,
      onClose,
      clickVersion
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
  min-height: calc(100vh - 64px) !important;
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

.ant-layout-header.custom-header {
  background: white;
  border-bottom: 1px solid #ccc;
  justify-content: space-between;
  display: flex;
  align-items: center;
}

.title-version {
  font-size: 18px;
  font-weight: bold;
}

.version-div:hover {
  background: #eee;
  cursor: pointer;
}

.version-div {
  padding: 8px 16px;
  border-radius: 8px;
}
</style>
