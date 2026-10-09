import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import Upload from "./upload.model.js";
import cloudinary from "../../utils/cloudinary.js";

// Helper to sanitize R2 endpoint (remove trailing bucket segment if present)
const getCleanR2Endpoint = (endpoint: string, bucket: string): string => {
  return endpoint.replace(new RegExp(`/${bucket}/?$`), "").replace(/\/+$/, "");
};

// 1. Upload files to Cloudflare R2 and record in MongoDB
export const handleUploads = async (req: any, res: any) => {
  try {
    const folder = (req.body?.category || "uploads").toString().replace(/\/+$/g, "");
    const R2_ENDPOINT = process.env.R2_ENDPOINT;
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
    const R2_BUCKET = process.env.R2_BUCKET || "lynchpin";
    const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;

    if (
      !R2_ENDPOINT ||
      !R2_ACCESS_KEY_ID ||
      !R2_SECRET_ACCESS_KEY ||
      !R2_BUCKET ||
      !R2_PUBLIC_BASE_URL
    ) {
      return res.status(500).json({
        success: false,
        message: "R2 storage configuration missing in environment",
      });
    }

    const cleanEndpoint = getCleanR2Endpoint(R2_ENDPOINT, R2_BUCKET);

    const r2 = new S3Client({
      region: "auto",
      endpoint: cleanEndpoint,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    const fileList =
      Array.isArray(req.files) && req.files.length
        ? req.files
        : req.file
        ? [req.file]
        : [];

    if (!fileList.length) {
      return res
        .status(400)
        .json({ success: false, message: "No files provided for upload" });
    }

    const uploads = await Promise.all(
      fileList.map(async (file: any) => {
        const safeName = (file.originalname || `file-${Date.now()}`).replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );
        const key = `${folder}/${Date.now()}-${safeName}`;

        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype || "application/octet-stream",
            ContentDisposition: "inline",
          })
        );

        const base = R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
        const url = `${base}/${key}`;
        return {
          url,
          key,
          filename: safeName,
          contentType: file.mimetype,
          size: file.size,
        };
      })
    );

    // Persist to MongoDB
    try {
      const docs = uploads.map((u) => ({
        key: u.key,
        url: u.url,
        filename: u.filename,
        bytes: u.size,
        contentType: u.contentType,
        category: folder,
        provider: "r2",
        user: req.user?._id,
      }));
      if (docs.length) {
        await Upload.insertMany(docs);
      }
    } catch (dbErr) {
      console.error("[uploads] failed to persist uploads to database:", dbErr);
    }

    return res.json({
      success: true,
      uploads,
      // Backward-compatibility for components expecting `urls` (e.g. asset-form.tsx)
      urls: uploads.map((u) => ({
        url: u.url,
        secure_url: u.url,
        key: u.key,
        public_id: u.key,
        filename: u.filename,
      })),
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Upload failed" });
  }
};

