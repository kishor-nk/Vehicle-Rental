const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const cors = require("cors");
const db = require("./db");
const { verifyEmailConfig } = require("./emailService");

const vehicleRoutes = require("./routes/vehicleRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Vehicle Rental Backend is Running!"
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS connected");

        res.json({
            message: "MySQL connected successfully!",
            result: rows
        });
    } catch (error) {
        console.error("Database error:", error.message);

        res.status(500).json({
            message: "Database connection failed",
            error: error.message
        });
    }
});

app.use("/api/vehicles", vehicleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

async function startServer() {
    try {
        await db.query("SELECT 1");

        console.log("MySQL connected successfully!");

        await verifyEmailConfig();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MySQL connection failed!");
        console.error(error.message);
    }
}

startServer();