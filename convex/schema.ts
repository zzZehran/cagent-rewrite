import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  business: defineTable({
    ownerId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  }).index("by_ownerId", ["ownerId"]),

  customers: defineTable({
    businessId: v.id("business"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    lastContactedAt: v.optional(v.number()),
  })
    .index("by_businessId", ["businessId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["businessId"],
    }),

  groups: defineTable({
    businessId: v.id("business"),
    name: v.string(),
  }).index("by_businessId", ["businessId"]),
  
  customerGroups: defineTable({
    customerId: v.id("customers"),
    groupId: v.id("groups"),
  })
    .index("by_customerId", ["customerId"])
    .index("by_groupId", ["groupId"]),
});
