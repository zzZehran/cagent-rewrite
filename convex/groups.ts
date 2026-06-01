import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

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

export const createCustomerGroup = mutation({
  args: { businessId: v.id("business"), groupName: v.string() },
  handler: async (ctx, args) => {
    const group = await ctx.db.insert("groups", {
      businessId: args.businessId,
      name: args.groupName,
    });

    if (!group) throw new ConvexError("Failed to create group.");
  },
});

export const updateCustomer = mutation({
  args: { groupId: v.id("groups"), groupName: v.string() },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId)

    if (!group) {
      throw new ConvexError("Group doesn't exist");
    }

    const updatedGroup = await ctx.db.patch(args.groupId, { name: args.groupName });
  },
});
