// src/pages/ProfilePage.tsx

import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import './ProfilePage.css'

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

const GAME_ICONS: Record<string, string> = {
  chess: '♟', checkers: '⬤', backgammon: '🎲', poker: '🃏',
  'league-of-legends': '⚔', 'dota-2': '🛡', cs2: '🎯', valorant: '💠', other: '🎮',
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const { showToast } = useToast()

  const [username, setUsername] = useState(user?.username || '')
  const [game, setGame]         = useState(user?.game || 'chess')
  const [saving, setSaving]     = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateUser({ username, game })
      showToast('Профиль сохранён!', 'success')
    } catch {
      showToast('Ошибка сохранения', 'error')
    } finally {
      setSaving(false)
    }
  }

  const icon = GAME_ICONS[user?.game || 'other']

  return (
    <div className="profile-page page-enter">
      <h1 className="page-title" style={{ marginBottom: 28 }}>Профиль</h1>

      <div className="profile-layout">
        {/* Avatar card */}
        <div className="profile-avatar-card card">
          <div className="avatar-big">{icon}</div>
          <div className="avatar-name">{user?.username || user?.email?.split('@')[0]}</div>
          <div className="avatar-email text-muted">{user?.email}</div>
          <div className="avatar-game">
            <span className="badge badge-blue">{user?.game}</span>
          </div>
          <div className="avatar-role">
            <span className={`badge ${user?.role === 'admin' ? 'badge-gold' : 'badge-green'}`}>
              {user?.role === 'admin' ? '⚙ Администратор' : '🎮 Игрок'}
            </span>
          </div>
          <div className="avatar-since text-muted">
            С {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru', { month: 'long', year: 'numeric' }) : '—'}
          </div>
        </div>

        {/* Edit form */}
        <div className="profile-form-card card">
          <h2 className="form-title">Настройки профиля</h2>
          <form onSubmit={handleSave} className="profile-form">
            <div className="field">
              <label>Никнейм</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ваш игровой псевдоним"
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
              <span className="field-hint text-muted">Email нельзя изменить</span>
            </div>
            <div className="field">
              <label>Основная игра</label>
              <select value={game} onChange={(e) => setGame(e.target.value)}>
                {GAMES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              <span className="field-hint text-muted">
                ИИ-ассистент будет использовать этот контекст в чате
              </span>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><div className="spinner" /> Сохранение...</> : 'Сохранить изменения'}
            </button>
          </form>
        </div>
      </div>

      {/* Danger zone */}
      <div className="danger-zone card">
        <h3 className="danger-title">⚠ Опасная зона</h3>
        <p className="text-muted" style={{ fontSize: 14, marginBottom: 16 }}>
          Выйти из аккаунта на этом устройстве.
        </p>
        <button className="btn btn-danger btn-sm" onClick={logout}>Выйти из аккаунта</button>
      </div>
    </div>
  )
}
