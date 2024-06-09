import './assets/main.css'
import { createApp, type Directive } from 'vue'
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.use(VueMonacoEditorPlugin, {
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs'
  }
})

app.mount('#app')
