import { useState, useEffect, useRef } from 'react'
import { Check, ChevronDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useProfile, PROFILES } from '@/context/ProfileContext'
import { useAuthStore } from '@/store/authStore'

export default function ProfileSwitcher() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { currentProfile, setCurrentProfile } = useProfile()
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  // Filtra perfis pelo role do JWT — cliente vê só perfis de conta, admin vê só admin
  const isPlatformAdmin = user?.role === 'platform_admin'
  const ACCOUNT_PROFILES = isPlatformAdmin ? [] : PROFILES.filter((p) => p.role !== 'platform_admin')
  const PLATFORM_PROFILES = isPlatformAdmin ? PROFILES.filter((p) => p.role === 'platform_admin') : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function renderProfileButton(profile: typeof PROFILES[0]) {
    return (
      <button
        key={profile.id}
        onClick={() => { setCurrentProfile(profile); setOpen(false) }}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50
                   transition-colors text-left"
      >
        <div
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            profile.avatarColor
          )}
        >
          <span className="text-[11px] font-bold text-white">{profile.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{profile.nome}</p>
          <p className="text-xs text-gray-400 truncate">{profile.cargo}</p>
        </div>
        {currentProfile.id === profile.id && (
          <Check size={14} className="text-blue-600 flex-shrink-0" />
        )}
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100
                   transition-colors"
      >
        <div
          className={clsx(
            'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
            currentProfile.avatarColor
          )}
        >
          <span className="text-[11px] font-bold text-white">{currentProfile.avatar}</span>
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-medium text-gray-900 leading-tight">{currentProfile.nome}</p>
          <p className="text-[10px] text-gray-400 leading-tight">{currentProfile.cargo}</p>
        </div>
        <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[260px] bg-white border border-gray-200
                     rounded-xl shadow-lg z-50 transition-all duration-200 overflow-hidden"
        >
          {/* Account profiles — só para clientes */}
          {ACCOUNT_PROFILES.length > 0 && (
            <>
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Perfis da conta
                </p>
              </div>
              <div className="py-1">
                {ACCOUNT_PROFILES.map(renderProfileButton)}
              </div>
            </>
          )}

          {/* Platform admin profiles — só para platform_admin */}
          {PLATFORM_PROFILES.length > 0 && (
            <>
              {ACCOUNT_PROFILES.length > 0 && <div className="border-t border-gray-100" />}
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Admin plataforma
                </p>
              </div>
              <div className="py-1">
                {PLATFORM_PROFILES.map(renderProfileButton)}
              </div>
            </>
          )}

          {/* Logout */}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                         text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
