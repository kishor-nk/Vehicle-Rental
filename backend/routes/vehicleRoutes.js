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
            "SELECT * FROM vehicles ORDER BY id DESC"
        );

        res.json(vehicles);
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to fetch vehicles"
        });
    }
});

router.get("/search", async (req, res) => {
    try {
        const { q, type } = req.query;

        let sql = "SELECT * FROM vehicles WHERE 1=1";
        const values = [];

        if (q) {
            sql += " AND (name LIKE ? OR brand LIKE ?)";
            values.push(`%${q}%`, `%${q}%`);
        }

        if (type) {
            sql += " AND type = ?";
            values.push(type);
        }

        sql += " ORDER BY id DESC";

        const [vehicles] = await db.query(sql, values);

        res.json(vehicles);
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Search failed"
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
        console.error(error.message);

        res.status(500).json({
            message: "Failed to fetch vehicle"
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
                description
            } = req.body;

            if (!name || !brand || !type || !price_per_day) {
                return res.status(400).json({
                    message:
                        "Name, brand, type and price are required"
                });
            }

            const [result] = await db.query(
                `INSERT INTO vehicles
                (name, brand, type, price_per_day, image, description)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    name.trim(),
                    brand.trim(),
                    type,
                    price_per_day,
                    image || null,
                    description || null
                ]
            );

            res.status(201).json({
                message: "Vehicle added successfully",
                vehicleId: result.insertId
            });
        } catch (error) {
            console.error(error.message);

            res.status(500).json({
                message: "Failed to add vehicle"
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
                available
            } = req.body;

            if (!name || !brand || !type || !price_per_day) {
                return res.status(400).json({
                    message:
                        "Name, brand, type and price are required"
                });
            }

            const [result] = await db.query(
                `UPDATE vehicles
                SET name = ?,
                    brand = ?,
                    type = ?,
                    price_per_day = ?,
                    image = ?,
                    description = ?,
                    available = ?
                WHERE id = ?`,
                [
                    name.trim(),
                    brand.trim(),
                    type,
                    price_per_day,
                    image || null,
                    description || null,
                    available ? 1 : 0,
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
            console.error(error.message);

            res.status(500).json({
                message: "Failed to update vehicle"
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
            console.error(error.message);

            res.status(500).json({
                message: "Failed to delete vehicle"
            });
        }
    }
);

module.exports = router;