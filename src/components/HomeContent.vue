<template>
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
        <a-row align="middle">
          <RouterLink :to="`/project/${record.mainVersionId}`" class="a-title">{{
            text
          }}</RouterLink>
          <a-tag class="mode-tag">
            <template #icon v-if="record.isPublic">
              <global-outlined />
            </template>
            <template #icon v-if="!record.isPublic">
              <lock-outlined />
            </template>
            {{ record.isPublic ? 'Public' : 'Private' }}
          </a-tag>
        </a-row>
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
        <a-row style="gap: 4px; color: #6e6893">
          by
          <AvatarApp :hide-avatar="true" :avatar-user="record.editor" :current-user="user" />
        </a-row>
      </template>
      <template v-if="column.dataIndex === 'actions'">
        <a-tooltip title="Delete">
          <a-button style="padding: 0 8px" @click="() => onDelete(record)">
            <delete-outlined />
          </a-button>
        </a-tooltip>
      </template>
    </template>
  </a-table>
  <a-row justify="space-between" align="middle" class="custom-pagination-row">
    <span>Show 20-30 of 58 items</span>
    <a-pagination :current="1" :page-size="2" :total="85" :showSizeChanger="false" />
  </a-row>
  <a-modal v-model:open="openModal" title="New Project" okText="Save" @ok="saveProject">
    <a-input v-model:value="namePrj" placeholder="Project Name" />
    <a-typography-text type="danger">{{ errorText }}</a-typography-text>
  </a-modal>
</template>

<script lang="ts">
import { serviceAPI } from '@/services/API'
import { NotiError, NotiSuccess } from '@/services/notification'
import { defineComponent, reactive, readonly, ref, watch, watchEffect } from 'vue'
import { dateTimeFormat } from '@/services/functions'
import { DeleteOutlined, GlobalOutlined, LockOutlined, SearchOutlined } from '@ant-design/icons-vue'
import debounce from 'lodash.debounce'
import { Confirm } from '@/services/confirm'
import AvatarApp from '@/components/common/AvatarApp.vue'

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
    AvatarApp
  },
  name: 'HomeContent',
  setup(props) {
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
        title: 'Status',
        dataIndex: 'status'
      },
      {
        title: 'Member',
        dataIndex: 'userProjects'
      },
      {
        title: 'Last Modified',
        dataIndex: 'modifiedTime',
        sorter: true
      },
      {
        title: 'Actions',
        dataIndex: 'actions',
        align: 'center',
        width: 100
      }
    ])
    const dataSource = ref<any[]>([])
    const loading = ref(false)
    const openModal = ref(false)
    const namePrj = ref<string>('')
    const to = ref<any>(null)

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
      onDelete
    }
  }
})
</script>

<style lang="scss">
.ant-table-container {
  .ant-table-thead .ant-table-cell,
  .ant-table-thead .ant-table-column-title {
    background: #f4f2ff;
    font-weight: bold;
    color: #6e6893;
    line-height: 32px;
  }

  .ant-table-cell {
    padding: 8px 24px !important;
  }

  .ant-table-cell-row-hover {
    background-color: #f2f0f9 !important;
  }

  .a-title {
    font-weight: 600;
  }
}

.ant-table-wrapper .ant-table-container table > thead > tr:first-child > *:first-child {
  border-radius: unset;
}

.ant-table-wrapper .ant-table-container table > thead > tr:first-child > *:last-child {
  border-radius: unset;
}

.custom-pagination-row {
  padding: 8px 24px;
}

.mode-tag {
  border-radius: 10px;
  margin-left: 12px;
  color: #6e6893;
  background: #f2f0f9;

  > .anticon + span {
    margin-inline-start: 2px;
  }
}
</style>
