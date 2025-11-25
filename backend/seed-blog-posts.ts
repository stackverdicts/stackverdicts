import { randomUUID } from 'crypto';
import { query } from './src/config/database';

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800', // Laptop
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800', // Coding
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800', // Computer desk
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800', // Code on screen
  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800', // Desk setup
  'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800', // Office workspace
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800', // Coding laptop
  'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=800', // Code editor
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800', // Programming
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800', // Technology
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800', // Laptop work
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', // Team coding
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800', // Developer
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800', // Developer tools
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800', // Data center
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800', // Server room
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', // Tech abstract
  'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800', // Code screen
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', // Programming
  'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800', // Web development
];

const BLOG_TITLES = [
  'Getting Started with Next.js 14: A Complete Guide',
  'Building Scalable APIs with Node.js and Express',
  'React Server Components: The Future of React',
  'Tailwind CSS Best Practices for Modern Web Design',
  'TypeScript Tips and Tricks for Better Code Quality',
  'Deploying Full-Stack Applications to Vercel',
  'MongoDB vs PostgreSQL: Which Database Should You Choose?',
  'Mastering Git: Advanced Techniques for Developers',
  'Creating Custom Hooks in React: A Deep Dive',
  'Web Performance Optimization: Core Web Vitals Explained',
  'Building a Real-Time Chat App with Socket.io',
  'Understanding JavaScript Closures and Scope',
  'Docker for Developers: Containerization Made Easy',
  'GraphQL vs REST: Making the Right Choice for Your API',
  'Authentication Best Practices with JWT and OAuth',
  'Microservices Architecture: Pros and Cons',
  'Testing React Applications with Jest and Testing Library',
  'CSS Grid vs Flexbox: When to Use Each',
  'Serverless Functions: Building with AWS Lambda',
  'State Management in React: Redux vs Context API'
];

const BLOG_EXCERPTS = [
  'Learn the fundamentals of Next.js 14 and build production-ready applications with server-side rendering and static generation.',
  'Discover best practices for building robust and maintainable REST APIs using Node.js and Express framework.',
  'Explore React Server Components and how they revolutionize the way we build React applications.',
  'Master Tailwind CSS utility-first approach and create beautiful, responsive designs efficiently.',
  'Improve your TypeScript skills with advanced patterns and techniques used by professional developers.',
  'Step-by-step guide to deploying your full-stack applications to Vercel with continuous deployment.',
  'Compare MongoDB and PostgreSQL to make an informed decision for your next project\'s database needs.',
  'Take your Git skills to the next level with advanced branching strategies and workflow optimizations.',
  'Learn how to create reusable and testable custom hooks to share logic across React components.',
  'Optimize your website\'s performance and improve Core Web Vitals scores for better user experience.',
  'Build a real-time messaging application using Socket.io and learn WebSocket communication patterns.',
  'Deep dive into JavaScript closures and scope to write more efficient and bug-free code.',
  'Learn how to containerize your applications with Docker for consistent development and deployment.',
  'Understand the differences between GraphQL and REST to choose the best API architecture.',
  'Implement secure authentication in your applications using modern JWT and OAuth2 standards.',
  'Explore microservices architecture patterns and learn when to use them in your projects.',
  'Write comprehensive tests for your React components using Jest and React Testing Library.',
  'Master CSS layout techniques and know when to use Grid vs Flexbox for your designs.',
  'Get started with serverless computing using AWS Lambda and reduce infrastructure overhead.',
  'Compare different state management solutions and choose the right one for your React app.'
];

async function seedBlogPosts() {
  try {
    console.log('🌱 Starting blog post seeding...');

    // Get admin user ID
    const admin = await query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
    if (!admin || admin.length === 0) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    const authorId = admin[0].id;

    for (let i = 0; i < 20; i++) {
      const postId = randomUUID();
      const title = BLOG_TITLES[i];
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const excerpt = BLOG_EXCERPTS[i];
      const featuredImage = UNSPLASH_IMAGES[i];

      const content = `
        <h2>Introduction</h2>
        <p>${excerpt}</p>

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
      `;

      const seoTitle = title.substring(0, 60);
      const seoDescription = excerpt.substring(0, 160);

      await query(
        `INSERT INTO blog_posts (
          id, title, slug, content, excerpt, featured_image,
          author_id, published_at,
          seo_title, seo_description, canonical_url,
          og_title, og_description, og_image,
          twitter_title, twitter_description, twitter_image,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          postId, title, slug, content, excerpt, featuredImage,
          authorId,
          seoTitle, seoDescription, `https://stackverdicts.com/blog/${slug}`,
          title, seoDescription, featuredImage,
          title, seoDescription, featuredImage
        ]
      );

      console.log(`✅ Created post ${i + 1}/20: ${title}`);
    }

    console.log('\n🎉 Successfully seeded 20 blog posts!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding blog posts:', error);
    process.exit(1);
  }
}

seedBlogPosts();
