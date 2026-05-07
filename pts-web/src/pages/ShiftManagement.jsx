import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Calendar,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  TimePicker,
  Typography,
  message
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../config/api';
import { getCurrentUser, getCurrentUserRole } from '../utils/auth';
import PageBanner from '../components/PageBanner';
import './ShiftManagement.css';

const { Title, Text } = Typography;

const formatClock = (timeString) => {
  if (!timeString) return '';
  return dayjs(`2000-01-01T${timeString}`).format('HH:mm');
};

const EMPLOYEE_SHIFT_COLORS = [
  '#9f6736',
  '#5f8f3b',
  '#2f6f8f',
  '#8b5fb0',
  '#c4493f',
  '#d18a2c'
];

const ShiftManagement = () => {
  const [form] = Form.useForm();
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const currentUser = getCurrentUser();
  const currentRole = getCurrentUserRole();
  const isSuperAdmin = ['Super Admin', 'System Admin'].includes(currentRole);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/shifts');
      if (response.data?.success) {
        setShifts(response.data.data || []);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isSuperAdmin) return;
    try {
      const response = await apiClient.get('/users');
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data?.data) {
        setUsers(response.data.data);
      }
    } catch (error) {
      message.warning('Could not load user list for assigning shifts');
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchUsers();
  }, []);

  const groupedByDate = useMemo(() => {
    return shifts.reduce((acc, shift) => {
      const key = dayjs(shift.shiftDate).format('YYYY-MM-DD');
      if (!acc[key]) acc[key] = [];
      acc[key].push(shift);
      return acc;
    }, {});
  }, [shifts]);

  const shiftsForSelectedDate = useMemo(() => {
    const key = selectedDate.format('YYYY-MM-DD');
    return (groupedByDate[key] || []).map((shift) => ({
      ...shift,
      key: shift.id
    }));
  }, [groupedByDate, selectedDate]);

  const canManageShift = (shift) => {
    return isSuperAdmin || shift.userId === currentUser?.id;
  };

  const getEmployeeColor = (userId) => {
    const safeId = Number(userId) || 0;
    return EMPLOYEE_SHIFT_COLORS[safeId % EMPLOYEE_SHIFT_COLORS.length];
  };

  const openCreate = () => {
    setEditingShift(null);
    form.resetFields();
    form.setFieldsValue({
      shiftDate: selectedDate,
      userId: currentUser?.id
    });
    setModalOpen(true);
  };

  const openEdit = (shift) => {
    if (!canManageShift(shift)) {
      message.warning('Only Super Admin can edit other users shifts');
      return;
    }
    setEditingShift(shift);
    form.setFieldsValue({
      shiftDate: dayjs(shift.shiftDate),
      timeRange: [
        dayjs(`2000-01-01T${shift.startTime}`),
        dayjs(`2000-01-01T${shift.endTime}`)
      ],
      title: shift.title,
      notes: shift.notes,
      userId: shift.userId
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    const [start, end] = values.timeRange || [];
    const payload = {
      shiftDate: values.shiftDate.format('YYYY-MM-DD'),
      startTime: start.format('HH:mm:ss'),
      endTime: end.format('HH:mm:ss'),
      title: values.title,
      notes: values.notes || null
    };

    if (isSuperAdmin && values.userId) {
      payload.userId = values.userId;
    }

    try {
      setSaving(true);
      if (editingShift) {
        await apiClient.put(`/shifts/${editingShift.id}`, payload);
        message.success('Shift updated successfully');
      } else {
        await apiClient.post('/shifts', payload);
        message.success('Shift added successfully');
      }
      setModalOpen(false);
      setEditingShift(null);
      form.resetFields();
      fetchShifts();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save shift');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (shift) => {
    if (!canManageShift(shift)) {
      message.warning('Only Super Admin can delete other users shifts');
      return;
    }
    try {
      await apiClient.delete(`/shifts/${shift.id}`);
      message.success('Shift deleted successfully');
      fetchShifts();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete shift');
    }
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (_, row) => (
        <div>
          <Text strong>{row.employeeName || 'Unknown'}</Text>
          <div>
            <Text type="secondary">{row.employeeEmail}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Shift',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <Tag color="gold">{text}</Tag>
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, row) => `${formatClock(row.startTime)} - ${formatClock(row.endTime)}`
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (text) => text || '-'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} disabled={!canManageShift(row)} onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this shift?"
            onConfirm={() => onDelete(row)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button type="link" danger icon={<DeleteOutlined />} disabled={!canManageShift(row)}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="shift-page">
      <PageBanner
        label="Operations"
        title="Shift Management"
        subtitle="Plan shifts in a shared calendar. Everyone can view all shifts, while only Super Admin can edit others."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Shift
          </Button>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <Card className="shift-calendar-card" bordered={false}>
            <Calendar
              fullscreen={false}
              value={selectedDate}
              onSelect={(date) => setSelectedDate(date)}
              dateCellRender={(date) => {
                const key = date.format('YYYY-MM-DD');
                const dayShifts = groupedByDate[key] || [];
                return (
                  <ul className="shift-cell-list">
                    {dayShifts.slice(0, 3).map((shift) => (
                      <li key={shift.id} className="shift-cell-item">
                        <span
                          className="shift-cell-dot"
                          style={{ backgroundColor: getEmployeeColor(shift.userId) }}
                        />
                        <span
                          className="shift-cell-time"
                          style={{ color: getEmployeeColor(shift.userId) }}
                        >
                          {formatClock(shift.startTime)}
                        </span>
                        <span className="shift-cell-title">{shift.employeeName || shift.title}</span>
                      </li>
                    ))}
                    {dayShifts.length > 3 && (
                      <li className="shift-cell-more">+{dayShifts.length - 3} more</li>
                    )}
                  </ul>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card className="shift-day-card" bordered={false}>
            <Title level={4} style={{ marginTop: 0 }}>
              {selectedDate.format('dddd, DD MMM YYYY')}
            </Title>
            <Text type="secondary">
              {shiftsForSelectedDate.length} shift(s) scheduled
            </Text>

            <Table
              style={{ marginTop: 12 }}
              columns={columns}
              dataSource={shiftsForSelectedDate}
              loading={loading}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 760, y: 360 }}
              className="shift-table"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingShift ? 'Edit Shift' : 'Add Shift'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingShift(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText={editingShift ? 'Update Shift' : 'Create Shift'}
      >
        <Form layout="vertical" form={form} onFinish={onSubmit}>
          <Form.Item
            name="userId"
            label="Employee"
            rules={[{ required: true, message: 'Please select an employee' }]}
            extra={!isSuperAdmin ? 'Only Super Admin can assign shifts to other employees.' : undefined}
          >
            <Select
              showSearch={isSuperAdmin}
              placeholder="Select employee"
              optionFilterProp="label"
              disabled={!isSuperAdmin}
              options={
                isSuperAdmin
                  ? users.map((u) => ({
                      value: u.id,
                      label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
                    }))
                  : [{
                      value: currentUser?.id,
                      label:
                        currentUser?.email ||
                        currentUser?.username ||
                        'My Shift'
                    }]
              }
            />
          </Form.Item>

          <Form.Item
            name="shiftDate"
            label="Shift Date"
            rules={[{ required: true, message: 'Please choose shift date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="Shift Time"
            rules={[{ required: true, message: 'Please select shift time' }]}
          >
            <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="title"
            label="Shift Title"
            rules={[{ required: true, message: 'Please enter shift title' }]}
          >
            <Input placeholder="Example: Breakfast Service" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Optional notes for this shift" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShiftManagement;
