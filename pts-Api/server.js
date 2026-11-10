const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const db = require('./models');
const routes = require('./routes');
const { DataTypes } = require('sequelize');

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api', routes);

// Sync DB (excluding documents table as we'll create it manually)
db.sequelize.sync({ force: false })
  .then(async () => {
    const queryInterface = db.sequelize.getQueryInterface();
    const employeeTable = await queryInterface.describeTable('employees');
    if (!employeeTable.visaRenewalRequested) {
      await queryInterface.addColumn('employees', 'visaRenewalRequested', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('🧩 Added employees.visaRenewalRequested column');
    }
    const taskTable = await queryInterface.describeTable('tasks');
    if (!taskTable.dueTime) {
      await queryInterface.addColumn('tasks', 'dueTime', {
        type: DataTypes.STRING(5),
        allowNull: true
      });
      console.log('🧩 Added tasks.dueTime column');
    }
    console.log('🛠️ Database synced!');
  })
  .catch(err => {
    console.error('❌ Failed to sync database:', err);
  });


  // Serve frontend build
app.use(express.static(path.join(__dirname, 'dist')));
app.get(/^\/(?!api|api-docs).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      console.error(`Error serving index.html: ${err.message}`);
      res.status(500).send("Server error");
    }
  });
});

// Define a simple route
app.get('/', (req, res) => {
  res.send('PTS Node.js server is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
