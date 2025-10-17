export const modules = [
  {
    id: 1,
    name: 'FUNDAMENTOS',
    order: 1,
    percentage: 25,
    lessons: [
      { day: 1, title: 'O Básico das Criptos' },
      { day: 2, title: 'Como o Dinheiro se Move' },
      { day: 3, title: 'Mercado Futuro Explicado' },
      { day: 4, title: 'Spot vs Futuro' },
      { day: 5, title: 'Seu Plano Financeiro' }
    ]
  },
  {
    id: 2,
    name: 'ANÁLISE',
    order: 2,
    percentage: 50,
    lessons: [
      { day: 6, title: 'A Matemática do Trader' },
      { day: 7, title: 'Dominando o Vector' },
      { day: 8, title: 'Os Indicadores que Importam' },
      { day: 9, title: 'Trabalhando com Ranges' },
      { day: 10, title: 'Gradiente Linear' }
    ]
  },
  {
    id: 3,
    name: 'PRÁTICA',
    order: 3,
    percentage: 75,
    lessons: [
      { day: 11, title: 'Nossa Estratégia' },
      { day: 12, title: 'Conhecendo a Bitget' },
      { day: 13, title: 'Vector na Prática' },
      { day: 14, title: 'Seu Maior Inimigo: Você Mesmo' },
      { day: 15, title: 'Simulando suas Primeiras Operações' }
    ]
  },
  {
    id: 4,
    name: 'INDO PRO REAL',
    order: 4,
    percentage: 100,
    lessons: [
      { day: 16, title: 'Hora da Verdade' },
      { day: 17, title: 'Colocando Dinheiro na Corretora' },
      { day: 18, title: 'Acompanhamento e Metas' },
      { day: 19, title: 'Consultoria Permanente' },
      { day: 20, title: 'Liberdade Financeira' }
    ]
  }
]

export const getAllLessons = () => {
  return modules.flatMap(module => 
    module.lessons.map(lesson => ({
      ...lesson,
      moduleId: module.id,
      moduleName: module.name
    }))
  )
}

export const getLessonByDay = (day) => {
  const allLessons = getAllLessons()
  return allLessons.find(lesson => lesson.day === day)
}

export const getModuleProgress = (completedLessons, moduleId) => {
  const module = modules.find(m => m.id === moduleId)
  if (!module) return 0
  
  const moduleLessonDays = module.lessons.map(l => l.day)
  const completedInModule = completedLessons.filter(day => 
    moduleLessonDays.includes(day)
  ).length
  
  return Math.round((completedInModule / module.lessons.length) * 100)
}

export const getTotalProgress = (completedLessons) => {
  const totalLessons = getAllLessons().length
  return Math.round((completedLessons.length / totalLessons) * 100)
}


// Alias for backward compatibility
export const COURSE_LESSONS = getAllLessons()

