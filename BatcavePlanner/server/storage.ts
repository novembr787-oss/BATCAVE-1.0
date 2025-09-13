import { type User, type InsertUser, type Task, type InsertTask, type UpdateTask } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Task management
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tasks: Map<string, Task>;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTasks(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((task) => task.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    const task: Task = {
      ...insertTask,
      description: insertTask.description ?? null,
      priority: insertTask.priority ?? "medium",
      estimatedHours: insertTask.estimatedHours ?? "1.0", // Store as string for numeric field
      actualHours: null,
      dueDate: insertTask.dueDate ?? null,
      id,
      xpReward: 0,
      euReward: 0,
      isCompleted: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updateData: UpdateTask): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;

    // Calculate XP and EU rewards if task is being completed
    let calculatedRewards = {};
    if (updateData.isCompleted && !existingTask.isCompleted) {
      const actualHours = updateData.actualHours || existingTask.estimatedHours;
      // Convert string hours to number for calculation
      const hoursAsNumber = typeof actualHours === 'string' ? parseFloat(actualHours) : actualHours;
      const xpReward = this.calculateXPReward(existingTask.priority, hoursAsNumber);
      const euReward = this.calculateEUReward(existingTask.domain, hoursAsNumber);
      
      calculatedRewards = {
        xpReward,
        euReward,
        actualHours,
      };
    }

    const updatedTask: Task = {
      ...existingTask,
      ...updateData,
      ...calculatedRewards,
      updatedAt: new Date(),
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  private calculateXPReward(priority: string, hours: number): number {
    const basePriorityMultipliers = {
      low: 10,
      medium: 15,
      high: 25,
      urgent: 40,
    };
    const baseXP = basePriorityMultipliers[priority as keyof typeof basePriorityMultipliers] || 15;
    // Handle fractional hours properly
    return Math.round(baseXP * hours);
  }

  private calculateEUReward(domain: string, hours: number): number {
    const domainMultipliers = {
      academic: 1.0,
      fitness: 2.5,
      creative: 0.8,
      social: 1.2,
      maintenance: 0.6,
    };
    const multiplier = domainMultipliers[domain as keyof typeof domainMultipliers] || 1.0;
    // Handle fractional hours properly and scale for storage as integer
    return Math.round((hours * multiplier) * 10);
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}

export const storage = new MemStorage();
