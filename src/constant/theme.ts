import { ref } from 'vue'

export const appTheme = ref(localStorage.getItem('theme') || 'light')
