import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { modules, getModuleProgress, getTotalProgress } from '../lib/courseData'
import { supabase } from '../lib/supabase'
import TabBar from '../components/TabBar'
import { CheckCircle2, Circle, Trophy, TrendingUp, Award, Target } from 'lucide-react'
import { Progress } from '../components/ui/progress'

const Dashboard = () => {
  const user = useStore((state) => state.user)
  const { lessons, loadProgress } = useStore()
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
    <div className="min-h-screen pb-24 bg-gradient-to-b from-background via-background to-card/20">
      {/* Header Premium */}
      <div className="bg-gradient-to-br from-card via-card/95 to-card/80 border-b border-primary/20 shadow-lg shadow-primary/5">
        <div className="max-w-screen-xl mx-auto px-6 py-10">
          <div className="flex items-center gap-4 mb-8 animate-in slide-in-from-top duration-500">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-primary/30 shadow-lg shadow-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Seu Progresso
              </h1>
              <p className="text-muted-foreground mt-1">Acompanhe sua jornada de aprendizado</p>
            </div>
          </div>

          {/* Overall Progress Card - Premium */}
          <div className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl rounded-2xl p-8 border border-primary/20 shadow-2xl shadow-primary/10 animate-in slide-in-from-bottom duration-700">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Progresso Geral
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {totalProgress}%
                </span>
              </div>
            </div>
            
            <div className="relative">
              <Progress value={totalProgress} className="h-4 bg-muted/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full pointer-events-none"></div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                {completedDays.length} de 20 aulas concluídas
              </p>
              {totalProgress === 100 && (
                <span className="text-xs font-semibold px-3 py-1 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border border-primary/30 rounded-full">
                  🎉 Curso Completo!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-screen-xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Módulos do Curso</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, idx) => {
            const moduleProgress = getModuleProgress(module.days, completedDays)
            const isCompleted = moduleProgress === 100

            return (
              <div
                key={module.id}
                className="group bg-gradient-to-br from-card to-card/80 rounded-2xl p-6 border border-primary/10 hover:border-primary/30 shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-bottom"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Module Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20">
                        Módulo {module.id}
                      </span>
                      {isCompleted && (
                        <CheckCircle2 className="h-5 w-5 text-primary animate-in zoom-in" />
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">Progresso</span>
                    <span className="text-sm font-bold text-primary">{moduleProgress}%</span>
                  </div>
                  <Progress value={moduleProgress} className="h-2 bg-muted/30" />
                </div>

                {/* Days */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Aulas
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {module.days.map((day) => {
                      const isDayCompleted = completedDays.includes(day)
                      return (
                        <div
                          key={day}
                          className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                            isDayCompleted
                              ? 'bg-gradient-to-br from-primary/30 to-secondary/30 text-primary border border-primary/40 shadow-md shadow-primary/20'
                              : 'bg-muted/20 text-muted-foreground border border-border hover:border-primary/30'
                          }`}
                        >
                          {day}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <TabBar />
    </div>
  )
}

export default Dashboard

