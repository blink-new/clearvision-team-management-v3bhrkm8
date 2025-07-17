import React, { useState, useEffect, useCallback } from 'react'
import { Toaster } from './components/ui/toaster'
import LoginPage from './pages/LoginPage'
import FounderDashboard from './pages/FounderDashboard'
import MemberDashboard from './pages/MemberDashboard'
import { blink } from './blink/client'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  const checkUserRole = useCallback(async (userId, userEmail, userName) => {
    try {
      // Use the database service which handles fallback gracefully
      const { dbService } = await import('./services/databaseService')
      
      let user = await dbService.getUserByUserId(userId)
      
      if (!user) {
        // Create new user record - default to member, founder can be set manually
        user = await dbService.createUser({
          userId: userId,
          email: userEmail || '',
          name: userName || 'New User',
          role: userId === 'gmLs6nNhYbWObKPpTY0G1zuGrL52' ? 'founder' : 'member',
          status: 'active',
          joinedAt: new Date().toISOString(),
          taskCompletionStreak: 0,
          missedWeeks: 0
        })
      }
      
      setUserRole(user.role)
    } catch (error) {
      // Gracefully handle database unavailability with fallback role assignment
      if (userId === 'gmLs6nNhYbWObKPpTY0G1zuGrL52') {
        setUserRole('founder')
      } else {
        setUserRole('member')
      }
    }
  }, [])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
      
      if (state.user) {
        // Check user role from database
        checkUserRole(state.user.id, state.user.email, state.user.displayName)
      }
    })
    return unsubscribe
  }, [checkUserRole])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ClearVision Platform...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {userRole === 'founder' ? (
        <FounderDashboard user={user} />
      ) : (
        <MemberDashboard user={user} />
      )}
      <Toaster />
    </div>
  )
}

export default App