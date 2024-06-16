<script setup lang="ts">
import 'splitpanes/dist/splitpanes.css'

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
      colorPrimary: '#25213B'
    },
    Tree: {
      colorPrimary: '#ffeccc'
    }
  }
}
</script>

<template>
  <a-config-provider :theme="theme">
    <RouterView />
  </a-config-provider>
</template>

<style>
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  background-color: #f2f0f9;
}

::-webkit-scrollbar {
  width: 6px;
  background-color: #f2f0f9;
}

::-webkit-scrollbar-thumb {
  background-color: #6d5bd080;
  border-radius: 10px;
}
</style>