// 2. Fetch persisted uploads from MongoDB (authoritative DB-first)
export const listStoredUploadsDb = async (req: any, res: any) => {
  try {
    const category = (req.query?.category || "uploads").toString();
    const provider = (req.query?.provider || "").toString();
    const query: Record<string, any> = {
      category: new RegExp(
        `^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      ),
    };
    if (provider && provider !== "any") {
      query.provider = provider;
    }

    const docs = await Upload.find(query).sort({ createdAt: -1 }).lean();
    const files = (docs || []).map((d: any) => ({
      url: d.url,
      public_id: d.key,
      resource_type: "raw",
      format: (d.filename || "").split(".").pop(),
      bytes: d.bytes,
      created_at: d.createdAt,
      filename: d.filename,
    }));
    return res.json({ success: true, files });
  } catch (error: any) {
    console.error("DB list error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to list stored uploads" });
  }
};

// 3. List resources from provider (R2 or Cloudinary) with DB backfill
export const listUploadsFromProvider = async (req: any, res: any) => {
  try {
    const folder = (req.query?.category || "uploads")
      .toString()
      .replace(/\/+$/g, "");
    const provider = (req.query?.provider || "cloudinary").toString();

    // 1) DB-first: if records already exist, return them
    try {
      const dbQuery: Record<string, any> = {
        category: new RegExp(
          `^${folder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      };
      if (provider && provider !== "any") dbQuery.provider = provider;
      const docs = await Upload.find(dbQuery).sort({ createdAt: -1 }).lean();
      if (docs && docs.length) {
        const files = docs.map((d: any) => ({
          url: d.url,
          public_id: d.key,
          resource_type: "raw",
          format: (d.filename || "").split(".").pop(),
          bytes: d.bytes,
          created_at: d.createdAt,
          filename: d.filename,
        }));
        return res.json({ success: true, files });
      }
    } catch (e: any) {
      console.warn(
        "[uploads] DB-first list failed, falling back to provider:",
        e?.message || e
      );
    }

    // 2) If provider is R2
    if (provider === "r2") {
      const R2_ENDPOINT = process.env.R2_ENDPOINT;
      const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
      const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
      const R2_BUCKET = process.env.R2_BUCKET || "lynchpin";
      const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;

      if (
        !R2_ENDPOINT ||
        !R2_ACCESS_KEY_ID ||
        !R2_SECRET_ACCESS_KEY ||
        !R2_BUCKET ||
        !R2_PUBLIC_BASE_URL
      ) {
        return res.status(500).json({
          success: false,
          message: "R2 storage configuration missing in environment",
        });
      }

      const cleanEndpoint = getCleanR2Endpoint(R2_ENDPOINT, R2_BUCKET);
      const r2 = new S3Client({
        region: "auto",
        endpoint: cleanEndpoint,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      });

      const prefix = `${folder}/`;
      let contents: any[] = [];
      try {
        const directList = await r2.send(
          new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: prefix })
        );
        contents = directList.Contents || [];
      } catch (e: any) {
        if (e?.Code !== "NoSuchKey" && e?.name !== "NoSuchKey") throw e;
      }

      // Check legacy prefix if direct returned empty
      if (contents.length === 0) {
        try {
          const legacyList = await r2.send(
            new ListObjectsV2Command({
              Bucket: R2_BUCKET,
              Prefix: `lynchpin/${prefix}`,
            })
          );
          if (legacyList?.Contents?.length) {
            contents = legacyList.Contents;
          }
        } catch {}
      }

      const base = R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
      const inferTypeAndFormat = (key: string) => {
        const m = key.match(/\.([a-zA-Z0-9]+)$/);
        const ext = (m?.[1] || "").toLowerCase();
        const imageExt = new Set([
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "svg",
          "bmp",
        ]);
        const videoExt = new Set(["mp4", "webm", "mov", "mkv", "avi"]);
        let resource_type = "raw";
        if (imageExt.has(ext)) resource_type = "image";
        else if (videoExt.has(ext)) resource_type = "video";
        return { resource_type, format: ext };
      };

      const files = contents
        .filter(
          (o: any) =>
            o.Key && o.Key !== prefix && o.Key !== `lynchpin/${prefix}`
        )
        .map((o: any) => {
          const key = o.Key;
          const url = `${base}/${key}`;
          const name = key.split("/").pop();
          const { resource_type, format } = inferTypeAndFormat(key);
          return {
            url,
            public_id: key,
            resource_type,
            format,
            bytes: o.Size,
            created_at: o.LastModified,
            filename: name,
          };
        })
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      // Best effort backfill to DB
      try {
        if (files.length) {
          const ops = files.map((f: any) => ({
            updateOne: {
              filter: { key: f.public_id },
              update: {
                $setOnInsert: { key: f.public_id, createdAt: f.created_at },
                $set: {
                  url: f.url,
                  filename: f.filename,
                  bytes: f.bytes,
                  category: folder,
                  provider: "r2",
                  updatedAt: new Date(),
                },
              },
              upsert: true,
            },
          }));
          await Upload.bulkWrite(ops, { ordered: false });
        }
      } catch (e: any) {
        console.warn("[uploads] backfill DB from R2 failed:", e?.message || e);
      }

      return res.json({ success: true, files });
    }

    // Default: Cloudinary
    const result = await cloudinary.search
      .expression(`folder:${folder}/*`)
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();

    const files = (result?.resources || []).map((r: any) => ({
      url: r.secure_url || r.url,
      public_id: r.public_id,
      resource_type: r.resource_type,
      format: r.format,
      bytes: r.bytes,
      created_at: r.created_at,
      filename: r.filename,
    }));
    return res.json({ success: true, files });
  } catch (error: any) {
    console.error("List error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to list files" });
  }
};

// 4. Delete uploaded resource by public_id
export const deleteUploadedFile = async (req: any, res: any) => {
  try {
    const { public_id, resource_type: resourceType, provider } =
      req.query || {};
    if (!public_id) {
      return res
        .status(400)
        .json({ success: false, message: "public_id is required" });
    }

    const key = String(public_id);

    // If provider is R2
    if ((provider || "").toString() === "r2") {
      const R2_ENDPOINT = process.env.R2_ENDPOINT;
      const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
      const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
      const R2_BUCKET = process.env.R2_BUCKET || "lynchpin";

      if (
        !R2_ENDPOINT ||
        !R2_ACCESS_KEY_ID ||
        !R2_SECRET_ACCESS_KEY ||
        !R2_BUCKET
      ) {
        return res.status(500).json({
          success: false,
          message: "R2 storage configuration missing in environment",
        });
      }

      const cleanEndpoint = getCleanR2Endpoint(R2_ENDPOINT, R2_BUCKET);
      const r2 = new S3Client({
        region: "auto",
        endpoint: cleanEndpoint,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      });

      // Try deleting both direct key and legacy prefix
      try {
        await r2.send(
          new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })
        );
      } catch (err) {
        console.warn("Direct key delete warning:", err);
      }
      if (!key.startsWith("lynchpin/")) {
        try {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET,
              Key: `lynchpin/${key}`,
            })
          );
        } catch {}
      }

      await Upload.deleteOne({ key });
      await Upload.deleteOne({ key: `lynchpin/${key}` });
      return res.json({ success: true, provider: "r2" });
    }

    // Default / Cloudinary
    const tryTypes = resourceType
      ? [String(resourceType)]
      : ["image", "video", "raw"];
    let lastError: any = null;
    for (const type of tryTypes) {
      try {
        const result = await cloudinary.uploader.destroy(key, {
          resource_type: type,
        });
        if (result?.result === "ok" || result?.result === "not found") {
          await Upload.deleteOne({ key });
          return res.json({
            success: true,
            resource_type: type,
            result: result?.result,
          });
        }
        lastError = new Error(
          `Unexpected result: ${result?.result || "unknown"}`
        );
      } catch (err) {
        lastError = err;
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete resource",
      error: String(lastError?.message || lastError),
    });
  } catch (error: any) {
    console.error("Delete error:", error);
    return res.status(500).json({ success: false, message: "Delete failed" });
  }
};
