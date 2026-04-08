const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');

const MAX_URLS_PER_SITEMAP = 5000;

const xmlEscape = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const toISODate = (dateValue) => {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
};

const getSiteUrl = (req) => {
  const fallback = `${req.protocol}://${req.get('host')}`;
  const raw = process.env.SITE_URL || process.env.FRONTEND_URL || fallback;
  return raw.replace(/\/$/, '');
};

const sendXml = (res, xml) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.status(200).send(xml);
};

router.get('/sitemap.xml', async (req, res) => {
  const siteUrl = getSiteUrl(req);
  const now = toISODate();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemaps/static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemaps/confessions.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemaps/hashtags.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  return sendXml(res, xml);
});

router.get('/sitemaps/static.xml', async (req, res) => {
  const siteUrl = getSiteUrl(req);
  const now = toISODate();
  const staticUrls = [
    { loc: `${siteUrl}/`, changefreq: 'hourly', priority: '1.0' },
    { loc: `${siteUrl}/explore`, changefreq: 'hourly', priority: '0.9' },
    { loc: `${siteUrl}/new`, changefreq: 'daily', priority: '0.8' },
  ];

  const entries = staticUrls
    .map(
      (item) => `  <url>
    <loc>${xmlEscape(item.loc)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  return sendXml(res, xml);
});

router.get('/sitemaps/confessions.xml', async (req, res) => {
  try {
    const siteUrl = getSiteUrl(req);
    const confessions = await Confession.find({
      isPublished: true,
      isHidden: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .select('_id createdAt')
      .limit(MAX_URLS_PER_SITEMAP)
      .lean();

    const entries = confessions
      .map(
        (item) => `  <url>
    <loc>${xmlEscape(`${siteUrl}/confession/${item._id}`)}</loc>
    <lastmod>${toISODate(item.createdAt)}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

    return sendXml(res, xml);
  } catch (error) {
    console.error('Error generating confessions sitemap:', error);
    return res.status(500).json({ error: { message: 'Failed to generate confessions sitemap' } });
  }
});

router.get('/sitemaps/hashtags.xml', async (req, res) => {
  try {
    const siteUrl = getSiteUrl(req);
    const hashtags = await Confession.aggregate([
      {
        $match: {
          isPublished: true,
          isHidden: false,
          expiresAt: { $gt: new Date() },
          hashtags: { $exists: true, $ne: [] },
        },
      },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: '$hashtags',
          latestPostAt: { $max: '$createdAt' },
        },
      },
      { $sort: { latestPostAt: -1 } },
      { $limit: MAX_URLS_PER_SITEMAP },
    ]);

    const entries = hashtags
      .map((item) => {
        const tag = String(item._id || '').toLowerCase();
        const encodedTag = encodeURIComponent(tag);

        return `  <url>
    <loc>${xmlEscape(`${siteUrl}/hashtags/${encodedTag}`)}</loc>
    <lastmod>${toISODate(item.latestPostAt)}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

    return sendXml(res, xml);
  } catch (error) {
    console.error('Error generating hashtags sitemap:', error);
    return res.status(500).json({ error: { message: 'Failed to generate hashtags sitemap' } });
  }
});

module.exports = router;
