<template>
  <CopyProject
    v-model:open="openCopyProject"
    :initData="{ name: project.name, version: project.mainVersionId }"
    :versions="project.versions"
  />
  <a-space :size="0" class="space-setting" :theme="theme">
    <a-dropdown placement="bottomLeft" :trigger="['click']">
      <a-button type="text" size="small">Project</a-button>
      <template #overlay>
        <a-menu :items="projectItems" @click="handleClick"></a-menu>
      </template>
    </a-dropdown>

    <a-dropdown placement="bottomLeft" :trigger="['click']" class="dropdown-setting">
      <a-button type="text" size="small">Editor</a-button>
      <template #overlay>
        <a-menu>
          <a-space direction="vertical" style="padding: 5px 20px" :size="10">
            <a-row justify="space-between">
              Auto closing bracket
              <a-switch
                :checked="editorOptions.autoClosingBrackets"
                @change="
                  (e) => emit('update:editorOptions', { ...editorOptions, autoClosingBrackets: e })
                "
                checked-value="always"
                un-checked-value="never"
                checked-children="On"
                un-checked-children="Off"
              />
            </a-row>
            <a-row justify="space-between">
              Bracket pair colorization
              <a-switch
                style="margin-left: 16px;"
                :checked="editorOptions['bracketPairColorization.enabled']"
                @change="
                  (e) =>
                    emit('update:editorOptions', {
                      ...editorOptions,
                      'bracketPairColorization.enabled': e
                    })
                "
                checked-children="On"
                un-checked-children="Off"
              />
            </a-row>
            <a-row justify="space-between">
              Word wrap
              <a-switch
                :checked="editorOptions.wordWrap"
                @change="
                  (e) =>
                    emit('update:editorOptions', {
                      ...editorOptions,
                      wordWrap: e
                    })
                "
                checked-value="on"
                un-checked-value="off"
                checked-children="On"
                un-checked-children="Off"
              />
            </a-row>
            <a-row justify="space-between" v-if="!readOnly">
              Ignore trim whitespace
              <a-switch
                :checked="editorOptions.ignoreTrimWhitespace"
                @change="
                  (e) =>
                    emit('update:editorOptions', {
                      ...editorOptions,
                      ignoreTrimWhitespace: e
                    })
                "
                checked-children="On"
                un-checked-children="Off"
              />
            </a-row>
            <a-row justify="space-between">
              Font size
              <a-select
                :value="editorOptions.fontSize"
                @select="(e) => emit('update:editorOptions', { ...editorOptions, fontSize: e })"
                size="small"
                :options="fontSizeOptions"
              >
              </a-select>
            </a-row>
          </a-space>
        </a-menu>
      </template>
    </a-dropdown>

    <a-dropdown placement="bottomLeft" :trigger="['click']" class="dropdown-setting">
      <a-button type="text" size="small">Compiler</a-button>
      <template #overlay>
        <a-menu>
          <a-space direction="vertical" style="padding: 5px 20px" :size="10">
            <a-row justify="space-between" v-if="!readOnly">
              Auto compile
              <a-switch
                :checked="compileOptions.autoCompile"
                checked-children="On"
                un-checked-children="Off"
                @change="(e) => emit('update:compileOptions', { ...compileOptions, autoCompile: e })"
              />
            </a-row>
            <a-row justify="space-between" align="middle" v-if="!readOnly">
              Auto compile Delay (s)
              <a-input-number
                style="margin-left: 32px;"
                v-model:value="compileOptions.autoCompileDelay"
                :disabled="!compileOptions.autoCompile"
                :min="3"
                :max="100"
                :step="1"
                @change="(e) => emit('update:compileOptions', { ...compileOptions, autoCompileDelay: e })"
                size="small"
              />
            </a-row>
            <a-row justify="space-between">
              Main file
              <a-select
                size="small"
                style="margin-left: 16px; flex: 1"
                :options="fileOptions"
                :value="mainFileId"
                @select="onChangeMainFile"
                :disabled="readOnly"
              ></a-select>
            </a-row>
          </a-space>
        </a-menu>
      </template>
    </a-dropdown>
  </a-space>
</template>

<script>
import { serviceAPI } from '@/services/API'
import { NotiError } from '@/services/notification'
import { computed, defineComponent, inject, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import CopyProject from '@/components/CopyProject.vue'
import { DefaultCompileOptions, DefaultEditorOptions } from '@/constant'
export default defineComponent({
  components: {
    CopyProject
  },
  props: {
    files: {
      type: Array,
      default: {}
    },
    mainFileId: {
      type: String,
      default: ''
    },
    project: {
      type: Object,
      default: {}
    },
    resCompile: {
      type: Object,
      default: {}
    },
    editorOptions: {
      type: Object,
      default: DefaultEditorOptions
    },
    compileOptions: {
      type: Object,
      default: DefaultCompileOptions
    },
    readOnly: {
      type: Boolean,
      default: false,
    }
  },
  emits: [
    'update:mainFileId',
    'downloadFolder',
    'downloadPdf',
    'update:editorOptions',
    'update:compileOptions'
  ],
  setup(props, { emit }) {
    const theme = inject('theme')
    const route = useRoute()
    const fontSize = [10, 11, 12, 13, 14, 16, 18, 20, 24]
    const fontSizeOptions = fontSize.map((e) => ({ value: e, label: e + 'px' }))
    const fileOptions = computed(() => props.files.filter(e => e.path.endsWith('.tex')).map((e) => ({ value: e.id, label: e.path })))
    const openCopyProject = ref(false)
    const projectItems = computed(() => [
      {
        label: 'Download',
        key: 'download',
        type: 'group',
        children: [
          {
            label: 'Download Source',
            key: 'download-source'
          },
          {
            label: 'Download PDF',
            key: 'download-pdf',
            disabled: !props.resCompile.pdf
          }
        ]
      },
      { type: 'divider' },
      {
        label: 'Actions',
        key: 'actions',
        type: 'group',
        children: [
          {
            label: 'Copy Project',
            key: 'copy-project'
          }
        ]
      }
    ])

    const handleClick = (e) => {
      if (e.key === 'download-source') {
        emit('downloadFolder', {
          title: props.project.name,
          key: ''
        })
        return
      }
      if (e.key === 'copy-project') {
        openCopyProject.value = true
        return
      }
      if (e.key === 'download-pdf') {
        emit('downloadPdf')
        return
      }
    }

    const onChangeMainFile = (e) => {
      if (e === props.mainFileId) return
      serviceAPI
        .updateVersion(route.params.versionId, {
          mainFileId: e
        })
        .then((res) => {
          emit('update:mainFileId', res.data.mainFileId)
        })
        .catch(() => NotiError('failed'))
    }

    return {
      projectItems,
      handleClick,
      fontSizeOptions,
      fileOptions,
      onChangeMainFile,
      openCopyProject,
      emit,
      theme
    }
  }
})
</script>

<style lang="scss">
@import '@/variable.scss';

@mixin apply-theme($theme) {
  $text-secondary: map-get($theme, text-secondary);

  .ant-btn-text.ant-btn-sm {
    color: $text-secondary;
  }
}

.space-setting {
  &[theme='light'] {
    @include apply-theme($theme-light);
  }
  &[theme='dark'] {
    @include apply-theme($theme-dark);
  }
  padding: 0 4px;

  .ant-btn-text.ant-btn-sm {
    font-size: 13px;
  }

  .dropdown-setting {
  }
}
</style>
