const express = require("express");
const router = express.Router();
const { getClient, getDatabase } = require("../../config/database");
const myLogModule = require("../../utils/logger");
const { ObjectId } = require("mongodb");

const DEFAULT_IMAGE_URL = process.env.DEFAULT_PROPERTY_IMAGE || "https://via.placeholder.com/300?text=Property";

function isValidObjectId(id) {
  return typeof id === "string" && ObjectId.isValid(id) && id.length === 24;
}

/**
 * @swagger
 * /property/create:
 *   post:
 *     summary: Create a new property
 *     tags:
 *       - Property
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buildingName
 *               - buildingAddress
 *               - pincode
 *               - state
 *               - userId
 *             properties:
 *               buildingName:
 *                 type: string
 *                 example: "Sunrise Apartments"
 *               buildingAddress:
 *                 type: string
 *                 example: "123 Main St"
 *               pincode:
 *                 type: string
 *                 example: "560001"
 *               state:
 *                 type: string
 *                 example: "Karnataka"
 *               userId:
 *                 type: string
 *                 example: "650f1a2b3c4d5e6f7a8b9c0d"
 *               owner:
 *                 type: string
 *                 example: "Rajesh"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               flats:
 *                 type: integer
 *                 example: 24
 *               shops:
 *                 type: integer
 *                 example: 2
 *               halls:
 *                 type: integer
 *                 example: 1
 *               plots:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       201:
 *         description: Property created successfully
 *       400:
 *         description: Missing required fields or invalid userId
 *       500:
 *         description: Server error
 */
