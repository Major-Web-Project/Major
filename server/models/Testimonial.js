class Testimonial {
  constructor(id, text, author, role, rating) {
    this.id = id;
    this.text = text;
    this.author = author;
    this.role = role;
    this.rating = rating;
  }

  static getAll() {
    return [
      {
        id: 1,
        text: "It was nice experience.\nI have learned many NEW Things.\nAnd finally Achieved my goal!",
        author: "Sarah Johnson",
        role: "Web Developer",
        rating: 5,
      },
      {
        id: 2,
        text: "Amazing platform for learning!\nThe personalized approach helped me\nreach my career goals faster.",
        author: "Michael Chen",
        role: "Data Scientist",
        rating: 5,
      },
      {
        id: 3,
        text: "Interactive lessons and great mentorship.\nI improved my skills significantly\nand landed my dream job!",
        author: "Emily Rodriguez",
        role: "UX Designer",
        rating: 5,
      },
      {
        id: 4,
        text: "Best learning experience ever!\nThe AI-powered recommendations\nwere spot on for my needs.",
        author: "David Kim",
        role: "Software Engineer",
        rating: 5,
      },
      {
        id: 5,
        text: "Transformed my career completely.\nFrom beginner to professional\nin just 6 months!",
        author: "Lisa Thompson",
        role: "Digital Marketer",
        rating: 5,
      },
    ];
  }

  static findById(id) {
    const testimonials = this.getAll();
    return testimonials.find((testimonial) => testimonial.id === parseInt(id));
  }
}

export default Testimonial;
