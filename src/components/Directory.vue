<template>
  <a-row :style="{ margin: '8px' }" justify="space-between" v-if="!readonly">
    <a-row>
      <a-tooltip title="New folder">
        <a-button v-if="!isMulti" type="text" class="icon-btn" @click="() => onNewFolder('folder')">
          <folder-add-filled class="icon-select" />
        </a-button>
      </a-tooltip>
      <a-tooltip title="New file">
        <a-button v-if="!isMulti" type="text" class="icon-btn" @click="() => onNewFolder('file')">
          <file-add-filled class="icon-select" />
        </a-button>
      </a-tooltip>
      <a-tooltip title="New image">
        <a-button v-if="!isMulti" type="text" class="icon-btn" @click="() => (openUpload = true)">
          <file-image-filled class="icon-select" />
        </a-button>
      </a-tooltip>
    </a-row>
    <a-row>
      <a-tooltip title="Delete">
        <a-button type="text" class="icon-btn" @click="onDelete">
          <delete-filled class="icon-select" />
        </a-button>
      </a-tooltip>
    </a-row>
  </a-row>
  <a-directory-tree
    mode="inline"
    :style="{ height: '100%', borderRight: 0 }"
    v-model:selectedKeys="selectedKeys"
    v-model:expandedKeys="expandedKeys"
    :tree-data="files"
    multiple
    @select="onChangeSelectedKeys"
  >
  </a-directory-tree>
  <a-modal
    :open="newFolder == 'file' || newFolder == 'folder'"
    :title="`New ${newFolder}`"
    okText="Save"
    @ok="saveFolder"
    @cancel="() => (newFolder = '')"
  >
    <a-input v-model:value="nameFolder" :placeholder="`${newFolder} name`" />
    <a-typography-text type="danger">{{ errorText }}</a-typography-text>
  </a-modal>
  <a-modal v-model:open="openUpload" title="Upload new image" okText="Save" @ok="saveImage">
    <input type="file" @change="onFileChanged($event)" accept="image/*" capture />
    <a-input v-model:value="nameFolder" placeholder="Image name" />
    <a-typography-text type="danger">{{ errorText }}</a-typography-text>
  </a-modal>
</template>

<script>
import { computed, defineComponent, h, readonly, ref, watch, watchEffect } from 'vue'
import {
  FolderOutlined,
  FileOutlined,
  FileImageOutlined,
  FolderAddFilled,
  FileAddFilled,
  FileImageFilled,
  UploadOutlined,
  DeleteFilled
} from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import { serviceAPI } from '@/services/API'
import { NotiError } from '@/services/notification'
import { Confirm } from '@/services/confirm'
import { notification, Button } from 'ant-design-vue'

