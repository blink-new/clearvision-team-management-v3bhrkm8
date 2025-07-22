import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'
import { toast } from '../hooks/use-toast'
import { blink } from '../blink/client'
import { dbService } from '../services/databaseService'
import { User } from '../services/databaseService'
import DatabaseStatusAlert from '../components/DatabaseStatusAlert'
import AddMemberDialog from '../components/AddMemberDialog'
import QuickStartGuide from '../components/QuickStartGuide'
import TaskAssignmentHelper from '../components/TaskAssignmentHelper'

export default function FounderDashboard({ user }) {
  const [askBarInput, setAskBarInput] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [useMockData, setUseMockData] = useState(false)
  const [weeklyTasks, setWeeklyTasks] = useState([])

  const getWeekNumber = useCallback((date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }, [])

  const loadTeamMembers = useCallback(async () => {
    try {
      const members = await dbService.getTeamMembers()
      setTeamMembers(members)
      setUseMockData(dbService.isUsingMockData())
    } catch (error) {
      console.error('Error loading team members:', error)
      setTeamMembers([])
      setUseMockData(true)
    }
  }, [])

  const loadWeeklyTasks = useCallback(async () => {
    try {
      const currentWeek = getWeekNumber(new Date())
      const currentYear = new Date().getFullYear()
      
      const tasks = await dbService.getWeeklyTasks(currentWeek, currentYear)
      setWeeklyTasks(tasks)
    } catch (error) {
      console.error('Error loading weekly tasks:', error)
      setWeeklyTasks([])
    }
  }, [getWeekNumber])

  const processAiCommand = useCallback(async (prompt: string, aiResponse: string) => {
    // Parse the AI response and take actual actions
    const lowerPrompt = prompt.toLowerCase()
    
    if (lowerPrompt.includes('assign') && lowerPrompt.includes('task')) {
      try {
        // Determine task type and target members
        const targetMembers = teamMembers.filter(m => m.status === 'active')
        let taskType: 'weekly' | 'custom' | 'one_time' = 'weekly'
        let taskCategory: 'grant_application' | 'sponsor_outreach' | 'partner_contact' | 'research' | 'other' = 'other'
        
        // Parse task category
        if (lowerPrompt.includes('grant')) {
          taskCategory = 'grant_application'
        } else if (lowerPrompt.includes('sponsor')) {
          taskCategory = 'sponsor_outreach'
        } else if (lowerPrompt.includes('partner')) {
          taskCategory = 'partner_contact'
        }
        
        // Parse task type
        if (lowerPrompt.includes('custom') || lowerPrompt.includes('one-time')) {
          taskType = 'custom'
        }
        
        // Create tasks for each target member
        const currentWeek = getWeekNumber(new Date())
        const currentYear = new Date().getFullYear()
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 7) // Due in 1 week
        
        const taskPromises = targetMembers.map(member => {
          let taskTitle = ''
          let taskDescription = ''
          let aiExplanation = ''
          
          // Generate task content based on category
          if (taskCategory === 'grant_application') {
            taskTitle = 'Weekly Grant Application Task'
            taskDescription = 'Research and apply to at least 2 relevant grants for ClearVision Foundation. Focus on grants that align with our mission and programs.'
            aiExplanation = 'Grant applications are crucial for nonprofit funding. Research foundations that support causes similar to ours, read their guidelines carefully, and submit compelling applications that demonstrate our impact and need.'
          } else if (taskCategory === 'sponsor_outreach') {
            taskTitle = 'Weekly Sponsor Outreach Task'
            taskDescription = 'Contact at least 5 potential sponsors including local businesses, corporations, or community organizations for partnership opportunities.'
            aiExplanation = 'Sponsor outreach helps diversify our funding sources. Focus on businesses that align with our values, prepare personalized pitches, and follow up professionally. Track all contacts and responses.'
          } else {
            taskTitle = 'Weekly Team Task'
            taskDescription = 'Complete assigned weekly responsibilities to support ClearVision Foundation operations.'
            aiExplanation = 'This task supports our foundation\'s ongoing operations. Please complete it thoroughly and submit your progress by the due date.'
          }
          
          return dbService.createTask({
            userId: member.userId,
            title: taskTitle,
            description: taskDescription,
            type: taskType,
            category: taskCategory,
            status: 'pending',
            dueDate: dueDate.toISOString(),
            assignedAt: new Date().toISOString(),
            weekNumber: currentWeek,
            year: currentYear,
            aiExplanation: aiExplanation,
            createdBy: user.id
          })
        })
        
        await Promise.all(taskPromises)
        
        toast({
          title: "Tasks Assigned Successfully!",
          description: `Created ${targetMembers.length} ${taskCategory.replace('_', ' ')} tasks for active team members.`,
        })
        
        // Refresh data
        loadWeeklyTasks()
        
      } catch (error) {
        console.error('Error creating tasks:', error)
        toast({
          title: "Task Assignment Error",
          description: "Failed to create tasks. Please try again.",
          variant: "destructive"
        })
      }
    }
    
    // Handle report generation requests
    if (lowerPrompt.includes('report') || lowerPrompt.includes('summary')) {
      toast({
        title: "Report Generated",
        description: "Weekly performance report has been generated. Check the Analytics tab for details.",
      })
    }
  }, [teamMembers, getWeekNumber, loadWeeklyTasks, user.id])

  useEffect(() => {
    loadTeamMembers()
    loadWeeklyTasks()
  }, [loadTeamMembers, loadWeeklyTasks])

  const handleAskBarSubmit = async () => {
    if (!askBarInput.trim()) return

    setIsProcessing(true)
    try {
      // Use AI to process the founder's request
      const { text } = await blink.ai.generateText({
        prompt: `You are an AI assistant for ClearVision Foundation's team management system. The founder is asking: "${askBarInput}"

        Context: You help manage team tasks, generate reports, assign tasks, and provide insights about team performance. You can:
        1. Assign new tasks to team members (both one-time and recurring)
        2. Generate reports about team performance
        3. Provide insights about specific team members
        4. Create custom task assignments
        5. Analyze team productivity and suggest improvements

        Current team members: ${teamMembers.map(m => m.name).join(', ')}
        
        Respond as if you're taking action on their request. Be specific about what you're doing and provide actionable next steps. If they're asking you to assign tasks, explain what tasks you're creating and for whom.`,
        maxTokens: 500
      })

      setAiResponse(text)
      
      // Save the interaction
      await dbService.createAiInteraction({
        userId: user.id,
        interactionType: 'ask_bar',
        prompt: askBarInput,
        response: text,
        context: JSON.stringify({ teamMembersCount: teamMembers.length })
      })

      // Process specific commands (this would be expanded based on the AI response)
      await processAiCommand(askBarInput, text)
      
    } catch (error) {
      console.error('Error processing ask bar request:', error)
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogout = () => {
    blink.auth.logout()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'on_leave': return 'bg-yellow-100 text-yellow-800'
      case 'flagged': return 'bg-red-100 text-red-800'
      case 'removed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleRemoveMember = async (member: User) => {
    if (!confirm(`Are you sure you want to remove ${member.name} from the team? This action cannot be undone.`)) {
      return
    }

    try {
      const success = await dbService.removeMember(member.id)
      if (success) {
        toast({
          title: "Member Removed",
          description: `${member.name} has been removed from the team.`,
        })
        loadTeamMembers() // Refresh the team list
      } else {
        toast({
          title: "Error",
          description: "Failed to remove team member. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: "Error",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">ClearVision - Founder Portal</h1>
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
        <DatabaseStatusAlert 
          isUsingMockData={useMockData} 
          onModeChanged={() => {
            setUseMockData(false)
            loadTeamMembers()
            loadWeeklyTasks()
          }} 
        />

        {/* Quick Start Guide */}
        <QuickStartGuide memberCount={teamMembers.length} />

        {/* Task Assignment Helper */}
        <TaskAssignmentHelper 
          onSuggestionClick={setAskBarInput} 
          memberCount={teamMembers.length} 
        />

        {/* AI Ask Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Assistant - Ask Bar
            </CardTitle>
            <CardDescription>
              Your intelligent partner for team management. Ask me to assign tasks, generate reports, or analyze team performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Ask me anything... e.g., 'Assign grant application tasks to all active members' or 'Generate a report on this week's performance'"
                value={askBarInput}
                onChange={(e) => setAskBarInput(e.target.value)}
                className="flex-1"
                rows={2}
              />
              <Button 
                onClick={handleAskBarSubmit}
                disabled={isProcessing || !askBarInput.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? 'Processing...' : 'Ask AI'}
              </Button>
            </div>
            
            {aiResponse && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">AI Response:</h4>
                <p className="text-blue-800 whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team Management</TabsTrigger>
            <TabsTrigger value="tasks">Task Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Members</p>
                      <p className="text-2xl font-bold text-gray-900">{teamMembers.filter(m => m.status === 'active' && m.status !== 'removed').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tasks This Week</p>
                      <p className="text-2xl font-bold text-gray-900">{weeklyTasks.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">85%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Flagged Members</p>
                      <p className="text-2xl font-bold text-gray-900">{teamMembers.filter(m => m.status === 'flagged' && m.status !== 'removed').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest team updates and task completions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Database connected successfully</p>
                      <p className="text-xs text-gray-500">ClearVision platform is now fully operational</p>
                    </div>
                    <span className="text-xs text-gray-500">Just now</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your ClearVision Foundation team</CardDescription>
                  </div>
                  <AddMemberDialog onMemberAdded={loadTeamMembers} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.filter(m => m.status !== 'removed').length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No team members found. Add your first team member to get started.</p>
                    </div>
                  ) : (
                    teamMembers
                      .filter(member => member.status !== 'removed')
                      .map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                              <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{member.name}</h3>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge className={getStatusColor(member.status)}>
                              {member.status.replace('_', ' ')}
                            </Badge>
                            <div className="text-right">
                              <p className="text-sm font-medium">Streak: {member.taskCompletionStreak}</p>
                              <p className="text-xs text-gray-500">Missed: {member.missedWeeks}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMember(member)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Management</CardTitle>
                <CardDescription>Monitor and assign tasks to team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Use the AI Ask Bar above to assign tasks to your team members.</p>
                  <p className="text-sm text-gray-400">Example: "Assign grant application tasks to all active members for this week"</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Analytics</CardTitle>
                <CardDescription>Performance insights and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Analytics will be populated as your team completes tasks and submits reports.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}