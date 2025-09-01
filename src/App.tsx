import React from 'react'
import ChatWidget from './components/ChatWidget'

export default function App() {
  return (
    <div>
      <h1 style={{ padding: 20, fontFamily: 'sans-serif' }}>AIChatBot Frontend (Vite)</h1>
      <p style={{ paddingLeft: 20 }}>示例页面 — 点击右下角聊天按钮打开 widget。</p>
      <ChatWidget />
    </div>
  )
}
