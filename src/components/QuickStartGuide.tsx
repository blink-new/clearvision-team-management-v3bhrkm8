import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CheckCircle, Users, MessageSquare, BarChart3, Calendar } from 'lucide-react'

interface QuickStartGuideProps {
  memberCount: number
}

export default function QuickStartGuide({ memberCount }: QuickStartGuideProps) {
  const steps = [
    {
      id: 1,
      title: "Add Team Members",
      description: "Start by adding your team members who will help with grant applications and sponsor outreach",
      icon: Users,
      completed: memberCount > 0,
      action: "Use the 'Add Team Member' button above"
    },
    {
      id: 2,
      title: "Assign First Tasks",
      description: "Use the AI Ask Bar to assign weekly tasks to your team members",
      icon: MessageSquare,
      completed: false,
      action: "Try: 'Assign grant application tasks to all active members'"
    },
    {
      id: 3,
      title: "Monitor Progress",
      description: "Track task completion and team performance in real-time",
      icon: BarChart3,
      completed: false,
      action: "Check the Analytics tab for insights"
    },
    {
      id: 4,
      title: "Manage Leave Requests",
      description: "Handle team member leave requests for exams, illness, or personal reasons",
      icon: Calendar,
      completed: false,
      action: "Leave requests will appear in the Team Management tab"
    }
  ]

  const completedSteps = steps.filter(step => step.completed).length

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>
              Get your ClearVision Foundation team management up and running
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {completedSteps}/{steps.length} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-sm font-medium ${
                      step.completed ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </h3>
                    {step.completed && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Done
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  {!step.completed && (
                    <p className="text-xs text-blue-600 mt-1 font-medium">{step.action}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {completedSteps === steps.length && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-900">
                Great! Your team management system is fully set up and ready to go.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}