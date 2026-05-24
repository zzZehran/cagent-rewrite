import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

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

export const bulkCreateCustomers = mutation({
  args: {
    businessId: v.id("business"),
    customers: v.array(
      v.object({
        name: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
        groupNames: v.array(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existingGroups = await ctx.db
      .query("groups")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    const groupMap: Record<string, Id<"groups">> = {};
    for (const group of existingGroups) {
      groupMap[group.name] = group._id;
    }

    for (const customer of args.customers) {
      const customerId = await ctx.db.insert("customers", {
        businessId: args.businessId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      });

      for (const groupName of customer.groupNames) {
        const name = groupName.trim();
        if (!name) continue;

        if (!groupMap[name]) {
          const newGroupId = await ctx.db.insert("groups", {
            businessId: args.businessId,
            name,
          });
          groupMap[name] = newGroupId;
        }

        await ctx.db.insert("customerGroups", {
          customerId,
          groupId: groupMap[name],
        });
      }
    }

    return { success: true, customersProcessed: args.customers.length };
  },
});

export const getPaginatedCustomersByBusiness = query({
  args: {
    businessId: v.id("business"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .paginate(args.paginationOpts);

    if (!customers) throw new ConvexError("Failed to fetch users.");

    return customers;
  },
});

export const getSearchedCustomers = query({
  args: {
    businessId: v.id("business"),
    customerName: v.string(),
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withSearchIndex("search_customerName", (q) =>
        q.search("name", args.customerName).eq("businessId", args.businessId),
      )
      .take(10);
    return customers;  
  },
});
