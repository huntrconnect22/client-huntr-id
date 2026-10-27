export function loader() {
  const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>Interactive XML Sitemap | Huntr.id</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: radial-gradient(circle at top, #1e1b18 0%, #0d0c0b 100%);
            color: #e5e7eb;
            margin: 0;
            padding: 40px 20px;
            min-height: 100vh;
            box-sizing: border-box;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            padding-bottom: 24px;
            margin-bottom: 32px;
            flex-wrap: wrap;
            gap: 16px;
          }
          .logo-area {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-img {
            width: 150px;
            height: 40px;
            border-radius: 0;
            object-fit: contain;
          }
          .title {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.5px;
          }
          .subtitle {
            margin: 4px 0 0;
            font-size: 11px;
            color: #f59e0b;
            letter-spacing: 0.1em;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge {
            background: rgba(249,115,22,0.12);
            border: 1px solid rgba(249,115,22,0.3);
            color: #fb923c;
            padding: 6px 14px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 700;
          }
          .desc {
            color: #9ca3af;
            font-size: 14px;
            line-height: 1.6;
            margin: 0 0 32px;
          }
          .card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 20px;
            overflow: hidden;
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 13px;
          }
          th {
            background: rgba(255, 255, 255, 0.02);
            padding: 14px 20px;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
            color: #9ca3af;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          td {
            padding: 14px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            vertical-align: middle;
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:hover td {
            background: rgba(255, 255, 255, 0.01);
          }
          a {
            color: #fb923c;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s;
          }
          a:hover {
            color: #f97316;
            text-decoration: underline;
          }
          .priority-bar {
            height: 6px;
            border-radius: 3px;
            background: #374151;
            width: 80px;
            overflow: hidden;
            display: inline-block;
            vertical-align: middle;
            margin-right: 8px;
          }
          .priority-fill {
            height: 100%;
            background: linear-gradient(90deg, #f97316, #f59e0b);
            border-radius: 3px;
          }
          .priority-val {
            font-weight: 700;
            color: #fff;
            display: inline-block;
            vertical-align: middle;
          }
          .freq-tag {
            background: rgba(59,130,246,0.12);
            border: 1px solid rgba(59,130,246,0.25);
            color: #60a5fa;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: capitalize;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-area">
              <img src="/assets/img/logo/sidebar.png" alt="Logo" class="logo-img"/>
              <div>
                <h1 class="title">Huntr.id</h1>
                <div class="subtitle">XML Sitemap Feed</div>
              </div>
            </div>
            <div class="badge">
              Total URLs: <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
            </div>
          </div>
          
          <p class="desc">
            This is the XML Sitemap for Huntr.id, generated automatically to enable search engine crawlers (like Google and Bing) to index all marketplace products and pages dynamically.
          </p>
          
          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>URL Path</th>
                  <th>Change Frequency</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <xsl:sort select="sitemap:priority" order="descending"/>
                  <tr>
                    <td>
                      <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                    </td>
                    <td>
                      <span class="freq-tag"><xsl:value-of select="sitemap:changefreq"/></span>
                    </td>
                    <td>
                      <div class="priority-bar">
                        <div class="priority-fill" style="width: {sitemap:priority * 100}%"></div>
                      </div>
                      <span class="priority-val"><xsl:value-of select="sitemap:priority"/></span>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`;

  return new Response(xsl, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
