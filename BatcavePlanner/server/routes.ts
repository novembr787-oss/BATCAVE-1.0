import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, updateTaskSchema, clientTaskSchema, clientUpdateTaskSchema } from "@shared/schema";
import { ZodError } from "zod";
import { generateTaskSuggestions, explainTaskStrategy } from "./gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Task management routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Use client schema for validation and conversion
      const validatedData = clientTaskSchema.parse(req.body);
      // Convert to server format with decimal hours and ISO dates
      const taskData: any = {
        ...validatedData,
        userId,
        estimatedHours: validatedData.estimatedHours.toString(), // Store as string for numeric field
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      };
      // Clean undefined values and parse with server schema
      Object.keys(taskData).forEach(key => {
        if (taskData[key] === undefined) delete taskData[key];
      });
      const task = await storage.createTask(insertTaskSchema.parse(taskData));
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const taskId = req.params.id;
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask || existingTask.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Use client update schema for validation (prevents reward tampering)
      const validatedUpdate = clientUpdateTaskSchema.parse(req.body);
      
      // Prevent un-completing tasks to maintain reward integrity
      if (validatedUpdate.isCompleted === false && existingTask.isCompleted) {
        return res.status(400).json({ 
          error: "Cannot un-complete a task", 
          message: "Tasks cannot be marked as incomplete once completed to maintain reward integrity." 
        });
      }
      
      // Convert to server format
      const updateData: any = {
        ...validatedUpdate,
        estimatedHours: validatedUpdate.estimatedHours ? validatedUpdate.estimatedHours.toString() : undefined,
        actualHours: validatedUpdate.actualHours ? validatedUpdate.actualHours.toString() : undefined,
        dueDate: validatedUpdate.dueDate ? new Date(validatedUpdate.dueDate) : undefined,
        completedAt: validatedUpdate.isCompleted ? new Date() : undefined,
      };
      // Clean undefined values and parse with server schema
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });
      const updatedTask = await storage.updateTask(taskId, updateTaskSchema.parse(updateData));
      
      if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const taskId = req.params.id;
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask || existingTask.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }

      const deleted = await storage.deleteTask(taskId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // AI-powered task suggestions
  app.get("/api/tasks/suggestions", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const existingTasks = await storage.getTasks(userId);
      const suggestions = await generateTaskSuggestions(existingTasks);
      
      res.json(suggestions);
    } catch (error) {
      console.error('Task suggestions error:', error);
      res.status(500).json({ error: "ALFRED is currently offline" });
    }
  });

  // AI task strategy explanation
  app.post("/api/tasks/:id/explain", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const taskId = req.params.id;
      const task = await storage.getTask(taskId);
      
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }

      const explanation = await explainTaskStrategy(task);
      
      res.json({ explanation });
    } catch (error) {
      console.error('Task explanation error:', error);
      res.status(500).json({ error: "ALFRED is currently offline" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
