<template>
  <a-space class="shared-div" align="center" :theme="theme">
    <a-button type="text" shape="circle" size="small">
      <lock-outlined v-if="!isPublic" />
      <global-outlined v-if="isPublic" />
    </a-button>
    <a-avatar-group
      :size="28"
      :max-count="3"
      :max-style="{ color: '#965E00', backgroundColor: '#FFECCC' }"
      :maxPopoverTrigger="''"
    >
      <a-avatar
        v-for="member in userProjects"
        :src="'https://ui-avatars.com/api/?background=random&name=' + member?.fullname"
      ></a-avatar>
    </a-avatar-group>
    <a-dropdown :trigger="['click']" placement="bottomRight">
      <a-button size="small" type="text" shape="circle" style="font-size: 12px">
        <DownOutlined />
      </a-button>
      <template #overlay>
        <div class="custom-overlay" :theme="theme">
          <a-typography-text class="title-text" strong style="font-size: 14px">
            GENERAL ACCESS
          </a-typography-text>
          <a-row>
            <div class="access-ic" :class="{ lock: !isPublic, global: isPublic }">
              <global-outlined v-if="isPublic" />
              <lock-outlined v-if="!isPublic" />
            </div>
            <div style="display: grid">
              <a-select
                size="small"
                :value="!!isPublic"
                @click="(e) => e.stopPropagation()"
                @select="onSelectAccess"
                :bordered="false"
              >
                <a-select-option :value="true">Public</a-select-option>
                <a-select-option :value="false">Private</a-select-option>
              </a-select>
              <a-typography-text
                style="font-size: 12px; color: #6e6893; padding: 0 7px; width: 250px"
              >
                {{
                  isPublic
                    ? 'Anyone on the internet can see this project.'
                    : 'Only the members can see this project'
                }}
              </a-typography-text>
            </div>
          </a-row>
          <a-typography-text class="title-text" strong style="font-size: 14px; margin-top: 8px">
            MEMBERS
          </a-typography-text>
          <a-row align="center" v-if="stepAdd === 1">
            <a-select
              v-model:value="addMemberState.members"
              style="width: calc(100% - 45px); margin-right: 8px"
              @click="(e) => e.stopPropagation()"
              show-search
              @search="onFilterUser"
              placeholder="Add members to project"
              mode="multiple"
              max-tag-count="responsive"
              :max-tag-text-length="10"
              :options="userOptions"
              :filterOption="filterOption"
            ></a-select>
            <a-button
              size="small"
              shapre="circle"
              type="link"
              style="margin: auto 0"
              @click="nextStep"
              :disabled="addMemberState.members.length == 0"
            >
              <ArrowRightOutlined />
            </a-button>
          </a-row>
          <a-row align="center" v-if="stepAdd === 2">
            <a-select
              v-model:value="addMemberState.role"
              style="width: calc(100% - 100px); margin-right: 8px"
              @click="(e) => e.stopPropagation()"
            >
              <a-select-option value="editor">Editor</a-select-option>
              <a-select-option value="viewer">Viewer</a-select-option>
            </a-select>
            <a-button size="small" type="link" style="margin: auto 0" @click="addMember">
              Add
            </a-button>
            <a-button
              size="small"
              shapre="circle"
              type="link"
              style="margin: auto 0"
              @click="cancelAdd"
              danger
            >
              <CloseOutlined />
            </a-button>
          </a-row>

          <a-space direction="vertical" :size="0" class="member">
            <a-row v-for="member in userProjects" justify="space-between">
              <a-space>
                <a-avatar
                  :size="40"
                  :src="'https://ui-avatars.com/api/?background=random&name=' + member?.fullname"
                />
                <div>
                  <div style="margin: 0 7px">
                    <span style="font-weight: 600; margin-right: 4px">
                      {{ member?.fullname }}
                    </span>
                    {{ member?.username }}
                  </div>
                  <a-select
                    size="small"
                    :value="member?.role"
                    @click="(e) => e.stopPropagation()"
                    :bordered="false"
                    :disabled="member?.role === 'owner'"
                    :showArrow="member?.role !== 'owner'"
                    @select="(e) => onChangeRole(e, member.id)"
                    style="width: 120px"
                  >
                    <a-select-option value="owner" style="display: none" :id="member.id">
                      Owner
                    </a-select-option>
                    <a-select-option value="editor">Editor</a-select-option>
                    <a-select-option value="viewer">Viewer</a-select-option>
                    <template #dropdownRender="{ menuNode }">
                      <VNodes :vnodes="menuNode" />
                      <a-divider style="margin: 4px 0" />
                      <a-button type="text" style="width: 100%; text-align: start">
                        Set owner
                      </a-button>
                      <a-button
                        danger
                        type="text"
                        style="width: 100%; text-align: start"
                        @click="(e) => removeMember(e, member.id)"
                      >
                        Remove
                      </a-button>
                    </template>
                  </a-select>
                </div>
              </a-space>
              <div class="active-tag" :class="{ active: activeUsers.has(member.editorId) }">
                <div class="circle"></div>
                {{ activeUsers.has(member.editorId) ? 'Active' : 'Inactive' }}
              </div>
            </a-row>
          </a-space>
        </div>
      </template>
    </a-dropdown>
  </a-space>
