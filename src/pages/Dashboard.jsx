import { useEffect, useState } from 'react'
import { useAuthStore, useProgressStore } from '../lib/store'
import { modules, getModuleProgress, getTotalProgress } from '../lib/courseData'
import { supabase } from '../lib/supabase'
import TabBar from '../components/TabBar'
import { CheckCircle2, Circle, Trophy } from 'lucide-react'
import { Progress } from '../components/ui/progress'

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)
  const { lessons, loadProgress } = useProgressStore()
  const [completedDays, setCompletedDays] = useState([])

  useEffect(() => {
    if (user) {
      loadProgress(user.id)
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    // Subscribe to realtime updates
    const channel = supabase
      .channel('lesson-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_progress',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadProgress(user.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    const completed = lessons
      .filter((l) => l.completed)
      .map((l) => l.lesson_day)
    setCompletedDays(completed)
  }, [lessons])

  const totalProgress = getTotalProgress(completedDays)

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-card to-background border-b border-border">
        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Seu Progresso</h1>
          </div>

          {/* Overall Progress */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Progresso Geral
              </span>
              <span className="text-2xl font-bold text-primary">
                {totalProgress}%
              </span>
            </div>
            <Progress value={totalProgress} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {completedDays.length} de 20 aulas concluídas
            </p>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-8">
        {modules.map((module) => {
          const moduleProgress = getModuleProgress(completedDays, module.id)

          return (
            <div
              key={module.id}
              className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border shadow-lg"
            >
              {/* Module Header */}
              <div className="mb-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-primary">
                      MÓDULO {module.order}: {module.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {module.lessons.length} aulas • {module.percentage}% do curso
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-secondary">
                    {moduleProgress}%
                  </span>
                </div>
                <Progress value={moduleProgress} className="h-2" />
              </div>

              {/* Lessons */}
              <div className="space-y-3">
                {module.lessons.map((lesson) => {
                  const isCompleted = completedDays.includes(lesson.day)

                  return (
                    <div
                      key={lesson.day}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                        isCompleted
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-muted/30 border border-border'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          Dia {lesson.day}: {lesson.title}
                        </p>
                      </div>
                      {isCompleted && (
                        <span className="text-xs font-semibold text-primary bg-primary/20 px-3 py-1 rounded-full">
                          Concluído
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <TabBar />
    </div>
  )
}

export default Dashboard

