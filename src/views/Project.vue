<template>
  <a-layout class="project-page">
    <a-layout-header class="custom-header">
      <a-space align="center">
        <a href="/" style="display: flex" title="Go to home page">
          <img src="/icons/logo-primary.svg" width="40" />
        </a>
        <a-space direction="vertical" :size="0" class="header-info">
          <a-space style="line-height: 24px">
            <a-input
              class="input-project"
              ref="inputRef"
              v-model:value="editProjectName"
              @blur="onBlurInput"
              @pressEnter="() => inputRef.blur()"
              :style="{ width: inputWidth + 'px' }"
            />
            <a-space class="starred-div">
              <span>
                <StarOutlined v-if="!project?.starred" @click="addStarred" />
                <StarFilled v-if="project?.starred" style="color: #fbc725" @click="removeStarred" />
              </span>
              <span>{{ project?.totalStar }}</span>
            </a-space>
          </a-space>
          <SettingBar
            :files="files"
            :project="project"
            v-model:mainFileId="project.mainFileId"
            @downloadFolder="onDownloadFolder"
          />
        </a-space>
      </a-space>
      <a-space>
        <ShareMode
          v-model:isPublic="project.isPublic"
          :projectId="project.id"
          v-model:userProjects="project.userProjects"
          :activeUsers="activeUsers"
        />
        <a-radio-group size="large">
          <a-radio-button @click="() => (openModal = true)">
            <a-space align="center">
              <img src="/icons/version.svg" style="width: 16px; position: relative; top: 2px" />
              <span style="font-weight: 600">Save Version</span>
            </a-space>
          </a-radio-button>
          <a-radio-button @click="showDrawer">
            <span style="font-weight: 600">{{ project?.versions?.length }}</span>
          </a-radio-button>
        </a-radio-group>
        <a-dropdown placement="bottomRight">
          <a-avatar
            :size="40"
            :src="'https://ui-avatars.com/api/?background=random&name=' + user?.fullname"
          />
          <template #overlay>
            <a-menu>
              <a-menu-item> {{ user?.fullname }} ({{ user?.username }}) </a-menu-item>
              <a-menu-item> Logout </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </a-space>
    </a-layout-header>
    <div style="display: flex">
      <!-- <button @click="() => sendMessage('ok')">Send</button> -->
      <vue-resizable :min-width="238" :max-width="500" :active="['r']" :width="258">
        <div
          style="
            background-color: white;
            min-height: calc(100vh - 64px);
            border-right: 6px solid #6d5bd030;
          "
        >
          <Directory
            :initData="files"
            @changeSelected="onChangeSelected"
            @update:files="() => onUpdateFiles(true)"
            @downloadFolder="onDownloadFolder"
          />
        </div>
      </vue-resizable>
      <a-layout>
        <a-layout-content class="project-content" v-if="!isConflict">
          <vue-resizable
            :min-width="238"
            :max-width="1000"
            :width="650"
            :active="['r']"
            @resize:move="handleResize"
          >
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
          </vue-resizable>
          <div class="editor-right" id="pdfDiv">
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
    </div>
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
      <div v-for="item in project?.versions" class="version-div" @click="() => clickVersion(item)">
        <p class="title-version">{{ item?.isMainVersion ? 'Main version' : item.description }}</p>
      </div>
    </a-drawer>
  </a-layout>
</template>

