<template>
  <a-layout class="project-page" :theme="theme">
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
            :resCompile="resCompile"
            v-model:editorOptions="editorOptions"
            v-model:mainFileId="project.mainFileId"
            v-model:compileOptions="compileOptions"
            @downloadFolder="onDownloadFolder"
            @downloadPdf="onDownloadPdf"
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
        <UserAvatar :user="user" />
      </a-space>
    </a-layout-header>
    <splitpanes>
      <pane min-size="17" max-size="50" size="20" class="directory">
        <Directory
          :initData="files"
          :mainFile="files?.find((e) => e.id === project.mainFileId)"
          @changeSelected="onChangeSelected"
          @update:files="() => onUpdateFiles(true)"
          @downloadFolder="onDownloadFolder"
        />
      </pane>
      <pane class="editor project-content" v-if="!isConflict">
        <Editor
          v-if="currentFile?.type === 'tex'"
          :initData="currentFile"
          @update:save="onSaveFile"
          @conflict="onConflict"
          @update:files="() => onUpdateFiles(true)"
          @update:code="onUpdateCode"
          :editorOptions="editorOptions"
        />
        <img
          v-if="currentFile?.type === 'img' && currentFile?.content"
          :src="`${apiUrl}/${currentFile?.content}`"
        />
        <div v-if="currentFile == null">Select 1 file</div>
      </pane>
      <pane class="editor-right project-content" id="pdfDiv" v-if="!isConflict">
        <div class="editor-btns">
          <a-button
            size="small"
            type="primary"
            @click="onDownloadPdf"
            :disabled="!resCompile.pdf"
            :loading="loadingCompile"
          >
            <DownloadOutlined />
          </a-button>
          <a-button size="small" type="primary" @click="onCompile" :loading="loadingCompile">
            <SyncOutlined />
          </a-button>
        </div>
        <!-- <div class="editor-btns">
          <a-button
            type="primary"
            @click="onCompile"
            :loading="loadingCompile"
            :disabled="disableCompile"
          >
            Compile
          </a-button>
        </div>
        <br /> -->
        <embed
          style="width: 100%; height: calc(100vh - 102px)"
          v-show="resCompile.pdf"
          :src="`${apiUrl}/${code}/${resCompile.pdf}#toolbar=0&zoom=120`"
          :key="show"
        />
        <!-- <PDFViewer
          :key="show"
          :source="`${apiUrl}/DoAn.pdf`"
          style="width: 100%; height: calc(100% - 64px)"
          :controls="['zoom', 'switchPage']"
        ></PDFViewer> -->
      </pane>
      <pane v-if="isConflict" style="display: grid">
        <div class="container-conflict" v-for="item in conflictFiles">
          <div class="title-path">{{ item.path }}</div>
          <div class="compare-editor">
            <Compare :oldData="item" @update:save="onSaveFile" />
          </div>
        </div>
      </pane>
    </splitpanes>
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
import { computed, defineComponent, h, inject, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
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
  StarFilled,
  SyncOutlined,
  DownloadOutlined
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
import { Splitpanes, Pane } from 'splitpanes'
import { DefaultCompileOptions, DefaultEditorOptions } from '@/constant'
import UserAvatar from '@/components/common/UserAvatar.vue'
import PDFViewer from 'pdf-viewer-vue'

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
    ShareMode,
    Splitpanes,
    Pane,
    UserAvatar,
    PDFViewer,
    SyncOutlined,
    DownloadOutlined
  },
  setup() {
    const theme = inject('theme')
    const route = useRoute()
    const files = ref([])
    const project = ref({
      mainFileId: '',
      isPublic: false,
      id: '',
      userProjects: []
    })
    const loadingCompile = ref(false)
    const loadingVersion = ref(false)
    const currentFile = ref()
    const resCompile = ref({
      pdf: '',
      log: ''
    })
    const conflictFiles = ref([])
    const isConflict = computed(() => conflictFiles.value && conflictFiles.value.length > 0)
    const code = ref('v-code' + Math.random().toString(16).slice(2))
    const show = ref(Math.random() * 1000)
    let showChange = false
    const open = ref(false)
    const openModal = ref(false)
    const description = ref('')
    const user = ref()
    const editProjectName = ref('')
    const inputWidth = computed(() => 24 + editProjectName.value.length * 9.2)
    const inputRef = ref()
    const activeUsers = ref(new Set())
    let socket
    const to = ref(null)
    const editorOptions = ref(
      JSON.parse(localStorage.getItem('editorOptions')) || DefaultEditorOptions
    )
    const compileOptions = ref(
      JSON.parse(localStorage.getItem('compileOptions')) || DefaultCompileOptions
    )

    const showDrawer = () => {
      open.value = true
    }

    const onClose = () => {
      open.value = false
    }

    watch(
      () => [editorOptions.value],
      () => localStorage.setItem('editorOptions', JSON.stringify(editorOptions.value))
    )
    watch(
      () => [compileOptions.value],
      () => localStorage.setItem('compileOptions', JSON.stringify(compileOptions.value))
    )

    onMounted(async () => {
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
          const main = files.value.find((e) => e.id === infoRes.data.mainFileId)
          if (main) currentFile.value = main
          if (main && (main.localContent || main.content)) {
            loadingCompile.value = true
            compileAPI(infoRes.data.mainFileId)
              .then((res) => {
                const path = res.data.path.split('.')
                path.pop()
                if (res.data.compileSuccess) {
                  resCompile.value.pdf = path.join('.') + '.pdf'
                }
                resCompile.value.log = path.join('.') + '.log'
                files.value = files.value.map((e) => ({
                  ...e,
                  isCompile: true
                }))
              })
              .catch()
              .finally(() => (loadingCompile.value = false))
          }
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
    })

    onUnmounted(() => {
      serviceAPI.deleteCompile(code.value)
      sendMessage(JSON.stringify({ type: 'user', active: false, userId: user.value.id }))
    })

    window.addEventListener('beforeunload', function (event) {
      serviceAPI.deleteCompile(code.value)
      sendMessage(JSON.stringify({ type: 'user', active: false, userId: user.value.id }))
    })

    watchEffect(() => {
      description.value = 'Version ' + project.value?.versions?.length
    })

    watchEffect(() => {
      editProjectName.value = project.value?.name || ''
    })

    const onChangeSelected = (event) => {
      if (event == null) {
        // currentFile.value = null
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
      if (loadingCompile.value) return
      loadingCompile.value = true

      let mainId = project.value.mainFileId
      if (
        currentFile.value &&
        currentFile.value.type === 'tex' &&
        currentFile.value.name.split('.').pop() === 'tex'
      ) {
        mainId = currentFile.value.id
      }

      compileAPI(mainId)
        .then((res) => {
          show.value = Math.random() * 1000
          const path = res.data.path.split('.')
          path.pop()
          if (res.data.compileSuccess) {
            resCompile.value = {
              pdf: path.join('.') + '.pdf',
              log: path.join('.') + '.log'
            }
          } else {
            resCompile.value = {
              pdf: '',
              log: path.join('.') + '.log'
            }
          }
          files.value = files.value.map((e) => ({
            ...e,
            isCompile: true
          }))
        })
        .catch()
        .finally(() => {
          loadingCompile.value = false
        })
    }

    const onUpdateFiles = (send) => {
      if (send) sendMessage(JSON.stringify({ type: 'change', change: 'list-files' }))
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
      sendMessage(
        JSON.stringify({
          type: 'change',
          change: 'file',
          file: [
            {
              id: event.id,
              name: event.name,
              path: event.path,
              content: event.content,
              oldShaCode: event.oldShaCode
            }
          ]
        })
      )

      currentFile.value = event
      const idx = files.value.findIndex((e) => e.id === event.id)
      files.value[idx] = event
      files.value = { ...files.value }
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
        console.log('ok')
      }

      //auto compile
      if (compileOptions.value.autoCompile) {
        to.value && clearTimeout(to.value)
        to.value = setTimeout(() => {
          onCompile()
        }, compileOptions.value.autoCompileDelay * 1000)

        return () => clearTimeout(to.value)
      }
    }

    function connectWebSocket() {
      socket = new WebSocket(`ws://localhost:5000/ws/${route.params.versionId}/${user.value.id}`)

      socket.onmessage = function (event) {
        const data = JSON.parse(event.data)
        if (data.type === 'user') handleUserActive(data)
        else if (data.type === 'userList') handleListUserAcitve(data)
        else if (data.type === 'change') notiChange(data)
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
        code: code.value,
        files: files.value
          .filter((e) => e.isCompile === false)
          .map((e) => ({
            name: e.name,
            path: e.path,
            content: localStorage.getItem(e.id) || e.content,
            type: e.type
          })),
        compilePath: files.value.find((e) => e.id === compileFileId).path || ''
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
                onUpdateFiles(false)

                if (event.change === 'file') {
                  const tmp = event.file.filter(
                    (e) => e.oldShaCode !== files.value.find((f) => f.id === e.id).localShaCode
                  )
                  if (tmp.length > 0) conflictFiles.value = tmp
                }
              }
            },
            { default: () => 'Update' }
          )
        ],
        key: 'notiChange',
        onClose: () => {
          console.log('close')
          showChange = false
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

    const handleResize = (event) => {
      document.getElementById('pdfDiv').style.width = `calc(100% - ${event.width}px)`
    }

    const onDownloadFolder = (event) => {
      serviceAPI
        .downloadFolder({
          code: code.value,
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
        activeUsers.value.add(data.userId)
      } else activeUsers.value.delete(data.userId)
    }

    const handleListUserAcitve = (data) => {
      if (user?.value?.id) activeUsers.value.add(user.value.id)
      data.list.forEach((e) => {
        activeUsers.value.add(e)
      })
    }

    const onDownloadPdf = () => {
      fetch(`${import.meta.env.VITE_API_URL}/${code.value}/${resCompile.value.pdf}`)
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = project.value.name // Tên tệp bạn muốn đặt cho tệp đã tải xuống
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
        })
        .catch((error) => console.error('Error downloading the PDF:', error))
    }

    watch(
      () => [compileOptions.value, files.value],
      () => {
        console.log(files.value)
      }
    )

    return {
      show,
      files,
      onChangeSelected,
      currentFile,
      apiUrl: import.meta.env.VITE_API_URL,
      currentFile,
      onCompile,
      resCompile,
      onUpdateFiles,
      onSaveFile,
      conflictFiles,
      isConflict,
      onConflict,
      loadingVersion,
      loadingCompile,
      onSaveVersion,
      sendMessage,
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
      activeUsers,
      code,
      onDownloadPdf,
      editorOptions,
      theme,
      compileOptions
    }
  }
})
</script>

