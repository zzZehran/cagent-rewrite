import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createCustomer = mutation({
  args: {
    businessId: v.id("business"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    groupIds: v.optional(v.array(v.id("groups"))),
  },
  handler: async (ctx, args) => {
    const customerId = await ctx.db.insert("customers", {
      businessId: args.businessId,
      name: args.name,
      email: args.email ?? "",
      phone: args.phone,
    });
    if (args.groupIds) {
      for (const groupId of args.groupIds) {
        await ctx.db.insert("customerGroups", { customerId, groupId });
      }
    }
    return customerId;
  },
});
