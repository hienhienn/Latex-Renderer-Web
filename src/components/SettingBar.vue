<template>
  <a-space :size="0" class="space-setting">
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
            <a-space>
              Auto close bracket
              <a-switch checked-children="On" un-checked-children="Off" />
            </a-space>
            <a-space>
              Font size
              <a-select size="small" :options="fontSizeOptions"> </a-select>
            </a-space>
          </a-space>
        </a-menu>
      </template>
    </a-dropdown>

    <a-dropdown placement="bottomLeft" :trigger="['click']" class="dropdown-setting">
      <a-button type="text" size="small">Compiler</a-button>
      <template #overlay>
        <a-menu>
          <a-space direction="vertical" style="padding: 5px 20px" :size="10">
            <a-space>
              Auto compile
              <a-switch checked-children="On" un-checked-children="Off" />
            </a-space>
            <a-space>
              Auto compile Delay (ms)
              <a-input-number v-model:value="value" :min="1000" :max="100000" :step="1000" />
            </a-space>
            <a-space>
              Main file
              <a-select size="small" :options="fileOptions"></a-select>
            </a-space>
          </a-space>
        </a-menu>
      </template>
    </a-dropdown>
  </a-space>
</template>

<script>
import { computed, defineComponent } from 'vue'

export default defineComponent({
  props: [{
    files: {
      type: Array,
      default: []
    }
  }],
  setup({ props }) {
    const fontSize = [10, 11, 12, 13, 14, 16, 18, 20, 24]
    const fontSizeOptions = fontSize.map((e) => ({ key: e, value: e + 'px' }))
    const fileOptions = computed(() => props.files.map(e => ({ key: e.id, value: e.path})))
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
            key: 'download-pdf'
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
      },
      { type: 'divider' },
      {
        label: 'Save',
        key: 'save-gr',
        type: 'group',
        children: [
          {
            label: 'Save',
            key: 'save'
          },
          {
            label: 'Save All',
            key: 'save-all'
          }
        ]
      }
    ])

    const handleClick = (e) => {
      console.log(e)
    }

    return {
      projectItems,
      handleClick,
      fontSizeOptions,
      fileOptions
    }
  }
})
</script>

<style lang="scss">
.space-setting {
  padding: 0 4px;

  .ant-btn-text.ant-btn-sm {
    font-size: 13px;
    color: #6e6893;
  }

  .dropdown-setting {
  }

  // .ant-dropdown-menu {
  //     width: 200px;
  //   }
}
</style>
