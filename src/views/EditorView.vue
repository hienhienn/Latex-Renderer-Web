<script setup>
import { ref } from 'vue'
import { VAceEditor } from 'vue3-ace-editor'
import 'ace-builds/src-noconflict/mode-latex'
import 'ace-builds/src-noconflict/theme-chrome' 
import 'ace-builds/src-noconflict/ext-language_tools'

const content = ref(`\\documentclass{article}`)
</script>
<template>
  <v-ace-editor 
    ref="latexEditor"
    v-model:value="content" 
    lang="latex" 
    theme="chrome" 
    style="height: 300px"
    :options="{ 
      useWorker: true, 
      fontSize: 18,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      enableSnippets: true,
    }"
  />
</template>
