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
import { Task } from '../services/databaseService'
import DatabaseStatusAlert from '../components/DatabaseStatusAlert'

export default function MemberDashboard({ user }) {
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [taskSubmission, setTaskSubmission] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useMockData, setUseMockData] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [weeklyProgress, setWeeklyProgress] = useState(0)

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

  // Calculate weekly progress
  useEffect(() => {
    const totalTasks = myTasks.length + completedTasks.length
    const completed = completedTasks.length
    const progress = totalTasks > 0 ? (completed / totalTasks) * 100 : 0
    setWeeklyProgress(progress)
  }, [myTasks, completedTasks])

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

      // Show celebration animation
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)

      toast({
        title: "🎉 Task Completed!",
        description: "Great work! Your submission has been recorded and AI feedback generated.",
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <div className="text-6xl">🎉</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ClearVision</h1>
                <p className="text-sm text-green-600 font-medium">Team Member Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.displayName || 'Team Member'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600">
                    {(user.displayName || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout} className="border-green-200 hover:bg-green-50">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user.displayName?.split(' ')[0] || 'Team Member'}! 👋
              </h2>
              <p className="text-green-100">
                Ready to make an impact today? Let's tackle your tasks and drive ClearVision forward.
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{completedTasks.length}</div>
                <div className="text-sm text-green-100">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{myTasks.length}</div>
                <div className="text-sm text-green-100">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{Math.round(weeklyProgress)}%</div>
                <div className="text-sm text-green-100">Progress</div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-green-100 mb-2">
              <span>Weekly Progress</span>
              <span>{Math.round(weeklyProgress)}% Complete</span>
            </div>
            <div className="w-full bg-green-400/30 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
                style={{ width: `${weeklyProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Your Tasks</h2>
                {myTasks.length > 0 && (
                  <Badge className="bg-green-100 text-green-800 px-3 py-1">
                    {myTasks.length} Active Task{myTasks.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {myTasks.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up! 🎉</h3>
                    <p className="text-gray-500 mb-2">No tasks assigned yet.</p>
                    <p className="text-sm text-gray-400">New tasks will appear here when assigned by the founder.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {myTasks.map((task) => (
                    <Card key={task.id} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl text-green-600">
                              {getCategoryIcon(task.category)}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Due: {formatDate(task.dueDate)}
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  {task.category.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(task.status)} font-medium`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 mb-4 leading-relaxed">{task.description}</p>
                        
                        {task.aiExplanation && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
                            <div className="flex items-start space-x-3">
                              <div className="p-1 bg-blue-100 rounded-lg">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-blue-900 mb-2">💡 AI Assistant Guidance</h4>
                                <p className="text-blue-800 text-sm leading-relaxed">{task.aiExplanation}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => setSelectedTask(task)}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Submit Task
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Task Submission Form */}
            {selectedTask && (
              <Card className="border-l-4 border-l-green-500 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl text-green-600">
                      {getCategoryIcon(selectedTask.category)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl text-gray-900">Submit Task: {selectedTask.title}</CardTitle>
                      <CardDescription className="text-gray-600 mt-1">
                        Provide detailed information about your task completion
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {/* Task Details Reminder */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">📋 Task Requirements</h4>
                    <p className="text-blue-800 text-sm leading-relaxed">{selectedTask.description}</p>
                  </div>

                  {/* Submission Guidelines */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">💡 Submission Guidelines</h4>
                    <ul className="text-yellow-800 text-sm space-y-1">
                      <li>• Be specific about what you accomplished</li>
                      <li>• Include names of organizations/people you contacted</li>
                      <li>• Mention any challenges you faced and how you overcame them</li>
                      <li>• Add links or references where applicable</li>
                    </ul>
                  </div>

                  {/* Submission Form */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Your Submission Details *
                    </label>
                    <Textarea
                      placeholder="Example: I applied to the Gates Foundation grant for our education program. I contacted Sarah Johnson (Program Officer) via email and submitted our proposal focusing on digital literacy. I also reached out to the Ford Foundation and scheduled a call for next week..."
                      value={taskSubmission}
                      onChange={(e) => setTaskSubmission(e.target.value)}
                      rows={8}
                      className="resize-none border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Be detailed and specific for better AI feedback</span>
                      <span>{taskSubmission.length} characters</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedTask(null)
                        setTaskSubmission('')
                      }}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleTaskSubmission}
                      disabled={isSubmitting || !taskSubmission.trim()}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-2 font-medium transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Submit Task
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Completed Tasks</h2>
                {completedTasks.length > 0 && (
                  <Badge className="bg-green-100 text-green-800 px-3 py-1">
                    {completedTasks.length} Completed
                  </Badge>
                )}
              </div>

              {completedTasks.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed tasks yet</h3>
                    <p className="text-gray-500 mb-2">Your completed tasks will appear here.</p>
                    <p className="text-sm text-gray-400">Complete your first task to see it here with AI feedback!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {completedTasks.map((task) => (
                    <Card key={task.id} className="border-l-4 border-l-green-500 bg-green-50/30">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl text-green-600">
                              {getCategoryIcon(task.category)}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Completed: {formatDate(task.completedAt || task.dueDate)}
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  {task.category.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 font-medium">
                            ✅ Completed
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 mb-4 leading-relaxed">{task.description}</p>
                        
                        {/* AI Feedback Placeholder */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-start space-x-3">
                            <div className="p-1 bg-green-100 rounded-lg">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-green-900 mb-2">🎯 AI Feedback</h4>
                              <p className="text-green-800 text-sm leading-relaxed">
                                Great work on completing this task! Your submission was thorough and well-documented. 
                                Keep up the excellent effort in driving ClearVision's mission forward.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Header */}
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center space-x-6 mb-6 md:mb-0">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {(user.displayName || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{user.displayName || 'Team Member'}</h2>
                      <p className="text-green-100 mb-2">{user.email}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-white/20 text-white border-white/30">
                          Active Member
                        </Badge>
                        <Badge className="bg-white/20 text-white border-white/30">
                          ClearVision Foundation
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center md:text-right">
                    <div className="text-3xl font-bold mb-1">{Math.round(weeklyProgress)}%</div>
                    <div className="text-green-100 text-sm">Weekly Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{completedTasks.length}</div>
                  <div className="text-sm text-gray-500">Tasks Completed</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
                  <div className="text-sm text-gray-500">Current Streak</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{myTasks.length}</div>
                  <div className="text-sm text-gray-500">Pending Tasks</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">A+</div>
                  <div className="text-sm text-gray-500">Performance</div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Task Completion Rate</span>
                      <span className="font-medium">100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Weekly Progress</span>
                      <span className="font-medium">{Math.round(weeklyProgress)}%</span>
                    </div>
                    <Progress value={weeklyProgress} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Response Time</span>
                      <span className="font-medium">Excellent</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {completedTasks.length > 0 ? (
                      completedTasks.slice(0, 3).map((task, index) => (
                        <div key={task.id} className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{task.title}</p>
                            <p className="text-xs text-gray-500">Completed {formatDate(task.completedAt || task.dueDate)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">No recent activity</p>
                        <p className="text-gray-400 text-xs mt-1">Complete tasks to see activity here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Achievements & Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="text-2xl mb-2">🌟</div>
                    <div className="text-sm font-medium text-gray-900">Team Player</div>
                    <div className="text-xs text-gray-500">Active member</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="text-2xl mb-2">🚀</div>
                    <div className="text-sm font-medium text-gray-900">Quick Starter</div>
                    <div className="text-xs text-gray-500">Fast onboarding</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200 opacity-50">
                    <div className="text-2xl mb-2">🏆</div>
                    <div className="text-sm font-medium text-gray-500">Task Master</div>
                    <div className="text-xs text-gray-400">Complete 10 tasks</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200 opacity-50">
                    <div className="text-2xl mb-2">🔥</div>
                    <div className="text-sm font-medium text-gray-500">Streak Hero</div>
                    <div className="text-xs text-gray-400">7-day streak</div>
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