import { z } from "zod";
import { normalizeKenyanPhone } from "@/lib/format";
export const phoneField = z
    .string()
    .trim()
    .min(1, "Enter your phone number.")
    .refine((v) => normalizeKenyanPhone(v) !== null, "Enter a valid Kenyan number, like 0712 345 678.");
export const passwordField = z.string().min(8, "Use at least 8 characters.");
