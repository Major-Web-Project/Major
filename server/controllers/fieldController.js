import Field from "../models/Field.js";

class FieldController {
  // Get all learning fields
  static async getAllFields(req, res) {
    try {
      const fields = Field.getAll();
      res.json(fields);
    } catch (error) {
      console.error("Error fetching fields:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch fields",
        message: error.message,
      });
    }
  }

  // Get field by value
  static async getFieldByValue(req, res) {
    try {
      const { value } = req.params;
      const field = Field.findByValue(value);

      if (!field) {
        return res.status(404).json({
          success: false,
          error: "Field not found",
          message: `No field found with value '${value}'`,
        });
      }

      res.json({
        success: true,
        field,
      });
    } catch (error) {
      console.error("Error fetching field:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch field",
        message: error.message,
      });
    }
  }

  // Get field labels only
  static async getFieldLabels(req, res) {
    try {
      const labels = Field.getLabels();
      res.json({
        success: true,
        labels,
      });
    } catch (error) {
      console.error("Error fetching field labels:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch field labels",
        message: error.message,
      });
    }
  }

  // Get field values only
  static async getFieldValues(req, res) {
    try {
      const values = Field.getValues();
      res.json({
        success: true,
        values,
      });
    } catch (error) {
      console.error("Error fetching field values:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch field values",
        message: error.message,
      });
    }
  }
}

export default FieldController;
