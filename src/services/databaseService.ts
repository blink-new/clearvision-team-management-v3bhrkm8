// Database service for ClearVision Team Management Platform
import { blink } from '../blink/client'

export interface User {
  id: string
  userId: string
  email: string
  name: string
  role: 'founder' | 'member'
  status: 'active' | 'on_leave' | 'flagged' | 'removed'
  joinedAt: string
  taskCompletionStreak: number
  missedWeeks: number
  createdAt: string
  updatedAt: string
}

export interface Task {
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
  aiExplanation?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TaskSubmission {
  id: string
  taskId: string
  userId: string
  submissionType: string
  details: string
  aiFeedback?: string
  feedbackScore?: number
  submittedAt: string
  createdAt: string
}

export interface LeaveRequest {
  id: string
  userId: string
  reason: 'exam' | 'illness' | 'personal' | 'other'
  description?: string
  startDate: string
  endDate: string
  status: 'pending' | 'approved' | 'denied'
  approvedBy?: string
  approvalNotes?: string
  requestedAt: string
  processedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AiInteraction {
  id: string
  userId: string
  interactionType: 'ask_bar' | 'task_feedback' | 'task_assignment' | 'report_generation' | 'other'
  prompt: string
  response: string
  context?: string
  createdAt: string
}

export interface PerformanceLog {
  id: string
  userId: string
  weekNumber: number
  year: number
  tasksAssigned: number
  tasksCompleted: number
  tasksOverdue: number
  completionRate: number
  performanceScore?: number
  notes?: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'task_assigned' | 'task_overdue' | 'leave_approved' | 'leave_denied' | 'performance_flag' | 'system' | 'other'
  title: string
  message: string
  isRead: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: string
  readAt?: string
}

export class DatabaseService {
  private static instance: DatabaseService

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // Users
  async getUserByUserId(userId: string): Promise<User | null> {
    try {
      const users = await blink.db.users.list({
        where: { userId: userId },
        limit: 1
      })
      return users.length > 0 ? users[0] : null
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
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
      console.error('Error creating user:', error)
      throw error
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const updatedUser = await blink.db.users.update(userId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      return updatedUser
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  async getTeamMembers(): Promise<User[]> {
    try {
      const members = await blink.db.users.list({
        where: { 
          role: 'member',
          status: { not: 'removed' }
        },
        orderBy: { name: 'asc' }
      })
      return members
    } catch (error) {
      console.error('Error fetching team members:', error)
      throw error
    }
  }

  async removeMember(memberId: string): Promise<boolean> {
    try {
      await blink.db.users.update(memberId, { 
        status: 'removed',
        updatedAt: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('Error removing member:', error)
      throw error
    }
  }

  // Tasks
  async getTasksForUser(userId: string, status?: string[]): Promise<Task[]> {
    try {
      const whereClause: any = { userId: userId }
      if (status && status.length > 0) {
        whereClause.status = status.length === 1 ? status[0] : { in: status }
      }
      
      const tasks = await blink.db.tasks.list({
        where: whereClause,
        orderBy: { dueDate: 'asc' }
      })
      return tasks
    } catch (error) {
      console.error('Error fetching user tasks:', error)
      throw error
    }
  }

  async getCompletedTasksForUser(userId: string, limit?: number): Promise<Task[]> {
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
      console.error('Error fetching completed tasks:', error)
      throw error
    }
  }

  async getWeeklyTasks(weekNumber: number, year: number): Promise<Task[]> {
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
      console.error('Error fetching weekly tasks:', error)
      throw error
    }
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
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
      console.error('Error creating task:', error)
      throw error
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const updatedTask = await blink.db.tasks.update(taskId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      return updatedTask
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  async deleteTask(taskId: string): Promise<boolean> {
    try {
      await blink.db.tasks.delete(taskId)
      return true
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  // Task Submissions
  async createTaskSubmission(submissionData: Partial<TaskSubmission>): Promise<TaskSubmission> {
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
      console.error('Error creating task submission:', error)
      throw error
    }
  }

  async getTaskSubmissions(taskId: string): Promise<TaskSubmission[]> {
    try {
      const submissions = await blink.db.taskSubmissions.list({
        where: { taskId: taskId },
        orderBy: { submittedAt: 'desc' }
      })
      return submissions
    } catch (error) {
      console.error('Error fetching task submissions:', error)
      throw error
    }
  }

  // Leave Requests
  async createLeaveRequest(leaveData: Partial<LeaveRequest>): Promise<LeaveRequest> {
    try {
      const newLeaveRequest = await blink.db.leaveRequests.create({
        userId: leaveData.userId || '',
        reason: leaveData.reason || 'other',
        description: leaveData.description,
        startDate: leaveData.startDate || new Date().toISOString(),
        endDate: leaveData.endDate || new Date().toISOString(),
        status: leaveData.status || 'pending',
        requestedAt: leaveData.requestedAt || new Date().toISOString()
      })
      return newLeaveRequest
    } catch (error) {
      console.error('Error creating leave request:', error)
      throw error
    }
  }

  async updateLeaveRequest(leaveId: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest> {
    try {
      const updatedLeave = await blink.db.leaveRequests.update(leaveId, {
        ...updates,
        updatedAt: new Date().toISOString(),
        processedAt: updates.status !== 'pending' ? new Date().toISOString() : undefined
      })
      return updatedLeave
    } catch (error) {
      console.error('Error updating leave request:', error)
      throw error
    }
  }

  async getLeaveRequests(userId?: string, status?: string): Promise<LeaveRequest[]> {
    try {
      const whereClause: any = {}
      if (userId) whereClause.userId = userId
      if (status) whereClause.status = status

      const leaveRequests = await blink.db.leaveRequests.list({
        where: whereClause,
        orderBy: { requestedAt: 'desc' }
      })
      return leaveRequests
    } catch (error) {
      console.error('Error fetching leave requests:', error)
      throw error
    }
  }

  // AI Interactions
  async createAiInteraction(interactionData: Partial<AiInteraction>): Promise<AiInteraction> {
    try {
      const newInteraction = await blink.db.aiInteractions.create({
        userId: interactionData.userId || '',
        interactionType: interactionData.interactionType || 'other',
        prompt: interactionData.prompt || '',
        response: interactionData.response || '',
        context: interactionData.context
      })
      return newInteraction
    } catch (error) {
      console.error('Error creating AI interaction:', error)
      throw error
    }
  }

  async getAiInteractions(userId: string, limit?: number): Promise<AiInteraction[]> {
    try {
      const interactions = await blink.db.aiInteractions.list({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        limit: limit
      })
      return interactions
    } catch (error) {
      console.error('Error fetching AI interactions:', error)
      throw error
    }
  }

  // Performance Logs
  async createPerformanceLog(performanceData: Partial<PerformanceLog>): Promise<PerformanceLog> {
    try {
      const newLog = await blink.db.performanceLogs.create({
        userId: performanceData.userId || '',
        weekNumber: performanceData.weekNumber || this.getWeekNumber(new Date()),
        year: performanceData.year || new Date().getFullYear(),
        tasksAssigned: performanceData.tasksAssigned || 0,
        tasksCompleted: performanceData.tasksCompleted || 0,
        tasksOverdue: performanceData.tasksOverdue || 0,
        completionRate: performanceData.completionRate || 0,
        performanceScore: performanceData.performanceScore,
        notes: performanceData.notes
      })
      return newLog
    } catch (error) {
      console.error('Error creating performance log:', error)
      throw error
    }
  }

  async getPerformanceLogs(userId: string, limit?: number): Promise<PerformanceLog[]> {
    try {
      const logs = await blink.db.performanceLogs.list({
        where: { userId: userId },
        orderBy: { year: 'desc', weekNumber: 'desc' },
        limit: limit
      })
      return logs
    } catch (error) {
      console.error('Error fetching performance logs:', error)
      throw error
    }
  }

  // Notifications
  async createNotification(notificationData: Partial<Notification>): Promise<Notification> {
    try {
      const newNotification = await blink.db.notifications.create({
        userId: notificationData.userId || '',
        type: notificationData.type || 'system',
        title: notificationData.title || '',
        message: notificationData.message || '',
        isRead: notificationData.isRead || false,
        priority: notificationData.priority || 'normal'
      })
      return newNotification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  async getNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]> {
    try {
      const whereClause: any = { userId: userId }
      if (unreadOnly) whereClause.isRead = false

      const notifications = await blink.db.notifications.list({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      })
      return notifications
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    try {
      const updatedNotification = await blink.db.notifications.update(notificationId, {
        isRead: true,
        readAt: new Date().toISOString()
      })
      return updatedNotification
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  // Analytics and Statistics
  async getTeamStatistics(): Promise<{
    activeMembers: number
    flaggedMembers: number
    totalTasks: number
    completedTasks: number
    completionRate: number
    pendingLeaveRequests: number
  }> {
    try {
      // Get team members count
      const activeMembers = await blink.db.users.list({
        where: { role: 'member', status: 'active' }
      })
      
      const flaggedMembers = await blink.db.users.list({
        where: { role: 'member', status: 'flagged' }
      })

      // Get tasks statistics
      const allTasks = await blink.db.tasks.list({})
      const completedTasks = allTasks.filter(task => task.status === 'completed')
      
      // Get pending leave requests
      const pendingLeaveRequests = await blink.db.leaveRequests.list({
        where: { status: 'pending' }
      })

      const completionRate = allTasks.length > 0 
        ? Math.round((completedTasks.length / allTasks.length) * 100) 
        : 0

      return {
        activeMembers: activeMembers.length,
        flaggedMembers: flaggedMembers.length,
        totalTasks: allTasks.length,
        completedTasks: completedTasks.length,
        completionRate,
        pendingLeaveRequests: pendingLeaveRequests.length
      }
    } catch (error) {
      console.error('Error fetching team statistics:', error)
      throw error
    }
  }

  // Utility methods
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  // Check if database is available
  async isDatabaseAvailable(): Promise<boolean> {
    try {
      await blink.db.users.list({ limit: 1 })
      return true
    } catch (error) {
      return false
    }
  }

  // Legacy method for compatibility
  isUsingMockData(): boolean {
    return false // Always return false since we're now using real database
  }

  // Legacy method for compatibility
  getStatistics() {
    // This method is kept for backward compatibility
    // In practice, use getTeamStatistics() for real data
    return {
      activeMembers: 0,
      flaggedMembers: 0,
      totalTasks: 0,
      completedTasks: 0,
      completionRate: 0
    }
  }
}

export const dbService = DatabaseService.getInstance()