// src/components/Layout.tsx

import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const GAME_ICONS: Record<string, string> = {
  chess: '♟',
  checkers: '⬤',
  backgammon: '🎲',
  poker: '🃏',
  'league-of-legends': '⚔',
  'dota-2': '🛡',
  cs2: '🎯',
  valorant: '💠',
  other: '🎮',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const icon = GAME_ICONS[user?.game || 'other']

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">◈</span>
            {sidebarOpen && <span className="logo-text">GameCoach<span className="logo-ai">AI</span></span>}
          </div>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◁' : '▷'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">💬</span>
            {sidebarOpen && <span>Чат с ИИ</span>}
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📋</span>
            {sidebarOpen && <span>История</span>}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">👤</span>
            {sidebarOpen && <span>Профиль</span>}
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">⚙</span>
              {sidebarOpen && <span>Админ</span>}
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{icon}</div>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">{user?.username || user?.email?.split('@')[0]}</div>
                <div className="user-game text-muted">{user?.game}</div>
              </div>
            )}
          </div>
          <button className="logout-btn btn btn-ghost btn-sm" onClick={handleLogout} title="Выйти">
            {sidebarOpen ? 'Выйти' : '↩'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
