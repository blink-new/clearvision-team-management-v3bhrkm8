// Mock data service to provide demo functionality while database is being set up

export interface MockUser {
  id: string
  userId: string
  email: string
  name: string
  role: 'founder' | 'member'
  status: 'active' | 'on_leave' | 'flagged' | 'removed'
  joinedAt: string
  taskCompletionStreak: number
  missedWeeks: number
}

export interface MockTask {
  id: string
  userId: string
  title: string
  description: string
  type: 'weekly' | 'custom' | 'one_time'
  category: 'grant_application' | 'sponsor_outreach' | 'partner_contact' | 'research' | 'other'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  dueDate: string
  assignedAt: string
  completedAt?: string
  weekNumber: number
  year: number
  aiExplanation: string
  createdBy: string
}

export interface MockTaskSubmission {
  id: string
  taskId: string
  userId: string
  submissionType: string
  details: string
  aiFeedback?: string
  feedbackScore?: number
  submittedAt: string
}

// Mock data
const mockUsers: MockUser[] = [
  {
    id: 'user_1',
    userId: 'gmLs6nNhYbWObKPpTY0G1zuGrL52',
    email: 'founder@clearvision.org',
    name: 'Foundation Founder',
    role: 'founder',
    status: 'active',
    joinedAt: '2024-01-01T00:00:00Z',
    taskCompletionStreak: 0,
    missedWeeks: 0
  },
  {
    id: 'user_2',
    userId: 'member_1',
    email: 'alex@clearvision.org',
    name: 'Alex Johnson',
    role: 'member',
    status: 'active',
    joinedAt: '2024-01-15T00:00:00Z',
    taskCompletionStreak: 3,
    missedWeeks: 0
  },
  {
    id: 'user_3',
    userId: 'member_2',
    email: 'sarah@clearvision.org',
    name: 'Sarah Chen',
    role: 'member',
    status: 'active',
    joinedAt: '2024-02-01T00:00:00Z',
    taskCompletionStreak: 2,
    missedWeeks: 1
  },
  {
    id: 'user_4',
    userId: 'member_3',
    email: 'mike@clearvision.org',
    name: 'Mike Rodriguez',
    role: 'member',
    status: 'flagged',
    joinedAt: '2024-01-20T00:00:00Z',
    taskCompletionStreak: 0,
    missedWeeks: 3
  }
]

const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const currentWeek = getWeekNumber(new Date())
const currentYear = new Date().getFullYear()

const mockTasks: MockTask[] = [
  {
    id: 'task_1',
    userId: 'member_1',
    title: 'Apply to Gates Foundation Grant',
    description: 'Research and submit application to the Gates Foundation for education-focused nonprofit grants. Focus on our literacy programs.',
    type: 'weekly',
    category: 'grant_application',
    status: 'pending',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedAt: new Date().toISOString(),
    weekNumber: currentWeek,
    year: currentYear,
    aiExplanation: 'The Gates Foundation focuses heavily on education and global development. Your application should emphasize measurable impact, scalability, and alignment with their strategic priorities. Include specific data about your literacy program outcomes.',
    createdBy: 'gmLs6nNhYbWObKPpTY0G1zuGrL52'
  },
  {
    id: 'task_2',
    userId: 'member_1',
    title: 'Reach out to Local Corporate Sponsors',
    description: 'Contact at least 5 local businesses for potential sponsorship opportunities. Focus on companies with CSR programs.',
    type: 'weekly',
    category: 'sponsor_outreach',
    status: 'in_progress',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    weekNumber: currentWeek,
    year: currentYear,
    aiExplanation: 'Focus on businesses that align with your mission. Prepare a compelling one-page proposal highlighting mutual benefits. Research their existing CSR initiatives to tailor your approach.',
    createdBy: 'gmLs6nNhYbWObKPpTY0G1zuGrL52'
  },
  {
    id: 'task_3',
    userId: 'member_2',
    title: 'Ford Foundation Grant Application',
    description: 'Complete application for Ford Foundation social justice grant program. Deadline is next week.',
    type: 'weekly',
    category: 'grant_application',
    status: 'pending',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    assignedAt: new Date().toISOString(),
    weekNumber: currentWeek,
    year: currentYear,
    aiExplanation: 'Ford Foundation prioritizes social justice and equity. Emphasize how your work addresses systemic inequalities and promotes inclusive communities. Include community voices and participatory approaches.',
    createdBy: 'gmLs6nNhYbWObKPpTY0G1zuGrL52'
  },
  {
    id: 'task_4',
    userId: 'member_2',
    title: 'Partner with University Research Center',
    description: 'Establish partnership with local university research center for program evaluation and impact measurement.',
    type: 'custom',
    category: 'partner_contact',
    status: 'pending',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignedAt: new Date().toISOString(),
    weekNumber: currentWeek,
    year: currentYear,
    aiExplanation: 'Academic partnerships provide credibility and research expertise. Propose a mutually beneficial arrangement where they get research opportunities and you get evaluation support.',
    createdBy: 'gmLs6nNhYbWObKPpTY0G1zuGrL52'
  }
]

