const express = require("express");
const db = require("../db");
const {
    authenticateToken,
    requireAdmin
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [vehicles] = await db.query(
            "SELECT * FROM vehicles ORDER BY id ASC"
        );

        res.json(vehicles);
    } catch (error) {
        console.error("Fetch vehicles error:", error.message);

        res.status(500).json({
            message: "Unable to fetch vehicles"
        });
    }
});

router.get("/search", async (req, res) => {
    try {
        const { search = "", type = "" } = req.query;

        let query = `
            SELECT * FROM vehicles
            WHERE available = 1
        `;

        const params = [];

        if (search) {
            query += `
                AND (
                    name LIKE ?
                    OR brand LIKE ?
                    OR type LIKE ?
                )
            `;

            const searchValue = `%${search}%`;

            params.push(
                searchValue,
                searchValue,
                searchValue
            );
        }

        if (type) {
            query += " AND type = ?";
            params.push(type);
        }

        query += " ORDER BY id ASC";

        const [vehicles] = await db.query(
            query,
            params
        );

        res.json(vehicles);
    } catch (error) {
        console.error(
            "Vehicle search error:",
            error.message
        );

        res.status(500).json({
            message: "Unable to search vehicles"
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const [vehicles] = await db.query(
            "SELECT * FROM vehicles WHERE id = ?",
            [req.params.id]
        );

        if (vehicles.length === 0) {
            return res.status(404).json({
                message: "Vehicle not found"
            });
        }

        res.json(vehicles[0]);
    } catch (error) {
        console.error(
            "Fetch vehicle error:",
            error.message
        );

        res.status(500).json({
            message: "Unable to fetch vehicle"
        });
    }
});

router.post(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const {
                name,
                brand,
                type,
                price_per_day,
                image,
                description,
                available,
                seats,
                transmission,
                fuel,
                mileage,
                engine,
                power
            } = req.body;

            if (
                !name ||
                !brand ||
                !type ||
                !price_per_day
            ) {
                return res.status(400).json({
                    message:
                        "Required vehicle details are missing"
                });
            }

            const [result] = await db.query(
                `INSERT INTO vehicles
                (
                    name,
                    brand,
                    type,
                    price_per_day,
                    image,
                    description,
                    available,
                    seats,
                    transmission,
                    fuel,
                    mileage,
                    engine,
                    power
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name,
                    brand,
                    type,
                    price_per_day,
                    image || null,
                    description || null,
                    available ? 1 : 0,
                    seats || 5,
                    transmission || "Manual",
                    fuel || "Petrol",
                    mileage || "18 km/l",
                    engine || "1.2L",
                    power || "90 HP"
                ]
            );

            res.status(201).json({
                message: "Vehicle added successfully",
                vehicleId: result.insertId
            });
        } catch (error) {
            console.error(
                "Add vehicle error:",
                error.message
            );

            res.status(500).json({
                message: "Unable to add vehicle"
            });
        }
    }
);

router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const {
                name,
                brand,
                type,
                price_per_day,
                image,
                description,
                available,
                seats,
                transmission,
                fuel,
                mileage,
                engine,
                power
            } = req.body;

            if (
                !name ||
                !brand ||
                !type ||
                !price_per_day
            ) {
                return res.status(400).json({
                    message:
                        "Required vehicle details are missing"
                });
            }

            const [result] = await db.query(
                `UPDATE vehicles
                 SET
                    name = ?,
                    brand = ?,
                    type = ?,
                    price_per_day = ?,
                    image = ?,
                    description = ?,
                    available = ?,
                    seats = ?,
                    transmission = ?,
                    fuel = ?,
                    mileage = ?,
                    engine = ?,
                    power = ?
                 WHERE id = ?`,
                [
                    name,
                    brand,
                    type,
                    price_per_day,
                    image || null,
                    description || null,
                    available ? 1 : 0,
                    seats || 5,
                    transmission || "Manual",
                    fuel || "Petrol",
                    mileage || "18 km/l",
                    engine || "1.2L",
                    power || "90 HP",
                    req.params.id
                ]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Vehicle not found"
                });
            }

            res.json({
                message: "Vehicle updated successfully"
            });
        } catch (error) {
            console.error(
                "Update vehicle error:",
                error.message
            );

            res.status(500).json({
                message: "Unable to update vehicle"
            });
        }
    }
);

router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const [result] = await db.query(
                "DELETE FROM vehicles WHERE id = ?",
                [req.params.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Vehicle not found"
                });
            }

            res.json({
                message: "Vehicle deleted successfully"
            });
        } catch (error) {
            console.error(
                "Delete vehicle error:",
                error.message
            );

            res.status(500).json({
                message: "Unable to delete vehicle"
            });
        }
    }
);

module.exports = router;