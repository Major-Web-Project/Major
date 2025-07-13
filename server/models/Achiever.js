class Achiever {
  constructor(id, name, image, field, achievement, completionTime) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.field = field;
    this.achievement = achievement;
    this.completionTime = completionTime;
  }

  static getAll() {
    return [
      {
        id: 1,
        name: "Nick",
        image:
          "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
        field: "Web Development",
        achievement: "Full Stack Developer at Google",
        completionTime: "4 months",
      },
      {
        id: 2,
        name: "Adil",
        image:
          "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
        field: "Data Science",
        achievement: "ML Engineer at Microsoft",
        completionTime: "6 months",
      },
      {
        id: 3,
        name: "Marina",
        image:
          "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
        field: "UI/UX Design",
        achievement: "Senior Designer at Apple",
        completionTime: "3 months",
      },
      {
        id: 4,
        name: "Dean",
        image:
          "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400",
        field: "Digital Marketing",
        achievement: "Marketing Director at Meta",
        completionTime: "5 months",
      },
      {
        id: 5,
        name: "Max",
        image:
          "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
        field: "AI/ML",
        achievement: "AI Researcher at OpenAI",
        completionTime: "8 months",
      },
    ];
  }

  static findById(id) {
    const achievers = this.getAll();
    return achievers.find((achiever) => achiever.id === parseInt(id));
  }

  static findByField(field) {
    const achievers = this.getAll();
    return achievers.filter(
      (achiever) => achiever.field.toLowerCase() === field.toLowerCase()
    );
  }
}

export default Achiever;
