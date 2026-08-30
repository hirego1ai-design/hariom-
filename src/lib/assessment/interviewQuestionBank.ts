export const interviewQuestionBank: Record<string, string[]> = {
  frontend: [
    "What is the Virtual DOM and how does React use it to improve performance?",
    "Explain the difference between local storage, session storage, and cookies.",
    "How do you optimize a web application for better core web vitals?",
    "What are React Hooks and how do they differ from class lifecycle methods?",
    "Describe your approach to building responsive and accessible user interfaces.",
    "Explain the concept of closure in JavaScript and provide a practical use case.",
    "How does CSS Flexbox differ from CSS Grid, and when would you use each?",
    "What are the benefits of Server-Side Rendering (SSR) vs Single Page Applications (SPA)?",
    "How do you handle state management in a complex React application?",
    "What strategies do you use for testing frontend components?"
  ],
  backend: [
    "Explain the differences between REST and GraphQL APIs.",
    "How do you handle authentication and authorization in a Node.js application?",
    "What are database indexes and how do they impact read/write performance?",
    "Explain the concept of middleware in an Express.js application.",
    "How do you design a scalable microservices architecture?",
    "What is the difference between SQL and NoSQL databases?",
    "How do you implement rate limiting and API security best practices?",
    "Describe caching strategies using tools like Redis.",
    "How would you approach designing a database schema for a multi-tenant application?",
    "Explain how Node.js handles asynchronous operations."
  ],
  fullstack: [
    "How do you handle data fetching and synchronization between frontend and backend?",
    "Describe a challenging full-stack bug you resolved and your debugging process.",
    "What is your approach to handling database migrations in a production environment?",
    "How do you structure a Next.js application for scalability and maintainability?",
    "Explain the advantages of using TypeScript across both frontend and backend.",
    "How do you ensure end-to-end security in a web application?",
    "Describe your experience with CI/CD pipelines for full-stack deployments.",
    "How do you handle error logging and monitoring across the stack?",
    "What are WebSockets and when would you use them over traditional HTTP?",
    "How do you approach performance testing and optimization end-to-end?"
  ],
  data: [
    "Explain the difference between supervised and unsupervised learning.",
    "How do you handle missing or corrupted data in a dataset?",
    "What are the key differences between a Data Warehouse and a Data Lake?",
    "Describe your approach to designing an ETL pipeline.",
    "Explain the bias-variance tradeoff in machine learning models.",
    "How do you optimize SQL queries for large-scale data processing?",
    "What evaluation metrics do you use for classification vs regression problems?",
    "Describe your experience with big data processing frameworks like Spark.",
    "How do you deploy and monitor machine learning models in production?",
    "Explain the concept of cross-validation."
  ],
  devops: [
    "What is Infrastructure as Code (IaC) and what tools do you prefer?",
    "Explain the concept of Blue-Green vs Canary deployments.",
    "How do you manage secrets and sensitive configuration in Kubernetes?",
    "Describe your approach to setting up monitoring and alerting.",
    "What is the difference between a container and a virtual machine?",
    "How do you ensure high availability and disaster recovery for a web service?",
    "Explain the concept of immutable infrastructure.",
    "How do you troubleshoot a microservice that is intermittently failing?",
    "Describe the process of optimizing a Dockerfile for size and build speed.",
    "How do you manage auto-scaling in a cloud environment?"
  ],
  general: [
    "Describe a complex technical problem you solved recently.",
    "How do you handle technical debt while meeting project deadlines?",
    "Explain a technology or framework you learned recently and why.",
    "How do you ensure code quality and consistency in a team environment?",
    "Describe a situation where you disagreed with a technical decision and how you handled it.",
    "What is your approach to estimating tasks and project timelines?",
    "How do you mentor junior developers or share knowledge within a team?",
    "Describe a time when you had to optimize legacy code.",
    "What are your strategies for staying up to date with technology trends?",
    "How do you balance adding new features with maintaining system stability?"
  ]
};

export function getFallbackQuestion(roleTarget: string, questionIndex: number): string {
  const role = roleTarget.toLowerCase();
  let category = 'general';

  if (role.includes('frontend') || role.includes('ui') || role.includes('react')) {
    category = 'frontend';
  } else if (role.includes('backend') || role.includes('node') || role.includes('api')) {
    category = 'backend';
  } else if (role.includes('fullstack') || role.includes('full stack')) {
    category = 'fullstack';
  } else if (role.includes('data') || role.includes('machine learning') || role.includes('ai')) {
    category = 'data';
  } else if (role.includes('devops') || role.includes('sre') || role.includes('cloud')) {
    category = 'devops';
  }

  const questions = interviewQuestionBank[category];
  return questions[questionIndex % questions.length];
}
