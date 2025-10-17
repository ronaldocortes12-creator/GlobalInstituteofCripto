import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { BookOpen, Plus, TrendingUp, CheckCircle2, Circle } from 'lucide-react'
import { UserHeader } from './UserHeader'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { COURSE_LESSONS } from '../lib/courseData'

export function ChatSidebar({ onLessonSelect, currentLessonId }) {
  const user = useStore((state) => state.user)
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState({})

  useEffect(() => {
    if (user) {
      loadLessons()
      loadProgress()
    }
  }, [user])

  const loadLessons = async () => {
    // Initialize with all 20 lessons
    setLessons(COURSE_LESSONS)
  }

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      const progressMap = {}
      data?.forEach(item => {
        progressMap[item.lesson_day] = item.completed
      })
      setProgress(progressMap)
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const getLessonIcon = (day) => {
    if (progress[day]) {
      return <CheckCircle2 className="h-4 w-4 text-primary" />
    }
    if (day === currentLessonId) {
      return <Circle className="h-4 w-4 text-secondary fill-secondary" />
    }
    return <Circle className="h-4 w-4 text-muted-foreground" />
  }

  const getLessonStatus = (day) => {
    if (progress[day]) return 'completed'
    if (day === currentLessonId) return 'active'
    return 'pending'
  }

  const handleViewProgress = () => {
    // Navigate to dashboard
    window.location.href = '/dashboard'
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* User Header */}
      <UserHeader />

      {/* Lessons List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Aulas do Curso</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onLessonSelect(1)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Nova
            </Button>
          </div>

          {lessons.map((lesson) => {
            const status = getLessonStatus(lesson.day)
            const isActive = lesson.day === currentLessonId

            return (
              <button
                key={lesson.day}
                onClick={() => onLessonSelect(lesson.day)}
                className={`
                  w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all
                  ${isActive 
                    ? 'bg-primary/10 border border-primary/30 shadow-sm' 
                    : 'hover:bg-muted/50 border border-transparent'
                  }
                  ${status === 'completed' ? 'opacity-75' : ''}
                `}
              >
                <div className="mt-0.5">
                  {getLessonIcon(lesson.day)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isActive ? 'text-primary' : 'text-foreground'
                  }`}>
                    Dia {lesson.day}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lesson.title}
                  </p>
                  {lesson.module && (
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {lesson.module}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Progress Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleViewProgress}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Ver Progresso do Curso
        </Button>
      </div>
    </div>
  )
}

