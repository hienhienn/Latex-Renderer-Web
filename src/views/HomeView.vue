<template>
  <a-layout class="container" :theme="theme">
    <HeaderHome :user="user"/>
    <a-layout class="main-content">
      <div class="circle"></div>
      <img class="bg-table" src="/images/bg-table.png" />
      <img class="bg-table bg-table-horizontal" src="/images/bg-table.png" />
      <a-space direction="vertical" :size="0">
        <a-typography-text class="title-text" strong>PROJECTS</a-typography-text>
        <a-tabs v-model:activeKey="selectedKeys1" size="small">
          <a-tab-pane key="personal" tab="Personal"></a-tab-pane>
          <a-tab-pane key="starred" tab="Stared"></a-tab-pane>
        </a-tabs>
        <a-tabs v-model:activeKey="selectedKeys2" size="small" v-if="selectedKeys1 === 'personal'">
          <a-tab-pane key="all" tab="All"></a-tab-pane>
          <a-tab-pane key="yours" tab="Yours"></a-tab-pane>
          <a-tab-pane key="shared" tab="Shared with you"></a-tab-pane>
        </a-tabs>
        <a-layout-content>
          <HomeContent :category="category" :user="user"/>
        </a-layout-content>
      </a-space>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import HomeContent from '@/components/HomeContent.vue'
import { serviceAPI } from '@/services/API'
import { NotiError } from '@/services/notification'
import { inject } from 'vue';

export default defineComponent({
  components: {
    HomeContent
  },
  setup() {
    const theme = inject('theme')
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
      user,
      theme
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

  background-color: $color-background-layout;
  .main-content {
    background-color: $color-background-layout;
  }
  .ant-space .ant-layout-content {
    margin-top: 16px;
    background-color: $color-background;
    box-shadow: 0 10px 50px $color-shadow;
  }

  .title-text {
    color: $text-secondary;
  }

  .ant-tabs-nav {
    margin-bottom: 0 !important;
    .ant-tabs-tab {
      &.ant-tabs-tab-active .ant-tabs-tab-btn {
        color: $text-primary;
      }
      &:not(.ant-tabs-tab-active) {
        color: $text-secondary;
      }
    }

    .ant-tabs-ink-bar {
      background: $text-primary;
    }
  }
}

.ant-layout.container {
  &[theme='dark'] {
    @include apply-theme($theme-dark);
  }
  &[theme='light'] {
    @include apply-theme($theme-light);
  }

  .ant-space {
    padding: 16px 24px;
    .title-text {
      font-size: 18px;
    }
    .ant-layout-content {
      margin: 8px 0 0;
      border-radius: 8px;
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
      background: $color-background-primary;
      border-radius: 100%;
    }

    .bg-table {
      position: absolute;
      z-index: 0;
      width: 200px;
      bottom: 0;
      transform: translateY(-80%);
      opacity: 0.05;
      right: -40px;
    }

    .bg-table-horizontal {
      transform: rotate(90deg);
      left: 20px;
      bottom: 160px;
    }
  }
}
</style>
