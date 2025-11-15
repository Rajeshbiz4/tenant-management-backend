const express = require("express");
const router = express.Router();
const { getClient, getDatabase } = require("../../config/database");
const myLogModule = require("../../utils/logger");
const { ObjectId } = require("mongodb");

function isValidObjectId(id) {
  return typeof id === "string" && ObjectId.isValid(id) && id.length === 24;
}

/**
 * @swagger
 * /unit/create:
 *   post:
 *     summary: Create a new unit (Flat, Shop, Hall, or Plot)
 *     tags:
 *       - Unit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - unitType
 *               - flatNo
 *               - area
 *               - rent
 *             properties:
 *               propertyId:
 *                 type: string
 *                 example: "650f1a2b3c4d5e6f7a8b9c0d"
 *               unitType:
 *                 type: string
 *                 enum: ["flat", "shop", "hall", "plot"]
 *                 example: "flat"
 *               flatNo:
 *                 type: string
 *                 example: "101"
 *               area:
 *                 type: number
 *                 example: 1200
 *               rent:
 *                 type: number
 *                 example: 25000
 *               description:
 *                 type: string
 *                 example: "3 BHK apartment with balcony"
 *               rentalStatus:
 *                 type: string
 *                 enum: ["available", "rented"]
 *                 example: "available"
 *               maintenance:
 *                 type: number
 *                 example: 5000
 *               lightBill:
 *                 type: number
 *                 example: 500
 *               rentObject:
 *                 type: object
 *                 properties:
 *                   tenantId:
 *                     type: string
 *                   tenantName:
 *                     type: string
 *                   rentStartDate:
 *                     type: string
 *                     format: date
 *                   rentEndDate:
 *                     type: string
 *                     format: date
 *                   securityDeposit:
 *                     type: number
 *                 example:
 *                   tenantId: "650f1a2b3c4d5e6f7a8b9c0d"
 *                   tenantName: "John Doe"
 *                   rentStartDate: "2025-01-01"
 *                   rentEndDate: "2026-01-01"
 *                   securityDeposit: 50000
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["balcony", "parking", "garden"]
 *     responses:
 *       201:
 *         description: Unit created successfully
 *       400:
 *         description: Missing required fields or invalid propertyId
 *       409:
 *         description: Unit already exists
 *       500:
 *         description: Server error
 */
