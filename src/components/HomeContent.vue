<template>
  <div class="home-table-container" :theme="theme">
    <a-row justify="space-between" class="row-search">
      <a-input v-model:value="searchText" placeholder="Type here to search" allow-clear>
        <template #prefix>
          <search-outlined />
        </template>
      </a-input>
      <a-button type="primary" @click="onClickNew">New Project</a-button>
    </a-row>
    <a-table
      :dataSource="dataSource"
      :columns="columns"
      :pagination="false"
      @change="onChangeTable"
      :loading="loading"
      size="middle"
    >
      <template #bodyCell="{ column, text, record }">
        <template v-if="column.dataIndex === 'name'">
          <div style="display: flex">
            <RouterLink :to="`/project/${record.mainVersionId}`" class="a-title">
              {{ text }}
            </RouterLink>
            <a-tag class="mode-tag" v-if="record.role">
              {{ record.role }}
            </a-tag>
            <a-tooltip :title="record.isPublic ? 'Public' : 'Private'">
              <a-button size="small" type="text" shape="circle">
                <GlobalOutlined v-if="record.isPublic" />
                <LockOutlined v-if="!record.isPublic" />
              </a-button>
            </a-tooltip>
            <a-tooltip :title="record.starred ? 'Starred' : 'Unstarred'">
              <a-button size="small" type="text" shape="circle">
                <StarFilled v-if="record.starred" style="color: #fbc725" />
                <StarOutlined v-if="!record.starred" />
              </a-button>
            </a-tooltip>
          </div>
        </template>
        <template v-if="column.dataIndex === 'userProjects'">
          <a-avatar-group
            :size="28"
            :max-count="3"
            :max-style="{ color: '#965E00', backgroundColor: '#FFECCC' }"
            :maxPopoverTrigger="''"
          >
            <a-avatar
              v-for="member in text"
              :src="'https://ui-avatars.com/api/?background=random&name=' + member?.fullname"
            ></a-avatar>
          </a-avatar-group>
        </template>
        <template v-if="column.dataIndex === 'modifiedTime'">
          {{ dateTimeFormat(text) }}
          <a-row class="modify-editor">
            by
            <AvatarApp :hide-avatar="true" :avatar-user="record.editor" :current-user="user" />
          </a-row>
        </template>
        <template v-if="column.dataIndex === 'actions'">
          <div style="display: flex">
            <a-tooltip title="Copy">
              <a-button style="padding: 0 8px" @click="() => onCopyProject(record)" type="text">
                <copy-outlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="Delete">
              <a-button style="padding: 0 8px" @click="() => onDelete(record)" type="text">
                <delete-outlined />
              </a-button>
            </a-tooltip>
          </div>
        </template>
      </template>
    </a-table>
    <a-row justify="space-between" align="middle" class="custom-pagination-row">
      <span>
        Show {{ pagination.pageSize * (pagination.page - 1) + 1 }} -
        {{ pagination.pageSize * (pagination.page - 1) + dataSource.length }} of
        {{ pagination.total }} items
      </span>
      <a-pagination
        :current="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :showSizeChanger="false"
        @change="onChangePagination"
      />
    </a-row>
    <a-modal v-model:open="openModal" title="New Project" okText="Save" @ok="saveProject">
      <a-input v-model:value="namePrj" placeholder="Project Name" />
      <a-typography-text type="danger">{{ errorText }}</a-typography-text>
    </a-modal>
  </div>
  <CopyProject
    :initData="{ name: selectedProject?.name, version: selectedProject?.mainVersionId }"
    v-model:open="openCopy"
    :versions="selectedProject?.versions"
    @success="onSuccessCopy"
  />
</template>

<script lang="ts">
import { serviceAPI } from '@/services/API'
import { NotiError, NotiSuccess } from '@/services/notification'
import { defineComponent, reactive, readonly, ref, watch } from 'vue'
import { dateTimeFormat } from '@/services/functions'
import {
  CopyOutlined,
  DeleteOutlined,
  GlobalOutlined,
  LockOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined
} from '@ant-design/icons-vue'
import debounce from 'lodash.debounce'
import { Confirm } from '@/services/confirm'
import AvatarApp from '@/components/common/AvatarApp.vue'
import { inject } from 'vue'
import CopyProject from './CopyProject.vue'

