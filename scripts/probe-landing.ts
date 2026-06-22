import { parseLandingPage } from "../src/lib/landing-import";

async function main() {
  const url = "https://www.orensonego.co.il/%D7%94%D7%A6%D7%A2%D7%AA-%D7%9E%D7%97%D7%99%D7%A8-3/";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PannuyBot/1.0)", Accept: "text/html" },
    redirect: "follow",
  });
  const html = await res.text();
  const parsed = parseLandingPage(html, res.url);
  console.log(
    JSON.stringify(
      {
        name: parsed.name,
        bioLen: parsed.bioHe?.length,
        bioPreview: parsed.bioHe?.slice(0, 180),
        basePriceFrom: parsed.basePriceFrom,
        basePriceTo: parsed.basePriceTo,
        packages: parsed.packages,
        imageCount: parsed.rawImages.length,
        sampleImages: parsed.rawImages.slice(0, 5),
      },
      null,
      2
    )
  );
}

main().catch(console.error);