<script>
import { computed, defineComponent, h, onMounted, reactive, ref, watchEffect } from 'vue'
import {
  FolderOutlined,
  FileOutlined,
  FileImageOutlined,
  FolderAddFilled,
  FileAddFilled,
  FileImageFilled,
  FolderOpenOutlined,
  TeamOutlined,
  CloseOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import { serviceAPI } from '@/services/API'
import Directory from '@/components/Directory.vue'
import Editor from '@/components/Editor.vue'
import ShareMode from '@/components/ShareMode.vue'
import Compare from '@/components/Compare.vue'
import SettingBar from '@/components/SettingBar.vue'
import { Button, notification } from 'ant-design-vue'
import router from '@/router'
import VueResizable from 'vue-resizable'
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
    Editor,
    Compare,
    VueResizable,
    TeamOutlined,
    CloseOutlined,
    StarOutlined,
    StarFilled,
    SettingBar,
    ShareMode
  },
  setup() {
    const route = useRoute()
    const files = ref([])
    const project = ref({
      mainFileId: '',
      isPublic: false,
      id: '',
      userProjects: []
    })
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
    const user = ref()
    const editProjectName = ref('')
    const inputWidth = computed(() => 24 + editProjectName.value.length * 9.2)
    const inputRef = ref()
    const activeUsers = ref(new Set())

    const showDrawer = () => {
      open.value = true
    }

    const onClose = () => {
      open.value = false
    }

    window.addEventListener('beforeunload', function (event) {
      serviceAPI.deleteCompile(code)
    })

    onMounted(async () => {
      loading.value = true
      try {
        const [filesRes, infoRes, userRes] = await Promise.all([
          serviceAPI.getFilesByVersionId(route.params.versionId),
          serviceAPI.getVersionById(route.params.versionId),
          serviceAPI.getCurrentUser()
        ])

        user.value = userRes.data
        activeUsers.value.add(user.value.id)
        project.value = infoRes.data

        if (!infoRes.data.role) {
          NotiError('You do not have permission to see this project!')
          router.push('/')
        }
        if (infoRes.data.role === 'editor' || infoRes.data.role === 'owner') {
          const changeList = []
          files.value = filesRes.data.map((e) => {
            if (localStorage.getItem(e.id)) {
              e.localContent = localStorage.getItem(e.id)
              e.isSave = false
            } else {
              e.isSave = true
            }
            if (
              localStorage.getItem(`sha-${e.id}`) &&
              localStorage.getItem(`sha-${e.id}`) !== 'null'
            ) {
              e.localShaCode = localStorage.getItem(`sha-${e.id}`)
              if (e.localShaCode !== e.shaCode) changeList.push(e)
            } else {
              e.localShaCode = e.shaCode
            }
            e.isCompile = false
            return e
          })
          // const main = files.value.find((e) => e.id === infoRes.data.mainFileId)
          // if (main && (main.localContent || main.content)) {
          //   compileAPI()
          //     .then((res) => {
          //       pdf.value = res.data
          //       files.value = files.value.map((e) => ({
          //         ...e,
          //         isCompile: true
          //       }))
          //     })
          //     .catch()
          if (changeList.length > 0) {
            notiChange({
              change: 'file',
              file: changeList
            })
          }
        } else {
          files.value = filesRes.data
        }

        connectWebSocket()
      } catch (err) {
        console.log(err)
      }

      loading.value = false
    })

    watchEffect(() => {
      description.value = 'Version ' + project.value?.versions?.length
    })

    watchEffect(() => {
      editProjectName.value = project.value?.name || ''
    })

    const onChangeSelected = (event) => {
      console.log(event)
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
      // if (send) sendMessage(JSON.stringify({ change: 'list-files' }))
      serviceAPI
        .getFilesByVersionId(route.params.versionId)
        .then((res) => {
          const prev = files.value
          files.value = res.data.map((e) => {
            const prevE = prev.find((prv) => prv.id === e.id)
            if (localStorage.getItem(e.id)) {
              e.localContent = localStorage.getItem(e.id)
            }
            e.localShaCode = localStorage.getItem(`sha-${e.id}`) || e.shaCode
            e.isCompile = prevE?.isCompile || false
            e.isSave = prevE ? prevE.isSave : true
            return e
          })
        })
        .catch((err) => {
          console.log(err)
        })
    }

    const onSaveFile = (event) => {
      // sendMessage(
      //   JSON.stringify({
      //     change: 'file',
      //     file: [
      //       {
      //         id: event.id,
      //         name: event.name,
      //         path: event.path,
      //         content: event.content
      //       }
      //     ]
      //   })
      // )

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
      if (!project.value) return
      serviceAPI
        .saveVersion(project.value.id, {
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
              project.value = res.data
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

    const onUpdateCode = (event) => {
      const idx = files.value.findIndex((e) => e.id === event.id)
      files.value[idx].isCompile = false
      if (files.value[idx].isSave !== event.isSave) {
        files.value[idx].isSave = event.isSave
        files.value = JSON.parse(JSON.stringify(files.value))
      }
    }

    let socket

    function connectWebSocket() {
      socket = new WebSocket(`ws://localhost:5000/ws/${route.params.versionId}/${user.value.id}`)

      socket.onmessage = function (event) {
        console.log('ms', event)
        const data = JSON.parse(event.data)
        console.log(data)
        if (data.type === 'user') handleUserActive(data)
        if (data.type === 'userList') handleListUserAcitve(data)
      }

      socket.onopen = () => {
        sendMessage(JSON.stringify({ type: 'user', active: true, userId: user.value.id }))
      }
    }

    function sendMessage(message) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(message)
      }
    }

    const compileAPI = (compileFileId) =>
      serviceAPI.compile({
        code: code,
        files: files.value
          .filter((e) => e.isCompile === false)
          .map((e) => ({
            name: e.name,
            path: e.path,
            content: localStorage.getItem(e.id) || e.content,
            type: e.type
          })),
        compilePath: files.value.find((e) => e.id === compileFileId)
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
        key: 'notiChange'
        // onClose: () => {
        //   console.log('close')
        // }
      })
    }

    const clickVersion = (v) => {
      if (v.isMainVersion) {
        router.push(`/project/${v.id}`)
        return
      }
      router.push(`/version/${v.id}`)
    }

    const handleResize = (event) => {
      document.getElementById('pdfDiv').style.width = `calc(100% - ${event.width}px)`
    }

    const onDownloadFolder = (event) => {
      serviceAPI
        .downloadFolder({
          code: code,
          files: files.value
            .filter((e) => e.isCompile === false)
            .map((e) => ({
              name: e.name,
              path: e.path,
              content: localStorage.getItem(e.id) || e.content,
              type: e.type
            })),
          folderPath: event.key,
          folderName: event.title
        })
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `${event.title}.zip`)
          document.body.appendChild(link)
          link.click()
        })
        .catch(() => NotiError(''))
    }

    const onBlurInput = (e) => {
      if (!e.target.value) {
        editProjectName.value = project.value?.name
        return
      }
      if (e.target.value === project.value?.name) {
        return
      }
      console.log(e)

      serviceAPI
        .updateProject(project.value?.id, {
          name: e.target.value
        })
        .then((res) => {
          project.value.name = res.data.name
        })
        .catch((err) => {
          NotiError('failed')
        })
    }

    const addStarred = () => {
      serviceAPI
        .addStarProject({
          projectId: project.value.id,
          editorId: user.value.id
        })
        .then((res) => {
          project.value.totalStar = res.data.totalStar
          project.value.starred = true
          project.value.starredId = res.data.id
        })
        .catch((err) => {
          NotiError('Failed')
        })
    }

    const removeStarred = () => {
      serviceAPI.removeStarProject(project.value.starredId).then((res) => {
        project.value.totalStar = res.data.totalStar
        project.value.starred = false
      })
    }

    const handleUserActive = (data) => {
      if (data.active) {
        activeUsers.add(data.userId)
      } else activeUsers.delete(data.userId)
    }

    const handleListUserAcitve = (data) => {
      console.log('hd', activeUsers)

      if (user?.value?.id) activeUsers.value.add(user.value.id)
      data.list.forEach((e) => {
        activeUsers.value.add(e)
      })
      console.log('hd', activeUsers)
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
      project,
      clickVersion,
      open,
      showDrawer,
      onClose,
      openModal,
      description,
      user,
      handleResize,
      onDownloadFolder,
      editProjectName,
      onBlurInput,
      inputWidth,
      inputRef,
      addStarred,
      removeStarred,
      activeUsers
    }
  }
})
</script>

