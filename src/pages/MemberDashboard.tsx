import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'
import { toast } from '../hooks/use-toast'
import { blink } from '../blink/client'
import { dbService } from '../services/databaseService'
import { MockTask } from '../services/mockData'
import DatabaseStatusAlert from '../components/DatabaseStatusAlert'

interface Task {
  id: string
  title: string
  description: string
  type: string
  category: string
  status: string
  dueDate: string
  aiExplanation: string
}

export default function MemberDashboard({ user }) {
  const [myTasks, setMyTasks] = useState<MockTask[]>([])
  const [completedTasks, setCompletedTasks] = useState<MockTask[]>([])
  const [taskSubmission, setTaskSubmission] = useState('')
  const [selectedTask, setSelectedTask] = useState<MockTask | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useMockData, setUseMockData] = useState(false)

  const loadMyTasks = useCallback(async () => {
    if (!user?.id) return
    try {
      const tasks = await dbService.getTasksForUser(user.id, ['pending', 'in_progress'])
      setMyTasks(tasks)
      setUseMockData(dbService.isUsingMockData())
    } catch (error) {
      console.error('Error loading tasks:', error)
      setMyTasks([])
      setUseMockData(true)
    }
  }, [user?.id])

  const loadCompletedTasks = useCallback(async () => {
    if (!user?.id) return
    try {
      const tasks = await dbService.getCompletedTasksForUser(user.id, 10)
      setCompletedTasks(tasks)
    } catch (error) {
      console.error('Error loading completed tasks:', error)
      setCompletedTasks([])
    }
  }, [user?.id])

  useEffect(() => {
    loadMyTasks()
    loadCompletedTasks()
  }, [loadMyTasks, loadCompletedTasks])

  const handleTaskSubmission = async () => {
    if (!selectedTask || !taskSubmission.trim()) return

    setIsSubmitting(true)
    try {
      // Create task submission
      await dbService.createTaskSubmission({
        taskId: selectedTask.id,
        userId: user.id,
        submissionType: selectedTask.category,
        details: taskSubmission,
        submittedAt: new Date().toISOString()
      })

      // Update task status to completed
      await dbService.updateTask(selectedTask.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      })

      // Get AI feedback on the submission
      const { text } = await blink.ai.generateText({
        prompt: `You are an AI assistant for ClearVision Foundation. A team member has submitted their task completion report.

        Task: ${selectedTask.title}
        Task Description: ${selectedTask.description}
        Member Submission: ${taskSubmission}

        Please provide constructive feedback on their submission. Rate their work on a scale of 1-5 and provide specific suggestions for improvement if needed. Be encouraging but honest.`,
        maxTokens: 300
      })

      // For now, we'll skip updating the submission with AI feedback in mock mode
      // This would be implemented when the database is available

      toast({
        title: "Task Submitted!",
        description: "Your task has been submitted and AI feedback has been generated.",
      })

      setTaskSubmission('')
      setSelectedTask(null)
      loadMyTasks()
      loadCompletedTasks()

    } catch (error) {
      console.error('Error submitting task:', error)
      toast({
        title: "Error",
        description: "Failed to submit task. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    blink.auth.logout()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grant_application':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'sponsor_outreach':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">ClearVision - Team Member Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.displayName || user.email}</span>
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Database Status Alert */}
        <DatabaseStatusAlert isUsingMockData={useMockData} />

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            {/* Current Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Current Tasks</CardTitle>
                <CardDescription>Your assigned tasks for this week</CardDescription>
              </CardHeader>
              <CardContent>
                {myTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No tasks assigned yet.</p>
                    <p className="text-sm text-gray-400 mt-2">New tasks will appear here when assigned by the founder.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myTasks.map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                              {getCategoryIcon(task.category)}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{task.title}</h3>
                              <p className="text-sm text-gray-500">Due: {formatDate(task.dueDate)}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{task.description}</p>
                        
                        {task.aiExplanation && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <h4 className="font-medium text-blue-900 mb-1">AI Assistant Explanation:</h4>
                            <p className="text-blue-800 text-sm">{task.aiExplanation}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => setSelectedTask(task)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Submit Task
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Submission Modal */}
            {selectedTask && (
              <Card>
                <CardHeader>
                  <CardTitle>Submit Task: {selectedTask.title}</CardTitle>
                  <CardDescription>Provide details about your task completion</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Describe what you accomplished, where you applied, who you contacted, etc. Be specific and detailed."
                    value={taskSubmission}
                    onChange={(e) => setTaskSubmission(e.target.value)}
                    rows={6}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedTask(null)
                        setTaskSubmission('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleTaskSubmission}
                      disabled={isSubmitting || !taskSubmission.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Task'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Completed Tasks</CardTitle>
                <CardDescription>Your recently completed tasks and feedback</CardDescription>
              </CardHeader>
              <CardContent>
                {completedTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No completed tasks yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Completed tasks will appear here with AI feedback.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedTasks.map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                              {getCategoryIcon(task.category)}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{task.title}</h3>
                              <p className="text-sm text-gray-500">Completed: {formatDate(task.completedAt || task.dueDate)}</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{task.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Your ClearVision Foundation team member profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-semibold text-green-600">
                        {(user.displayName || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{user.displayName || 'Team Member'}</h3>
                      <p className="text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{completedTasks.length}</div>
                      <div className="text-sm text-gray-500">Tasks Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-sm text-gray-500">Current Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{myTasks.length}</div>
                      <div className="text-sm text-gray-500">Pending Tasks</div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Performance Overview</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Task Completion Rate</span>
                        <span>100%</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}