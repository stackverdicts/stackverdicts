import { query, queryOne, insert } from '../config/database';
import { generateId } from '../utils/id-generator';
import { logger } from '../utils/logger';

interface BlogPostData {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  youtubeVideoId?: string;
  publishedAt?: Date | null;
  publishDateOverride?: Date | null;
  author_id?: string;

  // SEO Fields
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  metaRobotsNoindex?: boolean;
  metaRobotsNofollow?: boolean;

  // Hierarchy
  parentId?: string | null;
  order?: number;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
}

class BlogService {
  /**
   * Get all blog posts (admin view with hierarchy)
   */
  async getAllPosts(options: {
    includeUnpublished?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const { includeUnpublished = false, limit, offset } = options;

    let sql = `
      SELECT
        bp.*,
        COUNT(DISTINCT bpt.tag_id) as tag_count
      FROM blog_posts bp
      LEFT JOIN blog_post_tags bpt ON bp.id = bpt.post_id
      WHERE bp.parent_id IS NULL
    `;

    if (!includeUnpublished) {
      sql += ` AND bp.published_at IS NOT NULL`;
    }

    sql += `
      GROUP BY bp.id
      ORDER BY bp.\`order\` ASC, bp.created_at DESC
    `;

    if (limit) {
      sql += ` LIMIT ${limit}`;
      if (offset) {
        sql += ` OFFSET ${offset}`;
      }
    }

    const posts = await query(sql);

    // Fetch tags and children for each post
    for (const post of posts) {
      post.tags = await this.getPostTags(post.id);
      post.children = await this.getChildPosts(post.id, includeUnpublished);
    }

    return posts;
  }

  /**
   * Get child posts
   */
  private async getChildPosts(parentId: string, includeUnpublished: boolean = false): Promise<any[]> {
    let sql = `
      SELECT
        bp.*,
        COUNT(DISTINCT bpt.tag_id) as tag_count
      FROM blog_posts bp
      LEFT JOIN blog_post_tags bpt ON bp.id = bpt.post_id
      WHERE bp.parent_id = ?
    `;

    if (!includeUnpublished) {
      sql += ` AND bp.published_at IS NOT NULL`;
    }

    sql += `
      GROUP BY bp.id
      ORDER BY bp.\`order\` ASC, bp.created_at DESC
    `;

    const children = await query(sql, [parentId]);

    // Recursively fetch tags and children
    for (const child of children) {
      child.tags = await this.getPostTags(child.id);
      child.children = await this.getChildPosts(child.id, includeUnpublished);
    }

    return children;
  }

  /**
   * Get post by ID
   */
  async getPostById(id: string): Promise<any | null> {
    const post = await queryOne(
      'SELECT * FROM blog_posts WHERE id = ?',
      [id]
    );

    if (!post) return null;

    post.tags = await this.getPostTags(id);
    post.children = await this.getChildPosts(id, true);

    return post;
  }

  /**
   * Get post by slug
   */
  async getPostBySlug(slug: string, includeUnpublished: boolean = false): Promise<any | null> {
    let sql = 'SELECT * FROM blog_posts WHERE slug = ?';

    if (!includeUnpublished) {
      sql += ' AND published_at IS NOT NULL';
    }

    const post = await queryOne(sql, [slug]);

    if (!post) return null;

    post.tags = await this.getPostTags(post.id);
    post.children = await this.getChildPosts(post.id, includeUnpublished);

    return post;
  }

  /**
   * Create new blog post
   */
  async createPost(data: BlogPostData, authorId: string): Promise<any> {
    const postId = generateId('post');

    // Generate slug if not provided
    let slug = data.slug;
    if (!slug) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Ensure unique slug
    const existingPost = await queryOne(
      'SELECT id FROM blog_posts WHERE slug = ?',
      [slug]
    );

    if (existingPost) {
      slug = `${slug}-${Date.now()}`;
    }

    await insert(
      `INSERT INTO blog_posts (
        id, title, slug, content, excerpt, featured_image, youtube_video_id,
        published_at, publish_date_override, author_id,
        seo_title, seo_description, focus_keyword, canonical_url,
        og_title, og_description, og_image,
        twitter_title, twitter_description, twitter_image,
        meta_robots_noindex, meta_robots_nofollow,
        parent_id, \`order\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        postId,
        data.title,
        slug,
        data.content,
        data.excerpt || null,
        data.featuredImage || null,
        data.youtubeVideoId || null,
        data.publishedAt || null,
        data.publishDateOverride || null,
        authorId,
        data.seoTitle || null,
        data.seoDescription || null,
        data.focusKeyword || null,
        data.canonicalUrl || null,
        data.ogTitle || null,
        data.ogDescription || null,
        data.ogImage || null,
        data.twitterTitle || null,
        data.twitterDescription || null,
        data.twitterImage || null,
        data.metaRobotsNoindex || false,
        data.metaRobotsNofollow || false,
        data.parentId || null,
        data.order || 0,
      ]
    );

    await logger.info('Blog', 'Post created', { postId, title: data.title });

    return this.getPostById(postId);
  }

  /**
   * Update blog post
   */
  async updatePost(id: string, data: Partial<BlogPostData>): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.slug !== undefined) {
      updates.push('slug = ?');
      values.push(data.slug);
    }
    if (data.content !== undefined) {
      updates.push('content = ?');
      values.push(data.content);
    }
    if (data.excerpt !== undefined) {
      updates.push('excerpt = ?');
      values.push(data.excerpt);
    }
    if (data.featuredImage !== undefined) {
      updates.push('featured_image = ?');
      values.push(data.featuredImage);
    }
    if (data.youtubeVideoId !== undefined) {
      updates.push('youtube_video_id = ?');
      values.push(data.youtubeVideoId);
    }
    if (data.publishedAt !== undefined) {
      updates.push('published_at = ?');
      values.push(data.publishedAt);
    }
    if (data.publishDateOverride !== undefined) {
      updates.push('publish_date_override = ?');
      values.push(data.publishDateOverride);
    }
    if (data.seoTitle !== undefined) {
      updates.push('seo_title = ?');
      values.push(data.seoTitle);
    }
    if (data.seoDescription !== undefined) {
      updates.push('seo_description = ?');
      values.push(data.seoDescription);
    }
    if (data.focusKeyword !== undefined) {
      updates.push('focus_keyword = ?');
      values.push(data.focusKeyword);
    }
    if (data.canonicalUrl !== undefined) {
      updates.push('canonical_url = ?');
      values.push(data.canonicalUrl);
    }
    if (data.ogTitle !== undefined) {
      updates.push('og_title = ?');
      values.push(data.ogTitle);
    }
    if (data.ogDescription !== undefined) {
      updates.push('og_description = ?');
      values.push(data.ogDescription);
    }
    if (data.ogImage !== undefined) {
      updates.push('og_image = ?');
      values.push(data.ogImage);
    }
    if (data.twitterTitle !== undefined) {
      updates.push('twitter_title = ?');
      values.push(data.twitterTitle);
    }
    if (data.twitterDescription !== undefined) {
      updates.push('twitter_description = ?');
      values.push(data.twitterDescription);
    }
    if (data.twitterImage !== undefined) {
      updates.push('twitter_image = ?');
      values.push(data.twitterImage);
    }
    if (data.metaRobotsNoindex !== undefined) {
      updates.push('meta_robots_noindex = ?');
      values.push(data.metaRobotsNoindex);
    }
    if (data.metaRobotsNofollow !== undefined) {
      updates.push('meta_robots_nofollow = ?');
      values.push(data.metaRobotsNofollow);
    }
    if (data.parentId !== undefined) {
      updates.push('parent_id = ?');
      values.push(data.parentId);
    }
    if (data.order !== undefined) {
      updates.push('`order` = ?');
      values.push(data.order);
    }

    if (updates.length === 0) {
      return this.getPostById(id);
    }

    values.push(id);

    await query(
      `UPDATE blog_posts SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    await logger.info('Blog', 'Post updated', { postId: id });

    return this.getPostById(id);
  }

  /**
   * Delete blog post
   */
  async deletePost(id: string): Promise<void> {
    await query('DELETE FROM blog_posts WHERE id = ?', [id]);
    await logger.info('Blog', 'Post deleted', { postId: id });
  }

  /**
   * Reorder blog post
   */
  async reorderPost(postId: string, parentId: string | null, order: number): Promise<void> {
    await query(
      'UPDATE blog_posts SET parent_id = ?, `order` = ? WHERE id = ?',
      [parentId, order, postId]
    );

    await logger.info('Blog', 'Post reordered', { postId, parentId, order });
  }

  // ========== TAG MANAGEMENT ==========

  /**
   * Get all tags
   */
  async getAllTags(): Promise<Tag[]> {
    return query('SELECT * FROM tags ORDER BY name ASC');
  }

  /**
   * Get tag by ID
   */
  async getTagById(id: string): Promise<Tag | null> {
    return queryOne('SELECT * FROM tags WHERE id = ?', [id]);
  }

  /**
   * Get tag by slug
   */
  async getTagBySlug(slug: string): Promise<Tag | null> {
    return queryOne('SELECT * FROM tags WHERE slug = ?', [slug]);
  }

  /**
   * Create tag
   */
  async createTag(name: string, slug?: string): Promise<Tag> {
    const tagId = generateId('tag');

    if (!slug) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Ensure unique slug
    const existingTag = await queryOne('SELECT id FROM tags WHERE slug = ?', [slug]);
    if (existingTag) {
      slug = `${slug}-${Date.now()}`;
    }

    await insert(
      'INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)',
      [tagId, name, slug]
    );

    await logger.info('Blog', 'Tag created', { tagId, name });

    return this.getTagById(tagId) as Promise<Tag>;
  }

  /**
   * Update tag
   */
  async updateTag(id: string, name: string, slug?: string): Promise<Tag> {
    if (!slug) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    await query(
      'UPDATE tags SET name = ?, slug = ? WHERE id = ?',
      [name, slug, id]
    );

    await logger.info('Blog', 'Tag updated', { tagId: id, name });

    return this.getTagById(id) as Promise<Tag>;
  }

  /**
   * Delete tag
   */
  async deleteTag(id: string): Promise<void> {
    await query('DELETE FROM tags WHERE id = ?', [id]);
    await logger.info('Blog', 'Tag deleted', { tagId: id });
  }

  /**
   * Get posts by tag
   */
  async getPostsByTag(tagSlug: string, includeUnpublished: boolean = false): Promise<any[]> {
    let sql = `
      SELECT
        bp.*,
        COUNT(DISTINCT bpt2.tag_id) as tag_count
      FROM blog_posts bp
      INNER JOIN blog_post_tags bpt ON bp.id = bpt.post_id
      INNER JOIN tags t ON bpt.tag_id = t.id
      LEFT JOIN blog_post_tags bpt2 ON bp.id = bpt2.post_id
      WHERE t.slug = ?
    `;

    if (!includeUnpublished) {
      sql += ` AND bp.published_at IS NOT NULL`;
    }

    sql += `
      GROUP BY bp.id
      ORDER BY bp.published_at DESC
    `;

    const posts = await query(sql, [tagSlug]);

    for (const post of posts) {
      post.tags = await this.getPostTags(post.id);
    }

    return posts;
  }

  /**
   * Get tags for a post
   */
  private async getPostTags(postId: string): Promise<Tag[]> {
    return query(
      `SELECT t.* FROM tags t
       INNER JOIN blog_post_tags bpt ON t.id = bpt.tag_id
       WHERE bpt.post_id = ?
       ORDER BY t.name ASC`,
      [postId]
    );
  }

  /**
   * Add tag to post
   */
  async addTagToPost(postId: string, tagId: string): Promise<void> {
    const relationId = generateId('bpt');

    await insert(
      'INSERT IGNORE INTO blog_post_tags (id, post_id, tag_id) VALUES (?, ?, ?)',
      [relationId, postId, tagId]
    );

    await logger.info('Blog', 'Tag added to post', { postId, tagId });
  }

  /**
   * Remove tag from post
   */
  async removeTagFromPost(postId: string, tagId: string): Promise<void> {
    await query(
      'DELETE FROM blog_post_tags WHERE post_id = ? AND tag_id = ?',
      [postId, tagId]
    );

    await logger.info('Blog', 'Tag removed from post', { postId, tagId });
  }

  /**
   * Set tags for post (replaces all existing tags)
   */
  async setPostTags(postId: string, tagIds: string[]): Promise<void> {
    // Remove all existing tags
    await query('DELETE FROM blog_post_tags WHERE post_id = ?', [postId]);

    // Add new tags
    for (const tagId of tagIds) {
      await this.addTagToPost(postId, tagId);
    }

    await logger.info('Blog', 'Post tags updated', { postId, tagCount: tagIds.length });
  }
}

export const blogService = new BlogService();
