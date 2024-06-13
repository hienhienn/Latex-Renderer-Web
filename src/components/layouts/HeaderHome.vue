<template>
  <a-layout-header theme="dark" class="home-header">
    <a-row justify="space-between" align="middle">
      <a-row align="middle">
        <a href="/" style="height: 40px;">
          <img src="/icons/logo-white.svg" width="40" />
        </a>
        <div class="title">Latex Editor Online</div>
      </a-row>
      <a-dropdown placement="bottomRight">
        <a-avatar :src="'https://ui-avatars.com/api/?background=random&name=' + user?.fullname" />
        <template #overlay>
          <a-menu>
            <a-menu-item @click="onLogout">{{ user?.fullname }} ({{ user?.username }})</a-menu-item>
            <a-menu-item @click="onLogout"> Logout </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </a-row>
  </a-layout-header>
</template>

<script lang="ts">
import router from '@/router'
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    user: {
      type: Object
    }
  },
  setup() {
    const onLogout = () => {
      localStorage.removeItem('token')
      router.push('/login')
    }

    return {
      onLogout
    }
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
  background-color: #6D5BD0;

  .title {
    font-weight: bold;
    cursor: default;
    user-select: none;
    margin-left: 16px;
    font-size: 20px;
  }
}
</style>
