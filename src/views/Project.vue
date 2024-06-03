<template>
  <a-layout>
    <a-layout-header class="custom-header">
      {{ version?.version.project.name }}
      <a-space>
        <a-radio-group>
          <a-radio-button @click="() => (openModal = true)">Save Version</a-radio-button>
          <a-radio-button @click="showDrawer">{{ version?.listVersion.length }}</a-radio-button>
        </a-radio-group>
      </a-space>
    </a-layout-header>
    <a-layout>
      <a-modal v-model:open="openModal" title="Save version" okText="Save" @ok="onSaveVersion">
        <a-input v-model:value="description" placeholder="Description" />
      </a-modal>
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
        <Directory
          :initData="files"
          @changeSelected="onChangeSelected"
          @update:files="() => onUpdateFiles(true)"
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
              @update:files="() => onUpdateFiles(true)"
              @update:code="onUpdateCode"
            />
            <img
              v-if="currentFile?.type === 'img' && currentFile?.content"
              :src="`${apiUrl}/${currentFile?.content}`"
            />
            <div v-if="currentFile == null">Select 1 file</div>
          </div>
          <div class="editor-right">
            <div class="editor-btns">
              <a-button
                type="primary"
                @click="onCompile"
                :loading="loading"
                :disabled="disableCompile"
              >
                Compile
              </a-button>
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
import { computed, defineComponent, h, onMounted, ref, watchEffect } from 'vue'
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
import { Button, notification } from 'ant-design-vue'
import router from '@/router';

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
    const pdf = ref()
    const conflictFiles = ref([])
    const isConflict = computed(() => conflictFiles.value && conflictFiles.value.length > 0)
    const code = 'v-code' + Math.random().toString(16).slice(2)
    const show = ref(Math.random() * 1000)
    const disableCompile = computed(() => files.value.every((e) => e.isCompile == true))
    let showChange = false
    const open = ref(false)
    const openModal = ref(false)
    const description = ref('')

    const showDrawer = () => {
      open.value = true
    }

    const onClose = () => {
      open.value = false
    }

    window.addEventListener('beforeunload', function (event) {
      serviceAPI.deleteCompile(code)
    })

    onMounted(() => {
      loading.value = true
      serviceAPI
        .getFilesByVersionId(route.params.versionId)
        .then((res) => {
          const changeList = []
          files.value = res.data.map((e) => {
            if (localStorage.getItem(e.id)) {
              e.localContent = localStorage.getItem(e.id)
            }
            if (localStorage.getItem(`sha-${e.id}`)) {
              console.log(localStorage.getItem(`sha-${e.id}`))
              e.localShaCode = localStorage.getItem(`sha-${e.id}`)
              if (e.localShaCode !== e.shaCode) changeList.push(e)
            } else {
              e.localShaCode = e.shaCode
            }
            e.isCompile = false
            return e
          })
          if (files.value.length > 0) {
            compileAPI()
              .then((res) => {
                pdf.value = res.data
                files.value = files.value.map((e) => ({
                  ...e,
                  isCompile: true
                }))
              })
              .catch()
          }
          if (changeList.length > 0) {
            notiChange({
              change: 'file',
              file: changeList
            })
          }
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
      connectWebSocket()
    })

    watchEffect(() => {
      description.value = 'Version ' + version.value?.listVersion.length
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

    const onCompile = () => {
      if (loading.value) return
      loading.value = true
      compileAPI()
        .then(() => {
          show.value = Math.random() * 1000
          files.value = files.value.map((e) => ({
            ...e,
            isCompile: true
          }))
        })
        .catch()
        .finally(() => {
          loading.value = false
        })
    }

    const onUpdateFiles = (send) => {
      if (send) sendMessage(JSON.stringify({ change: 'list-files' }))
      console.log('1')
      serviceAPI
        .getFilesByVersionId(route.params.versionId)
        .then((res) => {
          const prev = files.value
          files.value = res.data.map((e, id) => {
            if (localStorage.getItem(e.id)) {
              e.localContent = localStorage.getItem(e.id)
              e.localShaCode = localStorage.getItem(`sha-${e.id}`)
            }
            e.localShaCode = localStorage.getItem(`sha-${e.id}`) || e.shaCode
            e.isCompile = prev.find((prv) => prv.id === e.id)?.isCompile || false
            return e
          })
        })
        .catch((err) => {
          console.log(err)
        })
    }

    const onSaveFile = (event) => {
      sendMessage(
        JSON.stringify({
          change: 'file',
          file: [
            {
              id: event.id,
              name: event.name,
              path: event.path,
              content: event.content
            }
          ]
        })
      )

      currentFile.value = event
      const idx = files.value.findIndex((e) => e.id === event.id)
      files.value[idx] = event
      localStorage.removeItem(event.id)
      localStorage.removeItem(`sha-${event.id}`)

      // xoá list file conflict
      const idConflict = conflictFiles.value.findIndex((e) => e.id === event.id)
      if (idConflict > -1) conflictFiles.value.splice(idConflict, 1)
    }

    const onConflict = (event) => {
      conflictFiles.value = [event]
    }

    const onSaveVersion = () => {
      if (!version.value.version) return
      serviceAPI
        .saveVersion(version.value.version.projectId, {
          description: description.value,
          files: files.value.map((e) => ({
            name: e.name,
            path: e.path,
            content: localStorage.getItem(e.id) || e.content,
            type: e.type
          }))
        })
        .then(() => {
          serviceAPI
            .getVersionById(route.params.versionId)
            .then((res) => {
              version.value = res.data
            })
            .catch((err) => {
              console.log(err)
            })
        })
        .catch((err) => {
          console.log(err)
        })
        .finally(() => {
          openModal.value = false
        })
    }

    const onUpdateCode = (id) => {
      const idx = files.value.findIndex((e) => e.id === id)
      files.value[idx].isCompile = false
    }

    let socket

    function connectWebSocket() {
      socket = new WebSocket(`ws://localhost:5000/ws/${route.params.versionId}`)

      socket.onmessage = function (event) {
        console.log('ms', JSON.parse(event.data))
        // notiChange(JSON.parse(event.data))
      }
    }

    function sendMessage(message) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(message)
      }
    }

    const compileAPI = () =>
      serviceAPI.compile({
        code: code,
        files: files.value
          .filter((e) => e.isCompile === false)
          .map((e) => ({
            name: e.name,
            path: e.path,
            content: localStorage.getItem(e.id) || e.content,
            type: e.type
          }))
      })

    const notiChange = (event) => {
      if (showChange) return
      showChange = true
      notification.info({
        message: 'Project has been changed',
        description: 'Do you want to update project?',
        placement: 'top',
        btn: () => [
          h(
            Button,
            {
              type: 'ghost',
              onClick: () => {
                notification.close('notiChange')
              }
            },
            { default: () => 'Later' }
          ),
          h(
            Button,
            {
              type: 'primary',
              onClick: () => {
                notification.close('notiChange')
                if (event.change === 'file') {
                  conflictFiles.value = event.file
                } else {
                  onUpdateFiles(false)
                }
              }
            },
            { default: () => 'Update' }
          )
        ],
        key: 'notiChange',
        onClose: () => {
          console.log('close')
        }
      })
    }

    const clickVersion = (v) => {
      if (v.isMainVersion) {
        router.push(`/project/${v.id}`)
        return
      }
      router.push(`/version/${v.id}`)
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
      onSaveFile,
      conflictFiles,
      isConflict,
      onConflict,
      loadingVersion,
      onSaveVersion,
      sendMessage,
      disableCompile,
      onUpdateCode,
      version,
      clickVersion,
      open,
      showDrawer,
      onClose,
      openModal,
      description
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

.ant-input {
  width: 100%;
}
</style>
