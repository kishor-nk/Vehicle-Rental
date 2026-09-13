const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/authMiddleware");

const {
    sendBookingConfirmation,
    sendBookingCancellation
} = require("../emailService");

const router = express.Router();

const pickupLocations = [
    "Gachibowli",
    "Hitech City",
    "Secunderabad",
    "Hyderabad Airport"
];

router.post("/", authenticateToken, async (req, res) => {
    try {
        const {
            vehicle_id,
            start_date,
            end_date,
            pickup_location
        } = req.body;

        if (!vehicle_id || !start_date || !end_date || !pickup_location) {
            return res.status(400).json({
                message: "All booking details are required"
            });
        }

        if (!pickupLocations.includes(pickup_location)) {
            return res.status(400).json({
                message: "Invalid pickup location"
            });
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        if (startDate < today) {
            return res.status(400).json({
                message: "Pickup date cannot be in the past"
            });
        }

        if (endDate <= startDate) {
            return res.status(400).json({
                message: "Return date must be after pickup date"
            });
        }

        const [vehicles] = await db.query(
            "SELECT * FROM vehicles WHERE id = ? AND available = 1",
            [vehicle_id]
        );

        if (vehicles.length === 0) {
            return res.status(404).json({
                message: "Vehicle is not available"
            });
        }

        const [overlappingBookings] = await db.query(
            `SELECT id
             FROM bookings
             WHERE vehicle_id = ?
             AND status IN ('pending', 'confirmed')
             AND start_date < ?
             AND end_date > ?`,
            [
                vehicle_id,
                end_date,
                start_date
            ]
        );

        if (overlappingBookings.length > 0) {
            return res.status(409).json({
                message: "Vehicle is already booked for these dates"
            });
        }

        const millisecondsPerDay = 1000 * 60 * 60 * 24;

        const days = Math.ceil(
            (endDate - startDate) / millisecondsPerDay
        );

        const totalPrice =
            days * Number(vehicles[0].price_per_day);

        const [result] = await db.query(
            `INSERT INTO bookings
            (
                user_id,
                vehicle_id,
                start_date,
                end_date,
                pickup_location,
                total_price,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, 'confirmed')`,
            [
                req.user.id,
                vehicle_id,
                start_date,
                end_date,
                pickup_location,
                totalPrice
            ]
        );

        const [bookings] = await db.query(
            `SELECT
                b.*,
                u.name AS user_name,
                u.email AS user_email,
                v.name AS vehicle_name,
                v.brand,
                v.type,
                v.price_per_day,
                v.image,
                v.description
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN vehicles v ON b.vehicle_id = v.id
             WHERE b.id = ?`,
            [result.insertId]
        );

        const booking = bookings[0];

        console.log("Booking created:", booking.id);
        console.log("Sending confirmation email to:", booking.user_email);

        try {
            await sendBookingConfirmation(booking);
            console.log("Booking confirmation email sent successfully!");
        } catch (emailError) {
            console.error(
                "Booking confirmation email failed:",
                emailError.message
            );
        }

        res.status(201).json({
            message: "Booking confirmed successfully",
            booking
        });

    } catch (error) {
        console.error("Booking creation error:", error.message);

        res.status(500).json({
            message: "Unable to create booking"
        });
    }
});


router.get("/my", authenticateToken, async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT
                b.*,
                v.name AS vehicle_name,
                v.brand,
                v.type,
                v.price_per_day,
                v.image,
                v.description
             FROM bookings b
             JOIN vehicles v ON b.vehicle_id = v.id
             WHERE b.user_id = ?
             ORDER BY b.created_at DESC`,
            [req.user.id]
        );

        res.json(bookings);

    } catch (error) {
        console.error("Fetch bookings error:", error.message);

        res.status(500).json({
            message: "Unable to fetch bookings"
        });
    }
});


router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT
                b.*,
                v.name AS vehicle_name,
                v.brand,
                v.type,
                v.price_per_day,
                v.image,
                v.description
             FROM bookings b
             JOIN vehicles v ON b.vehicle_id = v.id
             WHERE b.id = ?
             AND b.user_id = ?`,
            [
                req.params.id,
                req.user.id
            ]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json(bookings[0]);

    } catch (error) {
        console.error("Fetch booking error:", error.message);

        res.status(500).json({
            message: "Unable to fetch booking"
        });
    }
});


router.put("/:id/cancel", authenticateToken, async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT
                b.*,
                u.name AS user_name,
                u.email AS user_email,
                v.name AS vehicle_name
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN vehicles v ON b.vehicle_id = v.id
             WHERE b.id = ?
             AND b.user_id = ?`,
            [
                req.params.id,
                req.user.id
            ]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const booking = bookings[0];

        if (
            booking.status !== "pending" &&
            booking.status !== "confirmed"
        ) {
            return res.status(400).json({
                message: "This booking cannot be cancelled"
            });
        }

        await db.query(
            `UPDATE bookings
             SET status = 'cancelled'
             WHERE id = ?
             AND user_id = ?`,
            [
                req.params.id,
                req.user.id
            ]
        );

        booking.status = "cancelled";

        console.log(
            "Sending cancellation email to:",
            booking.user_email
        );

        try {
            await sendBookingCancellation(booking);
            console.log("Cancellation email sent successfully!");
        } catch (emailError) {
            console.error(
                "Cancellation email failed:",
                emailError.message
            );
        }

        res.json({
            message: "Booking cancelled successfully"
        });

    } catch (error) {
        console.error("Cancel booking error:", error.message);

        res.status(500).json({
            message: "Unable to cancel booking"
        });
    }
});


module.exports = router;