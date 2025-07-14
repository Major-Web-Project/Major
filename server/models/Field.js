class Field {
  constructor(value, label, description) {
    this.value = value;
    this.label = label;
    this.description = description;
  }

  static getAll() {
    return [
      {
        value: "design",
        label: "UI/UX Design",
        description: "Create beautiful and user-friendly interfaces",
      },
      {
        value: "development",
        label: "Web Development",
        description: "Build modern web applications",
      },
      {
        value: "marketing",
        label: "Digital Marketing",
        description: "Master online marketing strategies",
      },
      {
        value: "business",
        label: "Business Analytics",
        description: "Analyze data to drive business decisions",
      },
      {
        value: "ai",
        label: "Artificial Intelligence",
        description: "Develop intelligent systems and algorithms",
      },
      {
        value: "data",
        label: "Data Science",
        description: "Extract insights from complex datasets",
      },
    ];
  }

  static findByValue(value) {
    const fields = this.getAll();
    return fields.find((field) => field.value === value);
  }

  static getLabels() {
    const fields = this.getAll();
    return fields.map((field) => field.label);
  }

  static getValues() {
    const fields = this.getAll();
    return fields.map((field) => field.value);
  }
}

export default Field;
