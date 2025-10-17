import { useEffect, useState, useRef } from 'react'
import { useStore } from '../lib/store'
import TabBar from '../components/TabBar'
import { ChatSidebar } from '../components/ChatSidebar'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Send, Bot, User, Menu } from 'lucide-react'
import { useToast } from '../components/ui/use-toast'
import { supabase } from '../lib/supabase'
import { COURSE_LESSONS } from '../lib/courseData'

const Chat = () => {
  const user = useStore((state) => state.user)
  const { toast } = useToast()
  
  const [currentLessonId, setCurrentLessonId] = useState(1)
  const [messages, setMessages] = useState({})
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (user) {
      loadAllMessages()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentLessonId, streamingMessage])

  const loadAllMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group messages by lesson_day
      const messagesByLesson = {}
      data?.forEach(msg => {
        const lessonDay = msg.lesson_day || 1
        if (!messagesByLesson[lessonDay]) {
          messagesByLesson[lessonDay] = []
        }
        messagesByLesson[lessonDay].push({
          role: msg.role,
          content: msg.content
        })
      })

      // Add initial message for lesson 1 if empty
      if (!messagesByLesson[1] || messagesByLesson[1].length === 0) {
        messagesByLesson[1] = [{
          role: 'assistant',
          content: `Seja bem-vindo! Serei seu professor nesses próximos dias e eu mesmo vou garantir que você aprenda tudo e consiga operar e lucrar consistentemente no mercado que mais cresce no mundo.

Nosso treinamento será por aqui, e começamos com o básico sobre cripto para os leigos. Me diga se você já entende o básico, caso já saiba, podemos pular a primeira parte.`
        }]
      }

      setMessages(messagesByLesson)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const detectLessonCompletion = (content) => {
    const patterns = [
      /dia (\d+) concluído/i,
      /completamos o dia (\d+)/i,
      /finalizamos a aula (\d+)/i,
      /aula (\d+) finalizada/i
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        const lessonDay = parseInt(match[1])
        if (lessonDay >= 1 && lessonDay <= 20) {
          return lessonDay
        }
      }
    }
    return null
  }

  const handleLessonSelect = (lessonDay) => {
    setCurrentLessonId(lessonDay)
    
    // Initialize messages for this lesson if not exists
    if (!messages[lessonDay]) {
      const lesson = COURSE_LESSONS.find(l => l.day === lessonDay)
      const initialMsg = {
        role: 'assistant',
        content: `Bem-vindo à aula ${lessonDay}: ${lesson?.title || ''}!\n\nEstou aqui para te guiar nesta etapa. Vamos começar?`
      }
      setMessages(prev => ({
        ...prev,
        [lessonDay]: [initialMsg]
      }))
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Add user message to current lesson
      const userMsg = { role: 'user', content: userMessage }
      setMessages(prev => ({
        ...prev,
        [currentLessonId]: [...(prev[currentLessonId] || []), userMsg]
      }))

      // Save to database
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        lesson_day: currentLessonId,
        role: 'user',
        content: userMessage
      })

      // Prepare conversation history
      const conversationHistory = messages[currentLessonId] || []

      // Call AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...conversationHistory, userMsg]
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao obter resposta da IA')
      }

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                assistantMessage += parsed.content
                setStreamingMessage(assistantMessage)
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }

      // Save complete assistant message
      const assistantMsg = { role: 'assistant', content: assistantMessage }
      setMessages(prev => ({
        ...prev,
        [currentLessonId]: [...(prev[currentLessonId] || []), userMsg, assistantMsg]
      }))
      
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        lesson_day: currentLessonId,
        role: 'assistant',
        content: assistantMessage
      })
      
      setStreamingMessage('')

      // Check for lesson completion
      const completedLesson = detectLessonCompletion(assistantMessage)
      if (completedLesson) {
        await supabase.from('lesson_progress').upsert({
          user_id: user.id,
          lesson_day: completedLesson,
          completed: true,
          completed_at: new Date().toISOString()
        })

        toast({
          title: '🎉 Parabéns!',
          description: `Aula ${completedLesson} concluída com sucesso!`,
        })

        // Auto-advance to next lesson if available
        if (completedLesson < 20) {
          setTimeout(() => {
            handleLessonSelect(completedLesson + 1)
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentMessages = messages[currentLessonId] || []
  const currentLesson = COURSE_LESSONS.find(l => l.day === currentLessonId)

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <ChatSidebar 
          onLessonSelect={handleLessonSelect}
          currentLessonId={currentLessonId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg">Jeff Wu</h1>
            <p className="text-xs text-muted-foreground">
              {currentLesson ? `Dia ${currentLesson.day}: ${currentLesson.title}` : 'Seu Professor de Trading'}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-32">
          {currentMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-secondary/20'
                    : 'bg-primary/20'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="h-5 w-5 text-secondary" />
                ) : (
                  <Bot className="h-5 w-5 text-primary" />
                )}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-secondary/20 text-foreground'
                    : 'bg-card border border-border'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streamingMessage && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-card border border-border">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {streamingMessage}
                  <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                </p>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingMessage && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border px-4 py-4 bg-background/95 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-card border-border"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  )
}

export default Chat

