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
          <HomeContent :category="selectedKeys[0]"/>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import { computed, defineComponent, readonly, ref } from 'vue'
import HomeContent from '@/components/HomeContent.vue'

export default defineComponent({
  components: {
    HomeContent
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
   
    return {
      siderItems,
      selectedKeys,
      breadcrumb,
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
