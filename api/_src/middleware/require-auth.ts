import type { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

// Fails open until Supabase auth is configured, matching the frontend's
// gate: staff pages aren't locked before login is actually set up.
export const requireAuth: RequestHandler = async (req, res, next) => {
  if (!supabase) {
    next();
    return;
  }
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    res.status(401).json({ message: "Sign in required" });
    return;
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ message: "Sign in required" });
    return;
  }
  next();
};
