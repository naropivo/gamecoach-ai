import axios from 'axios'

// На production (Railway) — фронт и бэкенд на одном домене, baseURL пустой
// На localhost — Vite proxy перенаправляет /auth /chat /admin → :5000
const api = axios.create({
  baseURL: '',
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
  sendMessage: (dialogId: string, message: string, signal?: AbortSignal) =>
    api.post('/chat/send', { dialogId, message }, { signal }),
}

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getStats: () => api.get('/admin/stats'),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
}
