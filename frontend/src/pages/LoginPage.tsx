// src/pages/LoginPage.tsx

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import './AuthPages.css'

export default function LoginPage() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return showToast('Заполните все поля', 'error')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/chat')
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка входа', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="scan-bg" /><div className="auth-glow" /></div>
      <div className="auth-card card page-enter">
        <div className="auth-logo">
          <span className="logo-icon-big">◈</span>
          <span>GameCoach<span className="text-accent">AI</span></span>
        </div>
        <h1 className="auth-title">Добро пожаловать</h1>
        <p className="auth-sub text-muted">Войдите в свой аккаунт</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><div className="spinner" /> Вход...</> : 'Войти →'}
          </button>
        </form>

        <p className="auth-switch text-muted">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-accent">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}
