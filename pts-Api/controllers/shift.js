const { Op } = require('sequelize');
const { Shift, User } = require('../models');

const isSuperAdmin = (role) => ['Super Admin', 'System Admin'].includes(role);

const formatShift = (shift) => ({
  id: shift.id,
  userId: shift.userId,
  employeeName: shift.employee ? `${shift.employee.firstName} ${shift.employee.lastName}` : '',
  employeeEmail: shift.employee?.email || '',
  shiftDate: shift.shiftDate,
  startTime: shift.startTime,
  endTime: shift.endTime,
  title: shift.title,
  notes: shift.notes,
  createdAt: shift.createdAt,
  updatedAt: shift.updatedAt
});

const getShifts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.shiftDate = { [Op.between]: [startDate, endDate] };
    }

    const shifts = await Shift.findAll({
      where,
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['shiftDate', 'ASC'], ['startTime', 'ASC']]
    });

    res.json({ success: true, data: shifts.map(formatShift) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch shifts', error: error.message });
  }
};

const createShift = async (req, res) => {
  try {
    const { shiftDate, startTime, endTime, title, notes, userId } = req.body;
    const superAdmin = isSuperAdmin(req.user?.role);
    const ownerId = superAdmin && userId ? userId : req.user.id;

    if (!shiftDate || !startTime || !endTime || !title) {
      return res.status(400).json({
        success: false,
        message: 'shiftDate, startTime, endTime, and title are required'
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const employee = await User.findByPk(ownerId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'User not found for this shift' });
    }

    const overlappingShift = await Shift.findOne({
      where: {
        userId: ownerId,
        shiftDate,
        [Op.and]: [
          { startTime: { [Op.lt]: endTime } },
          { endTime: { [Op.gt]: startTime } }
        ]
      }
    });

    if (overlappingShift) {
      return res.status(400).json({
        success: false,
        message: 'This user already has an overlapping shift in this time range'
      });
    }

    const shift = await Shift.create({
      userId: ownerId,
      shiftDate,
      startTime,
      endTime,
      title,
      notes: notes || null
    });

    const created = await Shift.findByPk(shift.id, {
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.status(201).json({ success: true, data: formatShift(created) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create shift', error: error.message });
  }
};

const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { shiftDate, startTime, endTime, title, notes, userId } = req.body;
    const superAdmin = isSuperAdmin(req.user?.role);

    const shift = await Shift.findByPk(id);
    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    if (!superAdmin && shift.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only Super Admin can edit other users shifts' });
    }

    const nextUserId = superAdmin && userId ? userId : shift.userId;
    const nextShiftDate = shiftDate || shift.shiftDate;
    const nextStartTime = startTime || shift.startTime;
    const nextEndTime = endTime || shift.endTime;

    if (nextStartTime >= nextEndTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const overlappingShift = await Shift.findOne({
      where: {
        id: { [Op.ne]: shift.id },
        userId: nextUserId,
        shiftDate: nextShiftDate,
        [Op.and]: [
          { startTime: { [Op.lt]: nextEndTime } },
          { endTime: { [Op.gt]: nextStartTime } }
        ]
      }
    });

    if (overlappingShift) {
      return res.status(400).json({
        success: false,
        message: 'This user already has an overlapping shift in this time range'
      });
    }

    await shift.update({
      userId: nextUserId,
      shiftDate: nextShiftDate,
      startTime: nextStartTime,
      endTime: nextEndTime,
      title: title ?? shift.title,
      notes: notes ?? shift.notes
    });

    const updated = await Shift.findByPk(shift.id, {
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.json({ success: true, data: formatShift(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update shift', error: error.message });
  }
};

const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const superAdmin = isSuperAdmin(req.user?.role);

    const shift = await Shift.findByPk(id);
    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    if (!superAdmin && shift.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only Super Admin can delete other users shifts' });
    }

    await shift.destroy();
    res.json({ success: true, message: 'Shift deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete shift', error: error.message });
  }
};

module.exports = {
  getShifts,
  createShift,
  updateShift,
  deleteShift
};
