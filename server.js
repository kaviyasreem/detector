"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./db/database");
const websocket_1 = require("./services/websocket");
const auth_1 = __importDefault(require("./routes/auth"));
const complaints_1 = __importDefault(require("./routes/complaints"));
const masterIssues_1 = __importDefault(require("./routes/masterIssues"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const auditLogs_1 = __importDefault(require("./routes/auditLogs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve Uploaded Files
const uploadsPath = path_1.default.resolve(__dirname, '../uploads');
app.use('/uploads', express_1.default.static(uploadsPath));
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/complaints', complaints_1.default);
app.use('/api/master-issues', masterIssues_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/audit-logs', auditLogs_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        institution: 'KPR ARTS AND SCIENCE COLLEGE',
        application: 'Smart Complaint Management System',
        timestamp: new Date().toISOString()
    });
});
const server = http_1.default.createServer(app);
// Initialize DB and WebSockets
(0, database_1.initDatabase)()
    .then(() => {
    (0, websocket_1.initWebSocketServer)(server);
    server.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`  KPRCAS SMART COMPLAINT MANAGEMENT SYSTEM BACKEND  `);
        console.log(`  Server running on http://localhost:${PORT}        `);
        console.log(`  WebSocket live updates initialized                `);
        console.log(`====================================================`);
    });
})
    .catch((err) => {
    console.error('Failed to initialize database:', err);
});
