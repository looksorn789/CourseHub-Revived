export const postData = [
  {
    id: 1,
    author: {
      name: "Elias Woldie",
      image: "",
      channel: "Machine Learning Study Group",
      slug: "machine-learning-study-group",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    title: "Graph Algorithms Practice",
    content:
      "I'm currently diving deep into graph algorithms, and it's fascinating how they're used in real-world applications like social networks and recommendation systems. Does anyone have recommendations for resources or exercises to practice these concepts?\nI'm currently diving deep into graph algorithms, and it's fascinating how they're used in real-world applications like social networks and recommendation systems. Does anyone have recommendations for resources or exercises to practice these concepts?",
    tags: ["graph algorithms", "practice", "recommendations"],
    likes: 25,
    comments: [
      {
        id: 1,
        author: { name: "Patrick Bootchot", image: "" },
        content:
          "Check out LeetCode! They have some great graph algorithm problems, especially for interview prep.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        likes: 8,
      },
    ],
  },
  {
    id: 2,
    author: {
      name: "Zachary Sanchez",
      image: "",
      channel: "Advanced Java Programming Forum",
      slug: "advanced-java-programming-forum",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    content:
      "Started working on a project using neural networks to detect anomalies in datasets. It’s amazing how much potential AI has in automating tasks we thought were impossible before. Anyone here working on something similar?",
    likes: 40,
    comments: [
      {
        id: 2,
        author: { name: "Jenna Itani", image: "" },
        content:
          "That's awesome! I'm working on image classification using CNNs. What framework are you using for your project?",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        likes: 12,
      },
    ],
  },
  {
    id: 3,
    author: {
      name: "Patrick Bootchot",
      image: "",
      channel: "Final Exam Preparation - Math 101",
      slug: "final-exam-preparation-math-101",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    content:
      "After weeks of training and tweaking, I finally achieved 95% accuracy on my machine learning model! It was quite a journey, but persistence pays off. Anyone else have tips for improving model accuracy?",
    likes: 65,
    comments: [
      {
        id: 3,
        author: { name: "Randolf Pangilin", image: "" },
        content:
          "Congrats, Patrick! Have you tried experimenting with hyperparameter tuning? It can make a big difference.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
        likes: 9,
      },
      {
        id: 4,
        author: { name: "Ethan Andrews", image: "" },
        content:
          "Great job! I found that using a more complex ensemble model can also help improve accuracy.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
        likes: 11,
      },
    ],
  },
  {
    id: 4,
    author: {
      name: "Ethan Andrews",
      image: "",
      channel: "Python Programming Help",
      slug: "python-programming-help",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9),
    content:
      "Just finished a project on process synchronization in operating systems. It’s pretty cool learning how critical sections and deadlock avoidance work under the hood. Any advice for resources on advanced OS topics?",
    likes: 22,
    comments: [
      {
        id: 5,
        author: { name: "Zachary Sanchez", image: "" },
        content:
          "You should check out 'Operating Systems: Three Easy Pieces.' It's a great resource for diving deeper into OS concepts.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        likes: 6,
      },
    ],
  },
  {
    id: 5,
    author: {
      name: "Jenna Itani",
      image: "",
      channel: "Machine Learning Study Group",
      slug: "machine-learning-study-group",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 11),
    content:
      "I'm building my first full-stack application using React and Node.js. The backend setup was more complicated than I expected. Does anyone have any tips for managing API routes efficiently?",
    likes: 34,
    comments: [
      {
        id: 6,
        author: { name: "Elias Woldie", image: "" },
        content:
          "It can be tricky at first! I recommend using Express.js and structuring your routes by resource type. Also, middleware can really help keep things clean.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
        likes: 10,
      },
    ],
  },
  {
    id: 6,
    author: {
      name: "Randolf Pangilin",
      image: "",
      channel: "Advanced Java Programming Forum",
      slug: "advanced-java-programming-forum",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
    content:
      "I'm researching the impact of quantum computing on modern encryption techniques. It’s a bit daunting, but I’m fascinated by how encryption as we know it could change in the next decade. Anyone have recommendations for papers on this?",
    likes: 50,
    comments: [
      {
        id: 7,
        author: { name: "Patrick Bootchot", image: "" },
        content:
          "There's a great paper by Shor on quantum algorithms that you might find interesting. It explains how certain encryption techniques could be vulnerable.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 15),
        likes: 15,
      },
    ],
  },
  {
    id: 7,
    author: {
      name: "Elias Woldie",
      image: "",
      channel: "Final Exam Preparation - Math 101",
      slug: "final-exam-preparation-math-101",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    content:
      "I've been working with NoSQL databases, and it's quite different from traditional SQL. Anyone here have experience with MongoDB? I'd love to hear your thoughts on how it compares to PostgreSQL for large-scale applications.",
    likes: 27,
    comments: [
      {
        id: 8,
        author: { name: "Zachary Sanchez", image: "" },
        content:
          "MongoDB is great for unstructured data, but you may run into challenges with complex queries. PostgreSQL offers more in terms of relational integrity.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
        likes: 7,
      },
    ],
  },
  {
    id: 8,
    author: {
      name: "Zachary Sanchez",
      image: "",
      channel: "Python Programming Help",
      slug: "python-programming-help",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    content:
      "Just deployed my first application using AWS Lambda. It’s incredible how serverless architecture can streamline deployment, but there’s definitely a learning curve. Any tips on optimizing cold starts?",
    likes: 38,
    comments: [
      {
        id: 9,
        author: { name: "Ethan Andrews", image: "" },
        content:
          "One trick is to pre-warm your Lambda functions by sending scheduled requests. It helps reduce cold start times significantly.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
        likes: 12,
      },
    ],
  },
  {
    id: 9,
    author: {
      name: "Jenna Itani",
      image: "",
      channel: "Machine Learning Study Group",
      slug: "machine-learning-study-group",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    content:
      "I've been diving into CI/CD pipelines, and I’m amazed at how they can improve development workflow. Jenkins and Docker are powerful tools, but I’m curious if anyone has experience with alternatives like GitLab CI?",
    likes: 45,
    comments: [
      {
        id: 10,
        author: { name: "Randolf Pangilin", image: "" },
        content:
          "I’ve used GitLab CI on a few projects, and it's solid! The built-in integration with GitLab repositories makes it really easy to set up pipelines.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7),
        likes: 13,
      },
    ],
  },
  {
    id: 10,
    author: {
      name: "Patrick Bootchot",
      image: "",
      channel: "Final Exam Preparation - Math 101",
      slug: "final-exam-preparation-math-101",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9),
    content:
      "Finally wrapping up my capstone project! Building a real-time collaboration tool was both exciting and challenging. I had to handle concurrency issues and ensure smooth performance across multiple users. Anyone else working on large-scale projects?",
    likes: 52,
    comments: [
      {
        id: 11,
        author: { name: "Zachary Sanchez", image: "" },
        content:
          "Congrats on finishing! I’m working on a real-time chat app, and concurrency has definitely been tricky. Any tips?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
        likes: 18,
      },
    ],
  },
];
