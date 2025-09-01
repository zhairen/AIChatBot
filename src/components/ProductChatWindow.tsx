import React from 'react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import useChat, { ChatMessage } from '../hooks/useChat'

type Props = {
  onClose: () => void
  mode: 'LOCAL' | 'REST' | 'WS' | 'OPENROUTER'
  restUrl: string
  wsUrl: string
  openrouterApiKey: string
  openrouterModel: string
  sessionKey?: string
  username?: string
  rightOffset?: number
}

export default function ProductChatWindow(props: Props) {
  const { messages, sendMessage, clear } = useChat({
    mode: props.mode,
    restUrl: props.restUrl,
    wsUrl: props.wsUrl,
    openrouterApiKey: props.openrouterApiKey,
    openrouterModel: props.openrouterModel,
    sessionKey: props.sessionKey,
    username: props.username,
  })

  return (
    <div className="chat-window" style={{ width: 420 }}>
      <div className="chat-header">
        <div>
          <strong>产品咨询助手</strong>
          <div style={{ fontSize: 12, color: '#666' }}>{props.mode} 模式</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { clear() }} title="清空对话">清空</button>
          <button onClick={props.onClose} title="关闭">关闭</button>
        </div>
      </div>

      <div className="chat-messages">
        <MessageList messages={messages} />
      </div>

      <div className="chat-input">
        <MessageInput onSend={(text) => sendMessage(text)} />
      </div>
    </div>
  )
}
