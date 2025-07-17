import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Lightbulb, Target, Users, Calendar } from 'lucide-react'

interface TaskAssignmentHelperProps {
  onSuggestionClick: (suggestion: string) => void
  memberCount: number
}

export default function TaskAssignmentHelper({ onSuggestionClick, memberCount }: TaskAssignmentHelperProps) {
  const suggestions = [
    {
      category: "Grant Applications",
      icon: Target,
      color: "bg-blue-100 text-blue-800",
      tasks: [
        "Assign grant application tasks to all active members for this week",
        "Create custom grant research task for foundation grants over $50k",
        "Assign federal grant application tasks to experienced members only"
      ]
    },
    {
      category: "Sponsor Outreach",
      icon: Users,
      color: "bg-green-100 text-green-800",
      tasks: [
        "Assign sponsor outreach tasks to all team members",
        "Create corporate sponsorship outreach for tech companies",
        "Assign local business outreach tasks for community events"
      ]
    },
    {
      category: "Weekly Management",
      icon: Calendar,
      color: "bg-purple-100 text-purple-800",
      tasks: [
        "Generate this week's performance report for all members",
        "Create weekly task summary and send to all members",
        "Assign follow-up tasks for incomplete submissions from last week"
      ]
    }
  ]

  if (memberCount === 0) {
    return (
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-900">Ready to get started?</h3>
              <p className="text-sm text-yellow-700">Add your first team member to begin assigning tasks and managing your foundation's work.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-blue-600" />
          AI Task Assignment Suggestions
        </CardTitle>
        <CardDescription>
          Click any suggestion below to quickly assign tasks to your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {suggestions.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.category}>
                <div className="flex items-center space-x-2 mb-3">
                  <Icon className="w-4 h-4 text-gray-600" />
                  <Badge className={category.color}>
                    {category.category}
                  </Badge>
                </div>
                <div className="grid gap-2">
                  {category.tasks.map((task, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto p-3 text-left hover:bg-gray-50"
                      onClick={() => onSuggestionClick(task)}
                    >
                      <div className="text-sm">{task}</div>
                    </Button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-blue-100 rounded">
              <Lightbulb className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">Pro Tip</h4>
              <p className="text-sm text-blue-700 mt-1">
                You can also type custom requests like "Assign research tasks about environmental grants to Sarah" or "Create a one-time task for all members to update their contact information."
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}