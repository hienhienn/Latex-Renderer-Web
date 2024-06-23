<template>
  <a-layout-header theme="dark" class="home-header">
    <a-row justify="space-between" align="middle">
      <a-row align="middle">
        <a href="/" style="height: 40px">
          <img src="/icons/logo-white.svg" width="40" />
        </a>
        <div class="title">Latex Editor Online</div>
      </a-row>
      <UserAvatar :user="user" :theme="theme" @update:theme="(e) => emit('update:theme', e)" />
    </a-row>
  </a-layout-header>
</template>

<script lang="ts">
import UserAvatar from '@/components/common/UserAvatar.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    UserAvatar,
  },
  props: {
    user: {
      type: Object
    },
    theme: {
      type: String
    }
  },
  emits: ['update:theme'],
  setup(props, { emit }) {
    return { emit }
  }
})
</script>

<style lang="scss">
.ant-layout-header.home-header {
  position: absolute;
  z-index: 10;
  top: 0;
  left: 0;
  right: 0;
  color: white;
  background-color: #6d5bd0;

  .title {
    font-weight: bold;
    cursor: default;
    user-select: none;
    margin-left: 16px;
    font-size: 20px;
  }
}
</style>
