import { useEffect, useState, useRef } from 'react'
import { useStore } from '../lib/store'
import TabBar from '../components/TabBar'
import { ChatSidebar } from '../components/ChatSidebar'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Send, User, Menu } from 'lucide-react'
import { useToast } from '../components/ui/use-toast'
import { supabase } from '../lib/supabase'
import { COURSE_LESSONS } from '../lib/courseData'
import jeffWuAvatar from '../assets/JeffWuQuadrado.png'

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
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Erro ao obter resposta da IA')
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
        description: error.message || 'Não foi possível enviar a mensagem. Tente novamente.',
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
        {/* Header - Premium Design */}
        <div className="bg-gradient-to-r from-card via-card/95 to-card border-b border-primary/20 px-6 py-4 flex items-center gap-4 shadow-lg shadow-primary/5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden hover:bg-primary/10"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Jeff Wu Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/20">
              <img 
                src={jeffWuAvatar} 
                alt="Jeff Wu" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card"></div>
          </div>
          
          <div className="flex-1">
            <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Jeff Wu
            </h1>
            <p className="text-xs text-muted-foreground">
              {currentLesson ? `Dia ${currentLesson.day}: ${currentLesson.title}` : 'Seu Professor de Trading'}
            </p>
          </div>
          
          {/* Decorative element */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-32 bg-gradient-to-b from-background to-background/95">
          {currentMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 animate-in slide-in-from-bottom-4 duration-300 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`flex-shrink-0 ${
                  msg.role === 'user' ? '' : ''
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center border border-secondary/20">
                    <User className="h-5 w-5 text-secondary" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shadow-md shadow-primary/10">
                    <img 
                      src={jeffWuAvatar} 
                      alt="Jeff Wu" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-secondary/20 to-secondary/10 text-foreground border border-secondary/20'
                    : 'bg-gradient-to-br from-card to-card/80 border border-primary/10 shadow-primary/5'
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
            <div className="flex gap-3 animate-in slide-in-from-bottom-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shadow-md shadow-primary/10">
                <img 
                  src={jeffWuAvatar} 
                  alt="Jeff Wu" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="max-w-[75%] rounded-2xl px-5 py-3 bg-gradient-to-br from-card to-card/80 border border-primary/10 shadow-md shadow-primary/5">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {streamingMessage}
                  <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse rounded" />
                </p>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingMessage && (
            <div className="flex gap-3 animate-in slide-in-from-bottom-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shadow-md shadow-primary/10">
                <img 
                  src={jeffWuAvatar} 
                  alt="Jeff Wu" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-gradient-to-br from-card to-card/80 border border-primary/10 rounded-2xl px-5 py-3 shadow-md">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input - Premium Design */}
        <div className="border-t border-primary/20 px-4 py-4 bg-gradient-to-t from-card/95 to-background/95 backdrop-blur-lg shadow-2xl shadow-primary/5">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-card/50 border-primary/20 focus:border-primary/40 text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 shadow-inner"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl px-6 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
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