export default defineComponent({
  components: {
    FolderOutlined,
    FileOutlined,
    FileImageOutlined,
    FolderAddFilled,
    FileAddFilled,
    FileImageFilled,
    UploadOutlined,
    DeleteFilled
  },
  props: {
    initData: {
      type: Array,
      default: []
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['changeSelected', 'update:files'],
  setup(props, { emit }) {
    const selectedKeys = ref([])
    const expandedKeys = ref([])
    const files = ref([])
    const route = useRoute()
    const nameFolder = ref('')
    const errorText = ref('')
    const newFolder = ref('')
    const paths = new Set()
    const openUpload = ref(false)
    const loading = ref(false)
    const imageFile = ref()
    const isMulti = computed(() => selectedKeys.value.length > 1)

    const compareFile = (a, b) => {
      let aIsLeaf = a.isLeaf ? 1 : 0
      let bIsLeaf = b.isLeaf ? 1 : 0
      if (aIsLeaf !== bIsLeaf) {
        return aIsLeaf - bIsLeaf
      }

      if (a.title && b.title) {
        return a.title.localeCompare(b.title)
      } else if (a.title) {
        return -1
      } else if (b.title) {
        return 1
      }

      return 0
    }

    const onNewFolder = (val) => {
      newFolder.value = val
      errorText.value = ''
      imageFile.value = null
    }

    const deepSet = (obj, path, value) => {
      let lastKey = path.pop()
      let lastObj = path.reduce((acc, key) => {
        if (acc[key] === undefined) {
          acc[key] = {}
        }
        return acc[key]
      }, obj)

      lastObj[lastKey].push(value)
      lastObj[lastKey].sort(compareFile)
    }

    function insertPath(node, parts, item, isLeaf = false) {
      if (parts.length === 0) return

      const part = parts.shift()
      let child = node.children.find((c) => c.title === part)

      if (!child) {
        child = {
          title: part,
          key: node.key ? `${node.key}/${part}` : part,
          children: [],
          isLeaf: false
        }
        node.children.push(child)
        node.children.sort(compareFile)
        paths.add(node.key ? `${node.key}/${part}` : part)
      }

      if (parts.length === 0 && isLeaf) {
        child.isLeaf = true
        child.icon = item.typeFile === 'img' ? h(FileImageOutlined) : h(FileOutlined)
      } else {
        insertPath(child, parts, item, isLeaf)
      }
    }

    function buildDirectoryStructure(files) {
      const root = { title: '', path: '', children: [] }

      files.forEach((file) => {
        const parts = file.path.split('/')
        const fileName = parts.pop()
        insertPath(root, parts, file)
        const leafNode = {
          title: fileName,
          key: `${root.path}/${file.path}`,
          children: [],
          isLeaf: false,
          typeFile: file.type
        }
        insertPath(root, file.path.split('/'), leafNode, true)
      })

      return root.children
    }

    const saveFolder = () => {
      if (!nameFolder.value) {
        errorText.value = `${newFolder.value} name is required!`
        return
      }

      if (newFolder.value === 'file') nameFolder.value += '.tex'

      let path = selectedKeys.value[0]?.split('/') || []
      if (path.length > 0 && path[path.length - 1].includes('.')) path.pop()

      if (paths.has([...path, nameFolder.value].join('/'))) {
        errorText.value = `A ${newFolder.value} with this name already exists`
        return
      }

      if (newFolder.value === 'folder') {
        let pathToObj = []
        let id = []

        path.forEach((p) => {
          let i = -1
          if (id.length === 0) {
            i = files.value.findIndex((e) => e.title === p)
          } else {
            let targetArray = [...files.value]
            for (const idx of id) {
              targetArray = targetArray[idx].children
            }
            i = targetArray.findIndex((e) => e.title === p)
          }
          pathToObj.push(i, 'children')
          id.push(i)
        })
        if (pathToObj.length === 0) {
          files.value = [
            ...files.value,
            {
              key: nameFolder.value,
              title: nameFolder.value,
              children: [],
              isLeaf: false
            }
          ]
          files.value.sort(compareFile)
          paths.add(nameFolder.value)
        } else {
          deepSet(files.value, pathToObj, {
            title: nameFolder.value,
            key: [...path, nameFolder.value].join('/'),
            children: [],
            isLeaf: false
          })
          paths.add([...path, nameFolder.value].join('/'))
        }
        newFolder.value = ''
        nameFolder.value = ''
      } else {
        if (loading.value) return
        loading.value = true
        serviceAPI
          .createFile({
            versionId: route.params.versionId,
            name: nameFolder.value,
            path: [...path, nameFolder.value].join('/')
          })
          .then(() => {
            emit('update:files')
            paths.add([...path, nameFolder.value].join('/'))
          })
          .catch((err) => {
            if (err.response.status == 400) {
              NotiFileList({
                type: 'saveImage',
                message: err.response.data.message
              })
            } else NotiError('Failed to create new file!')
          })
          .finally(() => {
            newFolder.value = ''
            nameFolder.value = ''
            loading.value = false
          })
      }
      return
    }

    const saveImage = () => {
      if (!imageFile.value) {
        errorText.value = `Image file is required!`
        return
      }

      if (!nameFolder.value) {
        errorText.value = `Image name is required!`
        return
      }
      let path = selectedKeys.value[0]?.split('/') || []
      if (path.length > 0 && path[path.length - 1].includes('.')) path.pop()

      const ext = imageFile.value.name.split('.').pop()
      const filePath = [...path, nameFolder.value].join('/') + '.' + ext

      if (paths.has(filePath)) {
        errorText.value = `A image with this name already exists`
        return
      }

      const formData = new FormData()
      formData.append('file', imageFile.value)
      formData.append('name', nameFolder.value)
      formData.append('versionId', route.params.versionId)
      formData.append('path', filePath)

      serviceAPI
        .uploadFile(formData)
        .then(() => {
          emit('update:files')
          paths.add(filePath)
        })
        .catch((err) => {
          if (err.response.status == 400) {
            NotiFileList({
              type: 'saveImage',
              message: err.response.data.message
            })
          } else NotiError('Failed to create new file!')
        })
        .finally(() => {
          openUpload.value = false
          nameFolder.value = ''
          loading.value = false
        })
    }

    function onFileChanged($event) {
      const target = $event.target
      if (target && target.files) {
        imageFile.value = target.files[0]
      }
    }

    const onDelete = () => {
      Confirm({
        content: 'Are you sure to delete these files?',
        okText: 'Delete',
        onOk() {
          const deleteFiles = props.initData.filter(
            (e) => selectedKeys.value.findIndex((k) => e.path.startsWith(k)) !== -1
          )
          if (loading.value) return
          loading.value = true
          Promise.all(
            deleteFiles.map((e) =>
              serviceAPI
                .deleteFile(e.id, e.localShaCode)
                .catch((err) => {
                  if (err.response.status == 400) {
                    NotiDelete({
                      type: 'saveImage',
                      message: err.response.data.message,
                      id: err.response.data.id,
                    })
                  } else NotiError('Failed to delete this file!')
                })
                .finally(() => {
                  loading.value = false
                })
            )
          ).finally(() => {
            emit('update:files')
            console.log('done')
            // files.value = buildDirectoryStructure(
            //   props.initData.filter((e) => !deleteFiles.includes(e))
            // )
            selectedKeys.value = []
          })
        }
      })
    }

    const NotiFileList = ({ type = '', filePath = '', message }) => {
      notification.error({
        message: message || 'Files list has been changed',
        description: 'Please update files list before create new file!',
        btn: () =>
          h(
            Button,
            {
              type: 'primary',
              onClick: () => {
                notification.close(`${type}${filePath}`)
                emit('update:files')
              }
            },
            { default: () => 'Update' }
          ),
        key: `${type}${filePath}`
      })
    }

    const NotiDelete = ({ type = '', filePath = '', message, id, shaCode }) => {
      notification.error({
        message: message || 'Files list has been changed',
        description: 'Do you want to delete?',
        btn: () =>
          h(
            Button,
            {
              type: 'text',
              onClick: () => {
                notification.close(`${type}${filePath}`)
                serviceAPI.deleteFile(id, shaCode).catch((err) => null)
              }
            },
            { default: () => 'Delete' }
          ),
        key: `${type}${filePath}`
      })
    }

    const onChangeSelectedKeys = (event) => {
      // không chọn file nào
      if (event.length === 0 || !event) {
        emit('changeSelected', null)
        return
      }
      // chọn 1 file tex hoặc ảnh
      if (event.length === 1 && event[0].includes('.')) {
        emit(
          'changeSelected',
          props.initData.find((e) => e.path === event[0])
        )
        return
      }
      // chọn nhiều file hoặc chọn folder
      emit('changeSelected', null)
    }

    watchEffect(() => (files.value = buildDirectoryStructure(props.initData).sort(compareFile)))

    watch(
      () => [nameFolder.value],
      ([value]) => {
        if (errorText.value && value) errorText.value = ''
      }
    )

    return {
      selectedKeys,
      expandedKeys,
      files,
      nameFolder,
      newFolder,
      saveFolder,
      onNewFolder,
      errorText,
      openUpload,
      saveImage,
      imageFile,
      onFileChanged,
      isMulti,
      onDelete,
      onChangeSelectedKeys
    }
  }
})
</script>

<style>
.ant-modal .ant-input {
  margin: 16px 0;
}

.icon-btn {
  padding: 0 4px;
}

.icon-select {
  font-size: 20px;
}
</style>
