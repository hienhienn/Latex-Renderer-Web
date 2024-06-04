<template>
  <a-row align="middle">
    <a-avatar
      :size="24"
      :src="'https://ui-avatars.com/api/?background=random&name=' + avatarUser?.fullname"
      style="margin-right: 8px"
      v-if="!hideAvatar"
    />
    {{ avatarUser?.username }}
    <span v-if="currentUser?.username === avatarUser?.username" style="margin-left: 4px">(You)</span>
  </a-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AvatarApp',
  props: ['avatarUser', 'currentUser', 'hideAvatar'],
})
</script>
