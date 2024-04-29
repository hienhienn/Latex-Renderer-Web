<template>
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
        <a :href="`/project/${record.lastestVersionId}`">{{ text }}</a>
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
</template>


<script lang="ts">
import { serviceAPI } from '@/services/API'
import { NotiError, NotiSuccess } from '@/services/notification'
import { defineComponent, reactive, readonly, ref, watch } from 'vue'
import { dateTimeFormat } from '@/services/functions'
import { DeleteOutlined } from '@ant-design/icons-vue'
import debounce from 'lodash.debounce'
import { Confirm } from '@/services/confirm'

export default defineComponent({
  props: ['category'],
  components: {
    DeleteOutlined
  },
  name: 'HomeContent',
  setup({ category }) {
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
      let query = {
        category: category,
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
        category,
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
      searchText,
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

<style>
.row-search {
  width: 100%;
  flex-flow: nowrap;
  gap: 8px;
  margin-bottom: 16px;
}

.ant-modal .ant-input {
  margin: 16px 0;
}
</style>