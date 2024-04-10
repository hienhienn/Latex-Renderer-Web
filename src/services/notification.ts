import { notification } from 'ant-design-vue'

export const NotiSuccess = (description: string) =>
  notification.success({
    message: 'Success',
    description
  })

export const NotiError = (description: string) =>
  notification.error({
    message: 'Error',
    description
  })
