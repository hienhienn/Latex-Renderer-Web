<template>
  <a-modal title="Copy Project" :open="open" :footer="null" @cancel="onCancel">
    <a-form :model="formState" name="basic" autocomplete="off" @finish="onFinish" layout="vertical">
      <a-form-item
        label="Project Name"
        name="name"
        :rules="[{ required: true, message: 'Project name is required!' }]"
      >
        <a-input v-model:value="formState.name" />
      </a-form-item>

      <a-form-item
        label="Version"
        name="version"
        :rules="[{ required: true, message: 'Version is required!' }]"
      >
        <a-select v-model:value="formState.version" :options="versionOptions"></a-select>
      </a-form-item>

      <a-form-item>
        <a-row justify="end">
          <a-space>
            <a-button @click="onCancel">Cancel</a-button>
            <a-button type="primary" html-type="submit">Submit</a-button>
          </a-space>
        </a-row>
      </a-form-item>
    </a-form>
  </a-modal>
</template>
<script>
import { computed, defineComponent, reactive, watch, watchEffect } from 'vue'

export default defineComponent({
  props: {
    open: {
      type: Boolean,
      default: false
    },
    initData: {
      type: Object,
      default: {
        name: '',
        version: ''
      }
    },
    versions: {
      type: Array,
      default: []
    }
  },
  emits: ['update:open'],
  setup(props, { emit }) {
    const formState = reactive({
      name: props.initData.name + ' (Copy)',
      version: props.initData.version
    })

    watch(
      () => [props.initData],
      () => {
        Object.assign(formState, {
          name: props.initData.name + ' (Copy)',
          version: props.initData.version
        })
      }
    )
    const versionOptions = computed(() =>
      props.versions.map((e) => ({ label: e.description, value: e.id }))
    )

    const onFinish = (values) => {
      console.log(values)
    }

    const onCancel = () => {
      emit('update:open', false)
    }

    watchEffect(() => {
      console.log('fs', formState)
    })
    return {
      versionOptions,
      formState,
      onFinish,
      onCancel
    }
  }
})
</script>