<style lang="scss">
@import '@/variable.scss';

@mixin apply-theme($theme) {
  $text-primary: map-get($theme, text-primary);
  $text-secondary: map-get($theme, text-secondary);
  $color-header: map-get($theme, color-header);
  $color-border: map-get($theme, color-border);
  $color-shadow: map-get($theme, color-shadow);
  $color-background-layout: map-get($theme, color-background-layout);
  $color-background: map-get($theme, color-background);

  .ant-layout-header.custom-header {
    background-color: $color-background;
    box-shadow: 0 4px 10px 0 $color-shadow;
    border-bottom: 1px solid $color-border;

    .ant-input {
      background: $color-background;
    }

    .starred-div {
      border: 1px solid $color-border;
      background: $color-background-layout;
    }
  }

  .directory {
    background: $color-background;
  }

  .pdf-viewer {
    background: $color-background;

    &__header {
      box-shadow: none;
      z-index: 0;
      input {
        background: $color-background-layout !important;
        color: $text-primary !important;
        border-radius: 4px;
      }

      .title,
      #divider,
      #pagelength {
        color: $text-primary;
      }

      #zoom-controls {
        margin-left: 16px;
        .icon-btn {
          width: 20px;
          height: 20px;
          &:hover {
            background: rgba(109, 91, 208, 0.2);
          }
          .iconfont {
            color: $text-secondary;
            font-size: 8px;
          }
        }
      }
    }
    &__body {
      height: calc(100vh - 102px);
    }
  }
}

