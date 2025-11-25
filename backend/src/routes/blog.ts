import { Router, Request, Response } from 'express';
import { blogService } from '../services/blog';
import { logger } from '../utils/logger';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

/**
 * GET /api/blog - Get all published blog posts (public)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

    const posts = await blogService.getAllPosts({
      includeUnpublished: false,
      limit,
      offset,
    });

    res.json({ posts });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to fetch posts', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

/**
 * GET /api/blog/:slug - Get single blog post by slug (public)
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const preview = req.query.preview === 'true';

    const post = await blogService.getPostBySlug(slug, preview);

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({ post });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to fetch post', {
      error: error instanceof Error ? error.message : 'Unknown error',
      slug: req.params.slug,
    });
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

/**
 * GET /api/blog/tag/:slug - Get posts by tag (public)
 */
router.get('/tag/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const posts = await blogService.getPostsByTag(slug, false);

    res.json({ posts });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to fetch posts by tag', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tagSlug: req.params.slug,
    });
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

/**
 * GET /api/blog/tags - Get all tags (public)
 */
router.get('/tags/all', async (req: Request, res: Response) => {
  try {
    const tags = await blogService.getAllTags();

    res.json({ tags });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to fetch tags', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// ========== ADMIN ROUTES ==========

/**
 * GET /api/blog/admin - Get all posts including drafts (admin only)
 */
router.get('/admin/all', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

    const posts = await blogService.getAllPosts({
      includeUnpublished: true,
      limit,
      offset,
    });

    res.json({ posts });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to fetch admin posts', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

/**
 * GET /api/blog/admin/:id - Get post by ID (admin only)
 */
router.get('/admin/post/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await blogService.getPostById(id);

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({ post });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to fetch post by ID', {
      error: error instanceof Error ? error.message : 'Unknown error',
      postId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

/**
 * POST /api/blog/admin - Create new blog post (admin only)
 */
router.post('/admin', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      publishedAt,
      publishDateOverride,
      seoTitle,
      seoDescription,
      focusKeyword,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      metaRobotsNoindex,
      metaRobotsNofollow,
      parentId,
      order,
      tagIds,
      publish,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // @ts-ignore - userId is added by authenticateAdmin middleware
    const authorId = req.userId;

    const post = await blogService.createPost(
      {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        publishedAt: publish ? new Date() : publishedAt ? new Date(publishedAt) : null,
        publishDateOverride: publishDateOverride ? new Date(publishDateOverride) : null,
        seoTitle,
        seoDescription,
        focusKeyword,
        canonicalUrl,
        ogTitle,
        ogDescription,
        ogImage,
        twitterTitle,
        twitterDescription,
        twitterImage,
        metaRobotsNoindex,
        metaRobotsNofollow,
        parentId,
        order,
      },
      authorId
    );

    // Add tags if provided
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await blogService.setPostTags(post.id, tagIds);
    }

    res.status(201).json({ post });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to create post', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

/**
 * PATCH /api/blog/admin/:id - Update blog post (admin only)
 */
router.patch('/admin/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      publishedAt,
      publishDateOverride,
      seoTitle,
      seoDescription,
      focusKeyword,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      metaRobotsNoindex,
      metaRobotsNofollow,
      parentId,
      order,
      tagIds,
    } = req.body;

    const post = await blogService.updatePost(id, {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      publishedAt: publishedAt !== undefined ? (publishedAt ? new Date(publishedAt) : null) : undefined,
      publishDateOverride: publishDateOverride !== undefined ? (publishDateOverride ? new Date(publishDateOverride) : null) : undefined,
      seoTitle,
      seoDescription,
      focusKeyword,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      metaRobotsNoindex,
      metaRobotsNofollow,
      parentId,
      order,
    });

    // Update tags if provided
    if (tagIds !== undefined && Array.isArray(tagIds)) {
      await blogService.setPostTags(id, tagIds);
    }

    res.json({ post });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to update post', {
      error: error instanceof Error ? error.message : 'Unknown error',
      postId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

/**
 * DELETE /api/blog/admin/:id - Delete blog post (admin only)
 */
router.delete('/admin/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await blogService.deletePost(id);

    res.json({ success: true });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to delete post', {
      error: error instanceof Error ? error.message : 'Unknown error',
      postId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

/**
 * PATCH /api/blog/admin/:id/reorder - Reorder blog post (admin only)
 */
router.patch('/admin/:id/reorder', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { parentId, order } = req.body;

    await blogService.reorderPost(id, parentId || null, order);

    res.json({ success: true });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to reorder post', {
      error: error instanceof Error ? error.message : 'Unknown error',
      postId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to reorder blog post' });
  }
});

// ========== TAG ADMIN ROUTES ==========

/**
 * GET /api/blog/admin/tags - Get all tags (admin)
 */
router.get('/admin/tags/all', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const tags = await blogService.getAllTags();

    res.json({ tags });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to fetch tags', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

/**
 * POST /api/blog/admin/tags - Create tag (admin only)
 */
router.post('/admin/tags', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = await blogService.createTag(name, slug);

    res.status(201).json({ tag });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to create tag', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

/**
 * PATCH /api/blog/admin/tags/:id - Update tag (admin only)
 */
router.patch('/admin/tags/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = await blogService.updateTag(id, name, slug);

    res.json({ tag });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to update tag', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tagId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

/**
 * DELETE /api/blog/admin/tags/:id - Delete tag (admin only)
 */
router.delete('/admin/tags/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await blogService.deleteTag(id);

    res.json({ success: true });
  } catch (error) {
    await logger.error('BlogAPI', 'Failed to delete tag', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tagId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
