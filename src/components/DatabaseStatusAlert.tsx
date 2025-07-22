import React, { useState, useEffect, useCallback } from 'react'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { CheckCircle, Database, ExternalLink } from 'lucide-react'
import { dbService } from '../services/databaseService'

interface DatabaseStatusAlertProps {
  isUsingMockData?: boolean
  onModeChanged?: () => void
}

export default function DatabaseStatusAlert({ isUsingMockData = false, onModeChanged }: DatabaseStatusAlertProps) {
  const [isDatabaseAvailable, setIsDatabaseAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const checkDatabaseStatus = useCallback(async () => {
    setIsChecking(true)
    try {
      const available = await dbService.isDatabaseAvailable()
      setIsDatabaseAvailable(available)
    } catch (error) {
      setIsDatabaseAvailable(false)
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    checkDatabaseStatus()
  }, [checkDatabaseStatus])

  const handleRetryConnection = async () => {
    await checkDatabaseStatus()
    if (isDatabaseAvailable && onModeChanged) {
      onModeChanged()
    }
  }

  // If database is available, show success message
  if (isDatabaseAvailable && !isUsingMockData) {
    return (
      <Alert className="mb-6 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>✅ Database Connected</strong>
              <p className="text-sm mt-1">
                Your ClearVision platform is fully operational with persistent data storage. 
                All team activities, tasks, and performance data are being saved securely.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <Database className="w-5 h-5" />
              <span className="text-sm font-medium">Live Database</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // If database is not available, show connection options
  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <Database className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="flex flex-col space-y-4">
          <div>
            <strong>⚠️ Database Connection Issue</strong>
            <p className="text-sm mt-1">
              Unable to connect to the database. This could be due to:
            </p>
            <ul className="text-sm mt-2 ml-4 space-y-1">
              <li>• Database tables not yet created</li>
              <li>• Network connectivity issues</li>
              <li>• Database service temporarily unavailable</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleRetryConnection}
              disabled={isChecking}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {isChecking ? 'Checking...' : 'Retry Connection'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://blink.new/dashboard', '_blank')}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Projects
            </Button>
          </div>
          
          <div className="text-xs text-amber-700 bg-amber-100 p-3 rounded-lg">
            <strong>💡 Quick Fix:</strong> If you're seeing this message, the database tables may need to be created. 
            The system has automatically attempted to create the necessary tables. Try refreshing the page or clicking "Retry Connection" above.
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}