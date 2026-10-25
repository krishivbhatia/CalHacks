import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("children").collect(),
});

// For ?child=maya URLs (lowercase name matched case-insensitively).
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const all = await ctx.db.query("children").collect();
    return all.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null;
  },
});

// For ?parent=... URLs.
export const parentByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const all = await ctx.db.query("parents").collect();
    return (
      all.find((p) => p.displayName.toLowerCase() === name.toLowerCase()) ??
      null
    );
  },
});
