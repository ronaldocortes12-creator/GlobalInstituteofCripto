import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Upload, Loader2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { useToast } from './ui/use-toast'

export function EditProfileModal({ open, onClose }) {
  const userProfile = useStore((state) => state.userProfile)
  const setUserProfile = useStore((state) => state.setUserProfile)
  const user = useStore((state) => state.user)
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [cryptoExperience, setCryptoExperience] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open && userProfile) {
      setName(userProfile.name || '')
      setAge(userProfile.age?.toString() || '')
      setCryptoExperience(userProfile.crypto_experience || '')
      setAvatarPreview(userProfile.avatar_url || '')
    }
  }, [open, userProfile])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione uma imagem JPG, PNG ou WebP.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 2MB.',
        variant: 'destructive',
      })
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    // Validate name
    if (!name || name.trim().length < 3 || name.trim().length > 30) {
      toast({
        title: 'Nome inválido',
        description: 'O nome deve ter entre 3 e 30 caracteres.',
        variant: 'destructive',
      })
      return
    }

    // Validate name (no control characters, not only spaces)
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) {
      toast({
        title: 'Nome inválido',
        description: 'O nome deve conter apenas letras e espaços.',
        variant: 'destructive',
      })
      return
    }

    // Validate age
    const ageNum = parseInt(age)
    if (!age || isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      toast({
        title: 'Idade inválida',
        description: 'A idade deve estar entre 13 e 120 anos.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      let avatarUrl = userProfile?.avatar_url || ''

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('user-avatars')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('user-avatars')
          .getPublicUrl(filePath)

        avatarUrl = publicUrl
      }

      // Update profile in database
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          name: name.trim(),
          age: ageNum,
          crypto_experience: cryptoExperience,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Update local state
      setUserProfile({
        ...userProfile,
        name: name.trim(),
        age: ageNum,
        crypto_experience: cryptoExperience,
        avatar_url: avatarUrl
      })

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      })

      onClose()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar suas informações. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Escolher Foto
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              JPG, PNG ou WebP. Máx. 2MB.
            </p>
          </div>

          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              maxLength={30}
            />
          </div>

          {/* Age */}
          <div className="grid gap-2">
            <Label htmlFor="age">Idade</Label>
            <Input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Sua idade"
              min={13}
              max={120}
            />
          </div>

          {/* Crypto Experience */}
          <div className="grid gap-2">
            <Label htmlFor="experience">Tempo operando cripto</Label>
            <Select value={cryptoExperience} onValueChange={setCryptoExperience}>
              <SelectTrigger id="experience">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="< 6 meses">Menos de 6 meses</SelectItem>
                <SelectItem value="6-12 meses">6 a 12 meses</SelectItem>
                <SelectItem value="1-3 anos">1 a 3 anos</SelectItem>
                <SelectItem value="3-5 anos">3 a 5 anos</SelectItem>
                <SelectItem value="5+ anos">Mais de 5 anos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

