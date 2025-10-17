import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'
import MatrixRain from '../components/MatrixRain'
import { Button } from '../components/ui/button'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const welcomeContent = {
  1: {
    title: 'Bem-vindo ao Global Institute of Cripto',
    content: 'Você está prestes a embarcar em uma jornada transformadora no mundo das criptomoedas. Nosso método exclusivo combina análise técnica avançada com disciplina rigorosa para formar traders consistentes e lucrativos.',
    page: '1 de 3'
  },
  2: {
    title: 'Seu Professor: Jeff Wu',
    content: 'Jeff Wu será seu mentor pessoal nesta jornada. Com uma abordagem direta e prática, ele vai te guiar por 20 dias de aprendizado intensivo, desde os fundamentos até suas primeiras operações reais no mercado.',
    page: '2 de 3'
  },
  3: {
    title: 'Compromisso com a Excelência',
    content: 'Este não é um curso comum. É um treinamento que exige dedicação, disciplina e comprometimento. Você aprenderá a operar com estratégias comprovadas, baseadas em matemática e estatística, não em achismos ou emoções.',
    page: '3 de 3'
  },
  4: {
    title: 'A Disciplina é Tudo',
    content: 'No trading, a diferença entre lucro e prejuízo está na disciplina. Você aprenderá a seguir um plano rigoroso, a gerenciar riscos de forma profissional e a manter a calma mesmo quando o mercado estiver volátil. Sem disciplina, não há lucro consistente.',
    page: '3 de 3'
  },
  5: {
    title: 'Pronto para Começar?',
    content: 'Você está a um passo de iniciar sua transformação. Jeff Wu está te esperando no chat para começar o Dia 1. Lembre-se: este é um compromisso com seu futuro financeiro. Vamos juntos nessa jornada!',
    page: '3 de 3',
    final: true
  }
}

const Welcome = () => {
  const { step } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const currentStep = parseInt(step) || 1
  const content = welcomeContent[currentStep]

  const handleNext = () => {
    if (currentStep < 5) {
      navigate(`/welcome/${currentStep + 1}`)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      navigate(`/welcome/${currentStep - 1}`)
    }
  }

  const handleStart = async () => {
    try {
      // Mark welcome as seen
      await supabase
        .from('user_preferences')
        .update({ has_seen_welcome: true })
        .eq('user_id', user.id)

      toast.success('Bem-vindo ao treinamento!')
      navigate('/chat')
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Erro ao iniciar. Tente novamente.')
    }
  }

  if (!content) {
    navigate('/welcome/1')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <MatrixRain />
      
      <div className="relative z-10 w-full max-w-2xl px-6">
        <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-12 shadow-2xl">
          {/* Page indicator */}
          <div className="text-center mb-6">
            <span className="text-sm text-muted-foreground">
              Página {content.page}
            </span>
          </div>

          {/* Content */}
          <div className="space-y-6 mb-12">
            <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {content.title}
            </h1>
            <p className="text-lg text-foreground/90 leading-relaxed text-center">
              {content.content}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            {currentStep > 1 ? (
              <Button
                onClick={handleBack}
                variant="outline"
                className="border-border hover:bg-muted"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            ) : (
              <div />
            )}

            {content.final ? (
              <Button
                onClick={handleStart}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
              >
                Começar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3, 4, 5].map((dot) => (
              <div
                key={dot}
                className={`h-2 w-2 rounded-full transition-all ${
                  dot === currentStep
                    ? 'bg-primary w-8'
                    : dot < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Welcome

