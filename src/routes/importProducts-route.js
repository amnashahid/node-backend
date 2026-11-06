const express = require("express");
const fs = require("fs");
const path = require("path");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const sourceTree = require("../data/categories.json"); // GrocerApp category list

const router = express.Router();

// ---------- config ----------
const BASE_URL = "https://endpoints.grocerapps.com/v3/products/listByParent";
const DEFAULT_VENDOR_ID = 20;
const REQUEST_DELAY_MS = 300;
const IMAGE_CONCURRENCY = 5;
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");
const PUBLIC_PREFIX = "/uploads/products"; // path saved in Mongo

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "Spices & Herbs" -> "spices and herbs"
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// "Robin Liquid Blue" -> "robin-liquid-blue"
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "item";

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<\?xml[^>]*>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw new Error(`${url} -> ${err.message}`);
      await sleep(attempt * 1000);
    }
  }
}

// ---------- category helpers ----------
function indexSource(nodes, parent = null, map = new Map()) {
  for (const n of nodes) {
    map.set(n.id, { id: n.id, name: n.name, parentId: parent ? parent.id : null });
    if (n.subcat?.length) indexSource(n.subcat, n, map);
  }
  return map;
}

// direct category first, then its ancestors, stopping before the top level
function getChain(sourceMap, catId, topId) {
  const chain = [];
  let cur = sourceMap.get(catId);
  while (cur && cur.id !== topId) {
    chain.push(cur);
    cur = cur.parentId != null ? sourceMap.get(cur.parentId) : null;
  }
  return chain;
}

async function buildMongoIndex() {
  const cats = await Category.find({}).select("_id nameEn parentCategoryId").lean();
  const parents = new Map();
  const children = new Map();
  const anyChild = new Map();

  for (const c of cats) {
    const key = norm(c.nameEn);
    if (!c.parentCategoryId) {
      parents.set(key, c);
    } else {
      children.set(`${c.parentCategoryId}:${key}`, c);
      if (!anyChild.has(key)) anyChild.set(key, c);
    }
  }
  return { parents, children, anyChild };
}

function resolveSubCategory(mongoIdx, parentDoc, chain) {
  for (const node of chain) {
    const key = norm(node.name);
    const hit = mongoIdx.children.get(`${parentDoc._id}:${key}`) || mongoIdx.anyChild.get(key);
    if (hit) return hit;
  }
  return null;
}

// ---------- unit ----------
const UNIT_MAP = {
  ml: "ml", l: "liter", ltr: "liter", liter: "liter", litre: "liter",
  kg: "kg", g: "gram", gm: "gram", gram: "gram",
  unit: "piece", piece: "piece", pcs: "piece", pc: "piece",
  pack: "pack", box: "box", dozen: "dozen", doz: "dozen",
};

function parseUnit(raw) {
  const m = String(raw || "").trim().toLowerCase().match(/^[\d.]*\s*([a-z]+)/);
  return (m && UNIT_MAP[m[1]]) || "piece";
}

// ---------- image download ----------
const CONTENT_TYPE_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function extFromUrl(url) {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    return ext && ext.length <= 5 ? ext : "";
  } catch {
    return "";
  }
}

// Unique file name per product: product-<name>.<ext>
// Same name twice (e.g. different sizes) -> add unit, then barcode
function pickFileName(p, ext, usedNames) {
  const base = slugify(p.name);
  const candidates = [
    `product-${base}${ext}`,
    `product-${base}-${slugify(p.unit)}${ext}`,
    `product-${base}-${slugify(p.barcode || p.id)}${ext}`,
  ];
  for (const c of candidates) {
    if (!usedNames.has(c)) {
      usedNames.add(c);
      return c;
    }
  }
  const last = `product-${base}-${p.id}${ext}`;
  usedNames.add(last);
  return last;
}

