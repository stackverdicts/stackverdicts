/**
 * Seed script for blog posts, tags, and their relationships
 *
 * Usage:
 *   npx tsx src/scripts/seed-blog-posts.ts
 *
 * This script will:
 * 1. First check for and create an admin user if needed (required as author)
 * 2. Insert all tags (skipping duplicates)
 * 3. Insert all blog posts (skipping duplicates)
 * 4. Insert blog post tag relationships (skipping duplicates)
 */

import { pool } from '../config/database';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';

// Default admin user ID - will be created if doesn't exist
const DEFAULT_AUTHOR_ID = '2aa9a721-6a63-479c-86e1-142f23df5c15';

const tags = [
  {"id": "470956eb-8efd-4016-9f69-6fe52d5550cb", "name": "Performance", "slug": "performance", "created_at": "2025-11-16 11:24:47"},
  {"id": "49f3327b-e616-48c8-bc1e-194dacc8f112", "name": "Security", "slug": "security", "created_at": "2025-11-16 11:24:47"},
  {"id": "8d16c5b6-e39e-43f7-9697-ac579acb6672", "name": "Tutorials", "slug": "tutorials", "created_at": "2025-11-16 11:24:47"},
  {"id": "8dac02f5-5db1-4fb6-a755-704710bb474d", "name": "Hosting", "slug": "hosting", "created_at": "2025-11-16 11:24:47"},
  {"id": "a4ae031f-57aa-40ef-81e7-5f9ae00b6d2a", "name": "Cloud", "slug": "cloud", "created_at": "2025-11-16 11:24:47"},
  {"id": "f5af6b5a-66e6-4631-8119-cdb4d0ea35df", "name": "DevOps", "slug": "devops", "created_at": "2025-11-16 11:24:47"},
  {"id": "tag_Cjsm2iBH6oH0mTq5", "name": "dans test tag", "slug": "dan-rules", "created_at": "2025-11-29 13:44:51"}
];

