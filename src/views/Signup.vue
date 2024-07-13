<template>
  <div class="main">
    <div class="login">
      <h1>Sign up</h1>
      <a-form
        id="formLogin"
        class="user-layout-login"
        ref="formRef"
        :model="formState"
        :rules="rules"
        @finish="onFinish"
      >
        <a-form-item name="fullname">
          <a-input v-model:value="formState.fullname" size="large" placeholder="Fullname">
            <template #prefix>
              <img src="/icons/user.svg" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="username">
          <a-input v-model:value="formState.username" size="large" placeholder="Username">
            <template #prefix>
              <img src="/icons/user.svg" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="password">
          <a-input-password
            v-model:value="formState.password"
            size="large"
            placeholder="Password"
            autocomplete="on"
          >
            <template #prefix>
              <img src="/icons/lock.svg" />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item name="confirmPassword">
          <a-input-password
            v-model:value="formState.confirmPassword"
            size="large"
            placeholder="Confirm password"
            autocomplete="on"
          >
            <template #prefix>
              <img src="/icons/lock.svg" />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            size="large"
            class="submit-btn"
            type="primary"
            htmlType="submit"
            :loading="loading"
          >
            Sign up
          </a-button>
        </a-form-item>
        <a-typography-text t>
          Already have an account? 
          <a-typography-link href="/login">Log in</a-typography-link>
        </a-typography-text>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts">
import { serviceAPI } from '@/services/API'
import { defineComponent, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NotiError, NotiSuccess } from '@/services/notification';

interface SignupForm {
  username: string
  password: string
  fullname: string
  confirmPassword: string
}

export default defineComponent({
  setup() {
    const loading = ref(false)
    const formRef = ref()
    const router = useRouter()
    const formState = reactive<SignupForm>({
      username: '',
      password: '',
      fullname: '',
      confirmPassword: ''
    })

    const checkPass = (rule, value, callback) => {
      const pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,20}$/
      if (!value) {
        return Promise.reject('Password is required.')
      }
      if (value.length < 6 || value.length > 20) {
        return Promise.reject('Length should be 6 to 20.')
      }
      if (pattern.test(value)) {
        return Promise.resolve()
      }
      return Promise.reject(
        'Password must include at least one number and includes both lower and uppercase letters.'
      )
    }

    const checkConfirm = (rule, value, callback) => {
      if (value !== formState.password) {
        return Promise.reject('Confirm password is not match password')
      }
      return Promise.resolve()
    }

    const checkUsername = (rule, value, callback) => {
      const pattern = /^[a-zA-Z0-9._-]+$/
      if (!value) {
        return Promise.reject('Username is required.')
      }
      if (value.length < 2 || value.length > 200) {
        return Promise.reject('Length should be 2 to 200.')
      }
      if (pattern.test(value)) {
        return Promise.resolve()
      }
      return Promise.reject(
        'Username is only include numbers, lower letters, uppercase letters and ".", "-", "_" characters.'
      )
    }

    const rules = {
      password: [{ validator: checkPass }],
      username: [{ validator: checkUsername }],
      confirmPassword: [{ validator: checkPass }, { validator: checkConfirm, trigger: 'blur' }],
      fullname: [
        {
          required: true,
          message: 'Fullname is required'
        },
        {
          minLength: 2,
          maxLength: 200,
          message: 'Length should be 2 to 200.'
        }
      ]
    }

    const onFinish = (values) => {
      if (loading.value) return
      loading.value = true
      delete values.confirmPassword
      serviceAPI.signUp(values)
        .then((res) => {
          localStorage.setItem('token', res.data?.token)
          NotiSuccess('Your account has been successfully created!')
          router.push('/')
        })
        .catch((err) => {
          if ((err.status = 400)) {
            NotiError(err.response?.data.title || 'Bad request.')
          }
          else NotiError('An error has occurred. Try again!')
        })
        .finally(() => {
          loading.value = false
        })
    }

    return {
      formState,
      formRef,
      rules,
      onFinish,
      loading
    }
  }
})
</script>

<style lang="less">
.main {
  min-height: 100vh;
  background-image: url(https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr);
  background-size: cover;
  padding: 40px;
  display: flex;
  justify-items: center;

  .login {
    width: 100%;
    height: fit-content;
    margin: auto;
    h1 {
      font-size: 40px;
      font-weight: bold;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 20px;
    }
    .ant-form {
      width: 400px;
      margin: auto;
      .ant-form-item-control-input-content {
        display: flex;
        justify-content: center;
      }
      .submit-btn {
        width: 100px;
        margin: auto;
      }
    }
  }
}
</style>