router.post("/create", async (req, res) => {
  myLogModule.info("UnitController - create", req.body);

  const { propertyId, unitType, flatNo, area, rent, description, rentalStatus, maintenance, lightBill, rentObject, features } = req.body || {};

  if (!propertyId || !unitType || !flatNo || !area || !rent) {
    return res.status(400).json({
      error: true,
      message: "Missing required fields: propertyId, unitType, flatNo, area, rent"
    });
  }

  if (!ObjectId.isValid(propertyId)) {
    return res.status(400).json({ error: true, message: "Invalid propertyId" });
  }

  if (!["flat", "shop", "hall", "plot"].includes(unitType.toLowerCase())) {
    return res.status(400).json({ error: true, message: "unitType must be: flat, shop, hall, or plot" });
  }

  if (rentalStatus && !["available", "rented"].includes(rentalStatus)) {
    return res.status(400).json({ error: true, message: "rentalStatus must be: available or rented" });
  }

  const payload = {
    propertyId: new ObjectId(propertyId),
    unitType: String(unitType).toLowerCase(),
    flatNo: String(flatNo).trim(),
    area: parseFloat(area) || 0,
    rent: parseFloat(rent) || 0,
    description: description ? String(description).trim() : null,
    rentalStatus: rentalStatus || "available",
    maintenance: parseFloat(maintenance) || 0,
    lightBill: parseFloat(lightBill) || 0,
    rentObject: rentObject && typeof rentObject === "object" ? {
      tenantId: rentObject.tenantId ? new ObjectId(rentObject.tenantId) : null,
      tenantName: rentObject.tenantName ? String(rentObject.tenantName).trim() : null,
      rentStartDate: rentObject.rentStartDate ? new Date(rentObject.rentStartDate) : null,
      rentEndDate: rentObject.rentEndDate ? new Date(rentObject.rentEndDate) : null,
      securityDeposit: rentObject.securityDeposit ? parseFloat(rentObject.securityDeposit) : 0
    } : null,
    features: Array.isArray(features) ? features : [],
    created_at: new Date(),
    updated_at: new Date()
  };

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();

    const existingUnit = await dbo.collection("units").findOne({
      propertyId: new ObjectId(propertyId),
      flatNo: payload.flatNo,
      unitType: payload.unitType
    });

    if (existingUnit) {
      return res.status(409).json({ error: true, message: "Unit with this flat number already exists in this property" });
    }

    const result = await dbo.collection("units").insertOne(payload);
    myLogModule.info("Unit created: " + payload.unitType + " " + payload.flatNo);

    res.status(201).json({
      message: "Unit created successfully",
      data: { id: result.insertedId, ...payload }
    });
  } catch (err) {
    myLogModule.error("Unit create error: " + err);
    res.status(500).json({ error: true, message: "Error creating unit", details: err.message });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /unit/list:
 *   get:
 *     summary: Get list of units with pagination and filters
 *     tags:
 *       - Unit
 *     parameters:
 *       - name: from
 *         in: query
 *         type: integer
 *         example: 1
 *         description: Page number
 *       - name: size
 *         in: query
 *         type: integer
 *         example: 10
 *         description: Items per page
 *       - name: propertyId
 *         in: query
 *         type: string
 *         example: "650f1a2b3c4d5e6f7a8b9c0d"
 *         description: Filter by property
 *       - name: unitType
 *         in: query
 *         type: string
 *         enum: ["flat", "shop", "hall", "plot"]
 *         description: Filter by unit type
 *       - name: rentalStatus
 *         in: query
 *         type: string
 *         enum: ["available", "rented"]
 *         description: Filter by rental status
 *     responses:
 *       200:
 *         description: List of units
 *       400:
 *         description: Invalid filter parameters
 *       500:
 *         description: Server error
 */
router.get("/list", async (req, res) => {
  myLogModule.info("UnitController - list", req.query);

  const pageNo = Math.max(parseInt(req.query.from) || 1, 1);
  const size = Math.max(parseInt(req.query.size) || 10, 1);
  const { propertyId, unitType, rentalStatus } = req.query;

  const filter = {};

  if (propertyId) {
    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({ error: true, message: "Invalid propertyId" });
    }
    filter.propertyId = new ObjectId(propertyId);
  }

  if (unitType) {
    if (!["flat", "shop", "hall", "plot"].includes(unitType.toLowerCase())) {
      return res.status(400).json({ error: true, message: "Invalid unitType" });
    }
    filter.unitType = unitType.toLowerCase();
  }

  if (rentalStatus) {
    if (!["available", "rented"].includes(rentalStatus)) {
      return res.status(400).json({ error: true, message: "Invalid rentalStatus" });
    }
    filter.rentalStatus = rentalStatus;
  }

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();

    const skip = size * (pageNo - 1);
    const total = await dbo.collection("units").countDocuments(filter);
    const data = await dbo.collection("units").find(filter).skip(skip).limit(size).toArray();

    res.status(200).json({
      success: true,
      data,
      pagination: { page: pageNo, size, total, totalPages: Math.ceil(total / size) }
    });
  } catch (err) {
    myLogModule.error("Unit list error: " + err);
    res.status(500).json({ error: true, message: "Error fetching units", details: err.message });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /unit/{id}:
 *   get:
 *     summary: Get unit by id
 *     tags:
 *       - Unit
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *         example: "650f1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: Unit details
 *       400:
 *         description: Invalid unit id
 *       404:
 *         description: Unit not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  if (!isValidObjectId(id)) return res.status(400).json({ error: true, message: "Invalid unit id" });

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();
    const unit = await dbo.collection("units").findOne({ _id: new ObjectId(id) });

    if (!unit) return res.status(404).json({ error: true, message: "Unit not found" });
    res.status(200).json({ data: unit });
  } catch (err) {
    myLogModule.error("Get unit error: " + err);
    res.status(500).json({ error: true, message: "Error fetching unit", details: err.message });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /unit/update:
 *   put:
 *     summary: Update unit details
 *     tags:
 *       - Unit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 example: "650f1a2b3c4d5e6f7a8b9c0d"
 *               flatNo:
 *                 type: string
 *               area:
 *                 type: number
 *               rent:
 *                 type: number
 *               description:
 *                 type: string
 *               rentalStatus:
 *                 type: string
 *                 enum: ["available", "rented"]
 *               maintenance:
 *                 type: number
 *               lightBill:
 *                 type: number
 *               rentObject:
 *                 type: object
 *                 properties:
 *                   tenantId:
 *                     type: string
 *                   tenantName:
 *                     type: string
 *                   rentStartDate:
 *                     type: string
 *                     format: date
 *                   rentEndDate:
 *                     type: string
 *                     format: date
 *                   securityDeposit:
 *                     type: number
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *       400:
 *         description: Invalid unit id or status
 *       404:
 *         description: Unit not found
 *       500:
 *         description: Server error
 */
router.put("/update", async (req, res) => {
  myLogModule.info("UnitController - update", req.body);

  const { id, flatNo, area, rent, description, rentalStatus, maintenance, lightBill, rentObject, features } = req.body || {};

  if (!isValidObjectId(id)) return res.status(400).json({ error: true, message: "Invalid unit id" });

  if (rentalStatus && !["available", "rented"].includes(rentalStatus)) {
    return res.status(400).json({ error: true, message: "Invalid rentalStatus value" });
  }

  const updates = { updated_at: new Date() };

  if (flatNo) updates.flatNo = String(flatNo).trim();
  if (area !== undefined) updates.area = parseFloat(area) || 0;
  if (rent !== undefined) updates.rent = parseFloat(rent) || 0;
  if (description) updates.description = String(description).trim();
  if (rentalStatus) updates.rentalStatus = rentalStatus;
  if (maintenance !== undefined) updates.maintenance = parseFloat(maintenance) || 0;
  if (lightBill !== undefined) updates.lightBill = parseFloat(lightBill) || 0;
  if (rentObject && typeof rentObject === "object") {
    updates.rentObject = {
      tenantId: rentObject.tenantId ? new ObjectId(rentObject.tenantId) : null,
      tenantName: rentObject.tenantName ? String(rentObject.tenantName).trim() : null,
      rentStartDate: rentObject.rentStartDate ? new Date(rentObject.rentStartDate) : null,
      rentEndDate: rentObject.rentEndDate ? new Date(rentObject.rentEndDate) : null,
      securityDeposit: rentObject.securityDeposit ? parseFloat(rentObject.securityDeposit) : 0
    };
  }
  if (Array.isArray(features)) updates.features = features;

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();
    const result = await dbo.collection("units").updateOne({ _id: new ObjectId(id) }, { $set: updates });

    if (result.matchedCount === 0) return res.status(404).json({ error: true, message: "Unit not found" });
    res.status(200).json({ message: "Unit updated successfully", modifiedCount: result.modifiedCount });
  } catch (err) {
    myLogModule.error("Unit update error: " + err);
    res.status(500).json({ error: true, message: "Error updating unit", details: err.message });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /unit/delete:
 *   delete:
 *     summary: Delete unit
 *     tags:
 *       - Unit
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         type: string
 *         example: "650f1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: Unit deleted successfully
 *       400:
 *         description: Invalid unit id
 *       404:
 *         description: Unit not found
 *       500:
 *         description: Server error
 */
router.delete("/delete", async (req, res) => {
  const id = req.query.id;
  if (!isValidObjectId(id)) return res.status(400).json({ error: true, message: "Invalid unit id" });

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();
    const result = await dbo.collection("units").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return res.status(404).json({ error: true, message: "Unit not found" });
    res.status(200).json({ message: "Unit deleted successfully", deletedCount: result.deletedCount });
  } catch (err) {
    myLogModule.error("Unit delete error: " + err);
    res.status(500).json({ error: true, message: "Error deleting unit", details: err.message });
  } finally {
    if (client) await client.close();
  }
});

module.exports = router;