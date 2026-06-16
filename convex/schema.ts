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
    .searchIndex("search_customerName", {
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

  /*
   * Below some fields are snake_cased because interakt expects fields as that.
   * To prevent mapping between snake_case and camelCase in backend mutation/query I have kept
   * some fields as snake_case and others as camelCase. This way I can spread the payload for ease.
   */
  whatsappTemplates: defineTable({
    businessId: v.id("business"),
    language: v.string(),
    display_name: v.string(), //name in interakt
    category: v.union(v.literal("Utility"), v.literal("Marketing")),
    localName: v.string(), //name in db
    header: v.optional(v.string()),
    body: v.string(),
    body_text: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("Approved"),
      v.literal("Pending"),
      v.literal("Rejected"),
    ),
    header_format: v.union(
      v.literal("NONE"),
      v.literal("TEXT"),
      v.literal("IMAGE"),
    ),
    header_text: v.optional(v.array(v.string())),
    header_handle: v.optional(v.string()),
    header_handle_file_url: v.optional(v.string()),
    header_handle_file_name: v.optional(v.string()),
    footer: v.optional(v.string()),
  }).index("by_businessId", ["businessId"]),
});
