import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) {
    req.headers.authorization = `Bearer ${localStorage.getItem('token')}`
  }
  return req
})

const signIn: (data) => Promise<any> = (userData) => API.post('/user/login', userData)
const signUp: (data) => Promise<any> = (userData) => API.post('/user/signup', userData)
const getCurrentUser: () => Promise<any> = () => API.get('/user')

const newProject: (data) => Promise<any> = (data) => API.post('/project', data)
const getListProject: (data) => Promise<any> = (data) =>
  API.get('/project', {
    params: data
  })
const deleteProject: (id) => Promise<any> = (id) => API.delete(`/project/${id}`)
const updateProject: (id, data) => Promise<any> = (id, data) => API.put(`/project/${id}`, data)
const copyProject: (data) => Promise<any> = (data) => API.post(`/project/copyProject`, data)

const getFilesByVersionId: (id) => Promise<any> = (id) => API.get(`/file/getAll/${id}`)
const createFile: (id) => Promise<any> = (data) => API.post(`/file/createFile/`, data)
const uploadFile: (data, config) => Promise<any> = (data, config) =>
  API.post(`/file/uploadFile/`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  })
const getFile: (id) => Promise<any> = (id) => API.get(`file/${id}`)
const downloadFile: (id) => Promise<any> = (id) =>
  API.get(`file/download/${id}`, {
    responseType: 'blob'
  })
const downloadLog: (code, filePath) => Promise<any> = (code, filePath) =>
  API.get(`file/downloadLog/compile?code=${code}&path=${filePath}`, {
    responseType: 'blob'
  })
const updateFile: (id, data) => Promise<any> = (id, data) => API.put(`file/updateFile/${id}`, data)
const renameFile: (id, data) => Promise<any> = (id, data) => API.put(`file/renameFile/${id}`, data)
const deleteFile: (id, shaCode) => Promise<any> = (id, shaCode) =>
  API.delete(`file/deleteFile/${id}?shaCode=${shaCode}`)

const compile: (data) => Promise<any> = (data) => API.post(`version/compile`, data)
const downloadFolder: (data) => Promise<any> = (data) =>
  API.post(`version/downloadFolder`, data, {
    responseType: 'blob'
  })
const deleteCompile: (code) => Promise<any> = (code) => API.delete(`version/compile/${code}`)
const getVersionById: (id) => Promise<any> = (id) => API.get(`version/${id}`)
const updateVersion: (id, data) => Promise<any> = (id, data) => API.put(`version/${id}`, data)
const saveVersion: (id, data) => Promise<any> = (id, data) =>
  API.post(`version/saveVersion/${id}`, data)
const deleteVersion: (id) => Promise<any> = (id) => API.delete(`version/${id}`)

const getUserToProject: (projectId, name) => Promise<any> = (projectId, name) =>
  API.get(`userProject/userAdd/${projectId}?name=${name}`)
const addMember: (data) => Promise<any> = (data) => API.post(`userProject`, data)
const changeRole: (data) => Promise<any> = (data) => API.put(`userProject`, data)
const removeMember: (id) => Promise<any> = (id) => API.delete(`userProject/${id}`)

const addStarProject: (data) => Promise<any> = (data) => API.post('starProject', data)
const removeStarProject: (id) => Promise<any> = (id) => API.delete(`starProject/${id}`)

export const serviceAPI = {
  signIn,
  signUp,
  getCurrentUser,
  newProject,
  getListProject,
  deleteProject,
  updateProject,
  copyProject,
  getFilesByVersionId,
  createFile,
  uploadFile,
  getFile,
  downloadFile,
  downloadLog,
  updateFile,
  renameFile,
  deleteFile,
  compile,
  downloadFolder,
  getVersionById,
  updateVersion,
  saveVersion,
  deleteVersion,
  deleteCompile,
  getUserToProject,
  addMember,
  changeRole,
  removeMember,
  addStarProject,
  removeStarProject
}