<style lang="scss">
.project-page {
  .custom-header {
    .title-project {
      font-size: 18px;
      font-weight: 600;
    }
  }

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
    // margin-bottom: 8px;
  }

  .header-info {
    margin-bottom: 16px;
    & > .ant-space-item {
      line-height: 24px;
    }
  }

  .ant-layout-content.project-content {
    background: #f5f5f5;
    margin: 0;
    padding: 0;
    min-height: calc(100vh - 64px) !important;
    display: flex;
  }

  div.editor {
    width: 100%;
    height: 100%;
    display: flex;
    border-right: 6px solid rgba(109, 91, 208, 0.19);
  }

  div.editor-right {
    width: calc(100% - 650px);
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
    border-bottom: 1px solid #d9d5ec;
    justify-content: space-between;
    display: flex;
    box-shadow: 0 4px 10px 0 #00000010;
    z-index: 10;
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

  .ant-input.input-project {
    padding: 0 11px;
    line-height: 24px;
    font-size: 18px;
    font-weight: 600;
    &:not(:hover) {
      border-color: transparent;
    }
  }

  .ant-radio-group {
    .ant-radio-button-wrapper {
      background: #6d5bd0;
      color: white;

      &:hover {
        color: white;
      }

      &:first-child {
        border-start-start-radius: 20px;
        border-end-start-radius: 20px;
      }

      &:last-child {
        border-start-end-radius: 20px;
        border-end-end-radius: 20px;
      }
    }
  }

  .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)::before {
    background-color: white;
  }

  .starred-div {
    background: #f4f2ff;
    padding: 0 8px;
    border-radius: 12px;
    border: 1px solid #d9d5ec;

    .anticon {
      transition: all 150ms ease-in-out;
      cursor: pointer;
      &:hover {
        scale: 1.2;
      }
    }
    span {
      font-weight: 600;
    }
  }
}
</style>
