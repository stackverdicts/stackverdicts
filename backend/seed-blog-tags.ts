import { query } from './src/config/database';
import { randomUUID } from 'crypto';

async function seedTags() {
  console.log('Creating test tags...');

  const tags = [
    { name: 'Hosting', slug: 'hosting' },
    { name: 'Cloud', slug: 'cloud' },
    { name: 'DevOps', slug: 'devops' },
    { name: 'Security', slug: 'security' },
    { name: 'Performance', slug: 'performance' },
    { name: 'Tutorials', slug: 'tutorials' },
    { name: 'Reviews', slug: 'reviews' },
    { name: 'Comparisons', slug: 'comparisons' },
  ];

  const tagIds: string[] = [];

  for (const tag of tags) {
    const id = randomUUID();
    await query(
      `INSERT INTO tags (id, name, slug, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [id, tag.name, tag.slug]
    );
    tagIds.push(id);
    console.log(`Created tag: ${tag.name}`);
  }

  // Get all existing blog posts
  const postsResult = await query('SELECT id, title FROM blog_posts') as any;
  const posts = Array.isArray(postsResult[0]) ? postsResult[0] : postsResult;

  console.log(`\nAssigning tags to ${posts.length} posts...`);

  // Assign 1-3 random tags to each post
  for (const post of posts) {
    // Remove existing tag assignments for this post
    await query('DELETE FROM blog_post_tags WHERE post_id = ?', [post.id]);

    // Randomly select 1-3 tags
    const numTags = Math.floor(Math.random() * 3) + 1;
    const shuffledTagIds = [...tagIds].sort(() => Math.random() - 0.5);
    const selectedTagIds = shuffledTagIds.slice(0, numTags);

    for (const tagId of selectedTagIds) {
      const junctionId = randomUUID();
      await query(
        `INSERT IGNORE INTO blog_post_tags (id, post_id, tag_id)
         VALUES (?, ?, ?)`,
        [junctionId, post.id, tagId]
      );
    }

    console.log(`Assigned ${numTags} tags to: ${post.title}`);
  }

  console.log('\nTag seeding complete!');
  process.exit(0);
}

seedTags().catch((err) => {
  console.error('Error seeding tags:', err);
  process.exit(1);
});
