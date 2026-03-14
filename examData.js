window.EXAM_DATA = {
  grades: ["G1", "G2", "AS", "A2"],
  boards: {
    CIE: {
      Mathematics: ["P1", "P2", "P3", "P4"],
      Physics: ["P1", "P2", "P3", "P4", "P5"],
      Chemistry: ["P1", "P2", "P3", "P4", "P5"]
    },
    Edexcel: {
      Mathematics: ["Pure 1", "Pure 2", "Statistics 1", "Mechanics 1"],
      Physics: ["Unit 1", "Unit 2", "Unit 4", "Unit 5"],
      Chemistry: ["Unit 1", "Unit 2", "Unit 4", "Unit 5"]
    },
    AQA: {
      Mathematics: ["Paper 1", "Paper 2", "Paper 3"],
      Physics: ["Paper 1", "Paper 2", "Paper 3"],
      Chemistry: ["Paper 1", "Paper 2", "Paper 3"]
    }
  },
  knowledgePoints: {
    Mathematics: ["Functions", "Algebra", "Trigonometry", "Calculus", "Statistics"],
    Physics: ["Mechanics", "Waves", "Electricity", "Thermal Physics", "Nuclear Physics"],
    Chemistry: ["Physical Chemistry", "Inorganic", "Organic", "Kinetics", "Equilibrium"]
  },
  questionBank: {
    Mathematics: [
      { id: "M001", paper: "P1", topic: "Algebra", difficulty: "Basic", type: "Structured", marks: 6, question: "Solve the equation: 3x - 7 = 2x + 5.", answer: "x = 12." },
      { id: "M002", paper: "P1", topic: "Functions", difficulty: "Basic", type: "Structured", marks: 7, question: "Given f(x) = 2x + 1 and g(x) = x^2, find f(3) and g(3).", answer: "f(3) = 7, g(3) = 9." },
      { id: "M003", paper: "P1", topic: "Algebra", difficulty: "Medium", type: "Structured", marks: 8, question: "Factorize completely: 2x^2 - 7x - 15.", answer: "(2x + 3)(x - 5)." },
      { id: "M004", paper: "P1", topic: "Functions", difficulty: "Medium", type: "Structured", marks: 7, question: "Find the inverse of f(x) = (x - 4) / 3.", answer: "f^-1(x) = 3x + 4." },
      { id: "M005", paper: "P1", topic: "Trigonometry", difficulty: "Basic", type: "Multiple Choice", marks: 4, question: "If sin(theta) = 1/2 and 0 deg <= theta <= 180 deg, which values are possible?", answer: "30 deg and 150 deg." },
      { id: "M006", paper: "P1", topic: "Calculus", difficulty: "Medium", type: "Structured", marks: 8, question: "Differentiate y = 5x^3 - 4x + 9.", answer: "dy/dx = 15x^2 - 4." },
      { id: "M007", paper: "P2", topic: "Trigonometry", difficulty: "Medium", type: "Structured", marks: 9, question: "Solve for 0 deg <= x <= 360 deg: 2sin(x) - 1 = 0.", answer: "x = 30 deg, 150 deg." },
      { id: "M008", paper: "P2", topic: "Calculus", difficulty: "Challenge", type: "Structured", marks: 10, question: "Find the stationary points of y = x^3 - 6x^2 + 9x + 2.", answer: "dy/dx = 3x^2 - 12x + 9 = 0 gives x = 1,3. Coordinates: (1,6) and (3,2)." },
      { id: "M009", paper: "P2", topic: "Algebra", difficulty: "Medium", type: "Multiple Choice", marks: 4, question: "The roots of x^2 - 5x + 6 = 0 are:", answer: "x = 2 and x = 3." },
      { id: "M010", paper: "P2", topic: "Functions", difficulty: "Challenge", type: "Structured", marks: 9, question: "Given f(x) = x^2 - 4x + 1, find the range for x >= 2.", answer: "Minimum at x = 2 is -3, so range is y >= -3." },
      { id: "M011", paper: "P3", topic: "Calculus", difficulty: "Challenge", type: "Structured", marks: 11, question: "Integrate: integral(3x^2 - 4x + 7) dx.", answer: "x^3 - 2x^2 + 7x + C." },
      { id: "M012", paper: "P3", topic: "Calculus", difficulty: "Medium", type: "Structured", marks: 10, question: "Find integral from 0 to 2 of (x^2 + 1) dx.", answer: "[x^3/3 + x]0 to 2 = 14/3." },
      { id: "M013", paper: "P3", topic: "Trigonometry", difficulty: "Challenge", type: "Structured", marks: 10, question: "Prove that (1 - cos2x) / sin2x = tanx.", answer: "Use identities 1 - cos2x = 2sin^2x and sin2x = 2sinx cosx, then simplify to tanx." },
      { id: "M014", paper: "P3", topic: "Algebra", difficulty: "Challenge", type: "Structured", marks: 10, question: "Solve ln(x + 1) = 2 for x.", answer: "x + 1 = e^2, so x = e^2 - 1." },
      { id: "M015", paper: "P3", topic: "Functions", difficulty: "Medium", type: "Multiple Choice", marks: 5, question: "If f(x)=x^2 and g(x)=x+1, then (f o g)(2) equals:", answer: "(2 + 1)^2 = 9." },
      { id: "M016", paper: "P4", topic: "Statistics", difficulty: "Basic", type: "Structured", marks: 7, question: "Find the mean of data set: 3, 5, 7, 9, 11.", answer: "Mean = 7." },
      { id: "M017", paper: "P4", topic: "Statistics", difficulty: "Medium", type: "Structured", marks: 9, question: "A fair die is rolled once. Find P(X >= 4).", answer: "3/6 = 1/2." },
      { id: "M018", paper: "P4", topic: "Statistics", difficulty: "Challenge", type: "Structured", marks: 11, question: "A variable X ~ N(50, 4^2). Find P(X > 58).", answer: "Standardize z = 2, so P(X > 58) = P(Z > 2) approx 0.0228." },
      { id: "M019", paper: "P4", topic: "Calculus", difficulty: "Medium", type: "Structured", marks: 8, question: "Find the equation of tangent to y = x^2 at x = 3.", answer: "Gradient = 2x = 6, point (3,9), tangent: y - 9 = 6(x - 3)." },
      { id: "M020", paper: "P2", topic: "Trigonometry", difficulty: "Basic", type: "Multiple Choice", marks: 4, question: "cos(60 deg) equals:", answer: "1/2." },
      { id: "M021", paper: "P1", topic: "Algebra", difficulty: "Basic", type: "Multiple Choice", marks: 3, question: "Simplify: 4a + 3a.", answer: "7a." },
      { id: "M022", paper: "P3", topic: "Calculus", difficulty: "Challenge", type: "Structured", marks: 12, question: "Find the area enclosed by y = x and y = x^2 from x=0 to x=1.", answer: "integral(0 to 1)(x - x^2)dx = 1/6." },
      { id: "M023", paper: "P2", topic: "Functions", difficulty: "Medium", type: "Structured", marks: 8, question: "Given f(x)=2x-3, find x when f(x)=11.", answer: "2x - 3 = 11 => x = 7." },
      { id: "M024", paper: "P4", topic: "Statistics", difficulty: "Medium", type: "Multiple Choice", marks: 5, question: "Median of 2, 3, 4, 7, 9 is:", answer: "4." }
    ]
  }
};
