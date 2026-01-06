'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, RotateCcw, FileText } from 'react-icons/fa'

interface Message {
  id: string
  type: 'user' | 'agent'
  text: string
  timestamp: Date
}

const SUGGESTED_QUESTIONS = [
  'What is the main topic of this document?',
  'Can you summarize the key points?',
  'What are the main findings?',
  'How is this document structured?'
]

const AGENT_ID = '695d1f1028280d857b8d249c'

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const welcomeMessage: Message = {
      id: '0',
      type: 'agent',
      text: 'Welcome to PDF Assistant! I can help you find information in your PDF documents. Ask me anything about A SIM.pdf and I\'ll search through the content to provide you with accurate answers.',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])

  const handleSubmit = async (e: React.FormEvent, text?: string) => {
    e.preventDefault()
    const messageText = text || input
    if (!messageText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          agent_id: AGENT_ID
        })
      })

      const data = await response.json()

      const agentResponseText =
        data.response?.response ??
        data.response?.result ??
        (typeof data.response === 'string' ? data.response : null) ??
        (data.response?.success === false ? data.raw_response : null) ??
        data.raw_response ??
        'I apologize, but I could not generate a response. Please try again.'

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        text: agentResponseText,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, agentMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    const welcomeMessage: Message = {
      id: '0',
      type: 'agent',
      text: 'Welcome to PDF Assistant! I can help you find information in your PDF documents. Ask me anything about A SIM.pdf and I\'ll search through the content to provide you with accurate answers.',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600 text-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">PDF Assistant</h1>
              <p className="text-sm text-slate-500">Ask questions about your documents</p>
            </div>
          </div>
          <Button
            onClick={handleClearChat}
            variant="outline"
            size="sm"
            className="gap-2 border-slate-300"
          >
            <RotateCcw className="text-sm" />
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6 p-6" ref={scrollRef}>
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-5 py-3 rounded-xl shadow-sm ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xl'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xl'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-900 px-5 py-3 rounded-xl border border-slate-200 rounded-bl-xl">
                  <div className="flex gap-2 items-center">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-slate-600">Searching document...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Suggested Questions - Show only if no messages except welcome */}
      {messages.length === 1 && !loading && (
        <div className="bg-white border-t border-slate-200 max-w-4xl mx-auto w-full">
          <div className="px-6 py-6">
            <p className="text-sm font-semibold text-slate-700 mb-4">Suggested questions:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SUGGESTED_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={e =>
                    handleSubmit(e as unknown as React.FormEvent, question)
                  }
                  className="text-left px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-sm transition-all duration-200 font-medium"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              type="text"
              placeholder="Ask a question about your PDF..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              autoFocus
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
