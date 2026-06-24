async function main() {
  const res = await fetch("https://www.orensonego.co.il/");
  const html = await res.text();
  const uploads = Array.from(
    html.matchAll(/wp-content\/uploads\/[^"'\s)]+\.(?:jpg|jpeg|png|webp)/gi)
  ).map((m) => m[0]);
  console.log("upload count", new Set(uploads).size);
  console.log("samples", [...new Set(uploads)].slice(0, 15));

  const sm = await fetch("https://www.orensonego.co.il/sitemap.xml");
  console.log("sitemap status", sm.status);
  if (sm.ok) {
    const xml = await sm.text();
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    const quote = locs.filter((u) => /הצעת|מחיר|price/i.test(u));
    console.log("quote pages", quote);
    console.log("all pages sample", locs.slice(0, 20));
  }

  const headings = Array.from(html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi))
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
  console.log("h3 headings", headings.slice(0, 12));
}

main();
