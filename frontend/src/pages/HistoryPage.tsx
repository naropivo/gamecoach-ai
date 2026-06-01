// src/pages/HistoryPage.tsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatApi } from '../api/client'
import './HistoryPage.css'

interface Dialog {
  id: string
  title: string
  createdAt: string
  messages?: { content: string; role: string }[]
}

export default function HistoryPage() {
  const [dialogs, setDialogs] = useState<Dialog[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    chatApi.getDialogs()
      .then((res) => setDialogs(res.data))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return <div className="page-center"><div className="spinner" /></div>

  return (
    <div className="history-page page-enter">
      <div className="history-header">
        <h1 className="page-title">История диалогов</h1>
        <span className="badge badge-blue">{dialogs.length} чатов</span>
      </div>

      {dialogs.length === 0 ? (
        <div className="history-empty">
          <div style={{ fontSize: 48 }}>📋</div>
          <p>История пуста. Начните чат с ИИ-ассистентом!</p>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>Перейти в чат</button>
        </div>
      ) : (
        <div className="dialogs-grid">
          {dialogs.map((d) => (
            <div
              key={d.id}
              className="dialog-card card"
              onClick={() => navigate(`/chat/${d.id}`)}
            >
              <div className="dc-header">
                <div className="dc-icon">💬</div>
                <div className="dc-date text-muted">{formatDate(d.createdAt)}</div>
              </div>
              <div className="dc-title">{d.title}</div>
              {d.messages?.[0] && (
                <div className="dc-preview text-muted">{d.messages[0].content.slice(0, 100)}…</div>
              )}
              <div className="dc-footer">
                <span className="text-accent" style={{ fontSize: 13 }}>Открыть →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
