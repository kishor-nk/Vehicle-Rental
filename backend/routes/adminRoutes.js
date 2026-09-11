const express = require("express");
const db = require("../db");
const {
    authenticateToken,
    requireAdmin
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/stats", async (req, res) => {
    try {
        const [[vehicleCount]] = await db.query(
            "SELECT COUNT(*) AS count FROM vehicles"
        );

        const [[userCount]] = await db.query(
            "SELECT COUNT(*) AS count FROM users"
        );

        const [[bookingCount]] = await db.query(
            "SELECT COUNT(*) AS count FROM bookings"
        );

        const [[revenue]] = await db.query(
            `SELECT COALESCE(SUM(total_price), 0) AS total
             FROM bookings
             WHERE status IN ('confirmed', 'completed')`
        );

        res.json({
            vehicles: vehicleCount.count,
            users: userCount.count,
            bookings: bookingCount.count,
            revenue: revenue.total
        });
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to fetch statistics"
        });
    }
});

router.get("/bookings", async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT
                b.id,
                b.start_date,
                b.end_date,
                b.total_price,
                b.status,
                b.created_at,
                u.name AS user_name,
                u.email AS user_email,
                v.name AS vehicle_name,
                v.brand,
                v.type
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN vehicles v ON b.vehicle_id = v.id
             ORDER BY b.created_at DESC`
        );

        res.json(bookings);
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to fetch bookings"
        });
    }
});

router.put("/bookings/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "confirmed",
            "cancelled",
            "completed"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid booking status"
            });
        }

        const [result] = await db.query(
            `UPDATE bookings
             SET status = ?
             WHERE id = ?`,
            [status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json({
            message: "Booking status updated successfully"
        });
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to update booking"
        });
    }
});

router.get("/users", async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT
                id,
                name,
                email,
                role,
                created_at
             FROM users
             ORDER BY created_at DESC`
        );

        res.json(users);
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to fetch users"
        });
    }
});

module.exports = router;