export default defineComponent({
  props: {
    category: {
      type: String
    },
    user: {
      type: Object
    }
  },
  components: {
    DeleteOutlined,
    SearchOutlined,
    LockOutlined,
    GlobalOutlined,
    AvatarApp,
    StarOutlined,
    StarFilled,
    CopyOutlined,
    CopyProject
  },
  name: 'HomeContent',
  setup(props) {
    const theme = inject('theme')
    const searchText = ref<string>('')
    const errorText = ref<string>('')
    const pagination = reactive({
      pageSize: 10,
      total: 50,
      page: 1,
      handlePagination: (page: number) => {
        pagination.page = page
      }
    })
    const sorter = reactive({
      fieldSort: null,
      sort: null
    })
    const columns = readonly([
      {
        title: 'Project',
        dataIndex: 'name',
        ellipsis: true,
        sorter: true
      },
      {
        title: 'Member',
        dataIndex: 'userProjects',
        width: 150
      },
      {
        title: 'Last Modified',
        dataIndex: 'modifiedTime',
        sorter: true,
        width: 200
      },
      {
        title: 'Actions',
        dataIndex: 'actions',
        align: 'center',
        width: 120
      }
    ])
    const dataSource = ref<any[]>([])
    const loading = ref(false)
    const openModal = ref(false)
    const namePrj = ref<string>('')
    const to = ref<any>(null)
    const selectedProject = ref()
    const openCopy = ref(false)

    watch(
      () => [namePrj.value],
      ([value]) => {
        if (errorText.value && value) errorText.value = ''
      }
    )

    const onClickNew = () => {
      openModal.value = true
      namePrj.value = ''
      errorText.value = ''
    }

    const saveProject = () => {
      if (!namePrj.value) {
        errorText.value = `Project name is required!`
        return
      }
      if (loading.value) return
      loading.value = true
      serviceAPI
        .newProject({ name: namePrj.value })
        .then((res) => {
          NotiSuccess('Your project have been created successfully')
          openModal.value = false
        })
        .catch((err) => {
          NotiError(err.data?.title || 'Failed to create new project')
        })
        .finally(() => {
          loading.value = false
          getData()
        })
    }

    const onDelete = (prj) => {
      Confirm({
        content: 'Are you sure to delete this project?',
        okText: 'Delete',
        onOk() {
          serviceAPI
            .deleteProject(prj.id)
            .then(() => {
              getData()
              NotiSuccess('Delete project successfully')
            })
            .catch((err) => {
              if (err.status == 404) {
                NotiError('Not found project')
              } else {
                NotiError(err.response?.data.title || 'Try again!')
              }
            })
        }
      })
    }

    const onChangeTable = (pagination, filters, sort) => {
      sorter.fieldSort = sort.field
      sorter.sort = sort.order
    }

    const getData = () => {
      if (loading.value) return
      loading.value = true
      let query = {
        category: props.category,
        pageSize: pagination.pageSize,
        page: pagination.page,
        keyword: searchText.value
      }
      if (sorter.sort) {
        query = { ...query, ...sorter }
      }
      serviceAPI
        .getListProject(query)
        .then((res) => {
          dataSource.value = res?.data?.list
          pagination.total = res?.data?.total
        })
        .catch((err) => {
          NotiError(err.data?.title || 'Failed to load projects')
        })
        .finally(() => {
          loading.value = false
        })
    }

    watch(
      () => [props.category, pagination.page, pagination.pageSize, sorter.fieldSort, sorter.sort],
      getData,
      {
        immediate: true
      }
    )

    watch(
      () => [searchText.value],
      () => {
        to.value && clearTimeout(to.value)
        to.value = setTimeout(getData, 500)
        return () => clearTimeout(to.value)
      }
    )

    const onChangePagination = (page) => {
      if (page === pagination.page) return
      pagination.page = page
      getData()
    }

    const onCopyProject = (record) => {
      selectedProject.value = record
      openCopy.value = true
    }

    const onSuccessCopy = () => {
      getData()
    }

    return {
      searchText,
      errorText,
      columns,
      dataSource,
      loading,
      openModal,
      onClickNew,
      namePrj,
      saveProject,
      dateTimeFormat,
      pagination,
      onChangeTable,
      debounce,
      onDelete,
      onChangePagination,
      theme,
      onCopyProject,
      selectedProject,
      openCopy,
      onSuccessCopy,
    }
  }
})
</script>

<style lang="scss">
@import '@/variable.scss';

@mixin apply-theme($theme) {
  $text-primary: map-get($theme, text-primary);
  $text-secondary: map-get($theme, text-secondary);
  $color-background: map-get($theme, color-background);
  $color-background-layout: map-get($theme, color-background-layout);
  $color-shadow: map-get($theme, color-shadow);
  $color-border: map-get($theme, color-border);

  .ant-table-wrapper {
    .ant-table-content {
      .ant-table-thead .ant-table-cell,
      .ant-table-thead .ant-table-column-title {
        color: $text-secondary;
      }
      .modify-editor {
        color: $text-secondary;
        gap: 4px;
      }
    }
  }
}

.home-table-container {
  &[theme='light'] {
    @include apply-theme($theme-light);
  }

  &[theme='dark'] {
    @include apply-theme($theme-dark);
  }
  .ant-table-wrapper {
    .ant-table-container {
      .ant-table-thead .ant-table-cell {
        background: rgba(109, 91, 208, 0.09);
        font-weight: bold;
        line-height: 32px;
      }
      .ant-table-thead .ant-table-column-title {
        font-weight: bold;
      }

      .ant-table-cell {
        padding: 8px 24px !important;
      }

      .ant-table-cell-row-hover {
        background-color: rgba(109, 91, 208, 0.09) !important;
      }

      .a-title {
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      table > thead {
        > tr:first-child > *:first-child {
          border-radius: unset;
        }

        > tr:first-child > *:last-child {
          border-radius: unset;
        }
      }
    }
  }

  .custom-pagination-row {
    padding: 8px 24px;
  }

  .mode-tag {
    border-radius: 10px;
    margin-left: 12px;
    text-transform: capitalize;
  }
}
</style>
