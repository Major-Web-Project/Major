import express from "express";
import FieldController from "../controllers/fieldController.js";

const router = express.Router();

// GET /api/fields - Get all learning fields
router.get("/", FieldController.getAllFields);

// GET /api/fields/labels - Get field labels only
router.get("/labels", FieldController.getFieldLabels);

// GET /api/fields/values - Get field values only
router.get("/values", FieldController.getFieldValues);

// GET /api/fields/:value - Get field by value
router.get("/:value", FieldController.getFieldByValue);

export default router;
