import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  TimePicker,
  Timeline,
  Tag,
  Typography,
  message
} from 'antd';
import { CommentOutlined, DeleteOutlined, EditOutlined, HistoryOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { apiClient } from '../config/api';
import { getCurrentUser, getCurrentUserRole } from '../utils/auth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PageBanner from '../components/PageBanner';

dayjs.extend(customParseFormat);

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const formatDueLabel = (task) => {
  const date = task.dueDate ? dayjs(task.dueDate).format('DD/MM/YYYY') : '';
  const time = task.dueTime ? String(task.dueTime).slice(0, 5) : '';
  return [date, time].filter(Boolean).join(' ');
};

const STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITY_COLORS = { High: 'red', Medium: 'orange', Low: 'green' };

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [taskHistory, setTaskHistory] = useState([]);
  const [historyTaskTitle, setHistoryTaskTitle] = useState('');
  const [commentTask, setCommentTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const boardRef = useRef(null);
  const [form] = Form.useForm();
  const role = getCurrentUserRole();
  const currentUserId = getCurrentUser()?.id;
  const canManageAll = ['HR Manager', 'Super Admin', 'System Admin'].includes(role);
  const canManageTask = (task) =>
    canManageAll || task.userId === currentUserId || task.createdBy === currentUserId;

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/tasks');
      if (res.data?.success) setTasks(res.data.data || []);
    } catch (error) {
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!canManageAll) return;
    try {
      const res = await apiClient.get('/users');
      if (res.data?.data) {
        const employeeUsers = res.data.data.filter((u) => u.role === 'Employee');
        setUsers(employeeUsers.map((u) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName} (${u.email})`
        })));
      }
    } catch (error) {
      message.error('Failed to load users');
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [canManageAll]);

  const groupedTasks = useMemo(
    () => STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter((t) => t.status === s) }), {}),
    [tasks]
  );

  const openCreateModal = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({ status: 'Pending', priority: 'Medium' });
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      userId: task.userId,
      dueDate: task.dueDate ? dayjs(task.dueDate) : null,
      dueTime: task.dueTime ? dayjs(String(task.dueTime).slice(0, 5), 'HH:mm') : null
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        title: values.title,
        description: values.description || null,
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
        dueTime: values.dueTime ? values.dueTime.format('HH:mm') : null,
        userId: values.userId
      };
      if (editingTask) {
        await apiClient.put(`/tasks/${editingTask.id}`, payload);
        message.success('Task updated');
      } else {
        await apiClient.post('/tasks', payload);
        message.success('Task created');
      }
      setModalOpen(false);
      fetchTasks();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save task');
    }
  };

  const onDropToStatus = async (status) => {
    if (!draggedTaskId) return;
    try {
      await apiClient.patch(`/tasks/${draggedTaskId}/status`, { status });
      setDraggedTaskId(null);
      fetchTasks();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to move task');
    }
  };

  const deleteTask = async (id) => {
    try {
      await apiClient.delete(`/tasks/${id}`);
      message.success('Task deleted');
      fetchTasks();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const openHistory = async (task) => {
    try {
      setHistoryTaskTitle(task.title);
      setHistoryOpen(true);
      setHistoryLoading(true);
      const res = await apiClient.get(`/tasks/${task.id}/history`);
      if (res.data?.success) setTaskHistory(res.data.data || []);
    } catch (error) {
      message.error('Failed to load task history');
      setTaskHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openComments = async (task) => {
    setCommentTask(task);
    setCommentText('');
    setComments([]);
    setCommentsLoading(true);
    try {
      const res = await apiClient.get(`/tasks/${task.id}/comments`);
      if (res.data?.success) setComments(res.data.data || []);
    } catch (error) {
      message.error('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const postComment = async () => {
    const text = commentText.trim();
    if (!commentTask || !text) return;
    try {
      setPostingComment(true);
      const res = await apiClient.post(`/tasks/${commentTask.id}/comments`, { comment: text });
      if (res.data?.success) {
        setComments((prev) => [...prev, res.data.data]);
        setCommentText('');
        setTasks((prev) => prev.map((task) => (
          task.id === commentTask.id
            ? { ...task, commentCount: (task.commentCount || 0) + 1 }
            : task
        )));
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setPostingComment(false);
    }
  };

  const exportBoardAsImage = async () => {
    try {
      if (!boardRef.current) return;
      const canvas = await html2canvas(boardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imageUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `task-board-${dayjs().format('YYYYMMDD-HHmmss')}.png`;
      link.click();
      message.success('Task board exported as image');
    } catch (error) {
      message.error('Failed to export image');
    }
  };

  const exportBoardAsPdf = async () => {
    try {
      if (!boardRef.current) return;
      const canvas = await html2canvas(boardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let y = 5;
      let remainingHeight = imgHeight;

      pdf.addImage(imageData, 'PNG', 5, y, imgWidth, imgHeight);
      remainingHeight -= pageHeight - 10;

      while (remainingHeight > 0) {
        pdf.addPage();
        y = 5 - (imgHeight - remainingHeight);
        pdf.addImage(imageData, 'PNG', 5, y, imgWidth, imgHeight);
        remainingHeight -= pageHeight - 10;
      }

      pdf.save(`task-board-${dayjs().format('YYYYMMDD-HHmmss')}.pdf`);
      message.success('Task board exported as PDF');
    } catch (error) {
      message.error('Failed to export PDF');
    }
  };

  return (
    <div>
      <PageBanner
        label="Productivity"
        title="Task Manager"
        subtitle="Plan, assign, and track task progress across the team."
        actions={(
          <Space>
            <Button onClick={exportBoardAsImage}>Export as Image</Button>
            <Button onClick={exportBoardAsPdf}>Export as PDF</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Add Task
            </Button>
          </Space>
        )}
      />

      <Row gutter={16} ref={boardRef}>
        {STATUSES.map((status) => (
          <Col span={8} key={status}>
            <Card
              title={status}
              loading={loading}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropToStatus(status)}
              style={{ height: '70vh' }}
              bodyStyle={{ height: 'calc(70vh - 57px)', overflowY: 'auto', paddingRight: 8 }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {groupedTasks[status]?.map((task) => (
                  <Card
                    key={task.id}
                    size="small"
                    draggable={canManageTask(task)}
                    onDragStart={() => canManageTask(task) && setDraggedTaskId(task.id)}
                    title={task.title}
                    extra={(
                      <Space size={8}>
                        {task.status === 'Completed' && (
                          <span
                            title="Completed"
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: '#52c41a',
                              display: 'inline-block'
                            }}
                          />
                        )}
                        <Tag color={PRIORITY_COLORS[task.priority]}>{task.priority}</Tag>
                      </Space>
                    )}
                  >
                    {task.description && <Text type="secondary">{task.description}</Text>}
                    <div style={{ marginTop: 8 }}>
                      <Text strong>Assignee: </Text>
                      <Text>{task.assigneeName || task.assigneeEmail || '-'}</Text>
                    </div>
                    {formatDueLabel(task) && (
                      <div>
                        <Text strong>Due: </Text>
                        <Text>{formatDueLabel(task)}</Text>
                      </div>
                    )}
                    <Space style={{ marginTop: 10 }} wrap>
                      <Button size="small" icon={<CommentOutlined />} onClick={() => openComments(task)}>
                        Comments{task.commentCount ? ` (${task.commentCount})` : ''}
                      </Button>
                      <Button size="small" icon={<HistoryOutlined />} onClick={() => openHistory(task)}>
                        History
                      </Button>
                      {canManageTask(task) && (
                        <>
                          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(task)}>
                            Edit
                          </Button>
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => deleteTask(task.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Space>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={editingTask ? 'Edit Task' : 'Create Task'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter task title' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                <Select>
                  <Option value="Low">Low</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="High">High</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select>
                  {STATUSES.map((s) => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="dueDate" label="Due Date">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueTime" label="Due Time">
                <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={5} />
              </Form.Item>
            </Col>
          </Row>
          {canManageAll && (
            <Form.Item name="userId" label="Assign To">
              <Select allowClear placeholder="Select assignee">
                {users.map((u) => <Option key={u.value} value={u.value}>{u.label}</Option>)}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={`Task History - ${historyTaskTitle}`}
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
      >
        <Card loading={historyLoading} bordered={false}>
          <Timeline
            items={(taskHistory || []).map((h) => ({
              children: (
                <div>
                  <Text strong>{h.action}</Text>
                  <div><Text type="secondary">{h.details || '-'}</Text></div>
                  <div>
                    <Text type="secondary">
                      By {h.changedByName || h.changedByEmail || 'Unknown'} on {dayjs(h.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Text>
                  </div>
                </div>
              )
            }))}
          />
          {!historyLoading && (!taskHistory || taskHistory.length === 0) && (
            <Text type="secondary">No history records found.</Text>
          )}
        </Card>
      </Modal>

      <Modal
        title={`Comments - ${commentTask?.title || ''}`}
        open={!!commentTask}
        onCancel={() => setCommentTask(null)}
        footer={null}
        destroyOnClose
      >
        <Card loading={commentsLoading} bordered={false} bodyStyle={{ padding: 0 }}>
          <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
            {comments.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 12 }}>
                <Text strong>{entry.authorName || entry.authorEmail || 'Unknown'}</Text>
                <div><Text>{entry.comment}</Text></div>
                <Text type="secondary">{dayjs(entry.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
              </div>
            ))}
            {!commentsLoading && comments.length === 0 && (
              <Text type="secondary">No comments yet. Add a progress update below.</Text>
            )}
          </div>
          <TextArea
            rows={3}
            value={commentText}
            maxLength={2000}
            placeholder="Write a progress update"
            onChange={(e) => setCommentText(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                postComment();
              }
            }}
          />
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <Button type="primary" loading={postingComment} disabled={!commentText.trim()} onClick={postComment}>
              Post comment
            </Button>
          </div>
        </Card>
      </Modal>
    </div>
  );
};

export default TaskManager;