router.post("/create", async (req, res) => {
  myLogModule.info("PropertyController - create", req.body);
  const { buildingName, buildingAddress, pincode, state, userId, owner, imageUrl, flats, shops, halls, plots } = req.body || {};

  if (!buildingName || !buildingAddress || !pincode || !state || !userId) {
    return res.status(400).json({ error: true, message: "Missing required fields: buildingName, buildingAddress, pincode, state, userId" });
  }

  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: true, message: "Invalid userId" });
  }

  const payload = {
    buildingName: String(buildingName).trim(),
    buildingAddress: String(buildingAddress).trim(),
    pincode: String(pincode).trim(),
    state: String(state).trim(),
    owner: owner ? String(owner).trim() : null,
    imageUrl: imageUrl ? String(imageUrl).trim() : DEFAULT_IMAGE_URL,
    createdBy: new ObjectId(userId),
    counts: {
      flats: flats !== undefined ? parseInt(flats, 10) || 0 : 0,
      shops: shops !== undefined ? parseInt(shops, 10) || 0 : 0,
      halls: halls !== undefined ? parseInt(halls, 10) || 0 : 0,
      plots: plots !== undefined ? parseInt(plots, 10) || 0 : 0
    },
    created_at: new Date(),
    updated_at: new Date()
  };

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();
    const result = await dbo.collection("property").insertOne(payload);
    myLogModule.info("Property created: " + payload.buildingName);
    res.status(201).json({ message: "Property created successfully", data: { id: result.insertedId, ...payload } });
  } catch (err) {
    myLogModule.error("Property create error: " + err);
    res.status(500).json({ error: true, message: "Error creating property", details: err.message });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /property/list:
 *   get:
 *     summary: Get list of properties with pagination
 *     tags:
 *       - Property
 *     parameters:
 *       - name: from
 *         in: query
 *         type: integer
 *         example: 1
 *         description: Page number (1-based)
 *       - name: size
 *         in: query
 *         type: integer
 *         example: 10
 *         description: Number of properties per page
 *       - name: userId
 *         in: query
 *         type: string
 *         example: "650f1a2b3c4d5e6f7a8b9c0d"
 *         description: Filter by userId (optional)
 *     responses:
 *       200:
 *         description: List of properties
 *       400:
 *         description: Invalid userId
 *       500:
 *         description: Server error
 */
router.get("/list", async (req, res) => {
  myLogModule.info("PropertyController - list", req.query);
  const pageNo = Math.max(parseInt(req.query.from) || 1, 1);
  const size = Math.max(parseInt(req.query.size) || 10, 1);
  const { userId } = req.query;

  const filter = {};
  if (userId) {
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: true, message: "Invalid userId" });
    }
    filter.createdBy = new ObjectId(userId);
  }

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();
    const skip = size * (pageNo - 1);
    const total = await dbo.collection("property").countDocuments(filter);
    const data = await dbo.collection("property").find(filter).skip(skip).limit(size).toArray();

    res.status(200).json({
      success: true,
      data,
      pagination: { page: pageNo, size, total, totalPages: Math.ceil(total / size) }
    });
  } catch (err) {
    myLogModule.error("Property list error: " + err);
    res.status(500).json({ error: true, message: "Error fetching properties", details: err.message });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /property/{id}:
 *   get:
 *     summary: Get property by id
 *     tags:
 *       - Property
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *         example: "650f1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: Property details
 *       400:
 *         description: Invalid property id
 *       404:
 *         description: Property not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  if (!isValidObjectId(id)) return res.status(400).json({ error: true, message: "Invalid property id" });

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();
    const property = await dbo.collection("property").findOne({ _id: new ObjectId(id) });
    if (!property) return res.status(404).json({ error: true, message: "Property not found" });
    res.status(200).json({ data: property });
  } catch (err) {
    myLogModule.error("Get property error: " + err);
    res.status(500).json({ error: true, message: "Error fetching property", details: err.message });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /property/update:
 *   put:
 *     summary: Update property details
 *     tags:
 *       - Property
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
 *               buildingName:
 *                 type: string
 *               buildingAddress:
 *                 type: string
 *               pincode:
 *                 type: string
 *               state:
 *                 type: string
 *               owner:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               flats:
 *                 type: integer
 *               shops:
 *                 type: integer
 *               halls:
 *                 type: integer
 *               plots:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       400:
 *         description: Invalid property id
 *       404:
 *         description: Property not found
 *       500:
 *         description: Server error
 */
router.put("/update", async (req, res) => {
  myLogModule.info("PropertyController - update", req.body);
  const { id, buildingName, buildingAddress, pincode, state, owner, imageUrl, flats, shops, halls, plots } = req.body || {};

  if (!isValidObjectId(id)) return res.status(400).json({ error: true, message: "Invalid property id" });

  const updates = { updated_at: new Date() };
  if (buildingName) updates.buildingName = String(buildingName).trim();
  if (buildingAddress) updates.buildingAddress = String(buildingAddress).trim();
  if (pincode) updates.pincode = String(pincode).trim();
  if (state) updates.state = String(state).trim();
  if (owner !== undefined) updates.owner = owner ? String(owner).trim() : null;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl ? String(imageUrl).trim() : DEFAULT_IMAGE_URL;

  const counts = {};
  if (flats !== undefined) counts.flats = parseInt(flats, 10) || 0;
  if (shops !== undefined) counts.shops = parseInt(shops, 10) || 0;
  if (halls !== undefined) counts.halls = parseInt(halls, 10) || 0;
  if (plots !== undefined) counts.plots = parseInt(plots, 10) || 0;
  if (Object.keys(counts).length) updates.counts = counts;

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();
    const result = await dbo.collection("property").updateOne({ _id: new ObjectId(id) }, { $set: updates });
    if (result.matchedCount === 0) return res.status(404).json({ error: true, message: "Property not found" });
    res.status(200).json({ message: "Property updated successfully", modifiedCount: result.modifiedCount });
  } catch (err) {
    myLogModule.error("Property update error: " + err);
    res.status(500).json({ error: true, message: "Error updating property", details: err.message });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /property/delete:
 *   delete:
 *     summary: Delete property
 *     tags:
 *       - Property
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         type: string
 *         example: "650f1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       400:
 *         description: Invalid property id
 *       404:
 *         description: Property not found
 *       500:
 *         description: Server error
 */
router.delete("/delete", async (req, res) => {
  const id = req.query.id;
  if (!isValidObjectId(id)) return res.status(400).json({ error: true, message: "Invalid property id" });

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();
    const result = await dbo.collection("property").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: true, message: "Property not found" });
    res.status(200).json({ message: "Property deleted successfully", deletedCount: result.deletedCount });
  } catch (err) {
    myLogModule.error("Property delete error: " + err);
    res.status(500).json({ error: true, message: "Error deleting property", details: err.message });
  } finally {
    if (client) await client.close();
  }
});

module.exports = router;
