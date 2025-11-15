const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const { getClient, getDatabase } = require("../../config/database");
const myLogModule = require("../../utils/logger");
const mypassModule = require("../../utils/utils");
const { ObjectId } = require("mongodb");

/**
 * @swagger
 * /user/create:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - mobile
 *               - password
 *               - userType
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 example: "SecurePass123"
 *               userType:
 *                 type: string
 *                 enum: ["tenant", "owner", "admin"]
 *                 example: "tenant"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: User with mobile already exists
 *       500:
 *         description: Server error
 */
router.post("/create", async function (req, res) {
  myLogModule.info("UserController API-create", req.body);

  const { firstName, lastName, mobile, password, userType } = req.body;
  if (!firstName || !lastName || !mobile || !password || !userType) {
    return res.status(400).json({
      error: true,
      message: "Missing required fields: firstName, lastName, mobile, password, userType"
    });
  }

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();

    const existingUser = await dbo.collection("users").findOne({ mobile: mobile });
    if (existingUser) {
      return res.status(409).json({ error: true, message: "User with this mobile already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const payload = {
      firstName,
      lastName,
      mobile,
      password: hashedPassword,
      userType,
      created_at: new Date(),
      updated_at: new Date()
    };

    myLogModule.info("Payload: " + JSON.stringify({ firstName, lastName, mobile, userType }));
    const result = await dbo.collection("users").insertOne(payload);

    myLogModule.info("User created successfully: " + mobile);
    res.status(201).json({
      message: "User created successfully",
      data: {
        id: result.insertedId,
        firstName,
        lastName,
        mobile,
        userType
      }
    });
  } catch (err) {
    myLogModule.error("Create user error: " + err);
    res.status(500).json({ error: true, message: "Error creating user", details: err.message });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /user/authenticate:
 *   post:
 *     summary: Login user (authenticate)
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - password
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 example: "SecurePass123"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Missing mobile or password
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/authenticate", async function (req, res) {
  myLogModule.info("UserController API-authenticate");

  if (!req.body.mobile || !req.body.password) {
    return res.status(400).json({ error: true, message: "Mobile and password are required" });
  }

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();

    const user = await dbo.collection("users").findOne({ mobile: req.body.mobile });

    if (!user) {
      return res.status(401).json({ error: true, message: "Authentication failed. Invalid user or password." });
    }

    const passwordMatch = await bcrypt.compare(req.body.password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: true, message: "Authentication failed. Invalid user or password." });
    }

    const token = jwt.sign(
      { id: user._id, mobile: user.mobile, userType: user.userType },
      process.env.TOKEN_SECRET || "your_secret_key",
      { expiresIn: "24h" }
    );

    myLogModule.info("User authenticated: " + req.body.mobile);
    res.status(200).json({
      message: "Login successful",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        userType: user.userType
      },
      token: token
    });
  } catch (err) {
    myLogModule.error("Auth error: " + err);
    res.status(500).json({ error: true, message: "Authentication error" });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /user/update:
 *   put:
 *     summary: Update user details
 *     tags:
 *       - User
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Server error
 */
router.put("/update", async function (req, res) {
  myLogModule.info("UserController API-update");

  if (!req.body.id) {
    return res.status(400).json({ error: true, message: "User ID is required" });
  }

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();

    const myquery = { _id: new ObjectId(req.body.id) };
    const newvalues = { $set: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      userType: req.body.userType,
      updated_at: new Date()
    }};

    const result = await dbo.collection("users").updateOne(myquery, newvalues);

    myLogModule.info("User updated successfully");
    res.status(200).json({ message: "User updated successfully", modifiedCount: result.modifiedCount });
  } catch (err) {
    myLogModule.error("Update error: " + err);
    res.status(500).json({ error: true, message: "Error updating user" });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /user/delete:
 *   delete:
 *     summary: Delete user
 *     tags:
 *       - User
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         type: string
 *         example: "650f1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Server error
 */
router.delete("/delete", async function (req, res) {
  myLogModule.info("UserController API-delete");

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: true, message: "Invalid user ID" });
  }

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();

    const result = await dbo.collection("users").deleteOne({ _id: new ObjectId(id) });

    myLogModule.info("User deleted successfully");
    res.status(200).json({ message: "User deleted successfully", deletedCount: result.deletedCount });
  } catch (err) {
    myLogModule.error("Delete error: " + err);
    res.status(500).json({ error: true, message: "Error deleting user" });
  } finally {
    if (client) await client.close();
  }
});

/**
 * @swagger
 * /user/change-password:
 *   put:
 *     summary: Change user password
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - password
 *             properties:
 *               id:
 *                 type: string
 *                 example: "650f1a2b3c4d5e6f7a8b9c0d"
 *               password:
 *                 type: string
 *                 example: "NewPassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: ID and password are required
 *       500:
 *         description: Server error
 */
router.put("/change-password", async function (req, res) {
  myLogModule.info("UserController API-change-password");

  if (!req.body.id || !req.body.password) {
    return res.status(400).json({ error: true, message: "ID and password are required" });
  }

  let client;
  try {
    client = await getClient();
    const dbo = await getDatabase();

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const myquery = { _id: new ObjectId(req.body.id) };
    const newvalues = { $set: { password: hashedPassword, updated_at: new Date() } };

    const result = await dbo.collection("users").updateOne(myquery, newvalues);

    myLogModule.info("Password changed successfully");
    res.status(200).json({ message: "Password changed successfully", modifiedCount: result.modifiedCount });
  } catch (err) {
    myLogModule.error("Change password error: " + err);
    res.status(500).json({ error: true, message: "Error changing password" });
  } finally {
    if (client) await client.close();
  }
});

module.exports = router;
