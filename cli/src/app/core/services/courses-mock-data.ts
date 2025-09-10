import { Course, CourseCategory } from '../models/course.model';
import { CourseModule, CourseLesson } from '../models/course-module.model';
import { User } from '../models/user.model';

export const mockCourseCategories: CourseCategory[] = [
  {
    id: 1,
    name: 'Web Development',
    description: 'Learn to build modern web applications',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Data Science',
    description: 'Data analysis, machine learning, and AI',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockCourses: Course[] = [
  {
    id: 1,
    instructor_id: 101,
    title: 'Angular for Beginners',
    thumbnail: 'https://placehold.co/600x400?text=Angular',
    publish_date: '2024-02-01T00:00:00Z',
    status: 'published',
    revenue: 1200,
    students: 150,
    rating: 4.7,
    description: 'A complete guide to Angular basics and best practices.',
    level: 'Beginner',
    duration: 12,
    category_id: 1,
    is_premium: false,
    is_deleted: false,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
    price: 0,
    original_price: 299000,
    discount: 100,
  },
  {
    id: 2,
    instructor_id: 102,
    title: 'Machine Learning 101',
    thumbnail: 'https://placehold.co/600x400?text=ML',
    publish_date: '2024-03-01T00:00:00Z',
    status: 'published',
    revenue: 2500,
    students: 200,
    rating: 4.9,
    description: 'Introduction to machine learning concepts and algorithms.',
    level: 'Beginner',
    duration: 15,
    category_id: 2,
    is_premium: true,
    is_deleted: false,
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
    price: 499000,
    original_price: 599000,
    discount: 17,
  },
  {
    id: 3,
    instructor_id: 101,
    title: 'React Development Mastery',
    thumbnail: 'https://placehold.co/600x400?text=React',
    publish_date: '2024-01-15T00:00:00Z',
    status: 'published',
    revenue: 1800,
    students: 89,
    rating: 4.5,
    description:
      'Master React development with hooks, context, and best practices.',
    level: 'Intermediate',
    duration: 18,
    category_id: 1,
    is_premium: true,
    is_deleted: false,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    price: 399000,
    original_price: 399000,
    discount: 0,
  },
  {
    id: 4,
    instructor_id: 102,
    title: 'Python Data Science',
    thumbnail: 'https://placehold.co/600x400?text=Python+DS',
    publish_date: '2024-03-15T00:00:00Z',
    status: 'published',
    revenue: 3200,
    students: 245,
    rating: 4.8,
    description:
      'Complete Python data science course with pandas, numpy, and visualization.',
    level: 'Intermediate',
    duration: 20,
    category_id: 2,
    is_premium: true,
    is_deleted: false,
    created_at: '2024-02-20T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
    price: 599000,
    original_price: 799000,
    discount: 25,
  },
  {
    id: 5,
    instructor_id: 101,
    title: 'JavaScript ES6+ Modern Features',
    thumbnail: 'https://placehold.co/600x400?text=JavaScript',
    publish_date: '2024-02-20T00:00:00Z',
    status: 'published',
    revenue: 800,
    students: 67,
    rating: 4.3,
    description:
      'Learn modern JavaScript features including async/await, destructuring, and modules.',
    level: 'Beginner',
    duration: 8,
    category_id: 1,
    is_premium: false,
    is_deleted: false,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-20T00:00:00Z',
    price: 0,
    original_price: 199000,
    discount: 100,
  },
  {
    id: 6,
    instructor_id: 102,
    title: 'Advanced Deep Learning',
    thumbnail: 'https://placehold.co/600x400?text=Deep+Learning',
    publish_date: '2024-04-01T00:00:00Z',
    status: 'published',
    revenue: 4200,
    students: 156,
    rating: 4.9,
    description:
      'Deep dive into neural networks, CNNs, RNNs, and advanced deep learning techniques.',
    level: 'Advanced',
    duration: 25,
    category_id: 2,
    is_premium: true,
    is_deleted: false,
    created_at: '2024-03-10T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
    price: 899000,
    original_price: 1199000,
    discount: 25,
  },
  {
    id: 6,
    instructor_id: 102,
    title: 'Advanced Deep Learning',
    thumbnail: 'https://placehold.co/600x400?text=Deep+Learning',
    publish_date: '2024-04-01T00:00:00Z',
    status: 'published',
    revenue: 4200,
    students: 156,
    rating: 4.9,
    description:
      'Deep dive into neural networks, CNNs, RNNs, and advanced deep learning techniques.',
    level: 'Advanced',
    duration: 25,
    category_id: 2,
    is_premium: true,
    is_deleted: false,
    created_at: '2024-03-10T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
    price: 899000,
    original_price: 1199000,
    discount: 25,
  },
  {
    id: 6,
    instructor_id: 102,
    title: 'Advanced Deep Learning',
    thumbnail: 'https://placehold.co/600x400?text=Deep+Learning',
    publish_date: '2024-04-01T00:00:00Z',
    status: 'published',
    revenue: 4200,
    students: 156,
    rating: 4.9,
    description:
      'Deep dive into neural networks, CNNs, RNNs, and advanced deep learning techniques.',
    level: 'Advanced',
    duration: 25,
    category_id: 2,
    is_premium: true,
    is_deleted: false,
    created_at: '2024-03-10T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
    price: 899000,
    original_price: 1199000,
    discount: 25,
  },
];

export const mockCourseModules: CourseModule[] = [
  {
    id: 1,
    course_id: 1,
    title: 'Getting Started',
    position: 1,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 2,
    course_id: 1,
    title: 'Components & Templates',
    position: 2,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 3,
    course_id: 2,
    title: 'ML Basics',
    position: 1,
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-10T00:00:00Z',
  },
];

export const mockCourseLessons: CourseLesson[] = [
  // Angular Course Lessons
  {
    id: 1,
    module_id: 1,
    title: 'Introduction to Angular',
    content: 'https://www.youtube.com/watch?v=k5E2AVpwsko', // Angular tutorial video
    duration: 20,
    position: 1,
    type: 'video',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 2,
    module_id: 1,
    title: 'Setting up Development Environment',
    content: `## Setting up Angular Development Environment

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Code editor (VS Code recommended)

### Installation Steps
1. Install Node.js from nodejs.org
2. Install Angular CLI globally:
   \`\`\`bash
   npm install -g @angular/cli
   \`\`\`
3. Verify installation:
   \`\`\`bash
   ng version
   \`\`\`

### Creating Your First Project
\`\`\`bash
ng new my-angular-app
cd my-angular-app
ng serve
\`\`\`

Your Angular app will be available at http://localhost:4200`,
    duration: 15,
    position: 2,
    type: 'document',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 3,
    module_id: 2,
    title: 'Component Basics',
    content: `## Angular Components

### What is a Component?
A component is a TypeScript class decorated with @Component that controls a patch of the screen called a view.

### Component Structure
- **Template**: HTML that defines the view
- **Class**: TypeScript code that handles data and logic
- **Styles**: CSS that defines appearance

### Example Component
\`\`\`typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-hello',
  template: '<h1>Hello {{name}}!</h1>',
  styles: ['h1 { color: blue; }']
})
export class HelloComponent {
  name = 'Angular';
}
\`\`\`

### Key Concepts
- Data binding
- Event handling
- Component lifecycle
- Input/Output properties`,
    duration: 30,
    position: 1,
    type: 'document',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 4,
    module_id: 2,
    title: 'Component Practice Quiz',
    content: `Test your understanding of Angular components with this interactive quiz.

Questions will cover:
- Component decoration
- Data binding syntax
- Component lifecycle hooks
- Best practices

Score 80% or higher to pass!`,
    duration: 10,
    position: 2,
    type: 'quiz',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  // Machine Learning Course Lessons
  {
    id: 5,
    module_id: 3,
    title: 'What is Machine Learning?',
    content: 'https://www.youtube.com/watch?v=ukzFI9rgwfU', // ML intro video
    duration: 25,
    position: 1,
    type: 'video',
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-10T00:00:00Z',
  },
  {
    id: 6,
    module_id: 3,
    title: 'Types of Machine Learning',
    content: `## Types of Machine Learning

### 1. Supervised Learning
- **Definition**: Learning with labeled training data
- **Examples**: Classification, Regression
- **Use cases**: Email spam detection, house price prediction
- **Algorithms**: Linear Regression, Decision Trees, Random Forest

### 2. Unsupervised Learning
- **Definition**: Finding patterns in data without labels
- **Examples**: Clustering, Dimensionality Reduction
- **Use cases**: Customer segmentation, anomaly detection
- **Algorithms**: K-Means, PCA, DBSCAN

### 3. Reinforcement Learning
- **Definition**: Learning through interaction and feedback
- **Examples**: Game playing, robotics
- **Use cases**: Autonomous vehicles, recommendation systems
- **Algorithms**: Q-Learning, Policy Gradient

### Key Differences
| Type | Data | Goal | Examples |
|------|------|------|---------|
| Supervised | Labeled | Predict | Classification, Regression |
| Unsupervised | Unlabeled | Discover | Clustering, Association |
| Reinforcement | Rewards/Penalties | Optimize | Game AI, Robotics |`,
    duration: 20,
    position: 2,
    type: 'document',
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-10T00:00:00Z',
  },
  {
    id: 7,
    module_id: 3,
    title: 'ML Fundamentals Assessment',
    content: `Evaluate your understanding of machine learning fundamentals.

This assessment covers:
- Definition and importance of ML
- Supervised vs Unsupervised vs Reinforcement Learning
- Common algorithms and their applications
- Real-world ML examples

Complete all questions to proceed to the next module.`,
    duration: 15,
    position: 3,
    type: 'exercise',
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-10T00:00:00Z',
  },
];

export const mockInstructors: User[] = [
  {
    id: 101,
    name: 'Nguyen Van A',
    email: 'a@example.com',
    role: 'creator',
    is_active: true,
    is_online: false,
    subscription_status: 'free',
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 102,
    name: 'Tran Thi B',
    email: 'b@example.com',
    role: 'creator',
    is_active: true,
    is_online: true,
    subscription_status: 'premium',
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockCourseEnrollments = [
  {
    id: 1,
    user_id: 201,
    course_id: 1,
    progress: 80,
    status: 'in-progress',
    start_date: '2024-02-10T00:00:00Z',
    completion_date: null,
    rating: 5,
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 202,
    course_id: 2,
    progress: 100,
    status: 'completed',
    start_date: '2024-03-10T00:00:00Z',
    completion_date: '2024-04-01T00:00:00Z',
    rating: 4,
    created_at: '2024-03-10T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
  },
];

export const mockInstructorQualifications = [
  {
    id: 1,
    user_id: 101,
    title: 'MSc Computer Science',
    institution: 'HUST',
    date: '2020-06-01',
    credential_url: null,
    created_at: '2020-06-01T00:00:00Z',
    updated_at: null,
  },
];

export const mockCourseReviews = [
  {
    id: 1,
    course_id: 1,
    user_id: 201,
    rating: 5,
    comment: 'Rất hay và dễ hiểu!',
    helpful: 10,
    not_helpful: 0,
    verified: true,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: null,
  },
  {
    id: 2,
    course_id: 2,
    user_id: 202,
    rating: 4,
    comment: 'Nội dung tốt, nên có thêm ví dụ.',
    helpful: 5,
    not_helpful: 1,
    verified: true,
    created_at: '2024-03-15T00:00:00Z',
    updated_at: null,
  },
];

export const mockRelatedCourses = [
  {
    id: 1,
    course_id: 1,
    related_course_id: 2,
    created_at: '2024-02-01T00:00:00Z',
  },
];

export const mockCourseLanguages = [
  {
    id: 1,
    course_id: 1,
    language: 'English',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: null,
  },
  {
    id: 2,
    course_id: 2,
    language: 'Vietnamese',
    created_at: '2024-02-10T00:00:00Z',
    updated_at: null,
  },
];
