const { Task, User, TaskHistory, TaskComment } = require('../models');

const PRIVILEGED_ROLES = new Set(['HR Manager', 'Super Admin', 'System Admin']);
const isPrivilegedRole = (role) => PRIVILEGED_ROLES.has(role);
const DUE_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const canModifyTask = (task, user) => {
  if (!user) return false;
  if (isPrivilegedRole(user.role)) return true;
  return task.userId === user.id || task.createdBy === user.id;
};

const normalizeDueTime = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const time = String(value).slice(0, 5);
  return DUE_TIME_PATTERN.test(time) ? time : null;
};

const formatTask = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  dueTime: task.dueTime || null,
  userId: task.userId,
  createdBy: task.createdBy,
  assigneeName: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '',
  assigneeEmail: task.assignee?.email || '',
  commentCount: Array.isArray(task.comments) ? task.comments.length : 0,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt
});

const taskIncludes = [
  {
    model: User,
    as: 'assignee',
    attributes: ['id', 'firstName', 'lastName', 'email']
  },
  {
    model: TaskComment,
    as: 'comments',
    attributes: ['id']
  }
];

const logTaskHistory = async ({ taskId, action, details, changedBy }) => {
  await TaskHistory.create({ taskId, action, details: details || null, changedBy });
};

const getTasks = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;

    const tasks = await Task.findAll({
      where,
      include: taskIncludes,
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: tasks.map(formatTask) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, dueTime, userId } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
    if (dueTime && normalizeDueTime(dueTime) === null) {
      return res.status(400).json({ success: false, message: 'Due time must be in HH:mm format' });
    }

    const privileged = isPrivilegedRole(req.user?.role);
    const assigneeId = privileged ? (userId || req.user.id) : req.user.id;

    const assignee = await User.findByPk(assigneeId);
    if (!assignee) return res.status(404).json({ success: false, message: 'Assignee not found' });

    const task = await Task.create({
      title,
      description: description || null,
      status: status || 'Pending',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      dueTime: normalizeDueTime(dueTime) || null,
      userId: assigneeId,
      createdBy: req.user.id
    });

    const created = await Task.findByPk(task.id, {
      include: taskIncludes
    });

    await logTaskHistory({
      taskId: task.id,
      action: 'Created',
      details: `Task created with status "${task.status}"`,
      changedBy: req.user.id
    });

    res.status(201).json({ success: true, data: formatTask(created) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create task', error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, dueTime, userId } = req.body;
    const privileged = isPrivilegedRole(req.user?.role);

    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!canModifyTask(task, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (dueTime !== undefined && dueTime !== null && dueTime !== '' && normalizeDueTime(dueTime) === null) {
      return res.status(400).json({ success: false, message: 'Due time must be in HH:mm format' });
    }

    const nextAssignee = privileged && userId ? userId : task.userId;
    if (privileged && userId) {
      const assignee = await User.findByPk(userId);
      if (!assignee) return res.status(404).json({ success: false, message: 'Assignee not found' });
    }

    const previous = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      userId: task.userId
    };

    await task.update({
      title: title ?? task.title,
      description: description ?? task.description,
      status: status ?? task.status,
      priority: priority ?? task.priority,
      dueDate: dueDate ?? task.dueDate,
      dueTime: dueTime !== undefined ? normalizeDueTime(dueTime) : task.dueTime,
      userId: nextAssignee
    });

    const changes = [];
    if (title !== undefined && title !== previous.title) changes.push(`Title: "${previous.title}" -> "${title}"`);
    if (description !== undefined && description !== previous.description) changes.push('Description updated');
    if (status !== undefined && status !== previous.status) changes.push(`Status: "${previous.status}" -> "${status}"`);
    if (priority !== undefined && priority !== previous.priority) changes.push(`Priority: "${previous.priority}" -> "${priority}"`);
    if (dueDate !== undefined && dueDate !== previous.dueDate) changes.push('Due date changed');
    if (dueTime !== undefined && normalizeDueTime(dueTime) !== previous.dueTime) changes.push('Due time changed');
    if (nextAssignee !== previous.userId) changes.push('Assignee changed');

    await logTaskHistory({
      taskId: task.id,
      action: 'Updated',
      details: changes.length ? changes.join(' | ') : 'Task details updated',
      changedBy: req.user.id
    });

    const updated = await Task.findByPk(id, {
      include: taskIncludes
    });

    res.json({ success: true, data: formatTask(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update task', error: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!canModifyTask(task, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const oldStatus = task.status;
    await task.update({ status });
    await logTaskHistory({
      taskId: task.id,
      action: 'Status Changed',
      details: `Status changed from "${oldStatus}" to "${status}"`,
      changedBy: req.user.id
    });
    res.json({ success: true, message: 'Task status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!canModifyTask(task, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await logTaskHistory({
      taskId: task.id,
      action: 'Deleted',
      details: `Task "${task.title}" deleted`,
      changedBy: req.user.id
    });

    await TaskComment.destroy({ where: { taskId: task.id } });
    await task.destroy();
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete task', error: error.message });
  }
};

const getTaskHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const history = await TaskHistory.findAll({
      where: { taskId: id },
      include: [{
        model: User,
        as: 'changer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    const formatted = history.map((h) => ({
      id: h.id,
      action: h.action,
      details: h.details,
      changedBy: h.changedBy,
      changedByName: h.changer ? `${h.changer.firstName} ${h.changer.lastName}` : '',
      changedByEmail: h.changer?.email || '',
      createdAt: h.createdAt
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch task history', error: error.message });
  }
};

const getTaskComments = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comments = await TaskComment.findAll({
      where: { taskId: id },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'ASC']]
    });

    const formatted = comments.map((entry) => ({
      id: entry.id,
      comment: entry.comment,
      userId: entry.userId,
      authorName: entry.author ? `${entry.author.firstName} ${entry.author.lastName}` : '',
      authorEmail: entry.author?.email || '',
      createdAt: entry.createdAt
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch comments', error: error.message });
  }
};

const addTaskComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
    if (!comment) return res.status(400).json({ success: false, message: 'Comment is required' });
    if (comment.length > 2000) {
      return res.status(400).json({ success: false, message: 'Comment must be 2000 characters or fewer' });
    }

    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const created = await TaskComment.create({
      taskId: task.id,
      userId: req.user.id,
      comment
    });

    const withAuthor = await TaskComment.findByPk(created.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      data: {
        id: withAuthor.id,
        comment: withAuthor.comment,
        userId: withAuthor.userId,
        authorName: withAuthor.author ? `${withAuthor.author.firstName} ${withAuthor.author.lastName}` : '',
        authorEmail: withAuthor.author?.email || '',
        createdAt: withAuthor.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskHistory,
  getTaskComments,
  addTaskComment
};
