// Self-hosted OCR (tesseract.js, WASM) — free, no API quota. Used as the primary
// scanner for contact details printed on supplier photos; Cloudinary OCR is only a
// fallback. Language data is vendored in /tessdata (eng + heb, "fast" models).
import path from "path";
import { createWorker, PSM, type Worker } from "tesseract.js";

// Contact details (digits, latin, @, dots) are what we hunt for; the English model
// reads them best. Hebrew data is vendored for future keyword checks.
const LANGS = "eng";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker(LANGS, 1, {
      langPath: path.join(process.cwd(), "tessdata"),
      gzip: true,
      cachePath: "/tmp",
      logger: () => {},
      errorHandler: (e: unknown) => console.error("[ocr-local] worker", e),
    })
      .then(async (w) => {
        // Sparse-text mode finds scattered captions/overlays on graphics.
        await w.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
        return w;
      })
      .catch((e) => {
      workerPromise = null;
      throw e;
    });
  }
  return workerPromise;
}

// Tesseract misses text touching the image edge and is sensitive to glyph size,
// so we OCR two Cloudinary renders — different widths, each with a white border —
// and merge the text. Non-Cloudinary URLs are read as-is.
const RENDERS = [
  "w_1600,c_limit,e_grayscale,f_png,bo_60px_solid_white",
  "w_1000,c_limit,e_grayscale,f_png,bo_60px_solid_white,e_sharpen",
];

export function ocrRenderUrls(url: string): string[] {
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/);
  if (!m) return [url];
  const rest = m[2].replace(/^v\d+\//, "");
  return RENDERS.map((tr) => `${m[1]}${tr}/${rest}`);
}

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`image fetch ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_IMAGE_BYTES) throw new Error("image too large");
  return buf;
}

/** Runs OCR over all renders and returns the merged text. Throws on engine failure. */
export async function ocrImageText(imageUrl: string): Promise<string> {
  const worker = await getWorker();
  const texts: string[] = [];
  for (const u of ocrRenderUrls(imageUrl)) {
    const buf = await fetchImage(u);
    const { data } = await worker.recognize(buf);
    texts.push(data.text ?? "");
  }
  return texts.join("\n");
}