</template>
<script>
import { defineComponent, ref, reactive, watchEffect, inject } from 'vue'
import {
  DownOutlined,
  GlobalOutlined,
  LockOutlined,
  ArrowRightOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { serviceAPI } from '@/services/API'
import { NotiError } from '@/services/notification'
const VNodes = defineComponent({
  props: {
    vnodes: {
      type: Object,
      required: true
    }
  },
  render() {
    return this.vnodes
  }
})

export default defineComponent({
  components: {
    LockOutlined,
    GlobalOutlined,
    VNodes,
    ArrowRightOutlined,
    DownOutlined,
    CloseOutlined
  },
  props: {
    isPublic: {
      type: Boolean,
      default: false
    },
    userProjects: {
      type: Array,
      default: []
    },
    projectId: {
      type: String,
      default: ''
    },
    activeUsers: {
      type: Set,
      default: new Set()
    }
  },
  emits: ['update:isPublic', 'update:userProjects'],
  setup(props, { emit }) {
    const theme = inject('theme')
    const userOptions = ref()
    const stepAdd = ref(1)
    const addMemberState = reactive({
      members: [],
      role: 'viewer'
    })

    const onSelectAccess = (e) => {
      if (e !== props.isPublic) {
        serviceAPI
          .updateProject(props.projectId, {
            isPublic: e
          })
          .then(emit('update:isPublic', e))
          .catch(() => NotiError('Try again'))
      }
    }

    const onChangeRole = (role, id) => {
      if (role === 'owner') return
      serviceAPI
        .changeRole({
          role,
          id
        })
        .then((res) => {
          emit('update:userProjects', res.data)
        })
        .catch(() => NotiError('Try again'))
    }

    const onFilterUser = async (input) => {
      try {
        const res = await serviceAPI.getUserToProject(props.projectId, input)
        userOptions.value = res.data.map((e) => ({
          value: e.id,
          label: e.fullname
        }))
      } catch (err) {
        NotiError('Failed')
        userOptions.value = []
      }
    }

    const filterOption = async (input, option) => {
      return option
    }

    const nextStep = (e) => {
      e.stopPropagation()
      stepAdd.value = 2
    }

    const cancelAdd = (e) => {
      e.stopPropagation()
      stepAdd.value = 1
      Object.assign(addMemberState, {
        members: [],
        role: 'viewer'
      })
    }

    const addMember = (e) => {
      e.stopPropagation()
      Promise.all(
        addMemberState.members.map((id) =>
          serviceAPI
            .addMember({
              projectId: props.projectId,
              editorId: id,
              role: addMemberState.role
            })
            .then((res) => {
              emit('update:userProjects', res.data)
              stepAdd.value = 1

              Object.assign(addMemberState, {
                members: [],
                role: 'viewer'
              })
            })
            .catch(() => NotiError('failed'))
        )
      )
    }

    const removeMember = (e, id) => {
      e = e.originalEvent
      serviceAPI
        .removeMember(id)
        .then((res) => {
          emit('update:userProjects', res.data)
          document.getElementById(id).click()
        })
        .catch((err) => {
          console.log(err)
          NotiError('Try again')
        })
    }

    return {
      userOptions,
      stepAdd,
      addMemberState,
      onSelectAccess,
      onChangeRole,
      onFilterUser,
      // fileOptions,
      cancelAdd,
      addMember,
      removeMember,
      filterOption,
      nextStep,
      theme
    }
  }
})
</script>
<style lang="scss">
@import '@/variable.scss';

@mixin apply-theme($theme) {
  $color-border: map-get($theme, color-border);
  $color-background-layout: map-get($theme, color-background-layout);

  background-color: $color-background-layout;
  border: 1px solid $color-border;
}

@mixin apply-theme-ovl($theme) {
  $text-primary: map-get($theme, text-primary);
  $text-secondary: map-get($theme, text-secondary);
  $color-border: map-get($theme, color-border);
  $color-background: map-get($theme, color-background);
  $color-background-layout: map-get($theme, color-background-layout);

  background-color: $color-background;
  border: 1px solid $color-border;

  .active-tag:not(.active) {
    color: $text-secondary;
    .circle {
      background: $text-secondary;
    }
  }

  .title-text {
    color: $text-secondary
  }
}

.shared-div {
  &[theme='light'] {
    @include apply-theme($theme-light)
  }

  &[theme='dark'] {
    @include apply-theme($theme-dark)
  }
  border-radius: 20px;
  line-height: 32px;
  padding: 0 8px;
  height: 40px;

  .ant-space-item {
    display: flex;
    align-items: center;
  }
}

.custom-overlay {
  &[theme='light'] {
    @include apply-theme-ovl($theme-light)
  }

  &[theme='dark'] {
    @include apply-theme-ovl($theme-dark)
  }
  
  padding: 16px 24px;
  margin-top: 20px;
  border-radius: 8px;
  display: grid;
  gap: 8px;
  max-height: 500px;
  overflow: auto;

  .access-ic {
    border-radius: 100%;
    padding: 4px 10px;
    width: 40px;
    height: 40px;
    font-size: 20px;
    margin-right: 16px;

    &.lock {
      color: #d30000;
      background: #d3000020;
    }

    &.global {
      color: #007f00;
      background: #007f0020;
    }
  }

  .member {
    margin-top: 8px;
    > .ant-space-item {
      margin: 0 -24px;
      padding: 8px 24px;

      &:hover {
        background: rgba(109, 91, 208, 0.09);
        cursor: default;
      }
    }
  }
}

.active-tag {
  background: rgba(109, 91, 208, 0.09);
  font-size: 12px;
  height: fit-content;
  padding: 2px 8px;
  display: flex;
  gap: 6px;
  border-radius: 12px;
  align-items: center;
  margin: auto 0;

  .circle {
    border-radius: 100%;
    width: 6px;
    height: 6px;
    flex-shrink: 0;
    flex-grow: 0;
  }

  &.active {
    color: #007f00;
    background: #007f0020;
    .circle {
      background-color: #007f00;
    }
  }
}
</style>
