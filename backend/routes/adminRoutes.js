const express = require("express");
const db = require("../db");

const {
    authenticateToken,
    requireAdmin
} = require("../middleware/authMiddleware");

const {
    sendBookingStatusUpdate
} = require("../emailService");

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);


router.get("/stats", async (req, res) => {
    try {
        const [[users]] = await db.query(
            "SELECT COUNT(*) AS count FROM users"
        );

        const [[vehicles]] = await db.query(
            "SELECT COUNT(*) AS count FROM vehicles"
        );

        const [[bookings]] = await db.query(
            "SELECT COUNT(*) AS count FROM bookings"
        );

        const [[revenue]] = await db.query(
            `SELECT COALESCE(SUM(total_price), 0) AS total
             FROM bookings
             WHERE status IN ('confirmed', 'completed')`
        );

        res.json({
            users: users.count,
            vehicles: vehicles.count,
            bookings: bookings.count,
            revenue: Number(revenue.total)
        });

    } catch (error) {
        console.error("Stats error:", error.message);

        res.status(500).json({
            message: "Failed to fetch admin stats"
        });
    }
});


router.get("/bookings", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                b.*,
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

        res.json(rows);

    } catch (error) {
        console.error("Admin bookings error:", error.message);

        res.status(500).json({
            message: "Failed to fetch bookings"
        });
    }
});


router.put("/bookings/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = [
            "pending",
            "confirmed",
            "cancelled",
            "completed"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid booking status"
            });
        }

        const [bookings] = await db.query(
            `SELECT
                b.*,
                u.name AS user_name,
                u.email AS user_email,
                v.name AS vehicle_name,
                v.brand,
                v.type
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN vehicles v ON b.vehicle_id = v.id
             WHERE b.id = ?`,
            [req.params.id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const booking = bookings[0];

        const [result] = await db.query(
            `UPDATE bookings
             SET status = ?
             WHERE id = ?`,
            [
                status,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        booking.status = status;

        console.log(
            "Booking status updated:",
            booking.id,
            "→",
            status
        );

        console.log(
            "Sending status update email to:",
            booking.user_email
        );

        try {
            await sendBookingStatusUpdate(booking);

            console.log(
                "Booking status update email sent successfully!"
            );

        } catch (emailError) {
            console.error(
                "Booking status update email failed:",
                emailError.message
            );
        }

        res.json({
            message: "Booking status updated successfully",
            booking
        });

    } catch (error) {
        console.error("Status update error:", error.message);

        res.status(500).json({
            message: "Failed to update booking status"
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
        console.error("Admin users error:", error.message);

        res.status(500).json({
            message: "Failed to fetch users"
        });
    }
});


module.exports = router;