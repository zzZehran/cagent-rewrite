import { v } from "convex/values";
import { action, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getCustomersByGroupId = internalQuery({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const customerGroups = await ctx.db
      .query("customerGroups")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const customers = await Promise.all(
      customerGroups.map((cg) => ctx.db.get(cg.customerId)),
    );

    return customers.filter(Boolean);
  },
});

export const sendBroadcast = action({
  args: {
    businessId: v.id("business"),
    broadcastGroupIds: v.array(v.id("groups")),
    templateId: v.id("whatsappTemplates"),
    varaibles: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    let customers = [];
    for (const groupId of args.broadcastGroupIds) {
      const fetchedCustomers = await ctx.runQuery(
        internal.broadcast.getCustomersByGroupId,
        {
          groupId: groupId,
        },
      );
      customers.push(...fetchedCustomers);
    }

    //found this online on how to remove unique object from an array of objects
    const uniqueCustomerArray = customers.filter(
      (o, index, arr) =>
        arr.findIndex((item) => JSON.stringify(item) === JSON.stringify(o)) ===
        index,
    );

    const template = await ctx.runQuery(internal.templates.getTemplateById, {
      businessId: args.businessId,
      templateId: args.templateId,
    });

    const headers = new Headers();
    headers.append("Authorization", `Basic ${process.env.INTERAKT_API_KEY!}`);
    headers.append("Content-Type", "application/json");

    // working on sending broadcast
    for (const customer of uniqueCustomerArray) {
      const body = {
        countryCode: "+91",
        phoneNumber: customer?.phone,
        template_category: template.category,
        callbackData: "some text here",
        type: "Template",
        template: {
          name: template.display_name,
          languageCode: "en",
          bodyValues: ["body_variable_value_1", "body_variable_value_n"],
        },
      };
    }
  },
});
