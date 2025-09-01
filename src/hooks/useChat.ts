import { useEffect, useRef, useState } from 'react'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  ts: number
  name?: string
}

type Opts = {
  mode: 'LOCAL' | 'REST' | 'WS' | 'OPENROUTER'
  restUrl: string
  wsUrl: string
  openrouterApiKey: string
  openrouterModel: string
  sessionKey?: string
  username?: string
}

export default function useChat(opts: Opts) {
  const sessionKey = opts.sessionKey || 'chat_widget_session_v1'
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(sessionKey)
      if(!raw) return []
      return JSON.parse(raw)
    } catch { return [] }
  })

  useEffect(() => {
    try { localStorage.setItem(sessionKey, JSON.stringify(messages)) } catch {}
  }, [messages, sessionKey])

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if(opts.mode !== 'WS') return
    try {
      wsRef.current = new WebSocket(opts.wsUrl)
      wsRef.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if(data && data.reply) {
            const msg = { role: 'assistant' as const, content: String(data.reply), ts: Date.now() }
            setMessages(prev => { const next = [...prev, msg]; try{ localStorage.setItem(sessionKey, JSON.stringify(next)) }catch{}; return next })
          }
        } catch {}
      }
    } catch(err){ console.warn('ws init failed', err) }
    return ()=>{ if(wsRef.current) wsRef.current.close() }
  }, [opts.mode, opts.wsUrl, sessionKey])

  const clear = () => { setMessages([]); try{ localStorage.removeItem(sessionKey) }catch{} }

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', content: text, ts: Date.now(), name: opts.username }
    setMessages(prev=> [...prev, userMsg])

    if(opts.mode === 'LOCAL'){
      // simple echo + short delay
      setTimeout(()=>{
        const bot: ChatMessage = { role: 'assistant', content: `本地响应：已收到 "${text}"`, ts: Date.now() }
        setMessages(prev=> [...prev, bot])
      }, 700)
      return
    }

    if(opts.mode === 'REST'){
      try{
        const res = await fetch(opts.restUrl, {
          method: 'POST', headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ username: opts.username, message: text })
        })
        const j = await res.json()
        const reply = j.reply ?? String(j.result ?? j.message ?? '未返回内容')
        const bot: ChatMessage = { role: 'assistant', content: reply, ts: Date.now() }
        setMessages(prev=> [...prev, bot])
      }catch(err){
        const bot: ChatMessage = { role: 'assistant', content: `调用 REST 接口失败：${String(err)}`, ts: Date.now() }
        setMessages(prev=> [...prev, bot])
      }
      return
    }

    if(opts.mode === 'WS'){
      try{
        if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
          wsRef.current.send(JSON.stringify({ username: opts.username, message: text }))
        } else {
          const bot: ChatMessage = { role: 'assistant', content: 'WebSocket 未连接', ts: Date.now() }
          setMessages(prev=> [...prev, bot])
        }
      }catch(err){
        const bot: ChatMessage = { role: 'assistant', content: `WS 发送失败：${String(err)}`, ts: Date.now() }
        setMessages(prev=> [...prev, bot])
      }
      return
    }

    if(opts.mode === 'OPENROUTER'){
      try{
        const body = {
          model: opts.openrouterModel,
          messages: [ { role: 'user', content: text } ]
        }
        const res = await fetch(opts.openrouterApiKey ? (import.meta.env.VITE_OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions') : '', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${opts.openrouterApiKey}`
          },
          body: JSON.stringify(body)
        })
        const j = await res.json()
        const reply = (j?.choices && j.choices[0] && (j.choices[0].message?.content || j.choices[0].delta?.content)) || j?.reply || JSON.stringify(j)
        const bot: ChatMessage = { role: 'assistant', content: String(reply), ts: Date.now() }
        setMessages(prev=> [...prev, bot])
      }catch(err){
        const bot: ChatMessage = { role: 'assistant', content: `OpenRouter 调用失败：${String(err)}`, ts: Date.now() }
        setMessages(prev=> [...prev, bot])
      }
      return
    }
  }

  return { messages, sendMessage, clear }
}
