const fs   = require('fs');
const path = require('path');

const siteUrl   = 'https://dikshitmakwana.in'; //
const siteTitle = 'Dikshit Makwana';
const siteDesc  = 'Engineer & Tinkerer';
const authorName  = 'Dikshit Makwana';
const authorEmail = 'dikshitdesign@gmail.com';

const blogs = JSON.parse(fs.readFileSync('./blog/index.json', 'utf8'));
const sorted = blogs.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
const updated = sorted[0]?.date ?? new Date().toISOString();

const entries = sorted.map(post => {
    const url = `${siteUrl}/#post/${post.slug}`;
    return `
  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <updated>${new Date(post.date).toISOString()}</updated>
    <summary>${escapeXml(post.excerpt)}</summary>
    <author><name>${authorName}</name></author>
  </entry>`;
}).join('');

const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteTitle)}</title>
  <subtitle>${escapeXml(siteDesc)}</subtitle>
  <link href="${siteUrl}/feed.xml" rel="self"/>
  <link href="${siteUrl}"/>
  <id>${siteUrl}/feed.xml</id>
  <updated>${new Date(updated).toISOString()}</updated>
  <author><name>${authorName}</name></author>
${entries}
</feed>`;

fs.writeFileSync('./feed.xml', feed);
console.log('feed.xml generated');

function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}