// src/pages/AdminPage.tsx

import React, { useEffect, useState } from 'react'
import { adminApi } from '../api/client'
import { useToast } from '../context/ToastContext'
import './AdminPage.css'
import './AdminPage.css'

interface UserRow {
  id: string; email: string; username: string | null
  game: string; role: string; createdAt: string
  _count: { dialogs: number }
}

interface Stats {
  totalUsers: number; totalDialogs: number; totalMessages: number
  usersByGame: { game: string; _count: { id: number } }[]
}

export default function AdminPage() {
  const { showToast } = useToast()
  const [users, setUsers]   = useState<UserRow[]>([])
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminApi.getUsers(), adminApi.getStats()])
      .then(([u, s]) => { setUsers(u.data); setStats(s.data) })
      .catch(() => showToast('Ошибка загрузки данных', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const deleteUser = async (id: string, email: string) => {
    if (!confirm(`Удалить пользователя ${email}?`)) return
    try {
      await adminApi.deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      showToast('Пользователь удалён', 'success')
    } catch { showToast('Ошибка удаления', 'error') }
  }

  if (loading) return <div className="page-center"><div className="spinner" /></div>

  return (
    <div className="admin-page page-enter">
      <h1 className="page-title" style={{ marginBottom: 24 }}>⚙ Панель администратора</h1>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label text-muted">Пользователей</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{stats.totalDialogs}</div>
            <div className="stat-label text-muted">Диалогов</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{stats.totalMessages}</div>
            <div className="stat-label text-muted">Сообщений</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{stats.usersByGame.length}</div>
            <div className="stat-label text-muted">Игр в базе</div>
          </div>
        </div>
      )}

      {/* Games breakdown */}
      {stats && stats.usersByGame.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 className="section-heading">Распределение по играм</h2>
          <div className="games-breakdown">
            {stats.usersByGame.map((g) => (
              <div key={g.game} className="game-bar-row">
                <span className="game-bar-label">{g.game}</span>
                <div className="game-bar-track">
                  <div
                    className="game-bar-fill"
                    style={{ width: `${(g._count.id / stats.totalUsers) * 100}%` }}
                  />
                </div>
                <span className="game-bar-count">{g._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="card">
        <h2 className="section-heading">Пользователи ({users.length})</h2>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Никнейм</th>
                <th>Игра</th>
                <th>Роль</th>
                <th>Диалогов</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.username || '—'}</td>
                  <td>{u.game}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'badge-green'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u._count.dialogs}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString('ru')}</td>
                  <td>
                    {u.role !== 'admin' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteUser(u.id, u.email)}
                      >
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
