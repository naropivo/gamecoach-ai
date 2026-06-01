// src/pages/LandingPage.tsx

import React from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

const FEATURES = [
  { icon: '🤖', title: 'ИИ-ассистент', desc: 'Диалог с персональным тренером на базе GPT-4. Задавайте любые вопросы и получайте развёрнутые ответы.' },
  { icon: '♟', title: 'Настольные игры', desc: 'Шахматы, шашки, нарды, покер — для каждой игры отдельный контекст и специализированные советы.' },
  { icon: '🎮', title: 'Цифровые игры', desc: 'League of Legends, Dota 2, CS2, Valorant — разбор механик, позиционирования и макро-стратегии.' },
  { icon: '📋', title: 'История советов', desc: 'Все рекомендации сохраняются. Отслеживайте прогресс и возвращайтесь к важным советам.' },
  { icon: '⚡', title: 'Мгновенно', desc: 'Ответ за считанные секунды. Никаких записей к тренеру — помощь в любое время суток.' },
  { icon: '🔒', title: 'Безопасно', desc: 'JWT-аутентификация, зашифрованные пароли. Ваши данные надёжно защищены.' },
]

const GAMES = [
  { name: 'Шахматы', icon: '♟', tag: 'Стратегия' },
  { name: 'Шашки', icon: '⬤', tag: 'Классика' },
  { name: 'Нарды', icon: '🎲', tag: 'Классика' },
  { name: 'Покер', icon: '🃏', tag: 'Карты' },
  { name: 'League of Legends', icon: '⚔', tag: 'MOBA' },
  { name: 'Dota 2', icon: '🛡', tag: 'MOBA' },
  { name: 'CS2', icon: '🎯', tag: 'Шутер' },
  { name: 'Valorant', icon: '💠', tag: 'Шутер' },
]

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <span className="logo-icon">◈</span>
          <span>GameCoach<span className="text-accent">AI</span></span>
        </div>
        <div className="nav-links">
          <Link to="/login"    className="btn btn-ghost btn-sm">Войти</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Начать бесплатно</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="scan-bg" />
          <div className="hero-glow" />
        </div>
        <div className="hero-content page-enter">
          <div className="hero-badge badge badge-blue">✦ Персональный ИИ-коуч</div>
          <h1 className="hero-title">
            Улучши свою игру<br />
            <span className="gradient-text">с помощью ИИ</span>
          </h1>
          <p className="hero-subtitle">
            Персональный ассистент для игроков в шахматы, нарды, покер,<br />
            League of Legends, CS2 и другие игры. Советы, разборы, стратегии — 24/7.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Начать бесплатно →</Link>
            <Link to="/login"    className="btn btn-ghost btn-lg">Уже есть аккаунт</Link>
          </div>
        </div>

        {/* Demo chat bubble */}
        <div className="demo-chat page-enter">
          <div className="demo-msg user-msg">Как улучшить позицию в шахматном эндшпиле? У меня ладья против ладьи с пешками.</div>
          <div className="demo-msg ai-msg">
            <span className="ai-label">◈ GameCoach AI</span>
            В ладейных эндшпилях ключевое правило — **активность ладьи**. Держите ладью за проходной пешкой соперника (7-я горизонталь), а свою ладью поставьте активно. Помните: ладья сзади проходной — сильнее, чем ладья впереди неё.
          </div>
        </div>
      </section>

      {/* Games */}
      <section className="section">
        <h2 className="section-title">Поддерживаемые игры</h2>
        <div className="games-grid">
          {GAMES.map((g) => (
            <div key={g.name} className="game-card">
              <div className="game-icon">{g.icon}</div>
              <div className="game-name">{g.name}</div>
              <div className={`badge ${g.tag === 'MOBA' ? 'badge-blue' : g.tag === 'Шутер' ? 'badge-gold' : 'badge-green'}`}>
                {g.tag}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section section-dark">
        <h2 className="section-title">Возможности платформы</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-glow" />
        <h2>Готов стать лучше?</h2>
        <p className="text-muted">Регистрация бесплатна. Никаких ограничений.</p>
        <Link to="/register" className="btn btn-primary btn-lg">Создать аккаунт →</Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-logo">◈ GameCoach<span className="text-accent">AI</span></div>
        <p className="text-muted" style={{ fontSize: 13 }}>© 2026 — Дипломный проект. Специальность 09.02.07</p>
      </footer>
    </div>
  )
}
