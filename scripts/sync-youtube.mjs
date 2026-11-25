// Pulls the channel's RSS feed (latest 15 uploads) and merges new videos into data/videos.json.
// Each video is sorted into a chapter by the code in its title, e.g. "G7_1_C4-3 血液成分" or "8-1-5-1 溫度與溫度計".
// Runs daily from .github/workflows/sync-youtube.yml; safe to run by hand: `node scripts/sync-youtube.mjs`.
import { readFile, writeFile } from "node:fs/promises";

const CHANNEL = "UCJtQ4k093PWRBCbzpuM9fVQ";
const FILE = new URL("../data/videos.json", import.meta.url);

const CN = { "七": 7, "八": 8, "九": 9, "上": 1, "下": 2 };
export function parseCode(title) {
  // "G7_1_C4-3", "8-1-5-1", "9-1-C7": grade 7-9, semester 1-2, chapter, optional section
  let m = title.match(/(?:^|[^\d])G?\s*([789])\s*[_-]\s*([12])\s*[_-]\s*C?\s*(\d{1,2})(?:\s*[-_]\s*(\d{1,2}))?/i);
  if (m) return { chapter: `${m[1]}-${m[2]}-${+m[3]}`, section: m[4] ? +m[4] : null };
  // "九上C4", "八下 1-1", "九上3-4"
  m = title.match(/([七八九])([上下])(?:自然)?\s*C?(\d{1,2})(?:\s*-\s*(\d{1,2}))?/);
  if (m) return { chapter: `${CN[m[1]]}-${CN[m[2]]}-${+m[3]}`, section: m[4] ? +m[4] : null };
  return null;
}

export function kindOf(title) {
  if (/習題|習作|解題/.test(title)) return "解題";
  if (/^Reel/i.test(title)) return "重點整理";
  if (/#shorts|短影音/i.test(title)) return "短影音";
  return "講解";
}

const decode = s => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

async function main() {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL}`);
  if (!res.ok) throw new Error(`YouTube feed returned ${res.status}`);
  const xml = await res.text();
  const feed = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
    const title = decode(e.match(/<title>([\s\S]*?)<\/title>/)[1].trim());
    const code = parseCode(title);
    return {
      id: e.match(/<yt:videoId>(.*?)<\/yt:videoId>/)[1],
      title,
      date: e.match(/<published>(.{10})/)[1],
      chapter: code?.chapter ?? null,
      section: code?.section ?? null,
      kind: kindOf(title),
    };
  });

  let list = [];
  try { list = JSON.parse(await readFile(FILE, "utf8")); } catch { list = []; }
  const known = new Map(list.map(v => [v.id, v]));
  let added = 0;
  for (const v of feed) {
    if (!known.has(v.id)) added++;
    known.set(v.id, { ...known.get(v.id), ...v }); // refresh title edits, keep any manual fields
  }
  const out = [...known.values()].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (a.order ?? 0) - (b.order ?? 0));
  await writeFile(FILE, JSON.stringify(out, null, 1) + "\n");
  console.log(`feed: ${feed.length}, new: ${added}, total: ${out.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e); process.exit(1); });
