<template>
  <a-layout class="container">
    <HeaderHome :user="user" />
    <a-layout class="main-content">
      <div class="circle"></div>
      <img class="bg-table" src="/images/bg-table.png" />
      <img class="bg-table bg-table-horizontal" src="/images/bg-table.png" />
      <a-space direction="vertical">
        <a-typography-text class="title-text" strong>PROJECTS</a-typography-text>
        <a-tabs v-model:activeKey="selectedKeys1" size="small">
          <a-tab-pane key="personal" tab="Personal"></a-tab-pane>
          <a-tab-pane key="starred" tab="Stared"></a-tab-pane>
        </a-tabs>
        <a-tabs v-model:activeKey="selectedKeys2" size="small">
          <a-tab-pane key="all" tab="All"></a-tab-pane>
          <a-tab-pane key="yours" tab="Yours"></a-tab-pane>
          <a-tab-pane key="shared" tab="Shared with you"></a-tab-pane>
        </a-tabs>
        <a-layout-content>
          <HomeContent :category="category" :user="user" />
        </a-layout-content>
      </a-space>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watchEffect } from 'vue'
import HomeContent from '@/components/HomeContent.vue'
import { serviceAPI } from '@/services/API'
import { NotiError } from '@/services/notification'

export default defineComponent({
  components: {
    HomeContent
  },
  setup() {
    const user = ref()
    const selectedKeys1 = ref<string>('personal')
    const selectedKeys2 = ref<string>('all')

    const category = computed(() => {
      if (selectedKeys1.value === 'personal') return selectedKeys2.value
      else return 'starred'
    })
    
    onMounted(() => {
      serviceAPI
        .getCurrentUser()
        .then((res) => {
          user.value = res.data
        })
        .catch(() => {
          NotiError('Your authorized failed')
        })
    })

    return {
      selectedKeys1,
      selectedKeys2,
      category,
      user
    }
  }
})
</script>

<style lang="scss">
.ant-modal .ant-input {
  margin: 16px 0 4px;
}

.title-text {
  font-size: 18px;
  color: #6e6893;
}

.ant-layout.container {
  .ant-space {
    padding: 16px 24px;

    .ant-layout-content {
      background: #fff;
      margin: 8px 0 0;
      border-radius: 8px;
      box-shadow: 0 10px 50px #00000020;
    }

    .ant-space-item {
      z-index: 2;
      position: relative;
    }

    .row-search {
      width: 100%;
      flex-flow: nowrap;
      gap: 8px;
      padding: 16px;

      .ant-input-affix-wrapper {
        max-width: 300px;
      }
    }
  }

  .main-content {
    position: relative;
    padding-top: 64px;
    max-width: 1280px;
    margin: auto;
    min-height: 100vh;

    .circle {
      position: absolute;
      z-index: 0;
      top: -56px;
      left: -120px;
      width: 428px;
      height: 428px;
      background: #eae8f4;
      border-radius: 100%;
    }

    .bg-table {
      position: absolute;
      z-index: 0;
      width: 200px;
      bottom: 0;
      transform: translateY(-80%);
      right: -40px;
    }

    .bg-table-horizontal {
      transform: rotate(90deg);
      left: 20px;
      bottom: 160px;
    }
  }
}

.ant-tabs-nav {
  margin-bottom: 0 !important;
  .ant-tabs-tab {
    &:not(.ant-tabs-tab-active) {
      color: #6e6893;
    }
  }
}
</style>
