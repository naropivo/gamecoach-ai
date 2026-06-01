// src/pages/RegisterPage.tsx

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import './AuthPages.css'

const GAMES = [
  { value: 'chess',            label: '♟  Шахматы' },
  { value: 'checkers',         label: '⬤  Шашки' },
  { value: 'backgammon',       label: '🎲 Нарды' },
  { value: 'poker',            label: '🃏 Покер' },
  { value: 'league-of-legends',label: '⚔  League of Legends' },
  { value: 'dota-2',           label: '🛡  Dota 2' },
  { value: 'cs2',              label: '🎯 CS2' },
  { value: 'valorant',         label: '💠 Valorant' },
  { value: 'other',            label: '🎮 Другая игра' },
]

export default function RegisterPage() {
  const { register, updateUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [game, setGame]         = useState('chess')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return showToast('Заполните email и пароль', 'error')
    if (password.length < 6) return showToast('Пароль минимум 6 символов', 'error')
    setLoading(true)
    try {
      await register(email, password, username)
      await updateUser({ game })
      showToast('Аккаунт создан!', 'success')
      navigate('/chat')
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка регистрации', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="scan-bg" /><div className="auth-glow" /></div>
      <div className="auth-card card page-enter" style={{ maxWidth: 460 }}>
        <div className="auth-logo">
          <span className="logo-icon-big">◈</span>
          <span>GameCoach<span className="text-accent">AI</span></span>
        </div>
        <h1 className="auth-title">Создать аккаунт</h1>
        <p className="auth-sub text-muted">Бесплатно. Навсегда.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Имя / Никнейм</label>
            <input
              type="text"
              placeholder="Ваш никнейм"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Email *</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Пароль * (минимум 6 символов)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Ваша основная игра</label>
            <select value={game} onChange={(e) => setGame(e.target.value)}>
              {GAMES.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><div className="spinner" /> Создание...</> : 'Создать аккаунт →'}
          </button>
        </form>

        <p className="auth-switch text-muted">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-accent">Войти</Link>
        </p>
      </div>
    </div>
  )
}
