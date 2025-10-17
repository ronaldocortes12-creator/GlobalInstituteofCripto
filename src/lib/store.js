import { create } from 'zustand'
import { supabase } from './supabase'

// Unified store for all app state
export const useStore = create((set, get) => ({
  // Auth state
  user: null,
  session: null,
  loading: true,
  
  // User profile state
  userProfile: null,
  
  // Progress state
  lessons: [],
  modules: [],
  
  // Actions
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLessons: (lessons) => set({ lessons }),
  setModules: (modules) => set({ modules }),
  
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, user: session?.user ?? null, loading: false })
      
      // Load user profile if logged in
      if (session?.user) {
        await get().loadUserProfile(session.user.id)
        await get().loadProgress(session.user.id)
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null })
        if (session?.user) {
          await get().loadUserProfile(session.user.id)
          await get().loadProgress(session.user.id)
        } else {
          set({ userProfile: null, lessons: [], modules: [] })
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false })
    }
  },
  
  loadUserProfile: async (userId) => {
    if (!userId) return
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      set({ userProfile: data || null })
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  },
  
  loadProgress: async (userId) => {
    if (!userId) return
    
    try {
      const { data: progress, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .order('lesson_day', { ascending: true })
      
      if (error) throw error
      
      set({ lessons: progress || [] })
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  },
  
  updateLessonProgress: async (userId, lessonDay) => {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: userId,
          lesson_day: lessonDay,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_day'
        })
        .select()
      
      if (error) throw error
      
      // Reload progress after update
      await get().loadProgress(userId)
      
      return data
    } catch (error) {
      console.error('Error updating lesson progress:', error)
      throw error
    }
  },
  
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, userProfile: null, lessons: [], modules: [] })
  }
}))

