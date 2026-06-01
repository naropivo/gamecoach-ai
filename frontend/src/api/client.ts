// src/api/client.ts
import axios from 'axios'

const api = axios.create({
  baseURL: '',   // vite proxy handles /auth /chat /admin → localhost:5000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export const authApi = {
  register: (email: string, password: string, username?: string) =>
    api.post('/auth/register', { email, password, username }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: { username?: string; game?: string }) =>
    api.patch('/auth/profile', data),
}

export const chatApi = {
  getDialogs: () => api.get('/chat/dialogs'),
  createDialog: (title?: string) => api.post('/chat/dialogs', { title }),
  deleteDialog: (id: string) => api.delete(`/chat/dialogs/${id}`),
  getMessages: (dialogId: string) => api.get(`/chat/dialogs/${dialogId}/messages`),
  // Добавили signal третьим параметром для возможности отмены запроса пользователем
  sendMessage: (dialogId: string, message: string, signal?: AbortSignal) =>
    api.post('/chat/send', { dialogId, message }, { signal }),
}

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getStats: () => api.get('/admin/stats'),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
}