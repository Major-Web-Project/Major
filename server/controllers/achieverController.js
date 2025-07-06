import Achiever from "../models/Achiever.js";

class AchieverController {
  // Get all achievers
  static async getAllAchievers(req, res) {
    try {
      const achievers = Achiever.getAll();
      res.json(achievers);
    } catch (error) {
      console.error("Error fetching achievers:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch achievers",
        message: error.message,
      });
    }
  }

  // Get achiever by ID
  static async getAchieverById(req, res) {
    try {
      const { id } = req.params;
      const achiever = Achiever.findById(id);

      if (!achiever) {
        return res.status(404).json({
          success: false,
          error: "Achiever not found",
          message: `No achiever found with ID ${id}`,
        });
      }

      res.json({
        success: true,
        achiever,
      });
    } catch (error) {
      console.error("Error fetching achiever:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch achiever",
        message: error.message,
      });
    }
  }

  // Get achievers by field
  static async getAchieversByField(req, res) {
    try {
      const { field } = req.params;
      const achievers = Achiever.findByField(field);

      res.json({
        success: true,
        field,
        count: achievers.length,
        achievers,
      });
    } catch (error) {
      console.error("Error fetching achievers by field:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch achievers by field",
        message: error.message,
      });
    }
  }

  // Create new achiever (for future use)
  static async createAchiever(req, res) {
    try {
      const { name, image, field, achievement, completionTime } = req.body;

      if (!name || !field || !achievement) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
          message: "Name, field, and achievement are required",
        });
      }

      const newAchiever = new Achiever(
        Date.now(),
        name,
        image,
        field,
        achievement,
        completionTime
      );

      res.status(201).json({
        success: true,
        message: "Achiever created successfully",
        achiever: newAchiever,
      });
    } catch (error) {
      console.error("Error creating achiever:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create achiever",
        message: error.message,
      });
    }
  }
}

export default AchieverController;
