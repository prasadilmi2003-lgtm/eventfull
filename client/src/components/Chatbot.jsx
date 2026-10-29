
import { useState, useRef, useEffect } from 'react'
import './Chatbot.css'

const API_URL = 'http://localhost:5000/api/chat'

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! 👋 Welcome to EventEase. I'm your AI event assistant. How can I help you today?",
    },
  ])

  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(event) {
    event?.preventDefault()

    const message = input.trim()

    if (!message || loading) return

    setMessages((previous) => [
      ...previous,
      { role: 'user', text: message },
    ])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to get an AI response.')
      }

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          text: data.reply || 'Sorry, I could not generate a response.',
        },
      ])
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          text: `Sorry, I couldn't connect to the assistant. ${error.message}`,
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="eventease-chatbot">
      {isOpen && (
        <section
          className="chat-window"
          aria-label="EventEase AI assistant"
        >
          <header className="chat-header">
            <div className="chat-avatar">✦</div>

            <div className="chat-heading">
              <h2>EventEase AI</h2>
              <span>
                <span className="online-dot" /> Your event assistant
              </span>
            </div>

            <button
              className="chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              type="button"
            >
              ×
            </button>
          </header>

          <div className="chat-messages" aria-live="polite">
            <div className="chat-date-label">YOUR EVENT ASSISTANT</div>

            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`chat-message ${message.role} ${
                  message.isError ? 'error-message' : ''
                }`}
              >
                {message.text}
              </div>
            ))}

            {loading && (
              <div className="chat-message assistant typing">
                <span />
                <span />
                <span />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask me anything..."
              aria-label="Message the AI assistant"
              maxLength={2000}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>

          <p className="chat-footer">
            AI-powered assistance for your events
          </p>
        </section>
      )}

      <button
        className={`chat-launcher ${isOpen ? 'chat-launcher-open' : ''}`}
        onClick={() => setIsOpen((previous) => !previous)}
        type="button"
        aria-label={isOpen ? 'Close EventEase AI' : 'Open EventEase AI'}
        aria-expanded={isOpen}
      >
        {isOpen ? '×' : '✦'}
        {!isOpen && <span className="chat-launcher-label">Ask AI</span>}
      </button>
    </div>
  )
}
