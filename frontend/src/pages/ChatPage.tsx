// src/pages/ChatPage.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { chatApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import './ChatPage.css' // Если файл называется chat.css, замени на './chat.css'

interface Dialog { id: string; title: string; createdAt: string; messages?: { content: string }[] }
interface Message { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }

const GAME_ICONS: Record<string, string> = {
  chess: '♟', checkers: '⬤', backgammon: '🎲', poker: '🃏',
  'league-of-legends': '⚔', 'dota-2': '🛡', cs2: '🎯', valorant: '💠', other: '🎮',
}

const GAME_HINTS: Record<string, string[]> = {
  chess:           ['Как улучшить позицию в эндшпиле?', 'Объясни принцип развития в дебюте', 'Как бороться с атакой на короля?'],
  checkers:        ['Как выиграть в эндшпиле с дамками?', 'Лучшие стратегии для шашек', 'Как не проиграть позицию в центре?'],
  backgammon:      ['Когда удваивать кубик?', 'Как считать очки в нардах?', 'Стратегия при закрытом борде'],
  poker:           ['Как считать пот-оддсы?', 'Когда блефовать на ривере?', 'Объясни концепцию GTO покера'],
  'league-of-legends': ['Как управлять волной миньонов?', 'Что такое макрогейм?', 'Советы по позиционированию в командных боях'],
  'dota-2':        ['Как правильно фармить лесником?', 'Что такое контроль карты?', 'Советы по выбору героев в драфте'],
  cs2:             ['Как улучшить аим?', 'Объясни механику smoke grenades', 'Как правильно покупать оружие по экономике?'],
  valorant:        ['Советы для роли duelist', 'Как правильно использовать abilities?', 'Как читать мини-карту?'],
  other:           ['С какой игрой вам помочь?', 'Расскажи о своей проблеме', 'Хочу улучшить свои навыки'],
}

