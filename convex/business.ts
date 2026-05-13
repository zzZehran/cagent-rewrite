import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getBusinessByOwnerId = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const business = await ctx.db
      .query("business")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
      .first();
  },
});

export const registerBusiness = mutation({
  args: {
    ownerId: v.string(),
    businessName: v.string(),
    businessDescription: v.optional(v.string()),
    groups: v.array(v.string()),
    customers: v.array(
      v.object({
        name: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
        groups: v.optional(v.array(v.string())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Creating business
    const businessId = await ctx.db.insert("business", {
      ownerId: args.ownerId,
      name: args.businessName,
      description: args.businessDescription,
    });

    // Create groups
    const groupMap: Record<string, Id<"groups">> = {};
    for (const groupName of args.groups) {
      const trimmedGroupName = groupName.trim();
      if (trimmedGroupName && !groupMap[trimmedGroupName]) {
        const groupId = await ctx.db.insert("groups", {
          businessId,
          name: trimmedGroupName,
        });
        groupMap[trimmedGroupName] = groupId;
      }
    }

    //Create customers and link them to groups
    for (const customer of args.customers) {
      const customerId = await ctx.db.insert("customers", {
        businessId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      });

      if (customer.groups) {
        for (const gName of customer.groups) {
          const trimmedGroupName = gName.trim();
          const groupId = groupMap[trimmedGroupName];
          if (groupId) {
            await ctx.db.insert("customerGroups", {
              customerId,
              groupId,
            });
          }
        }
      }
    }

    return businessId
  },
});
