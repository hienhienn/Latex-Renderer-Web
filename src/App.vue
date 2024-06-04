<script setup lang="ts">
const theme = {
  token: {
    colorPrimary: '#6D5BD0',
    colorInfo: '#4A4AFF',
    colorSuccess: '#007F00',
    colorWarning: '#965E00',
    colorError: '#D30000',
    borderRadius: 8,
    colorTextBase: '#25213B',
    colorTextSecondary: '#6E6893',
    colorBorder: '#D9D5EC',
    colorBgLayout: '#f2f0f9',
    colorSuccessBg: '#CDFFCD',
    colorText: '#25213B'
  },
  components: {
    Tabs: {
      colorPrimary: '#25213B',
    },
    Tree: {
      colorPrimary: '#ffeccc',
    }
  }
}
</script>

<template>
  <a-config-provider :theme="theme">
    <RouterView />
  </a-config-provider>
</template>

<style scoped></style>
