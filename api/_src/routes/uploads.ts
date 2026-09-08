import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/require-auth";
import { supabaseAdmin } from "../lib/supabase-admin";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router: IRouter = Router();

const BUCKET = "ingredient-images";

router.post("/bakery/uploads", requireAuth, upload.single("file"), async (req, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ message: "Photo uploads aren't set up yet." });
    return;
  }
  if (!req.file) {
    res.status(400).json({ message: "No file uploaded" });
    return;
  }
  const extension = req.file.originalname.split(".").pop() || "jpg";
  const path = `${randomUUID()}.${extension}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, req.file.buffer, {
    contentType: req.file.mimetype,
  });
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  res.status(201).json({ url: data.publicUrl });
});

export default router;
