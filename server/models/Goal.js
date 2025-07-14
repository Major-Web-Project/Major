class Goal {
  constructor(field, description, timeline, strengths, weaknesses) {
    this.id = Date.now();
    this.field = field;
    this.description = description;
    this.timeline = timeline;
    this.strengths = strengths;
    this.weaknesses = weaknesses;
    this.createdAt = new Date().toISOString();
    this.status = "active";
  }

  static create(goalData) {
    const { field, description, timeline, strengths, weaknesses } = goalData;

    if (!field || !description || !timeline) {
      throw new Error("Field, description, and timeline are required");
    }

    return new Goal(field, description, timeline, strengths, weaknesses);
  }

  static validate(goalData) {
    const { field, description, timeline } = goalData;
    const errors = [];

    if (!field) errors.push("Field is required");
    if (!description) errors.push("Description is required");
    if (!timeline) errors.push("Timeline is required");

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON() {
    return {
      id: this.id,
      field: this.field,
      description: this.description,
      timeline: this.timeline,
      strengths: this.strengths,
      weaknesses: this.weaknesses,
      createdAt: this.createdAt,
      status: this.status,
    };
  }
}

export default Goal;
