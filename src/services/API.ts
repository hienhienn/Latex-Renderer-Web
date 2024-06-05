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

const getFilesByVersionId: (id) => Promise<any> = (id) => API.get(`/file/getAll/${id}`)
const createFile: (id) => Promise<any> = (data) => API.post(`/file/createFile/`, data)
const uploadFile: (id) => Promise<any> = (data) =>
  API.post(`/file/uploadFile/`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
const getFile: (id) => Promise<any> = (id) => API.get(`file/${id}`)
const updateFile: (id, data) => Promise<any> = (id, data) => API.put(`file/updateFile/${id}`, data)
const renameFile: (id, data) => Promise<any> = (id, data) => API.put(`file/renameFile/${id}`, data)
const deleteFile: (id, shaCode) => Promise<any> = (id, shaCode) =>
  API.delete(`file/deleteFile/${id}?shaCode=${shaCode}`)

const compile: (data) => Promise<any> = (data) => API.post(`version/compile`, data)
const deleteCompile: (code) => Promise<any> = (code) => API.delete(`version/compile/${code}`)
const getVersionById: (id) => Promise<any> = (id) => API.get(`version/${id}`)
const saveVersion: (id, data) => Promise<any> = (id, data) =>
  API.post(`version/saveVersion/${id}`, data)

export const serviceAPI = {
  signIn,
  signUp,
  getCurrentUser,
  newProject,
  getListProject,
  deleteProject,
  updateProject,
  getFilesByVersionId,
  createFile,
  uploadFile,
  getFile,
  updateFile,
  renameFile,
  deleteFile,
  compile,
  getVersionById,
  saveVersion,
  deleteCompile
}
