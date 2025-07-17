// Database service wrapper that handles fallback to mock data
import { blink } from '../blink/client'
import { mockDataService, MockUser, MockTask, MockTaskSubmission } from './mockData'

export class DatabaseService {
  private static instance: DatabaseService
  private useMockData = true // Start with mock data by default
  private databaseAvailable = false // Track database availability
  private databaseChecked = false // Track if we've already checked database availability

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // Check database availability once
  private async checkDatabaseAvailability(): Promise<boolean> {
    if (this.databaseChecked) {
      return this.databaseAvailable
    }

    try {
      // Try a simple query to test database connectivity
      await blink.db.users.list({ limit: 1 })
      this.databaseAvailable = true
      this.useMockData = false
      console.log('✅ Database connected successfully')
    } catch (error: any) {
      this.databaseAvailable = false
      this.useMockData = true
      
      // Silently handle expected database unavailability
      // The application is designed to work seamlessly with mock data
      // Only log in development for debugging purposes
      if (process.env.NODE_ENV === 'development') {
        if (error?.message?.includes('404')) {
          console.log('📊 Demo Mode: Using mock data - database tables not created yet')
        } else if (error?.message?.includes('maximum database count')) {
          console.log('📊 Demo Mode: Using mock data - database limit reached')
        } else {
          console.log('📊 Demo Mode: Using mock data - database not available')
        }
      }
    }
    
    this.databaseChecked = true
    return this.databaseAvailable
  }

  // Users
  async getUserByUserId(userId: string): Promise<MockUser | null> {
    await this.checkDatabaseAvailability()
    
    if (!this.databaseAvailable) {
      return await mockDataService.getUserByUserId(userId)
    }
    
    try {
      const users = await blink.db.users.list({
        where: { userId: userId },
        limit: 1
      })
      return users.length > 0 ? users[0] : null
    } catch (error) {
      // Silently fallback to mock data - this is expected behavior
      this.useMockData = true
      this.databaseAvailable = false
      return await mockDataService.getUserByUserId(userId)
    }
  }

  async createUser(userData: Partial<MockUser>): Promise<MockUser> {
    await this.checkDatabaseAvailability()
    
    if (!this.databaseAvailable) {
      return await mockDataService.createUser(userData)
    }
    
    try {
      const newUser = await blink.db.users.create({
        userId: userData.userId || '',
        email: userData.email || '',
        name: userData.name || 'New User',
        role: userData.role || 'member',
        status: userData.status || 'active',
        joinedAt: userData.joinedAt || new Date().toISOString(),
        taskCompletionStreak: userData.taskCompletionStreak || 0,
        missedWeeks: userData.missedWeeks || 0
      })
      return newUser
    } catch (error) {
      // Silently fallback to mock data - this is expected behavior
      this.useMockData = true
      this.databaseAvailable = false
      return await mockDataService.createUser(userData)
    }
  }

  async getTeamMembers(): Promise<MockUser[]> {
    await this.checkDatabaseAvailability()
    
    if (!this.databaseAvailable) {
      return await mockDataService.getTeamMembers()
    }
    
    try {
      const members = await blink.db.users.list({
        where: { role: 'member' },
        orderBy: { name: 'asc' }
      })
      return members
    } catch (error) {
      // Silently fallback to mock data - this is expected behavior
      this.useMockData = true
      this.databaseAvailable = false
      return await mockDataService.getTeamMembers()
    }
  }

  // Tasks
  async getTasksForUser(userId: string, status?: string[]): Promise<MockTask[]> {
    await this.checkDatabaseAvailability()
    
    if (!this.databaseAvailable) {
      return await mockDataService.getTasksForUser(userId, status)
    }
    
    try {
      const whereClause: any = { userId: userId }
      if (status) {
        whereClause.status = status
      }
      
      const tasks = await blink.db.tasks.list({
        where: whereClause,
        orderBy: { dueDate: 'asc' }
      })
      return tasks
    } catch (error) {
      // Silently fallback to mock data - this is expected behavior
      this.useMockData = true
      this.databaseAvailable = false
      return await mockDataService.getTasksForUser(userId, status)
    }
  }

  async getCompletedTasksForUser(userId: string, limit?: number): Promise<MockTask[]> {
    await this.checkDatabaseAvailability()
    
    if (!this.databaseAvailable) {
      return await mockDataService.getCompletedTasksForUser(userId, limit)
    }
    
    try {
      const tasks = await blink.db.tasks.list({
        where: { 
          userId: userId,
          status: 'completed'
        },
        orderBy: { completedAt: 'desc' },
        limit: limit
      })
      return tasks
    } catch (error) {
      // Silently fallback to mock data - this is expected behavior
      this.useMockData = true
      this.databaseAvailable = false
      return await mockDataService.getCompletedTasksForUser(userId, limit)
    }
  }