export default function ChatPage() {
  const { id: dialogIdParam } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [dialogs, setDialogs]       = useState<Dialog[]>([])
  const [activeId, setActiveId]     = useState<string | null>(null)
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [sending, setSending]       = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const gameIcon = GAME_ICONS[user?.game || 'other']
  const hints = GAME_HINTS[user?.game || 'other']

  const loadDialogs = useCallback(async () => {
    try {
      const res = await chatApi.getDialogs()
      setDialogs(res.data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { loadDialogs() }, [loadDialogs])

  useEffect(() => {
    if (!activeId) { setMessages([]); return }
    setLoadingMsgs(true)
    chatApi.getMessages(activeId)
      .then((res) => setMessages(res.data))
      .catch(() => showToast('Не удалось загрузить сообщения', 'error'))
      .finally(() => setLoadingMsgs(false))
  }, [activeId, showToast])

  useEffect(() => {
    if (dialogIdParam) setActiveId(dialogIdParam)
  }, [dialogIdParam])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px'
    }
  }, [input])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const createDialog = async () => {
    try {
      const res = await chatApi.createDialog()
      const newDialog = res.data
      setDialogs((prev) => [newDialog, ...prev])
      setActiveId(newDialog.id)
      navigate(`/chat/${newDialog.id}`)
    } catch {
      showToast('Ошибка создания чата', 'error')
    }
  }

  const deleteDialog = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await chatApi.deleteDialog(id)
      setDialogs((prev) => prev.filter((d) => d.id !== id))
      if (activeId === id) {
        setActiveId(null)
        setMessages([])
        navigate('/chat')
      }
    } catch { showToast('Ошибка удаления', 'error') }
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setSending(false)
      showToast('Генерация остановлена', 'info')
    }
  }

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim()
    if (!content || sending) return

    let currentId = activeId
    if (!currentId) {
      try {
        const res = await chatApi.createDialog()
        currentId = res.data.id
        setDialogs((prev) => [res.data, ...prev])
        setActiveId(currentId)
        navigate(`/chat/${currentId}`)
      } catch {
        showToast('Ошибка создания чата', 'error')
        return
      }
    }

    setInput('')
    setSending(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const res = await chatApi.sendMessage(currentId!, content, controller.signal)
      const aiMsg: Message = res.data.message

      setMessages((prev) => [...prev, aiMsg])
      await loadDialogs()
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || controller.signal.aborted) {
        console.log('Запрос успешно отменен на фронтенде.')
      } else {
        showToast('Ошибка отправки сообщения', 'error')
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'short' })

  return (
    <div className="chat-page">
      <aside className="dialogs-panel">
        <div className="dialogs-header">
          <span className="dialogs-title">Чаты</span>
          <button className="btn btn-primary btn-sm" onClick={createDialog}>+ Новый</button>
        </div>
        <div className="dialogs-list">
          {dialogs.length === 0 && (
            <div className="dialogs-empty text-muted">Нет чатов</div>
          )}
          {dialogs.map((d) => (
            <div
              key={d.id}
              className={`dialog-item ${activeId === d.id ? 'active' : ''}`}
              onClick={() => { setActiveId(d.id); navigate(`/chat/${d.id}`) }}
            >
              <div className="dialog-icon">{gameIcon}</div>
              <div className="dialog-info">
                <div className="dialog-title">{d.title}</div>
                <div className="dialog-date text-muted">{formatDate(d.createdAt)}</div>
              </div>
              <button
                className="dialog-delete"
                onClick={(e) => deleteDialog(d.id, e)}
                title="Удалить"
              >×</button>
            </div>
          ))}
        </div>
      </aside>

      <div className="chat-main">
        {!activeId ? (
          <div className="chat-welcome page-enter">
            <div className="welcome-icon">{gameIcon}</div>
            <h2 className="welcome-title">
              Привет, {user?.username || user?.email?.split('@')[0]}!
            </h2>
            <p className="welcome-sub text-muted">
              Ваш персональный ИИ-коуч по <strong>{user?.game}</strong>.
              <br />Задайте вопрос или начните с одного из примеров ниже.
            </p>
            <div className="hint-chips">
              {hints.map((h) => (
                <button key={h} className="hint-chip" onClick={() => sendMessage(h)}>
                  {h}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={createDialog}>
              Начать чат →
            </button>
          </div>
        ) : (
          <>
            <div className="messages-area">
              {loadingMsgs ? (
                <div className="messages-loading"><div className="spinner" /></div>
              ) : messages.length === 0 ? (
                <div className="messages-empty text-muted">
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{gameIcon}</div>
                  Чат пуст. Напишите первое сообщение!
                  <div className="hint-chips" style={{ marginTop: 16 }}>
                    {hints.map((h) => (
                      <button key={h} className="hint-chip" onClick={() => sendMessage(h)}>{h}</button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'user' ? '👤' : '◈'}
                    </div>
                    <div className="message-body">
                      <div className="message-meta">
                        <span className="message-role">
                          {msg.role === 'user' ? (user?.username || 'Вы') : 'GameCoach AI'}
                        </span>
                        <span className="message-time text-muted">{formatTime(msg.createdAt)}</span>
                      </div>
                      <div className="message-content">
                        {msg.role === 'assistant' ? (
                          <div className="markdown-body">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <span>{msg.content}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div className="message assistant">
                  <div className="message-avatar">◈</div>
                  <div className="message-body">
                    <div className="message-meta">
                      <span className="message-role">GameCoach AI</span>
                    </div>
                    <div className="typing-indicator" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span /><span /><span />
                      </div>
                      <small style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                        Коуч анализирует игру... 🧠
                      </small>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <div className="input-wrapper">
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={sending ? "Ожидание ответа от тренера..." : "Напишите вопрос... (Enter — отправить, Shift+Enter — новая строка)"}
                  rows={1}
                  disabled={sending}
                />
                
                <button
                  className={`send-btn btn ${sending ? 'btn-danger' : 'btn-primary'}`}
                  onClick={sending ? stopGeneration : () => sendMessage()}
                  disabled={!sending && !input.trim()}
                  title={sending ? "Остановить генерацию" : "Отправить"}
                  style={{ backgroundColor: sending ? 'var(--accent-red)' : undefined }}
                >
                  {sending ? '⏹' : '↑'}
                </button>
              </div>
              <div className="input-hint text-muted">
                {gameIcon} Контекст: <strong>{user?.game}</strong> · Shift+Enter для переноса строки
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}