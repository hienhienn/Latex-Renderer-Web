<template>
  <a-layout>
    <a-layout>
      <a-layout-sider width="250" style="background: #fff">
        <a-row :style="{ margin: '8px' }">
          <a-tooltip title="New folder">
            <a-button type="text" class="icon-btn" @click="() => onNewFolder('folder')">
              <folder-add-filled class="icon-select" />
            </a-button>
          </a-tooltip>
          <a-tooltip title="New file">
            <a-button type="text" class="icon-btn" @click="() => onNewFolder('file')">
              <file-add-filled class="icon-select" />
            </a-button>
          </a-tooltip>
          <a-tooltip title="New image">
            <a-button type="text" class="icon-btn">
              <file-image-filled class="icon-select" />
            </a-button>
          </a-tooltip>
        </a-row>
        <a-directory-tree
          mode="inline"
          :style="{ height: '100%', borderRight: 0 }"
          v-model:selectedKeys="selectedKeys"
          v-model:expandedKeys="expandedKeys"
          :tree-data="files"
          multiple
        >
          <!-- <a-menu-item
            v-for="item in files"
            :key="item.path"
            :class="{ folder: item.type === 'folder' }"
          >
            <a-space>
              <file-outlined v-if="item.type === 'tex'" />
              <file-image-outlined v-if="item.type === 'img'" />
              <folder-outlined v-if="item.type === 'folder'" class="folder-icon" />
              <folder-outlined v-if="item.type === 'folder'" class="folder-icon-open" />
              {{ item.name }}
            </a-space>
          </a-menu-item> -->
        </a-directory-tree>
      </a-layout-sider>
      <a-layout style="padding: 0 24px 24px">
        <!-- <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>Projects</a-breadcrumb-item>
          <a-breadcrumb-item>{{ breadcrumb }}</a-breadcrumb-item>
        </a-breadcrumb> -->
        <a-layout-content>
          <a-modal
            :open="newFolder == 'file' || newFolder == 'folder'"
            :title="`New ${newFolder}`"
            okText="Save"
            @ok="saveFolder"
            @cancel="
              () => {
                newFolder = ''
              }
            "
          >
            <a-input v-model:value="nameFolder" :placeholder="`${newFolder} name`" />
            <a-typography-text type="danger">{{ errorText }}</a-typography-text>
          </a-modal>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script>
import { defineComponent, h, onMounted, ref, watch } from 'vue'
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
import { NotiError } from '@/services/notification'

export default defineComponent({
  components: {
    FolderOutlined,
    FileOutlined,
    FileImageOutlined,
    FolderAddFilled,
    FileAddFilled,
    FileImageFilled,
    FolderOpenOutlined
  },
  setup() {
    const selectedKeys = ref(['main.tex'])
    const expandedKeys = ref([])
    const files = ref([])
    const route = useRoute()
    const loading = ref(false)
    const nameFolder = ref('')
    const errorText = ref('')
    const newFolder = ref('')
    const paths = new Set()

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
      }

      if (parts.length === 0 && isLeaf) {
        // Đánh dấu nút này là nút lá nếu không còn bất kỳ phần nào khác của đường dẫn
        child.isLeaf = true
      } else {
        insertPath(child, parts, item, isLeaf)
      }
    }

    function buildDirectoryStructure(files) {
      const root = { title: '', path: '', children: [] }

      files.forEach((file) => {
        const parts = file.path.split('/')
        const fileName = parts.pop() // Remove and get the file name from parts
        insertPath(root, parts, file)
        // Add the file as a leaf node
        const leafNode = {
          title: fileName,
          key: `${root.path}/${file.path}`,
          children: [],
          isLeaf: false
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

      let path = selectedKeys.value[0].split('/')
      if (path[path.length - 1].includes('.')) path.pop()

      if (paths.has([...path, nameFolder.value].join('/'))) {
        errorText.value = `A ${newFolder.value} with this name already exists`
        return
      }

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

      if (newFolder.value === 'folder') {
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
        serviceAPI
          .createFile({
            versionId: route.params.versionId,
            name: nameFolder.value,
            path: [...path, nameFolder.value].join('/')
          })
          .then(() => {
            if (pathToObj.length === 0) {
              files.value = [
                ...files.value,
                {
                  key: nameFolder.value,
                  title: nameFolder.value,
                  children: [],
                  isLeaf: true
                }
              ]
              files.value.sort(compareFile)
              paths.add(nameFolder.value)
            } else {
              deepSet(files.value, pathToObj, {
                title: nameFolder.value,
                key: [...path, nameFolder.value].join('/'),
                children: [],
                isLeaf: true
              })
              paths.add([...path, nameFolder.value].join('/'))
            }
          })
          .catch((err) => {
            console.log(err)
            NotiError('Failed to create new file!')
          })
          .finally(() => {
            newFolder.value = ''
            nameFolder.value = ''
          })
      }

      return
    }

    const onOpenChange = ({ item, key, keyPath }) => {
      console.log(item, key, keyPath)
    }

    onMounted(() => {
      loading.value = true
      serviceAPI
        .getFilesByVersionId(route.params.versionId)
        .then((res) => {
          files.value = buildDirectoryStructure(res.data).sort(compareFile)
        })
        .catch((err) => {
          console.log(err)
        })
        .finally(() => {
          loading.value = false
        })
    })

    watch(
      () => [nameFolder.value],
      ([value, oldValue]) => {
        if (errorText && value) errorText.value = ''
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
      onOpenChange
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
  background: #fff;
  padding: 24px;
  margin: 0;
  min-height: calc(100vh - 142px) !important;
}

.ant-modal .ant-input {
  margin: 16px 0;
}

.icon-btn {
  padding: 0 4px;
}

.icon-select {
  font-size: 20px;
}

.ant-menu-item.folder:focus .folder-icon-active {
  display: hidden;
}
</style>
