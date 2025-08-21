import { nanoid } from 'nanoid';

class WorkflowEngine {
  constructor(db) {
    this.db = db;
    this.setupDatabase();
  }

  setupDatabase() {
    // Workflow execution history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_executions (
        id TEXT PRIMARY KEY,
        workflowId TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed, cancelled
        startedAt TEXT NOT NULL,
        completedAt TEXT,
        result TEXT, -- JSON object with execution results
        error TEXT,
        logs TEXT, -- JSON array of execution logs
        triggeredBy TEXT, -- user ID or 'system'
        FOREIGN KEY (workflowId) REFERENCES workflows(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS workflow_execution_logs (
        id TEXT PRIMARY KEY,
        executionId TEXT NOT NULL,
        nodeId TEXT NOT NULL,
        step TEXT NOT NULL,
        status TEXT NOT NULL, -- pending, running, completed, failed
        input TEXT, -- JSON object
        output TEXT, -- JSON object
        error TEXT,
        startedAt TEXT NOT NULL,
        completedAt TEXT,
        duration INTEGER, -- milliseconds
        FOREIGN KEY (executionId) REFERENCES workflow_executions(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflowId);
      CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
      CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_execution_id ON workflow_execution_logs(executionId);
    `);

    // Defensive: ensure workflow_executions.logs exists (older DBs may not have it)
    try {
      const info = this.db.prepare("PRAGMA table_info('workflow_executions')").all();
      const hasLogs = info.some((c) => c.name === 'logs');
      if (!hasLogs) {
        this.db.exec("ALTER TABLE workflow_executions ADD COLUMN logs TEXT");
      }
    } catch (e) {
      // ignore if pragma/alter fails
    }

    // Prepared statements
    this.insertExecution = this.db.prepare(`
      INSERT INTO workflow_executions (id, workflowId, status, startedAt, triggeredBy)
      VALUES (?, ?, ?, ?, ?)
    `);

    this.updateExecution = this.db.prepare(`
      UPDATE workflow_executions SET status = ?, completedAt = ?, result = ?, error = ?, logs = ?
      WHERE id = ?
    `);

    this.getExecution = this.db.prepare('SELECT * FROM workflow_executions WHERE id = ?');
    this.listExecutions = this.db.prepare('SELECT * FROM workflow_executions WHERE workflowId = ? ORDER BY startedAt DESC');

    this.insertExecutionLog = this.db.prepare(`
      INSERT INTO workflow_execution_logs (id, executionId, nodeId, step, status, input, output, error, startedAt, completedAt, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.updateExecutionLog = this.db.prepare(`
      UPDATE workflow_execution_logs SET status = ?, output = ?, error = ?, completedAt = ?, duration = ?
      WHERE id = ?
    `);
  }

  // Execute a workflow
  async executeWorkflow(workflowId, input = {}, triggeredBy = 'system') {
    const executionId = nanoid();
    const startedAt = new Date().toISOString();

    try {
      // Create execution record
      this.insertExecution.run(executionId, workflowId, 'running', startedAt, triggeredBy);

      // Get workflow definition
      const workflow = this.db.prepare('SELECT * FROM workflows WHERE id = ? AND deletedAt IS NULL').get(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const nodes = JSON.parse(workflow.nodes);
      const result = await this.executeNodes(nodes, input, executionId);

      // Update execution as completed
      this.updateExecution.run(
        'completed',
        new Date().toISOString(),
        JSON.stringify(result),
        null,
        JSON.stringify([]), // logs would be populated here
        executionId
      );

      // Update workflow stats
      this.db.prepare(`
        UPDATE workflows SET lastRun = ?, runCount = runCount + 1, updatedAt = ?
        WHERE id = ?
      `).run(new Date().toISOString(), new Date().toISOString(), workflowId);

      return { executionId, status: 'completed', result };

    } catch (error) {
      // Update execution as failed
      this.updateExecution.run(
        'failed',
        new Date().toISOString(),
        null,
        error.message,
        JSON.stringify([]),
        executionId
      );

      throw error;
    }
  }

  // Execute workflow nodes
  async executeNodes(nodes, input, executionId) {
    const context = { input, variables: {} };
    const results = {};

    // Find start nodes (nodes with no incoming connections)
    const startNodes = nodes.filter(node => 
      !nodes.some(otherNode => 
        otherNode.connections?.some(conn => conn.target === node.id)
      )
    );

    if (startNodes.length === 0) {
      throw new Error('No start nodes found in workflow');
    }

    // Execute nodes in dependency order
    const executed = new Set();
    const queue = [...startNodes];

    while (queue.length > 0) {
      const node = queue.shift();
      
      if (executed.has(node.id)) continue;

      // Check if all dependencies are executed
      const dependencies = nodes.filter(otherNode => 
        otherNode.connections?.some(conn => conn.target === node.id)
      );
      
      if (dependencies.some(dep => !executed.has(dep.id))) {
        queue.push(node); // Re-queue for later
        continue;
      }

      // Execute the node
      const nodeResult = await this.executeNode(node, context, executionId);
      results[node.id] = nodeResult;
      context.variables[node.id] = nodeResult;
      executed.add(node.id);

      // Add dependent nodes to queue
      const dependents = nodes.filter(otherNode => 
        node.connections?.some(conn => conn.target === otherNode.id)
      );
      queue.push(...dependents);
    }

    return results;
  }

  // Execute a single node
  async executeNode(node, context, executionId) {
    const logId = nanoid();
    const startedAt = new Date().toISOString();

    try {
      // Create execution log
      this.insertExecutionLog.run(
        logId,
        executionId,
        node.id,
        node.type,
        'running',
        JSON.stringify(node.data || {}),
        null,
        null,
        startedAt,
        null,
        null
      );

      let result;

      switch (node.type) {
        case 'start':
          result = context.input;
          break;

        case 'http_request':
          result = await this.executeHttpRequest(node, context);
          break;

        case 'data_transform':
          result = await this.executeDataTransform(node, context);
          break;

        case 'condition':
          result = await this.executeCondition(node, context);
          break;

        case 'delay':
          result = await this.executeDelay(node, context);
          break;

        case 'email':
          result = await this.executeEmail(node, context);
          break;

        case 'end':
          result = context.variables;
          break;

        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      const completedAt = new Date().toISOString();
      const duration = new Date(completedAt) - new Date(startedAt);

      // Update execution log
      this.updateExecutionLog.run(
        'completed',
        JSON.stringify(result),
        null,
        completedAt,
        duration,
        logId
      );

      return result;

    } catch (error) {
      const completedAt = new Date().toISOString();
      const duration = new Date(completedAt) - new Date(startedAt);

      // Update execution log with error
      this.updateExecutionLog.run(
        'failed',
        null,
        error.message,
        completedAt,
        duration,
        logId
      );

      throw error;
    }
  }

  // Node type implementations
  async executeHttpRequest(node, context) {
    const { url, method = 'GET', headers = {}, body } = node.data;
    
    const resolvedUrl = this.resolveTemplate(url, context);
    const resolvedHeaders = this.resolveTemplate(headers, context);
    const resolvedBody = body ? this.resolveTemplate(body, context) : undefined;

    const response = await fetch(resolvedUrl, {
      method,
      headers: resolvedHeaders,
      body: resolvedBody ? JSON.stringify(resolvedBody) : undefined
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData
    };
  }

  async executeDataTransform(node, context) {
    const { transform } = node.data;
    
    // Simple template-based transformation
    if (typeof transform === 'string') {
      return this.resolveTemplate(transform, context);
    }
    
    // Function-based transformation (would need sandboxing in production)
    if (typeof transform === 'function') {
      return transform(context.variables);
    }

    return context.variables;
  }

  async executeCondition(node, context) {
    const { condition } = node.data;
    
    // Simple condition evaluation
    const result = this.evaluateCondition(condition, context);
    
    return {
      condition: condition,
      result: result,
      branch: result ? 'true' : 'false'
    };
  }

  async executeDelay(node, context) {
    const { duration = 1000 } = node.data;
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return {
      delayed: true,
      duration: duration
    };
  }

  async executeEmail(node, context) {
    const { to, subject, body } = node.data;
    
    // Simple email simulation (would integrate with email service in production)
    const resolvedTo = this.resolveTemplate(to, context);
    const resolvedSubject = this.resolveTemplate(subject, context);
    const resolvedBody = this.resolveTemplate(body, context);
    
    return {
      sent: true,
      to: resolvedTo,
      subject: resolvedSubject,
      body: resolvedBody
    };
  }

  // Helper methods
  resolveTemplate(template, context) {
    if (typeof template === 'string') {
      return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const value = this.getNestedValue(context.variables, key.trim());
        return value !== undefined ? value : match;
      });
    }
    
    if (typeof template === 'object' && template !== null) {
      const result = {};
      for (const [k, v] of Object.entries(template)) {
        result[k] = this.resolveTemplate(v, context);
      }
      return result;
    }
    
    return template;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  evaluateCondition(condition, context) {
    if (typeof condition === 'string') {
      // Simple string-based condition evaluation
      const resolved = this.resolveTemplate(condition, context);
      return Boolean(resolved);
    }
    
    if (typeof condition === 'function') {
      return condition(context.variables);
    }
    
    return Boolean(condition);
  }

  // Get execution history
  getExecutionHistory(workflowId, limit = 10) {
    return this.listExecutions.all(workflowId).slice(0, limit);
  }

  // Get execution details
  getExecutionDetails(executionId) {
    const execution = this.getExecution.get(executionId);
    if (!execution) return null;

    const logs = this.db.prepare(`
      SELECT * FROM workflow_execution_logs 
      WHERE executionId = ? 
      ORDER BY startedAt
    `).all(executionId);

    return {
      ...execution,
      logs: logs.map(log => ({
        ...log,
        input: log.input ? JSON.parse(log.input) : null,
        output: log.output ? JSON.parse(log.output) : null
      }))
    };
  }
}

export default WorkflowEngine;