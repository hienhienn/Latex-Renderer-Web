<template>
  <div class="main">
    <div class="login">
      <h1>Login</h1>
      <a-form
        id="formLogin"
        class="user-layout-login"
        ref="formRef"
        :model="formState"
        :rules="rules"
        @finish="onFinish"
      >
        <a-form-item name="username">
          <a-input v-model:value="formState.username" size="large" placeholder="Username">
            <template #prefix>
              <img src="/icons/user.svg" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="password">
          <a-input-password v-model:value="formState.password" size="large" placeholder="Password">
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
            Login
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts">
import { serviceAPI } from '@/services/API'
import { NotiError, NotiSuccess } from '@/services/notification';
import { defineComponent, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

interface LoginForm {
  username: string
  password: string
}

export default defineComponent({
  setup() {
    const formRef = ref()
    const formState = reactive<LoginForm>({
      username: '',
      password: ''
    })
    const loading = ref(false)
    const router = useRouter()

    const checkPass = (rule, value, callback) => {
      const pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,20}$/
      if (!value) {
        callback('Password is required.')
        return
      }
      if (value.length < 6 || value.length > 20) {
        callback('Length should be 6 to 20.')
        return
      }
      if (pattern.test(value)) {
        callback()
        return
      }
      callback(
        'Password must include at least one number and includes both lower and uppercase letters.'
      )
    }

    const checkUsername = (rule, value, callback) => {
      const pattern = /^[a-zA-Z0-9._-]+$/
      if (!value) {
        callback('Username is required.')
        return
      }
      if (value.length < 2 || value.length > 200) {
        callback('Length should be 2 to 200.')
        return
      }
      if (pattern.test(value)) {
        callback()
        return
      }
      callback(
        'Username is only include numbers, lower letters, uppercase letters and ".", "-", "_" characters.'
      )
    }

    const rules = {
      password: [{ validator: checkPass }],
      username: [{ validator: checkUsername }]
    }

    const onFinish = (values) => {
      if (loading.value) return
      loading.value = true
      delete values.confirmPassword
      serviceAPI.signIn(values)
        .then((res) => {
          localStorage.setItem('token', res.data?.token)
          NotiSuccess('You have been logged in!')
          router.push('/')
        })
        .catch((err) => {
          if ((err.status = 400)) {
            NotiError(err.response?.data.title || 'Bad request.')
          } else
            NotiError('An error has occurred. Try again!')
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
