import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { MoreVertical, User, Image as ImageIcon, LogOut } from 'lucide-react'
import { EditProfileModal } from './EditProfileModal'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'

export function UserHeader() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const user = useStore((state) => state.user)
  const userProfile = useStore((state) => state.userProfile)
  const setUser = useStore((state) => state.setUser)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  const getInitials = () => {
    if (!userProfile?.name) return user?.email?.[0]?.toUpperCase() || 'U'
    const names = userProfile.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return userProfile.name[0].toUpperCase()
  }

  return (
    <>
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <Avatar 
          className="h-12 w-12 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
          onClick={() => setIsEditModalOpen(true)}
        >
          <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.name || 'User'} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {userProfile?.name || user?.email?.split('@')[0] || 'Usuário'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-primary/10"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              Editar Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Trocar Foto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditProfileModal 
        open={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </>
  )
}