const mockCompletedTasks: MockTask[] = [
  {
    id: 'task_completed_1',
    userId: 'member_1',
    title: 'United Way Grant Application',
    description: 'Submitted comprehensive application to United Way for community development funding.',
    type: 'weekly',
    category: 'grant_application',
    status: 'completed',
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    weekNumber: currentWeek - 1,
    year: currentYear,
    aiExplanation: 'United Way focuses on community impact. Your application should demonstrate local engagement and sustainable outcomes.',
    createdBy: 'gmLs6nNhYbWObKPpTY0G1zuGrL52'
  },
  {
    id: 'task_completed_2',
    userId: 'member_2',
    title: 'Sponsor Outreach - Tech Companies',
    description: 'Contacted 6 tech companies for potential sponsorship. Received positive responses from 2.',
    type: 'weekly',
    category: 'sponsor_outreach',
    status: 'completed',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    weekNumber: currentWeek - 1,
    year: currentYear,
    aiExplanation: 'Tech companies often have substantial CSR budgets. Focus on digital equity and STEM education alignment.',
    createdBy: 'gmLs6nNhYbWObKPpTY0G1zuGrL52'
  }
]

// Mock service functions
export const mockDataService = {
  // Users
  async getUserByUserId(userId: string): Promise<MockUser | null> {
    return mockUsers.find(user => user.userId === userId) || null
  },

  async getTeamMembers(): Promise<MockUser[]> {
    return mockUsers.filter(user => user.role === 'member')
  },

  async createUser(userData: Partial<MockUser>): Promise<MockUser> {
    const newUser: MockUser = {
      id: `user_${Date.now()}`,
      userId: userData.userId || '',
      email: userData.email || '',
      name: userData.name || 'New User',
      role: userData.role || 'member',
      status: userData.status || 'active',
      joinedAt: userData.joinedAt || new Date().toISOString(),
      taskCompletionStreak: userData.taskCompletionStreak || 0,
      missedWeeks: userData.missedWeeks || 0
    }
    mockUsers.push(newUser)
    return newUser
  },

  async removeMember(memberId: string): Promise<boolean> {
    const userIndex = mockUsers.findIndex(user => user.id === memberId)
    if (userIndex !== -1) {
      // Update status to 'removed' instead of deleting
      mockUsers[userIndex].status = 'removed'
      return true
    }
    return false
  },

  // Tasks
  async getTasksForUser(userId: string, status?: string[]): Promise<MockTask[]> {
    let tasks = mockTasks.filter(task => task.userId === userId)
    if (status) {
      tasks = tasks.filter(task => status.includes(task.status))
    }
    return tasks
  },

  async getCompletedTasksForUser(userId: string, limit?: number): Promise<MockTask[]> {
    let tasks = mockCompletedTasks.filter(task => task.userId === userId)
    if (limit) {
      tasks = tasks.slice(0, limit)
    }
    return tasks
  },

  async getWeeklyTasks(weekNumber: number, year: number): Promise<MockTask[]> {
    return [...mockTasks, ...mockCompletedTasks].filter(
      task => task.weekNumber === weekNumber && task.year === year
    )
  },

  async createTask(taskData: Partial<MockTask>): Promise<MockTask> {
    const newTask: MockTask = {
      id: `task_${Date.now()}`,
      userId: taskData.userId || '',
      title: taskData.title || '',
      description: taskData.description || '',
      type: taskData.type || 'weekly',
      category: taskData.category || 'other',
      status: taskData.status || 'pending',
      dueDate: taskData.dueDate || new Date().toISOString(),
      assignedAt: taskData.assignedAt || new Date().toISOString(),
      completedAt: taskData.completedAt,
      weekNumber: taskData.weekNumber || currentWeek,
      year: taskData.year || currentYear,
      aiExplanation: taskData.aiExplanation || '',
      createdBy: taskData.createdBy || ''
    }
    mockTasks.push(newTask)
    return newTask
  },

  async updateTask(taskId: string, updates: Partial<MockTask>): Promise<MockTask | null> {
    const taskIndex = mockTasks.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates }
      return mockTasks[taskIndex]
    }
    
    const completedTaskIndex = mockCompletedTasks.findIndex(task => task.id === taskId)
    if (completedTaskIndex !== -1) {
      mockCompletedTasks[completedTaskIndex] = { ...mockCompletedTasks[completedTaskIndex], ...updates }
      return mockCompletedTasks[completedTaskIndex]
    }
    
    return null
  },

  // Task Submissions
  async createTaskSubmission(submissionData: Partial<MockTaskSubmission>): Promise<MockTaskSubmission> {
    const newSubmission: MockTaskSubmission = {
      id: `submission_${Date.now()}`,
      taskId: submissionData.taskId || '',
      userId: submissionData.userId || '',
      submissionType: submissionData.submissionType || '',
      details: submissionData.details || '',
      aiFeedback: submissionData.aiFeedback,
      feedbackScore: submissionData.feedbackScore,
      submittedAt: submissionData.submittedAt || new Date().toISOString()
    }
    return newSubmission
  },

  // AI Interactions
  async createAiInteraction(interactionData: any): Promise<any> {
    return {
      id: `interaction_${Date.now()}`,
      ...interactionData,
      createdAt: new Date().toISOString()
    }
  },

  // Statistics
  getStatistics() {
    const activeMembers = mockUsers.filter(u => u.role === 'member' && u.status === 'active' && u.status !== 'removed').length
    const flaggedMembers = mockUsers.filter(u => u.role === 'member' && u.status === 'flagged' && u.status !== 'removed').length
    const totalTasks = mockTasks.length + mockCompletedTasks.length
    const completedTasks = mockCompletedTasks.length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      activeMembers,
      flaggedMembers,
      totalTasks,
      completedTasks,
      completionRate
    }
  }
}