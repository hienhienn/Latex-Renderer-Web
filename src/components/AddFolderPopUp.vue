<template>
  <a-modal
    :open="open"
    :title="typePopUp === 'add' ? 'New folder' : 'Rename folder'"
    okText="Save"
    :footer="null"
  >
    <a-form layout="vertical" v-model:model="formState">
      <a-form-item label="Name" 
      :rules="[{ required: true, message: 'Please input your username!' }]"
      >
        <a-input
          v-model:value="formState.name"
          placeholder="Name"
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary">Submit</a-button>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    // initValue: {
    //   type: String,
    //   default: ''
    // },
    open: {
      type: Boolean,
      default: false
    },
    typePopUp: {
      type: String,
      default: ''
    },
    files: {
      type: Object,
      default: {}
    }
  },
  setup(props) {
    const formState = {
      name: ''
    }

    return {
      formState
    }
  }
})
</script>
