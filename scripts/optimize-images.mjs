import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const IMAGES_DIR = path.resolve('public/images/posts');
const BLOG_DIR = path.resolve('src/content/blog');
const SUPPORTED_EXTS = new Set(['.png', '.jpg', '.jpeg']);
const MAX_WIDTH = 2560; // 4K 级别上限，防巨图爆内存并保持高精物证级画质
const WEBP_QUALITY = 82;
const KEEP_SOURCE = process.argv.includes('--keep-source');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function updateMarkdownReferences(oldRelPath, newRelPath) {
  if (!fs.existsSync(BLOG_DIR)) return;
  const mdFiles = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  for (const f of mdFiles) {
    const p = path.join(BLOG_DIR, f);
    const content = fs.readFileSync(p, 'utf8');
    if (content.includes(oldRelPath)) {
      const updated = content.replaceAll(oldRelPath, newRelPath);
      fs.writeFileSync(p, updated, 'utf8');
      console.log(`[img-opt] Updated reference in ${f}: ${oldRelPath} -> ${newRelPath}`);
    }
  }
}

export async function optimizeImages() {
  const startTime = Date.now();
  console.log('[img-opt] Scanning public/images/posts for unoptimized images...');

  const allFiles = getAllFiles(IMAGES_DIR);
  const targetFiles = allFiles.filter((filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    return SUPPORTED_EXTS.has(ext);
  });

  let convertedCount = 0;
  let skippedCount = 0;
  let savedBytes = 0;

  for (const sourcePath of targetFiles) {
    const parsed = path.parse(sourcePath);
    const webpPath = path.join(parsed.dir, `${parsed.name}.webp`);
    const sourceStat = fs.statSync(sourcePath);
    const relSource = path.relative(IMAGES_DIR, sourcePath).replace(/\\/g, '/');

    // 增量检查：如果对应 webp 已存在且修改时间晚于源文件，则跳过
    if (fs.existsSync(webpPath)) {
      const webpStat = fs.statSync(webpPath);
      if (webpStat.mtimeMs >= sourceStat.mtimeMs) {
        skippedCount++;
        continue;
      }
    }

    try {
      const pipeline = sharp(sourcePath).rotate(); // 自动根据 EXIF 矫正方向
      const metadata = await pipeline.metadata();

      if (metadata.width && metadata.width > MAX_WIDTH) {
        pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
      }

      await pipeline.webp({ quality: WEBP_QUALITY, effort: 6 }).toFile(webpPath);

      const webpStat = fs.statSync(webpPath);
      const diff = sourceStat.size - webpStat.size;

      // 如果 WebP 体积反而更大（偶见于本来就已被极度压缩的小 JPG），则删除 WebP，保留原图
      if (diff <= 0) {
        fs.unlinkSync(webpPath);
        console.log(`[img-opt] ${relSource}: Original is already optimal (${formatBytes(sourceStat.size)} <= ${formatBytes(webpStat.size)}). Kept original.`);
        skippedCount++;
        continue;
      }

      const ratio = ((diff / sourceStat.size) * 100).toFixed(1);
      console.log(
        `[img-opt] ${relSource}: ${formatBytes(sourceStat.size)} -> ${formatBytes(webpStat.size)} (-${ratio}%)`
      );

      // 同步更新 Markdown 引用并彻底清理未压缩的大源图（防止 Git 膨胀）
      const oldWebPath = `/images/posts/${relSource}`;
      const newWebPath = `/images/posts/${relSource.replace(/\.(png|jpe?g)$/i, '.webp')}`;
      updateMarkdownReferences(oldWebPath, newWebPath);

      if (!KEEP_SOURCE) {
        fs.unlinkSync(sourcePath);
      }

      savedBytes += diff;
      convertedCount++;
    } catch (err) {
      console.warn(`[img-opt] Failed to convert ${sourcePath}:`, err.message);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `[img-opt] Done in ${duration}s. Converted: ${convertedCount}, Cached/Skipped: ${skippedCount}, Saved: ${formatBytes(savedBytes)}`
  );
}

// 支持直接作为脚本运行
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  optimizeImages().catch((err) => {
    console.error('[img-opt] Unexpected error:', err);
    process.exit(1);
  });
}
