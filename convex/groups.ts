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

export const updateGroup = mutation({
  args: { groupId: v.id("groups"), groupName: v.string() },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);

    if (!group) {
      throw new ConvexError("Group doesn't exist");
    }

    const updatedGroup = await ctx.db.patch(args.groupId, {
      name: args.groupName,
    });
  },
});

export const deleteGroup = mutation({
  args: {
    businessId: v.id("business"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    const foundGroup = groups.find((group) => group._id === args.groupId);
    if (!foundGroup) throw new ConvexError("Group not found.");

    await ctx.db.delete("groups", args.groupId);
  },
});
