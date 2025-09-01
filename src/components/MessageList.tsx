import React, { useEffect, useRef } from 'react'
import type { ChatMessage } from '../hooks/useChat'

export default function MessageList({ messages } : { messages: ChatMessage[] }){
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if(ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [messages])

  return (
    <div ref={ref} style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {messages.map((m, idx) => (
        <div key={idx} className={`message ${m.role === 'user' ? 'user' : 'bot'}`}>
          <div className="meta">{m.role === 'user' ? (m.name ?? 'You') : 'Assistant'} • {new Date(m.ts).toLocaleTimeString()}</div>
          <div>{m.content}</div>
        </div>
      ))}
    </div>
  )
}
