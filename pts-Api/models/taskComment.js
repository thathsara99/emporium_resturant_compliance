module.exports = (sequelize, DataTypes) => {
  const TaskComment = sequelize.define('TaskComment', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    timestamps: true,
    tableName: 'task_comments'
  });

  TaskComment.associate = (models) => {
    TaskComment.belongsTo(models.Task, {
      foreignKey: 'taskId',
      as: 'task'
    });
    TaskComment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'author'
    });
  };

  return TaskComment;
};
