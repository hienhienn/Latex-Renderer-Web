<template>
  <a-space :size="0" class="space-setting">
    <a-dropdown placement="bottomLeft" :trigger="['click']">
      <a-button type="text" size="small">Project</a-button>
      <template #overlay>
        <a-menu mode="inline">
          <a-sub-menu title="子菜单">
            <a-menu-item>子菜单项</a-menu-item>
          </a-sub-menu>
          <a-menu-item> Copy project </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </a-space>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({})
</script>

<style lang="scss">
.space-setting {
  padding: 0 4px;
  .ant-btn-text.ant-btn-sm {
    font-size: 13px;
    color: #6e6893;
  }
}
</style>