// returns the public path to save in Mongo, or null on failure
async function downloadImage(p, usedNames) {
  const url = p.full_image || p.image;
  if (!url) return null;

  try {
    let ext = extFromUrl(url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (!ext) {
      const type = (res.headers.get("content-type") || "").split(";")[0].trim();
      ext = CONTENT_TYPE_EXT[type] || ".jpg";
    }

    const fileName = pickFileName(p, ext, usedNames);
    const filePath = path.join ( UPLOAD_DIR, fileName);
 console.log("sss",filePath);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.promises.writeFile(filePath, buf);

    return `${PUBLIC_PREFIX}/${fileName}`;
  } catch (err) {
    console.warn(`Image failed for "${p.name}" (${url}): ${err.message}`);
    return null;
  }
}

// ---------- mapping ----------
function mapProduct(p, categoryId, subCategoryId, image) {
  return {
    nameEn: String(p.name || "").trim().slice(0, 200),
    nameUr: String(p.name_ur || p.name || "").trim().slice(0, 200),
    description: stripHtml(p.desc),
    image,
    price: Number(p.price) || 0,
    salePrice: 0,
    isFeatured: false,
    isActive: true,
    categoryId,
    subCategoryId,
    sku: String(p.barcode || `GA-${p.vendor_id}-${p.id}`).toUpperCase(),
    unit: parseUnit(p.unit),
  };
}

// run fn over items, a few at a time
async function inChunks(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

// ---------- endpoint ----------
// POST /api/import/grocerapp?vendor_id=20
// optional: &categoryIds=444,445 (source top-level ids)  &dryRun=true  &images=false
router.get("/", async (req, res) => {
  try {
    console.log("Starting import");
    const vendorId = Number(req.query.vendor_id) || DEFAULT_VENDOR_ID;
    const dryRun = req.query.dryRun === "true";
    const withImages = req.query.images !== "false";
    const onlyIds = req.query.categoryIds
      ? req.query.categoryIds.split(",").map(Number)
      : null;

    const sourceMap = indexSource(sourceTree);
    const mongoIdx = await buildMongoIndex();
    const topLevels = sourceTree.filter((c) => !onlyIds || onlyIds.includes(c.id));
    const usedNames = new Set(); // file names handed out during this run

    const report = [];
    var i= 0;
    do {
  i++;
    for (const top of topLevels) {
      const entry = {
        sourceId: top.id,
        name: top.name,
        mongoCategoryId: null,
        fetched: 0,
        inserted: 0,
        updated: 0,
        imagesSaved: 0,
        imagesFailed: 0,
        missingSubCategory: [],
        error: null,
      };
      report.push(entry);

      const parentDoc = mongoIdx.parents.get(norm(top.name));
      if (!parentDoc) {
        entry.error = "Parent category not found in MongoDB - skipped";
        continue;
      }
      entry.mongoCategoryId = parentDoc._id;

      try {
        let page = 1;
        let lastPage = 1;

        do {
          const url = `${BASE_URL}?vendor_id=${vendorId}&category_id=${top.id}&page=${page}`;
          const json = await fetchJson(url);
          const items = json?.data?.data || [];
          lastPage = json?.data?.last_page || 1;
          entry.fetched += items.length;

          // download images
          const images = withImages && !dryRun
            ? await inChunks(items, IMAGE_CONCURRENCY, (p) => downloadImage(p, usedNames))
            : items.map(() => null);

          const ops = [];
          items.forEach((p, i) => {
            const chain = getChain(sourceMap, p.category_id, top.id);
            const subDoc = resolveSubCategory(mongoIdx, parentDoc, chain);

            if (!subDoc && chain.length) {
              const label = `${chain[0].name} (${chain[0].id})`;
              if (!entry.missingSubCategory.includes(label)) entry.missingSubCategory.push(label);
            }

            if (images[i]) entry.imagesSaved++;
            else if (withImages && !dryRun) entry.imagesFailed++;

            const doc = mapProduct(p, parentDoc._id, subDoc ? subDoc._id : null, images[i]);

            // don't overwrite an existing image with null if the download failed
            if (doc.image === null) delete doc.image;

            ops.push({
              updateOne: {
                filter: { sku: doc.sku },
                update: { $set: doc },
                upsert: true,
              },
            });
          });

          if (ops.length && !dryRun) {
            const r = await Product.bulkWrite(ops, { ordered: false });
            entry.inserted += r.upsertedCount || 0;
            entry.updated += r.modifiedCount || 0;
          }

          page++;
          if (page <= lastPage) await sleep(REQUEST_DELAY_MS);
        } while (page <= lastPage);
      } catch (err) {
        entry.error = err.message;
      }
    }
  }while(i<5);
    res.json({ success: true, dryRun, vendorId, report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;