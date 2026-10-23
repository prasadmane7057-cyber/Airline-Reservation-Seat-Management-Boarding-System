const app = require('./app');
const dotenv = require('dotenv');
const { memoryDB, isConnectedToMySQL, initialConnectionCheck } = require('./config/db');
const { initializeUserCsvStore } = require('./utils/csvUserStore');

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  await initialConnectionCheck;
  if (!isConnectedToMySQL()) {
    await initializeUserCsvStore(memoryDB);
    console.log('🗃️ User accounts will persist in the configured CSV file.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Airline Reservation Backend Server is running on port ${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(error => {
  console.error('Failed to initialize the airline backend:', error);
  process.exitCode = 1;
});
