import { ConvexError, v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

type templateBody = {
  businessId: Id<"business">;
  localName: string;
  display_name: string;
  category: "Utility" | "Marketing";
  header_format?: "NONE" | "TEXT" | "IMAGE";
  header?: string;
  header_text?: string[];
  body: string;
  body_text: string[];
  footer?: string;
};

export const createTemplate = internalMutation({
  args: {
    businessId: v.id("business"),
    localName: v.string(),
    display_name: v.string(),
    category: v.union(v.literal("Utility"), v.literal("Marketing")),
    header_format: v.union(
      v.literal("NONE"),
      v.literal("TEXT"),
      v.literal("IMAGE"),
    ),
    header: v.optional(v.string()),
    header_text: v.array(v.string()),
    body: v.string(), //not using yet
    body_text: v.array(v.string()),
    footer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const res = await ctx.db.insert("whatsappTemplates", {
      businessId: args.businessId,
      language: "English",
      display_name: args.display_name,
      category: args.category,
      localName: args.localName,
      header_format: args.header_format,
      header_text: args.header_text,
      headerVariables: args.header_text,
      bodyVariables: args.body_text,
      status: "Pending",
    });
    if (!res) throw new ConvexError("Failed to add template.");
    return res;
  },
});

export const registerTemplate = action({
  args: {
    businessId: v.id("business"),
    localName: v.string(),
    display_name: v.string(),
    category: v.union(v.literal("Utility"), v.literal("Marketing")),
    header_format: v.union(
      v.literal("NONE"),
      v.literal("TEXT"),
      v.literal("IMAGE"),
    ),
    header: v.string(),
    header_text: v.array(v.string()),
    body: v.string(),
    body_text: v.array(v.string()),
    footer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const headers = new Headers();
    headers.append("Authorization", `Basic ${process.env.INTERAKT_API_KEY!}`);
    headers.append("Content-Type", "application/json");

    let body;
    if (!args.header_format || args.header_format === "NONE") {
      body = {
        language: "English",
        display_name: args.display_name,
        category: args.category,
        body: args.body,
        body_text: args.body_text,
        footer: args.footer ? args.footer : null,
      };
    } else if (args.header_format === "TEXT") {
      body = {
        language: "English",
        display_name: args.display_name,
        category: args.category,
        header_format: args.header_format,
        header: args.header,
        header_text: args.header_text,
        body: args.body,
        body_text: args.body_text,
        footer: args.footer ? args.footer : null,
      };
    }
    if (!body) throw new ConvexError("Template body is required");

    const requestOptions = {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    };

    const response = await fetch(
      "https://api.interakt.ai/v1/public/track/templates/",
      requestOptions,
    );
    if (!response.ok) {
      const res = await response.json()
      throw new ConvexError(res.message);
    }
    const res = await ctx.runMutation(internal.templates.createTemplate, {
      businessId: args.businessId,
      localName: args.localName,
      display_name: args.display_name,
      category: args.category,
      header_format: args.header_format,
      header: args.header,
      header_text: args.header_text,
      body: args.body,
      body_text: args.body_text,
      footer: args.footer,
    });
    return "success";
  },
});
