<template>
  <a-layout>
    <HeaderHome />
    <a-layout>
      <a-layout-sider width="200" style="background: #fff; padding: 8px">
        <a-menu
          mode="inline"
          :style="{ height: '100%', borderRight: 0 }"
          v-model:selectedKeys="selectedKeys"
        >
          <a-menu-item v-for="item in siderItems" :key="item.key">{{ item.label }}</a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout style="padding: 0 24px 24px">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>Projects</a-breadcrumb-item>
          <a-breadcrumb-item>{{ breadcrumb }}</a-breadcrumb-item>
        </a-breadcrumb>
        <a-layout-content>
          <a-row class="row-search">
            <a-input-search
              v-model:value="searchText"
              placeholder="Type here to search"
              style="width: 100"
            />
            <a-button type="primary" @click="onClickNew">New Project</a-button>
          </a-row>
          <a-table
            :dataSource="dataSource"
            :columns="columns"
            bordered
            :pagination="pagination"
            @change="onChangeTable"
            :loading="loading"
          >
            <template #bodyCell="{ column, text, record }">
              <template v-if="column.dataIndex === 'name'">
                <a>{{ text }}</a>
              </template>
              <template v-if="column.dataIndex === 'owner'">
                {{ text.username }} ({{ text.fullname }})
              </template>
              <template v-if="column.dataIndex === 'lastModified'">
                {{ dateTimeFormat(text) }}
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
          <a-modal v-model:open="openModal" title="New Project" okText="Save" @ok="saveProject">
            <a-input v-model:value="namePrj" placeholder="Project Name" />
          </a-modal>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import { serviceAPI } from '@/services/API'
import { NotiError, NotiSuccess } from '@/services/notification'
import { computed, defineComponent, reactive, readonly, ref, watch } from 'vue'
import { dateTimeFormat } from '@/services/functions'
import { DeleteOutlined } from '@ant-design/icons-vue'
import debounce from 'lodash.debounce'
import { Confirm } from '@/services/confirm'

export default defineComponent({
  components: {
    DeleteOutlined
  },
  setup() {
    const siderItems = readonly([
      {
        key: 'all',
        label: 'All Projects'
      },
      {
        key: 'yours',
        label: 'Your Projects'
      },
      {
        key: 'shared',
        label: 'Shared With You'
      }
    ])
    const selectedKeys = ref<string[]>(['all'])
    const breadcrumb = computed(
      () => siderItems.find((item) => item.key === selectedKeys.value[0])?.label
    )
    const searchText = ref<string>('')
    const pagination = reactive({
      pageSize: 10,
      total: 0,
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
        title: 'Owner',
        dataIndex: 'owner'
      },
      {
        title: 'Last Modified',
        dataIndex: 'lastModified',
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

    const onClickNew = () => {
      openModal.value = true
    }

    const saveProject = () => {
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
          serviceAPI.deleteProject(prj.id)
            .then(() => {
              getData();
              NotiSuccess('Delete project successfully');
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
      console.log(sorter)
      let query = {
        category: selectedKeys.value[0],
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
      () => [
        selectedKeys.value[0],
        pagination.page,
        pagination.pageSize,
        sorter.fieldSort,
        sorter.sort
      ],
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
      siderItems,
      selectedKeys,
      searchText,
      columns,
      dataSource,
      breadcrumb,
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
</style>