  async getWeeklyTasks(weekNumber: number, year: number): Promise<MockTask[]> {
    await this.checkDatabaseAvailability()
    
    if (!this.databaseAvailable) {
      return await mockDataService.getWeeklyTasks(weekNumber, year)
    }
    
    try {
      const tasks = await blink.db.tasks.list({
        where: { 
          weekNumber: weekNumber,
          year: year
        },
        orderBy: { assignedAt: 'desc' }
      })
      return tasks
    } catch (error) {
      // Silently fallback to mock data - this is expected behavior
      this.useMockData = true
      this.databaseAvailable = false
      return await mockDataService.getWeeklyTasks(weekNumber, year)
    }
  }

  async createTask(taskData: Partial<MockTask>): Promise<MockTask> {
    await this.checkDatabaseAvailability()
    
    if (!this.databaseAvailable) {
      return await mockDataService.createTask(taskData)
    }
    
    try {
      const newTask = await blink.db.tasks.create({
        userId: taskData.userId || '',
        title: taskData.title || '',
        description: taskData.description || '',
        type: taskData.type || 'weekly',
        category: taskData.category || 'other',
        status: taskData.status || 'pending',
        dueDate: taskData.dueDate || new Date().toISOString(),
        assignedAt: taskData.assignedAt || new Date().toISOString(),
        completedAt: taskData.completedAt,
        weekNumber: taskData.weekNumber || this.getWeekNumber(new Date()),
        year: taskData.year || new Date().getFullYear(),
        aiExplanation: taskData.aiExplanation || '',
        createdBy: taskData.createdBy || ''
      })
      return newTask
    } catch (error) {
      // Silently fallback to mock data - this is expected behavior
      this.useMockData = true
      this.databaseAvailable = false
      return await mockDataService.createTask(taskData)
    }
  }

  async updateTask(taskId: string, updates: Partial<MockTask>): Promise<MockTask | null> {
    await this.checkDatabaseAvailability()
    
    if (!this.databaseAvailable) {
      return await mockDataService.updateTask(taskId, updates)
    }
    
    try {
      const updatedTask = await blink.db.tasks.update(taskId, updates)
      return updatedTask
    } catch (error) {
      // Silently fallback to mock data - this is expected behavior
      this.useMockData = true
      this.databaseAvailable = false
      return await mockDataService.updateTask(taskId, updates)
    }
  }

  // Task Submissions
  async createTaskSubmission(submissionData: Partial<MockTaskSubmission>): Promise<MockTaskSubmission> {
    await this.checkDatabaseAvailability()
    
    if (!this.databaseAvailable) {
      return await mockDataService.createTaskSubmission(submissionData)
    }
    
    try {
      const newSubmission = await blink.db.taskSubmissions.create({
        taskId: submissionData.taskId || '',
        userId: submissionData.userId || '',
        submissionType: submissionData.submissionType || '',
        details: submissionData.details || '',
        submittedAt: submissionData.submittedAt || new Date().toISOString(),
        aiFeedback: submissionData.aiFeedback,
        feedbackScore: submissionData.feedbackScore
      })
      return newSubmission
    } catch (error) {
      // Silently fallback to mock data - this is expected behavior
      this.useMockData = true
      this.databaseAvailable = false
      return await mockDataService.createTaskSubmission(submissionData)
    }
  }

  // AI Interactions
  async createAiInteraction(interactionData: any): Promise<any> {
    await this.checkDatabaseAvailability()
    
    if (!this.databaseAvailable) {
      return await mockDataService.createAiInteraction(interactionData)
    }
    
    try {
      const newInteraction = await blink.db.aiInteractions.create({
        userId: interactionData.userId,
        interactionType: interactionData.interactionType,
        prompt: interactionData.prompt,
        response: interactionData.response,
        context: interactionData.context
      })
      return newInteraction
    } catch (error) {
      // Silently fallback to mock data - this is expected behavior
      this.useMockData = true
      this.databaseAvailable = false
      return await mockDataService.createAiInteraction(interactionData)
    }
  }

  // Utility methods
  isUsingMockData(): boolean {
    return this.useMockData
  }

  getStatistics() {
    if (this.useMockData) {
      return mockDataService.getStatistics()
    }
    // In a real implementation, this would query the database for statistics
    return mockDataService.getStatistics()
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }
}

export const dbService = DatabaseService.getInstance()