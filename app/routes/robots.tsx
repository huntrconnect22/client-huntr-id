export function loader() {
  const robots = `User-agent: *
Allow: /
Allow: /marketplace
Allow: /marketplace/*
Allow: /crowd-buy
Allow: /crowd-buy/p/*
Allow: /llms.txt
Allow: /llms-full.txt
Disallow: /admin
Disallow: /checkout
Disallow: /cart
Disallow: /approvals
Disallow: /finance

Sitemap: https://app.huntr.id/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
