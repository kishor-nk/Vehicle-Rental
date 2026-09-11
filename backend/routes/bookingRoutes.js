const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
    try {
        const { vehicle_id, start_date, end_date } = req.body;

        if (!vehicle_id || !start_date || !end_date) {
            return res.status(400).json({
                message: "Vehicle, start date and end date are required"
            });
        }

        const vehicleId = Number(vehicle_id);

        if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
            return res.status(400).json({
                message: "Invalid vehicle"
            });
        }

        const start = new Date(`${start_date}T00:00:00`);
        const end = new Date(`${end_date}T00:00:00`);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return res.status(400).json({
                message: "Start date cannot be in the past"
            });
        }

        if (end <= start) {
            return res.status(400).json({
                message: "End date must be after start date"
            });
        }

        const millisecondsPerDay = 1000 * 60 * 60 * 24;

        const days = Math.ceil(
            (end.getTime() - start.getTime()) /
            millisecondsPerDay
        );

        if (days <= 0) {
            return res.status(400).json({
                message: "Invalid rental period"
            });
        }

        const [vehicles] = await db.query(
            `SELECT *
             FROM vehicles
             WHERE id = ?
             AND available = 1`,
            [vehicleId]
        );

        if (vehicles.length === 0) {
            return res.status(404).json({
                message: "Vehicle not found or unavailable"
            });
        }

        const vehicle = vehicles[0];

        const [conflictingBookings] = await db.query(
            `SELECT id
             FROM bookings
             WHERE vehicle_id = ?
             AND status IN ('pending', 'confirmed')
             AND start_date < ?
             AND end_date > ?`,
            [vehicleId, end_date, start_date]
        );

        if (conflictingBookings.length > 0) {
            return res.status(409).json({
                message: "Vehicle is already booked for these dates"
            });
        }

        const pricePerDay = Number(vehicle.price_per_day);

        if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) {
            return res.status(500).json({
                message: "Vehicle has an invalid rental price"
            });
        }

        const totalPrice = days * pricePerDay;

        const [result] = await db.query(
            `INSERT INTO bookings
             (user_id, vehicle_id, start_date, end_date, total_price, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                vehicleId,
                start_date,
                end_date,
                totalPrice,
                "confirmed"
            ]
        );

        res.status(201).json({
            message: "Booking created successfully",
            booking: {
                id: result.insertId,
                vehicle_id: vehicleId,
                vehicle_name: vehicle.name,
                start_date,
                end_date,
                days,
                price_per_day: pricePerDay,
                total_price: totalPrice,
                status: "confirmed"
            }
        });
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to create booking"
        });
    }
});


router.get("/my", authenticateToken, async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT
                b.id,
                b.start_date,
                b.end_date,
                b.total_price,
                b.status,
                b.created_at,
                v.name AS vehicle_name,
                v.brand,
                v.type,
                v.image
             FROM bookings b
             JOIN vehicles v
             ON b.vehicle_id = v.id
             WHERE b.user_id = ?
             ORDER BY b.created_at DESC`,
            [req.user.id]
        );

        res.json(bookings);
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to fetch bookings"
        });
    }
});


router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const bookingId = Number(req.params.id);

        if (!Number.isInteger(bookingId) || bookingId <= 0) {
            return res.status(400).json({
                message: "Invalid booking ID"
            });
        }

        const [bookings] = await db.query(
            `SELECT
                b.*,
                v.name AS vehicle_name,
                v.brand,
                v.type,
                v.price_per_day,
                v.image
             FROM bookings b
             JOIN vehicles v
             ON b.vehicle_id = v.id
             WHERE b.id = ?
             AND b.user_id = ?`,
            [bookingId, req.user.id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json(bookings[0]);
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to fetch booking"
        });
    }
});


router.put("/:id/cancel", authenticateToken, async (req, res) => {
    try {
        const bookingId = Number(req.params.id);

        if (!Number.isInteger(bookingId) || bookingId <= 0) {
            return res.status(400).json({
                message: "Invalid booking ID"
            });
        }

        const [result] = await db.query(
            `UPDATE bookings
             SET status = 'cancelled'
             WHERE id = ?
             AND user_id = ?
             AND status IN ('pending', 'confirmed')`,
            [bookingId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Booking not found or cannot be cancelled"
            });
        }

        res.json({
            message: "Booking cancelled successfully"
        });
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to cancel booking"
        });
    }
});

module.exports = router;