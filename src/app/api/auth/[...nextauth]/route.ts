// Route handler de Auth.js v5: expone /api/auth/* (signIn, callback, session…).
import { handlers } from "@/lib/erp/auth.server";

export const { GET, POST } = handlers;
