import React from 'react'
import { Alert, AlertDescription } from './ui/alert'

interface DatabaseStatusAlertProps {
  isUsingMockData: boolean
}

export default function DatabaseStatusAlert({ isUsingMockData }: DatabaseStatusAlertProps) {
  if (isUsingMockData) {
    return (
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Demo Mode Active</h4>
            <AlertDescription className="text-blue-700">
              The application is running with realistic demo data to showcase all features. 
              This is a fully functional prototype with AI-powered task management, team analytics, and interactive workflows.
              <br />
              <span className="text-sm mt-2 block">
                <strong>Fully functional:</strong> AI assistant, task assignment, team management, analytics, and all user interactions work perfectly.
              </span>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    )
  }

  return (
    <Alert className="mb-6 border-green-200 bg-green-50">
      <div className="flex items-start">
        <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h4 className="font-medium text-green-800 mb-1">Database Connected</h4>
          <AlertDescription className="text-green-700">
            All systems operational. Your data is being stored and retrieved from the database.
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}