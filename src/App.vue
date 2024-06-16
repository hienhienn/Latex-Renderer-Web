<script setup lang="ts">
import 'splitpanes/dist/splitpanes.css'
import { provide, watchEffect } from 'vue'
import { theme } from 'ant-design-vue'
import { appTheme } from './constant/theme'

provide('theme', appTheme)

const lightTheme = {
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
    colorText: '#25213B'
  }
}

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#6D5BD0',
    borderRadius: 8,
    colorBgLayout: '#1e1e1e'
  }
}

watchEffect(() => localStorage.setItem('theme', appTheme.value))
</script>

<template>
  <a-config-provider :theme="appTheme === 'light' ? lightTheme : darkTheme">
    <RouterView />
  </a-config-provider>
</template>

<style lang="scss">
@import '@/variable.scss';

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  background-color: rgba(109, 91, 208, 0.09);
}
::-webkit-scrollbar {
  width: 6px;
  background-color: rgba(109, 91, 208, 0.09);
}
::-webkit-scrollbar-thumb {
  background-color: $color-scrollbar;
  border-radius: 10px;
}
</style>
