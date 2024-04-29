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

const newProject: (data) => Promise<any> = (data) => API.post('/project', data)
const getListProject: (data) => Promise<any> = (data) =>
  API.get('/project', {
    params: data
  })
const deleteProject: (id) => Promise<any> = (id) => API.delete(`/project/${id}`)

const getFilesByVersionId: (id) => Promise<any> = (id) => API.get(`/file/getAll/${id}`)
const createFile: (id) => Promise<any> = (data) => API.post(`/file/createFile/`, data)

export const serviceAPI = {
  signIn,
  signUp,
  newProject,
  getListProject,
  deleteProject,
  getFilesByVersionId,
  createFile
}
