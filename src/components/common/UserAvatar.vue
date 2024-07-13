<template>
  <a-dropdown placement="bottomRight" v-if="user?.fullname && user?.username">
    <a-avatar
      :size="38"
      :src="'https://ui-avatars.com/api/?background=random&name=' + user?.fullname"
    />
    <template #overlay>
      <a-menu>
        <a-menu-item>{{ user?.fullname }} ({{ user?.username }})</a-menu-item>
        <a-menu-item @click="onLogout"> Logout </a-menu-item>
        <a-menu-item>
          <a-space>
            Light Mode
            <a-switch
              v-model:checked="theme"
              checked-value="light"
              un-checked-value="dark"
              @change="(e) => emit('update:theme', e)"
            />
          </a-space>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
  <a v-if="!user?.fullname || !user?.username" href="/login">
    <a-button> Log in </a-button>
  </a>
</template>

<script lang="ts">
import router from '@/router'
import { defineComponent } from 'vue'
import { inject } from 'vue'

export default defineComponent({
  props: {
    user: {
      type: Object
    }
  },
  emits: ['update:theme'],
  setup(props, { emit }) {
    const theme = inject('theme')
    const onLogout = () => {
      localStorage.removeItem('token')
      router.push('/login')
    }

    return {
      onLogout,
      emit,
      theme
    }
  }
})
</script>
