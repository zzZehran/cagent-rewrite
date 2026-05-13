import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByBusiness = query({
  args: { businessId: v.id("business") },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    return groups;
  },
});
