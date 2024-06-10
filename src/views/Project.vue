<template>
  <a-layout class="project-page">
    <a-layout-header class="custom-header">
      <a-space>
        <a style="line-height: 20px; background: blue" href="/">
          <img src="/icons/user.svg" />
        </a>
        <a-space style="line-height: 24px">
          <a-input
            ref="inputRef"
            v-model:value="editProjectName"
            @blur="onBlurInput"
            @pressEnter="() => inputRef.blur()"
            :style="{ width: inputWidth + 'px'}"
          />
          <!-- <p class="title-project">{{ project?.name }}</p> -->
          <StarIcon />
        </a-space>
      </a-space>
      <a-space>
        <a-space class="shared-div" align="center">
          <a-button type="text" shape="circle" size="small">
            <lock-outlined v-if="!project?.isPublic" />
            <global-outlined v-if="project?.isPublic" />
          </a-button>
          <a-avatar-group
            :size="28"
            :max-count="3"
            :max-style="{ color: '#965E00', backgroundColor: '#FFECCC' }"
            :maxPopoverTrigger="''"
          >
            <a-avatar
              v-for="member in project?.userProjects"
              :src="'https://ui-avatars.com/api/?background=random&name=' + member?.fullname"
            ></a-avatar>
          </a-avatar-group>
          <a-dropdown :trigger="['click']" placement="bottomRight">
            <a-button size="small" type="text" shape="circle" style="font-size: 12px">
              <DownOutlined />
            </a-button>
            <template #overlay>
              <div class="custom-overlay">
                <a-typography-text class="title-text" strong style="font-size: 14px">
                  GENERAL ACCESS
                </a-typography-text>
                <a-row>
                  <div
                    class="access-ic"
                    :class="{ lock: !project?.isPublic, global: project?.isPublic }"
                  >
                    <global-outlined v-if="project?.isPublic" />
                    <lock-outlined v-if="!project?.isPublic" />
                  </div>
                  <div style="display: grid">
                    <a-select
                      size="small"
                      :value="!!project?.isPublic"
                      @click="(e) => e.stopPropagation()"
                      @select="onSelectAccess"
                      :bordered="false"
                    >
                      <a-select-option :value="true">Public</a-select-option>
                      <a-select-option :value="false">Private</a-select-option>
                    </a-select>
                    <a-typography-text
                      style="font-size: 12px; color: #6e6893; padding: 0 7px; width: 250px"
                    >
                      {{
                        project?.isPublic
                          ? 'Anyone on the internet can see this project.'
                          : 'Only the members can see this project'
                      }}
                    </a-typography-text>
                  </div>
                </a-row>
                <a-typography-text
                  class="title-text"
                  strong
                  style="font-size: 14px; margin-top: 8px"
                >
                  MEMBERS
                </a-typography-text>
                <a-row align="center" v-if="stepAdd === 1">
                  <a-select
                    v-model:value="addMemberState.members"
                    style="width: calc(100% - 45px); margin-right: 8px"
                    @click="(e) => e.stopPropagation()"
                    show-search
                    @search="onFilterUser"
                    placeholder="Add members to project"
                    mode="multiple"
                    max-tag-count="responsive"
                    :max-tag-text-length="10"
                    :options="userOptions"
                    :filterOption="filterOption"
                  ></a-select>
                  <a-button
                    size="small"
                    shapre="circle"
                    type="link"
                    style="margin: auto 0"
                    @click="nextStep"
                    :disabled="addMemberState.members.length == 0"
                  >
                    <ArrowRightOutlined />
                  </a-button>
                </a-row>
                <a-row align="center" v-if="stepAdd === 2">
                  <a-select
                    v-model:value="addMemberState.role"
                    style="width: calc(100% - 100px); margin-right: 8px"
                    @click="(e) => e.stopPropagation()"
                  >
                    <a-select-option value="editor">Editor</a-select-option>
                    <a-select-option value="viewer">Viewer</a-select-option>
                  </a-select>
                  <a-button size="small" type="link" style="margin: auto 0" @click="addMember">
                    Add
                  </a-button>
                  <a-button
                    size="small"
                    shapre="circle"
                    type="link"
                    style="margin: auto 0"
                    @click="cancelAdd"
                    danger
                  >
                    <CloseOutlined />
                  </a-button>
                </a-row>

                <a-space direction="vertical" :size="0" class="member">
                  <a-space v-for="member in project.userProjects">
                    <a-avatar
                      :size="40"
                      :src="
                        'https://ui-avatars.com/api/?background=random&name=' + member?.fullname
                      "
                    />
                    <div>
                      <div style="margin: 0 7px">
                        <span style="font-weight: 600; margin-right: 4px">
                          {{ member?.fullname }}
                        </span>
                        {{ member?.username }}
                      </div>
                      <a-select
                        size="small"
                        :value="member?.role"
                        @click="(e) => e.stopPropagation()"
                        :bordered="false"
                        :disabled="member?.role === 'owner'"
                        :showArrow="member?.role !== 'owner'"
                        @select="(e) => onChangeRole(e, member.id)"
                        style="width: 120px"
                      >
                        <a-select-option value="owner" style="display: none" :id="member.id">
                          Owner
                        </a-select-option>
                        <a-select-option value="editor">Editor</a-select-option>
                        <a-select-option value="viewer">Viewer</a-select-option>
                        <template #dropdownRender="{ menuNode }">
                          <VNodes :vnodes="menuNode" />
                          <a-divider style="margin: 4px 0" />
                          <a-button type="text" style="width: 100%; text-align: start">
                            Set owner
                          </a-button>
                          <a-button
                            danger
                            type="text"
                            style="width: 100%; text-align: start"
                            @click="(e) => removeMember(e, member.id)"
                          >
                            Remove
                          </a-button>
                        </template>
                      </a-select>
                    </div>
                  </a-space>
                </a-space>
              </div>
            </template>
          </a-dropdown>
        </a-space>
        <a-radio-group size="large">
          <a-radio-button @click="() => (openModal = true)">
            <a-space align="center">
              <img src="/icons/version.svg" style="width: 16px; position: relative; top: 2px" />
              <span style="font-weight: 600">Save Version</span>
            </a-space>
          </a-radio-button>
          <a-radio-button @click="showDrawer">
            <span style="font-weight: 600">{{ project?.versions.length }}</span>
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
          v-for="item in project?.versions"
          class="version-div"
          @click="() => clickVersion(item)"
        >
          <p class="title-version">{{ item?.isMainVersion ? 'Main version' : item.description }}</p>
        </div>
      </a-drawer>
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
  DownOutlined,
  GlobalOutlined,
  LockOutlined,
  ArrowRightOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import { serviceAPI } from '@/services/API'