const blogPosts = [
  {
    "id": "034139a4-83ad-41d0-a487-f8e69dff7e07",
    "title": "Serverless Functions: Building with AWS Lambda",
    "slug": "serverless-functions-building-with-aws-lambda",
    "content": `
        <h2>Introduction</h2>
        <p>Get started with serverless computing using AWS Lambda and reduce infrastructure overhead.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Get started with serverless computing using AWS Lambda and reduce infrastructure overhead.",
    "featured_image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
    "youtube_video_id": "dQw4w9WgXcQ",
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Serverless Functions: Building with AWS Lambda",
    "seo_description": "Get started with serverless computing using AWS Lambda and reduce infrastructure overhead.",
    "canonical_url": "https://stackverdicts.com/blog/serverless-functions-building-with-aws-lambda",
    "og_title": "Serverless Functions: Building with AWS Lambda",
    "og_description": "Get started with serverless computing using AWS Lambda and reduce infrastructure overhead.",
    "og_image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
    "twitter_title": "Serverless Functions: Building with AWS Lambda",
    "twitter_description": "Get started with serverless computing using AWS Lambda and reduce infrastructure overhead.",
    "twitter_image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800"
  },
  {
    "id": "18041911-1ac8-4bd8-b9b9-58cc8bee401b",
    "title": "Building Scalable APIs with Node.js and Express",
    "slug": "building-scalable-apis-with-node-js-and-express",
    "content": `
        <h2>Introduction</h2>
        <p>Discover best practices for building robust and maintainable REST APIs using Node.js and Express framework.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Discover best practices for building robust and maintainable REST APIs using Node.js and Express framework.",
    "featured_image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    "youtube_video_id": "Tn6-PIqc4UM",
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Building Scalable APIs with Node.js and Express",
    "seo_description": "Discover best practices for building robust and maintainable REST APIs using Node.js and Express framework.",
    "canonical_url": "https://stackverdicts.com/blog/building-scalable-apis-with-node-js-and-express",
    "og_title": "Building Scalable APIs with Node.js and Express",
    "og_description": "Discover best practices for building robust and maintainable REST APIs using Node.js and Express framework.",
    "og_image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    "twitter_title": "Building Scalable APIs with Node.js and Express",
    "twitter_description": "Discover best practices for building robust and maintainable REST APIs using Node.js and Express framework.",
    "twitter_image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800"
  },
  {
    "id": "401083fe-f6d1-4f5d-9820-da4c692fce07",
    "title": "State Management in React: Redux vs Context API",
    "slug": "state-management-in-react-redux-vs-context-api",
    "content": `
        <h2>Introduction</h2>
        <p>Compare different state management solutions and choose the right one for your React app.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Compare different state management solutions and choose the right one for your React app.",
    "featured_image": "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800",
    "youtube_video_id": "kj8hU9_eqbA",
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "State Management in React: Redux vs Context API",
    "seo_description": "Compare different state management solutions and choose the right one for your React app.",
    "canonical_url": "https://stackverdicts.com/blog/state-management-in-react-redux-vs-context-api",
    "og_title": "State Management in React: Redux vs Context API",
    "og_description": "Compare different state management solutions and choose the right one for your React app.",
    "og_image": "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800",
    "twitter_title": "State Management in React: Redux vs Context API",
    "twitter_description": "Compare different state management solutions and choose the right one for your React app.",
    "twitter_image": "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800"
  },
  {
    "id": "61eec8ea-b566-46bd-bbed-18aee60d6921",
    "title": "TypeScript Tips and Tricks for Better Code Quality",
    "slug": "typescript-tips-and-tricks-for-better-code-quality",
    "content": `
        <h2>Introduction</h2>
        <p>Improve your TypeScript skills with advanced patterns and techniques used by professional developers.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Improve your TypeScript skills with advanced patterns and techniques used by professional developers.",
    "featured_image": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800",
    "youtube_video_id": "ahCwqrYpIuM",
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "TypeScript Tips and Tricks for Better Code Quality",
    "seo_description": "Improve your TypeScript skills with advanced patterns and techniques used by professional developers.",
    "canonical_url": "https://stackverdicts.com/blog/typescript-tips-and-tricks-for-better-code-quality",
    "og_title": "TypeScript Tips and Tricks for Better Code Quality",
    "og_description": "Improve your TypeScript skills with advanced patterns and techniques used by professional developers.",
    "og_image": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800",
    "twitter_title": "TypeScript Tips and Tricks for Better Code Quality",
    "twitter_description": "Improve your TypeScript skills with advanced patterns and techniques used by professional developers.",
    "twitter_image": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800"
  },
  {
    "id": "63e828d6-f2d5-45a9-8b13-b919f70d8a7b",
    "title": "CSS Grid vs Flexbox: When to Use Each",
    "slug": "css-grid-vs-flexbox-when-to-use-each",
    "content": `
        <h2>Introduction</h2>
        <p>Master CSS layout techniques and know when to use Grid vs Flexbox for your designs.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Master CSS layout techniques and know when to use Grid vs Flexbox for your designs.",
    "featured_image": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800",
    "youtube_video_id": "RSIclWvNTdQ",
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "CSS Grid vs Flexbox: When to Use Each",
    "seo_description": "Master CSS layout techniques and know when to use Grid vs Flexbox for your designs.",
    "canonical_url": "https://stackverdicts.com/blog/css-grid-vs-flexbox-when-to-use-each",
    "og_title": "CSS Grid vs Flexbox: When to Use Each",
    "og_description": "Master CSS layout techniques and know when to use Grid vs Flexbox for your designs.",
    "og_image": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800",
    "twitter_title": "CSS Grid vs Flexbox: When to Use Each",
    "twitter_description": "Master CSS layout techniques and know when to use Grid vs Flexbox for your designs.",
    "twitter_image": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800"
  },
  {
    "id": "66d58e50-5de9-4a41-87ce-5c53dff78626",
    "title": "Testing React Applications with Jest and Testing Library",
    "slug": "testing-react-applications-with-jest-and-testing-library",
    "content": `
        <h2>Introduction</h2>
        <p>Write comprehensive tests for your React components using Jest and React Testing Library.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Write comprehensive tests for your React components using Jest and React Testing Library.",
    "featured_image": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "youtube_video_id": "JKO8fEu-Gzk",
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Testing React Applications with Jest and Testing Library",
    "seo_description": "Write comprehensive tests for your React components using Jest and React Testing Library.",
    "canonical_url": "https://stackverdicts.com/blog/testing-react-applications-with-jest-and-testing-library",
    "og_title": "Testing React Applications with Jest and Testing Library",
    "og_description": "Write comprehensive tests for your React components using Jest and React Testing Library.",
    "og_image": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "twitter_title": "Testing React Applications with Jest and Testing Library",
    "twitter_description": "Write comprehensive tests for your React components using Jest and React Testing Library.",
    "twitter_image": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"
  },
  {
    "id": "76d0939e-43e1-4e62-bb20-a447bd876a3d",
    "title": "Creating Custom Hooks in React: A Deep Dive",
    "slug": "creating-custom-hooks-in-react-a-deep-dive",
    "content": `
        <h2>Introduction</h2>
        <p>Learn how to create reusable and testable custom hooks to share logic across React components.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Learn how to create reusable and testable custom hooks to share logic across React components.",
    "featured_image": "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800",
    "youtube_video_id": "O6P86uwfdR0",
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Creating Custom Hooks in React: A Deep Dive",
    "seo_description": "Learn how to create reusable and testable custom hooks to share logic across React components.",
    "canonical_url": "https://stackverdicts.com/blog/creating-custom-hooks-in-react-a-deep-dive",
    "og_title": "Creating Custom Hooks in React: A Deep Dive",
    "og_description": "Learn how to create reusable and testable custom hooks to share logic across React components.",
    "og_image": "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800",
    "twitter_title": "Creating Custom Hooks in React: A Deep Dive",
    "twitter_description": "Learn how to create reusable and testable custom hooks to share logic across React components.",
    "twitter_image": "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800"
  },
  {
    "id": "7d56c5f8-fae7-4370-a3b9-d10edc491f0b",
    "title": "Building a Real-Time Chat App with Socket.io",
    "slug": "building-a-real-time-chat-app-with-socket-io",
    "content": `
        <h2>Introduction</h2>
        <p>Build a real-time messaging application using Socket.io and learn WebSocket communication patterns.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Build a real-time messaging application using Socket.io and learn WebSocket communication patterns.",
    "featured_image": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800",
    "youtube_video_id": "pBy1zgt0XPc",
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Building a Real-Time Chat App with Socket.io",
    "seo_description": "Build a real-time messaging application using Socket.io and learn WebSocket communication patterns.",
    "canonical_url": "https://stackverdicts.com/blog/building-a-real-time-chat-app-with-socket-io",
    "og_title": "Building a Real-Time Chat App with Socket.io",
    "og_description": "Build a real-time messaging application using Socket.io and learn WebSocket communication patterns.",
    "og_image": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800",
    "twitter_title": "Building a Real-Time Chat App with Socket.io",
    "twitter_description": "Build a real-time messaging application using Socket.io and learn WebSocket communication patterns.",
    "twitter_image": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800"
  },
  {
    "id": "7f466cf6-f23f-4ef6-9791-b4f11931d97d",
    "title": "Docker for Developers: Containerization Made Easy",
    "slug": "docker-for-developers-containerization-made-easy",
    "content": `
        <h2>Introduction</h2>
        <p>Learn how to containerize your applications with Docker for consistent development and deployment.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Learn how to containerize your applications with Docker for consistent development and deployment.",
    "featured_image": "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800",
    "youtube_video_id": "Gjnup-PuquQ",
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Docker for Developers: Containerization Made Easy",
    "seo_description": "Learn how to containerize your applications with Docker for consistent development and deployment.",
    "canonical_url": "https://stackverdicts.com/blog/docker-for-developers-containerization-made-easy",
    "og_title": "Docker for Developers: Containerization Made Easy",
    "og_description": "Learn how to containerize your applications with Docker for consistent development and deployment.",
    "og_image": "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800",
    "twitter_title": "Docker for Developers: Containerization Made Easy",
    "twitter_description": "Learn how to containerize your applications with Docker for consistent development and deployment.",
    "twitter_image": "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800"
  },
  {
    "id": "86affbc5-27ef-4245-8278-33ad3e1b4cb9",
    "title": "Mastering Git: Advanced Techniques for Developers",
    "slug": "mastering-git-advanced-techniques-for-developers",
    "content": `
        <h2>Introduction</h2>
        <p>Take your Git skills to the next level with advanced branching strategies and workflow optimizations.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Take your Git skills to the next level with advanced branching strategies and workflow optimizations.",
    "featured_image": "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=800",
    "youtube_video_id": "RGOj5yH7evk",
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Mastering Git: Advanced Techniques for Developers",
    "seo_description": "Take your Git skills to the next level with advanced branching strategies and workflow optimizations.",
    "canonical_url": "https://stackverdicts.com/blog/mastering-git-advanced-techniques-for-developers",
    "og_title": "Mastering Git: Advanced Techniques for Developers",
    "og_description": "Take your Git skills to the next level with advanced branching strategies and workflow optimizations.",
    "og_image": "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=800",
    "twitter_title": "Mastering Git: Advanced Techniques for Developers",
    "twitter_description": "Take your Git skills to the next level with advanced branching strategies and workflow optimizations.",
    "twitter_image": "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=800"
  },
  {
    "id": "8d5adee8-e7fd-4cca-b211-d298fd02605b",
    "title": "Tailwind CSS Best Practices for Modern Web Design",
    "slug": "tailwind-css-best-practices-for-modern-web-design",
    "content": `
        <h2>Introduction</h2>
        <p>Master Tailwind CSS utility-first approach and create beautiful, responsive designs efficiently.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Master Tailwind CSS utility-first approach and create beautiful, responsive designs efficiently.",
    "featured_image": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
    "youtube_video_id": null,
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Tailwind CSS Best Practices for Modern Web Design",
    "seo_description": "Master Tailwind CSS utility-first approach and create beautiful, responsive designs efficiently.",
    "canonical_url": "https://stackverdicts.com/blog/tailwind-css-best-practices-for-modern-web-design",
    "og_title": "Tailwind CSS Best Practices for Modern Web Design",
    "og_description": "Master Tailwind CSS utility-first approach and create beautiful, responsive designs efficiently.",
    "og_image": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
    "twitter_title": "Tailwind CSS Best Practices for Modern Web Design",
    "twitter_description": "Master Tailwind CSS utility-first approach and create beautiful, responsive designs efficiently.",
    "twitter_image": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"
  },
  {
    "id": "92256970-445e-4339-b7b5-6e776912b79f",
    "title": "Deploying Full-Stack Applications to Vercel",
    "slug": "deploying-full-stack-applications-to-vercel",
    "content": `
        <h2>Introduction</h2>
        <p>Step-by-step guide to deploying your full-stack applications to Vercel with continuous deployment.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Step-by-step guide to deploying your full-stack applications to Vercel with continuous deployment.",
    "featured_image": "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800",
    "youtube_video_id": null,
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Deploying Full-Stack Applications to Vercel",
    "seo_description": "Step-by-step guide to deploying your full-stack applications to Vercel with continuous deployment.",
    "canonical_url": "https://stackverdicts.com/blog/deploying-full-stack-applications-to-vercel",
    "og_title": "Deploying Full-Stack Applications to Vercel",
    "og_description": "Step-by-step guide to deploying your full-stack applications to Vercel with continuous deployment.",
    "og_image": "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800",
    "twitter_title": "Deploying Full-Stack Applications to Vercel",
    "twitter_description": "Step-by-step guide to deploying your full-stack applications to Vercel with continuous deployment.",
    "twitter_image": "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800"
  },
  {
    "id": "9b92b6a5-b610-4570-b074-4bc294137caa",
    "title": "Web Performance Optimization: Core Web Vitals Explained",
    "slug": "web-performance-optimization-core-web-vitals-explained",
    "content": `
        <h2>Introduction</h2>
        <p>Optimize your website's performance and improve Core Web Vitals scores for better user experience.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Optimize your website's performance and improve Core Web Vitals scores for better user experience.",
    "featured_image": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800",
    "youtube_video_id": null,
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Web Performance Optimization: Core Web Vitals Explained",
    "seo_description": "Optimize your website's performance and improve Core Web Vitals scores for better user experience.",
    "canonical_url": "https://stackverdicts.com/blog/web-performance-optimization-core-web-vitals-explained",
    "og_title": "Web Performance Optimization: Core Web Vitals Explained",
    "og_description": "Optimize your website's performance and improve Core Web Vitals scores for better user experience.",
    "og_image": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800",
    "twitter_title": "Web Performance Optimization: Core Web Vitals Explained",
    "twitter_description": "Optimize your website's performance and improve Core Web Vitals scores for better user experience.",
    "twitter_image": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800"
  },
  {
    "id": "b275064b-f413-415b-aaa5-f19cf38ac0ff",
    "title": "MongoDB vs PostgreSQL: Which Database Should You Choose?",
    "slug": "mongodb-vs-postgresql-which-database-should-you-choose",
    "content": `
        <h2>Introduction</h2>
        <p>Compare MongoDB and PostgreSQL to make an informed decision for your next project's database needs.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Compare MongoDB and PostgreSQL to make an informed decision for your next project's database needs.",
    "featured_image": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800",
    "youtube_video_id": null,
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "MongoDB vs PostgreSQL: Which Database Should You Choose?",
    "seo_description": "Compare MongoDB and PostgreSQL to make an informed decision for your next project's database needs.",
    "canonical_url": "https://stackverdicts.com/blog/mongodb-vs-postgresql-which-database-should-you-choose",
    "og_title": "MongoDB vs PostgreSQL: Which Database Should You Choose?",
    "og_description": "Compare MongoDB and PostgreSQL to make an informed decision for your next project's database needs.",
    "og_image": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800",
    "twitter_title": "MongoDB vs PostgreSQL: Which Database Should You Choose?",
    "twitter_description": "Compare MongoDB and PostgreSQL to make an informed decision for your next project's database needs.",
    "twitter_image": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800"
  },
  {
    "id": "b73c639a-e5a2-4ad8-b33d-049161c57af7",
    "title": "Authentication Best Practices with JWT and OAuth",
    "slug": "authentication-best-practices-with-jwt-and-oauth",
    "content": `
        <h2>Introduction</h2>
        <p>Implement secure authentication in your applications using modern JWT and OAuth2 standards.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Implement secure authentication in your applications using modern JWT and OAuth2 standards.",
    "featured_image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    "youtube_video_id": null,
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Authentication Best Practices with JWT and OAuth",
    "seo_description": "Implement secure authentication in your applications using modern JWT and OAuth2 standards.",
    "canonical_url": "https://stackverdicts.com/blog/authentication-best-practices-with-jwt-and-oauth",
    "og_title": "Authentication Best Practices with JWT and OAuth",
    "og_description": "Implement secure authentication in your applications using modern JWT and OAuth2 standards.",
    "og_image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    "twitter_title": "Authentication Best Practices with JWT and OAuth",
    "twitter_description": "Implement secure authentication in your applications using modern JWT and OAuth2 standards.",
    "twitter_image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800"
  },
  {
    "id": "bfae2b02-8dda-4ecb-b654-63f5fb84e2f8",
    "title": "Getting Started with Next.js 14: A Complete Guide",
    "slug": "getting-started-with-next-js-14-a-complete-guide",
    "content": `
        <h2>Introduction</h2>
        <p>Learn the fundamentals of Next.js 14 and build production-ready applications with server-side rendering and static generation.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Learn the fundamentals of Next.js 14 and build production-ready applications with server-side rendering and static generation.",
    "featured_image": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800",
    "youtube_video_id": null,
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Getting Started with Next.js 14: A Complete Guide",
    "seo_description": "Learn the fundamentals of Next.js 14 and build production-ready applications with server-side rendering and static generation.",
    "canonical_url": "https://stackverdicts.com/blog/getting-started-with-next-js-14-a-complete-guide",
    "og_title": "Getting Started with Next.js 14: A Complete Guide",
    "og_description": "Learn the fundamentals of Next.js 14 and build production-ready applications with server-side rendering and static generation.",
    "og_image": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800",
    "twitter_title": "Getting Started with Next.js 14: A Complete Guide",
    "twitter_description": "Learn the fundamentals of Next.js 14 and build production-ready applications with server-side rendering and static generation.",
    "twitter_image": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800"
  },
  {
    "id": "e8454e0a-d345-4a46-b4b5-91317b797dfc",
    "title": "GraphQL vs REST: Making the Right Choice for Your API",
    "slug": "graphql-vs-rest-making-the-right-choice-for-your-api",
    "content": `
        <h2>Introduction</h2>
        <p>Understand the differences between GraphQL and REST to choose the best API architecture.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Understand the differences between GraphQL and REST to choose the best API architecture.",
    "featured_image": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
    "youtube_video_id": null,
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "GraphQL vs REST: Making the Right Choice for Your API",
    "seo_description": "Understand the differences between GraphQL and REST to choose the best API architecture.",
    "canonical_url": "https://stackverdicts.com/blog/graphql-vs-rest-making-the-right-choice-for-your-api",
    "og_title": "GraphQL vs REST: Making the Right Choice for Your API",
    "og_description": "Understand the differences between GraphQL and REST to choose the best API architecture.",
    "og_image": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
    "twitter_title": "GraphQL vs REST: Making the Right Choice for Your API",
    "twitter_description": "Understand the differences between GraphQL and REST to choose the best API architecture.",
    "twitter_image": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"
  },
  {
    "id": "ed3cae07-f547-4e6b-bbd5-8840e81af074",
    "title": "React Server Components: The Future of React",
    "slug": "react-server-components-the-future-of-react",
    "content": `
        <h2>Introduction</h2>
        <p>Explore React Server Components and how they revolutionize the way we build React applications.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Explore React Server Components and how they revolutionize the way we build React applications.",
    "featured_image": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    "youtube_video_id": null,
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "React Server Components: The Future of React",
    "seo_description": "Explore React Server Components and how they revolutionize the way we build React applications.",
    "canonical_url": "https://stackverdicts.com/blog/react-server-components-the-future-of-react",
    "og_title": "React Server Components: The Future of React",
    "og_description": "Explore React Server Components and how they revolutionize the way we build React applications.",
    "og_image": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    "twitter_title": "React Server Components: The Future of React",
    "twitter_description": "Explore React Server Components and how they revolutionize the way we build React applications.",
    "twitter_image": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800"
  },
  {
    "id": "fa52772d-3bc5-460a-aac7-6b2d70d9bc23",
    "title": "Microservices Architecture: Pros and Cons",
    "slug": "microservices-architecture-pros-and-cons",
    "content": `
        <h2>Introduction</h2>
        <p>Explore microservices architecture patterns and learn when to use them in your projects.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Explore microservices architecture patterns and learn when to use them in your projects.",
    "featured_image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    "youtube_video_id": null,
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Microservices Architecture: Pros and Cons",
    "seo_description": "Explore microservices architecture patterns and learn when to use them in your projects.",
    "canonical_url": "https://stackverdicts.com/blog/microservices-architecture-pros-and-cons",
    "og_title": "Microservices Architecture: Pros and Cons",
    "og_description": "Explore microservices architecture patterns and learn when to use them in your projects.",
    "og_image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    "twitter_title": "Microservices Architecture: Pros and Cons",
    "twitter_description": "Explore microservices architecture patterns and learn when to use them in your projects.",
    "twitter_image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800"
  },
  {
    "id": "fc121671-39c4-4420-b85a-c12567323bc5",
    "title": "Understanding JavaScript Closures and Scope",
    "slug": "understanding-javascript-closures-and-scope",
    "content": `
        <h2>Introduction</h2>
        <p>Deep dive into JavaScript closures and scope to write more efficient and bug-free code.</p>

        <h2>Getting Started</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>Basic understanding of JavaScript</li>
          <li>Node.js installed on your machine</li>
          <li>Familiarity with command line tools</li>
        </ul>

        <h2>Key Concepts</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

        <h2>Implementation</h2>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

        <h2>Best Practices</h2>
        <ol>
          <li>Always follow coding standards</li>
          <li>Write comprehensive documentation</li>
          <li>Test your code thoroughly</li>
          <li>Use version control effectively</li>
        </ol>

        <h2>Conclusion</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
      `,
    "excerpt": "Deep dive into JavaScript closures and scope to write more efficient and bug-free code.",
    "featured_image": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
    "youtube_video_id": null,
    "published_at": "2025-11-15 20:25:10",
    "seo_title": "Understanding JavaScript Closures and Scope",
    "seo_description": "Deep dive into JavaScript closures and scope to write more efficient and bug-free code.",
    "canonical_url": "https://stackverdicts.com/blog/understanding-javascript-closures-and-scope",
    "og_title": "Understanding JavaScript Closures and Scope",
    "og_description": "Deep dive into JavaScript closures and scope to write more efficient and bug-free code.",
    "og_image": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
    "twitter_title": "Understanding JavaScript Closures and Scope",
    "twitter_description": "Deep dive into JavaScript closures and scope to write more efficient and bug-free code.",
    "twitter_image": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800"
  }
];

const blogPostTags = [
  {"id": "bpt_BFZiUqRAUrLZjNw-", "post_id": "post_wF-IAIbilvthbLmn", "tag_id": "tag_Cjsm2iBH6oH0mTq5", "assigned_at": "2025-11-29 13:48:09"}
];

async function ensureAuthorExists() {
  console.log('Checking for author user...');

  const [rows] = await pool.execute(
    'SELECT id FROM users WHERE id = ?',
    [DEFAULT_AUTHOR_ID]
  );

  if ((rows as any[]).length === 0) {
    console.log('Creating default author user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.execute(
      `INSERT INTO users (id, email, password, name, role, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [DEFAULT_AUTHOR_ID, 'admin@stackverdicts.com', hashedPassword, 'Admin', 'admin']
    );
    console.log('Default author user created.');
  } else {
    console.log('Author user already exists.');
  }
}

