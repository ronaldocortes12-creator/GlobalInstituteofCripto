import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'
import MatrixRain from '../components/MatrixRain'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Check if user has seen welcome
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('has_seen_welcome')
        .eq('user_id', data.user.id)
        .single()

      if (preferences?.has_seen_welcome) {
        navigate('/chat')
      } else {
        navigate('/welcome/1')
      }
    } catch (error) {
      toast.error(error.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!email || !password) {
      toast.error('Preencha email e senha')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      })

      if (error) throw error

      // Create user preferences
      await supabase.from('user_preferences').insert({
        user_id: data.user.id,
        has_seen_welcome: false
      })

      toast.success('Conta criada com sucesso!')
      navigate('/welcome/1')
    } catch (error) {
      toast.error(error.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <MatrixRain />
      
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 backdrop-blur-sm">
            <img src={logo} alt="Global Institute of Cripto" className="h-24 w-auto" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-center mb-2">Acesso</h1>
          <p className="text-center text-muted-foreground mb-8">
            O futuro da análise cripto chegou, bem-vindo (a)
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-primary">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-primary">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border focus:border-primary transition-colors"
                required
              />
            </div>

            <Button
              type="button"
              variant="link"
              className="text-secondary hover:text-secondary/80 p-0 h-auto"
            >
              Esqueceu a senha?
            </Button>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSignup}
              variant="outline"
              className="w-full border-secondary text-secondary hover:bg-secondary/10"
              disabled={loading}
            >
              Cadastre-se
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2025 Global Institute of Cripto
        </p>
      </div>
    </div>
  )
}

export default Login

