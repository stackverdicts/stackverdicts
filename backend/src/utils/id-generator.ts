import { nanoid } from 'nanoid';

/**
 * Generate unique IDs for database records
 */
export function generateId(prefix?: string): string {
  const id = nanoid(16);
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate SubID for click tracking
 * Format: {source}-{campaign}-{adgroup}-{creative}-{gclid}-{timestamp}
 */
export function generateSubId(params: {
  trafficSource: string;
  campaignId?: string;
  adGroupId?: string;
  creativeId?: string;
  gclid?: string;
}): string {
  const {
    trafficSource,
    campaignId = 'none',
    adGroupId = 'none',
    creativeId = 'none',
    gclid = 'none',
  } = params;

  const timestamp = Date.now();
  const uniqueId = nanoid(8);

  // Clean values to remove special characters that might break URLs
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);

  const parts = [
    clean(trafficSource),
    clean(campaignId),
    clean(adGroupId),
    clean(creativeId),
    clean(gclid),
    timestamp,
    uniqueId,
  ];

  return parts.join('-');
}

/**
 * Parse SubID back into its components
 */
export function parseSubId(subid: string): {
  trafficSource: string;
  campaignId: string;
  adGroupId: string;
  creativeId: string;
  gclid: string;
  timestamp: number;
  uniqueId: string;
} | null {
  try {
    const parts = subid.split('-');
    if (parts.length < 7) return null;

    return {
      trafficSource: parts[0],
      campaignId: parts[1],
      adGroupId: parts[2],
      creativeId: parts[3],
      gclid: parts[4],
      timestamp: parseInt(parts[5]),
      uniqueId: parts[6],
    };
  } catch (error) {
    return null;
  }
}
