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
    variables: v.optional(v.any()),
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

    /*
     * Customers and groups is a many to many relation. A customer can be in many groups.
     * So if we have two groups, the customer can be in both, we don't want to send the
     * broadcast to him twice thus below we get uniqueCustomerArray.
     *
     * found this online on how to remove unique object from an array of objects
     */

    const uniqueCustomerArray = customers.filter(
      (o, index, arr) =>
        arr.findIndex((item) => JSON.stringify(item) === JSON.stringify(o)) ===
        index,
    );

    const template = await ctx.runQuery(internal.templates.getTemplateById, {
      businessId: args.businessId,
      templateId: args.templateId,
    });

    const variables = (args.variables ?? {}) as Record<
      string,
      { source: string; value: string }
    >;

    // REVIEW: Get this part reviewed for the order of array.
    const fullBodyVariables = Object.values(variables);

    const headers = new Headers();
    headers.append("Authorization", `Basic ${process.env.INTERAKT_API_KEY!}`);
    headers.append("Content-Type", "application/json");

    for (const customer of uniqueCustomerArray) {
      const bodyValues = fullBodyVariables
        .map((el) => {
          if (el.source === "customer_name") {
            return customer?.name ?? "";
          }
          if (el.source === "customer_phone") {
            return customer?.phone ?? "";
          }
          return el.value;
        })
        .reverse();

      let body = {
        countryCode: "+91",
        phoneNumber: customer?.phone,
        template_category: template.category,
        callbackData: "some text here",
        type: "Template",
        template: {
          name: template.display_name,
          languageCode: "en",
          bodyValues: bodyValues,
        },
      };

      if (template.header_format === "NONE") {
        body = {
          ...body,
        }
      }
      if(template.header_format === "TEXT"){
        body = {
          ...body,
          
        }
      }

     

      const response = await fetch(
        "https://api.interakt.ai/v1/public/message/",
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      console.log(data);
    }
  },
});