import Directory from '@/components/Directory.vue'
import Editor from '@/components/Editor.vue'
import Compare from '@/components/Compare.vue'
import { Button, notification } from 'ant-design-vue'
import router from '@/router'
import StarIcon from '../../public/icons/star.svg'
import VueResizable from 'vue-resizable'
import { NotiError } from '@/services/notification'

const VNodes = defineComponent({
  props: {
    vnodes: {
      type: Object,
      required: true
    }
  },
  render() {
    return this.vnodes
  }
})

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
    StarIcon,
    VueResizable,
    TeamOutlined,
    DownOutlined,
    GlobalOutlined,
    LockOutlined,
    ArrowRightOutlined,
    CloseOutlined,
    VNodes
  },
  setup() {
    const files = ref([])
    const project = ref()
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
    const user = ref()
    const userOptions = ref()
    const stepAdd = ref(1)
    const addMemberState = reactive({
      members: [],
      role: 'viewer'
    })
    const editProjectName = ref('')
    const inputWidth = computed(() => 24 + editProjectName.value.length * 9.2)
    const inputRef = ref()

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
          const main = files.value.find((e) => e.path === 'main.tex')
          if (main && main.content) {
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
          project.value = res.data
        })
        .catch((err) => {
          console.log(err)
        })
      serviceAPI
        .getCurrentUser()
        .then((res) => {
          user.value = res.data
        })
        .catch(() => {
          NotiError('Your authorized failed')
        })
      connectWebSocket()
    })

    watchEffect(() => {
      description.value = 'Version ' + project.value?.versions.length
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
      if (send) sendMessage(JSON.stringify({ change: 'list-files' }))
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
      socket = new WebSocket(`ws://localhost:5000/ws/${route.params.versionId}`)

      socket.onmessage = function (event) {
        // console.log('ms', JSON.parse(event.data))
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

    const onSelectAccess = (e) => {
      if (e !== project.value.isPublic) {
        serviceAPI
          .updateProject(project.value.id, {
            isPublic: e
          })
          .then((project.value.isPublic = e))
          .catch(() => NotiError('Try again'))
      }
    }

    const onChangeRole = (role, id) => {
      if (role === 'owner') return
      serviceAPI
        .changeRole({
          role,
          id
        })
        .then((res) => {
          project.value.userProjects = res.data
        })
        .catch(() => NotiError('Try again'))
    }

    const onFilterUser = async (input) => {
      try {
        const res = await serviceAPI.getUserToProject(project.value.id, input)
        userOptions.value = res.data.map((e) => ({
          value: e.id,
          label: e.fullname
        }))
      } catch (err) {
        NotiError('Failed')
        userOptions.value = []
      }
    }

    const filterOption = async (input, option) => {
      return option
    }

    const nextStep = (e) => {
      e.stopPropagation()
      stepAdd.value = 2
    }

    const cancelAdd = (e) => {
      e.stopPropagation()
      stepAdd.value = 1
      Object.assign(addMemberState, {
        members: [],
        role: 'viewer'
      })
    }

    const addMember = (e) => {
      e.stopPropagation()
      Promise.all(
        addMemberState.members.map((id) =>
          serviceAPI
            .addMember({
              projectId: project.value.id,
              editorId: id,
              role: addMemberState.role
            })
            .then((res) => {
              project.value.userProjects = res.data
              stepAdd.value = 1

              Object.assign(addMemberState, {
                members: [],
                role: 'viewer'
              })
            })
            .catch(() => NotiError('failed'))
        )
      )
    }

    const removeMember = (e, id) => {
      e = e.originalEvent
      serviceAPI
        .removeMember(id)
        .then((res) => {
          project.value.userProjects = res.data
          document.getElementById(id).click()
        })
        .catch((err) => {
          console.log(err)
          NotiError('Try again')
        })
    }

    const onDownloadFolder = (event) => {
      console.log(event)
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
      onSelectAccess,
      onChangeRole,
      onFilterUser,
      userOptions,
      filterOption,
      stepAdd,
      nextStep,
      addMemberState,
      cancelAdd,
      addMember,
      removeMember,
      onDownloadFolder,
      editProjectName,
      onBlurInput,
      inputWidth,
      inputRef
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
    margin-bottom: 16px;
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

  .ant-input {
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

  .shared-div {
    // background-color: #f2f0f9;
    border-radius: 20px;
    line-height: 32px;
    padding: 0 8px;
    height: 40px;
    border: 1px solid #6d5bd0;
    color: #6d5bd0;

    .ant-space-item {
      display: flex;
      align-items: center;
    }
  }
}

.custom-overlay {
  background-color: white;
  padding: 16px 24px;
  margin-top: 20px;
  border-radius: 8px;
  box-shadow: 0 8px 10px 0 #00000010;
  display: grid;
  gap: 8px;
  max-height: 500px;
  overflow: auto;

  .access-ic {
    border-radius: 100%;
    padding: 4px 10px;
    width: 40px;
    height: 40px;
    font-size: 20px;
    margin-right: 16px;

    &.lock {
      color: #d30000;
      background: #ffe0e0;
    }

    &.global {
      color: #007f00;
      background: #cdffcd;
    }
  }

  .member {
    margin-top: 8px;
    > .ant-space-item {
      margin: 0 -24px;
      padding: 8px 24px;

      &:hover {
        background: #f2f0f9;
        cursor: default;
      }
      // border-bottom: 1px solid #d9d5ec;
    }
  }

  // .ant-select-arrow {
  //   transform: translateY(-62%);
  // }
}
</style>