async function seedTags() {
  console.log('\nSeeding tags...');
  let inserted = 0;
  let skipped = 0;

  for (const tag of tags) {
    try {
      await pool.execute(
        `INSERT IGNORE INTO tags (id, name, slug, created_at) VALUES (?, ?, ?, ?)`,
        [tag.id, tag.name, tag.slug, tag.created_at]
      );
      inserted++;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        skipped++;
      } else {
        throw error;
      }
    }
  }

  console.log(`Tags: ${inserted} inserted, ${skipped} skipped (duplicates)`);
}

async function seedBlogPosts() {
  console.log('\nSeeding blog posts...');
  let inserted = 0;
  let skipped = 0;

  for (const post of blogPosts) {
    try {
      await pool.execute(
        `INSERT IGNORE INTO blog_posts (
          id, title, slug, content, excerpt, featured_image, youtube_video_id,
          published_at, author_id, seo_title, seo_description, canonical_url,
          og_title, og_description, og_image, twitter_title, twitter_description, twitter_image,
          meta_robots_noindex, meta_robots_nofollow, \`order\`, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          post.id,
          post.title,
          post.slug,
          post.content,
          post.excerpt,
          post.featured_image,
          post.youtube_video_id,
          post.published_at,
          DEFAULT_AUTHOR_ID,
          post.seo_title,
          post.seo_description,
          post.canonical_url,
          post.og_title,
          post.og_description,
          post.og_image,
          post.twitter_title,
          post.twitter_description,
          post.twitter_image,
          0, // meta_robots_noindex
          0, // meta_robots_nofollow
          0  // order
        ]
      );
      inserted++;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        skipped++;
      } else {
        throw error;
      }
    }
  }

  console.log(`Blog posts: ${inserted} inserted, ${skipped} skipped (duplicates)`);
}

async function seedBlogPostTags() {
  console.log('\nSeeding blog post tags...');
  let inserted = 0;
  let skipped = 0;

  for (const bpt of blogPostTags) {
    try {
      await pool.execute(
        `INSERT IGNORE INTO blog_post_tags (id, post_id, tag_id, assigned_at) VALUES (?, ?, ?, ?)`,
        [bpt.id, bpt.post_id, bpt.tag_id, bpt.assigned_at]
      );
      inserted++;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        skipped++;
      } else {
        throw error;
      }
    }
  }

  console.log(`Blog post tags: ${inserted} inserted, ${skipped} skipped (duplicates)`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('Blog Posts Seed Script');
  console.log('='.repeat(60));

  try {
    await ensureAuthorExists();
    await seedTags();
    await seedBlogPosts();
    await seedBlogPostTags();

    console.log('\n' + '='.repeat(60));
    console.log('Seeding completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
