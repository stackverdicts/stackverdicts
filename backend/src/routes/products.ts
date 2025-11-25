import { Router, Request, Response } from 'express';
import { query, queryOne } from '../config/database';
import { nanoid } from 'nanoid';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get all products
 * GET /api/products?category=hosting&active_only=true
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, active_only, limit = 100, offset = 0 } = req.query;

    let sql = `
      SELECT
        p.*,
        an.network_name,
        an.network_slug
      FROM products p
      LEFT JOIN affiliate_networks an ON p.network_id = an.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }

    if (active_only === 'true') {
      sql += ' AND p.is_active = true';
    }

    sql += ' ORDER BY p.priority DESC, p.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const products = await query(sql, params);

    res.json({ products });
  } catch (error) {
    await logger.error('ProductsAPI', 'Failed to get products', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get products',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get single product
 * GET /api/products/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await queryOne(
      `
      SELECT
        p.*,
        an.network_name,
        an.network_slug
      FROM products p
      LEFT JOIN affiliate_networks an ON p.network_id = an.id
      WHERE p.id = ?
      `,
      [id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    await logger.error('ProductsAPI', 'Failed to get product', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get product',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create new product
 * POST /api/products
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      category,
      network_id,
      affiliate_url,
      commission_type = 'percentage',
      commission_value,
      recurring_commission = false,
      recurring_percentage,
      pricing_info,
      features,
      target_audience,
      priority = 0,
    } = req.body;

    if (!name || !category || !affiliate_url) {
      return res.status(400).json({
        error: 'name, category, and affiliate_url are required',
      });
    }

    const id = nanoid();
    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await query(
      `
      INSERT INTO products (
        id, name, slug, description, category, network_id, affiliate_url,
        commission_type, commission_value, recurring_commission, recurring_percentage,
        pricing_info, features, target_audience, priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        name,
        productSlug,
        description,
        category,
        network_id,
        affiliate_url,
        commission_type,
        commission_value,
        recurring_commission,
        recurring_percentage,
        JSON.stringify(pricing_info),
        JSON.stringify(features),
        target_audience,
        priority,
      ]
    );

    const product = await queryOne('SELECT * FROM products WHERE id = ?', [id]);

    await logger.info('ProductsAPI', 'Product created', { productId: id, name });

    res.status(201).json({ product });
  } catch (error) {
    await logger.error('ProductsAPI', 'Failed to create product', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to create product',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Update product
 * PATCH /api/products/:id
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingProduct = await queryOne('SELECT * FROM products WHERE id = ?', [id]);

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const allowedFields = [
      'name',
      'slug',
      'description',
      'category',
      'network_id',
      'affiliate_url',
      'commission_type',
      'commission_value',
      'recurring_commission',
      'recurring_percentage',
      'pricing_info',
      'features',
      'target_audience',
      'is_active',
      'priority',
    ];

    const setClause: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = ?`);
        if (key === 'pricing_info' || key === 'features') {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);

    await query(
      `UPDATE products SET ${setClause.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    const product = await queryOne('SELECT * FROM products WHERE id = ?', [id]);

    await logger.info('ProductsAPI', 'Product updated', { productId: id });

    res.json({ product });
  } catch (error) {
    await logger.error('ProductsAPI', 'Failed to update product', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to update product',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete product
 * DELETE /api/products/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingProduct = await queryOne('SELECT * FROM products WHERE id = ?', [id]);

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await query('DELETE FROM products WHERE id = ?', [id]);

    await logger.info('ProductsAPI', 'Product deleted', { productId: id });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    await logger.error('ProductsAPI', 'Failed to delete product', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to delete product',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
