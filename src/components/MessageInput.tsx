import React, { useState } from 'react'

export default function MessageInput({ onSend } : { onSend: (text:string)=>void }){
  const [text, setText] = useState('')
  const send = () => {
    const v = text.trim()
    if(!v) return
    onSend(v)
    setText('')
  }
  return (
    <>
      <textarea rows={2} value={text} onChange={e=>setText(e.target.value)} placeholder="输入消息，按 Ctrl+Enter 发送" onKeyDown={(e)=>{ if(e.key==='Enter' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); send() } }} />
      <button onClick={send}>发送</button>
    </>
  )
}