iframe {
  background-color: orange;
}

.splitpanes > .splitpanes__splitter {
  min-width: 6px;
  background: rgba(109, 91, 208, 0.3);
}

.project-page {
  &[theme='light'] {
    @include apply-theme($theme-light);
  }

  &[theme='dark'] {
    @include apply-theme($theme-dark);
  }
  .logo {
    width: 48px;
    height: 48px;
    margin-top: 8px;
  }

  .row-search {
    width: 100%;
    flex-flow: nowrap;
    gap: 8px;
  }

  .header-info {
    margin-bottom: 16px;
    & > .ant-space-item {
      line-height: 24px;
    }
  }

  .project-content {
    margin: 0;
    padding: 0;
    min-height: calc(100vh - 64px) !important;
  }

  .editor {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .editor-right {
    position: relative;
    width: calc(100% - 650px);
    height: 100%;
    .pdf-viewer {
      &__header {
        background-color: rgba(109, 91, 208, 0.09);
        height: 38px;
      }
    }
  }

  .editor-btns {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .editor img {
    width: 100%;
    margin: auto;
  }

  .title-path {
    width: 100%;
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
    justify-content: space-between;
    display: flex;
    z-index: 10;
    .title-project {
      font-size: 18px;
      font-weight: 600;
    }
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
    padding: 0 8px;
    border-radius: 12px;

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
