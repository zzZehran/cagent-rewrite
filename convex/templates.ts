import { ConvexError, v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

type MediaHandlerType = {
  result: boolean;
  message: string;
  data: {
    file_url: string;
    file_handle: string;
    file_name: string;
  };
};

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

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
    header_text: v.optional(v.array(v.string())),
    header_handle: v.optional(v.string()),
    header_handle_file_url: v.optional(v.string()),
    header_handle_file_name: v.optional(v.string()),
    body: v.string(),
    body_text: v.optional(v.array(v.string())),
    footer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const res = await ctx.db.insert("whatsappTemplates", {
      businessId: args.businessId,
      language: "English",
      display_name: args.display_name,
      category: args.category,
      localName: args.localName,
      header: args.header,
      header_format: args.header_format,
      header_text: args.header_text,
      header_handle: args.header_format,
      header_handle_file_url: args.header_handle_file_url,
      header_handle_file_name: args.header_handle_file_name,
      body: args.body,
      body_text: args.body_text,
      status: "Pending",
      footer: args.footer,
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
    header: v.optional(v.string()),
    header_text: v.optional(v.string()),
    body: v.string(),
    body_text: v.optional(v.string()),
    footer: v.optional(v.string()),
    headerImageId: v.optional(v.string()),
    headerImageName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const headers = new Headers();
    headers.append("Authorization", `Basic ${process.env.INTERAKT_API_KEY!}`);
    headers.append("Content-Type", "application/json");

    let body;
    let bodyVariables;
    let headerVariables;
    if (args.header_format === "TEXT" && args.header_text) {
      headerVariables = args.header_text.split(",");
    }
    if (args.body_text) {
      bodyVariables = args.body_text.split(",");
    }
    //No header
    if (!args.header_format || args.header_format === "NONE") {
      body = {
        language: "English",
        display_name: args.display_name,
        category: args.category,
        body: args.body,
        body_text: bodyVariables,
        footer: args.footer ? args.footer : null,
      };
    }
    //Text header
    else if (args.header_format === "TEXT") {
      body = {
        language: "English",
        display_name: args.display_name,
        category: args.category,
        header_format: args.header_format,
        header: args.header,
        header_text: headerVariables,
        body: args.body,
        body_text: bodyVariables,
        footer: args.footer ? args.footer : null,
      };
    }
    //Image header
    else if (args.header_format === "IMAGE" && args.headerImageId) {
      const headerUrl = await ctx.storage.getUrl(args.headerImageId);

      if (!headerUrl) {
        throw new Error("Image not found");
      }
      const headerImageResponse = await fetch(headerUrl);
      const headerImageBlob = await headerImageResponse.blob();

      const formData = new FormData();
      formData.append("uploadFile", headerImageBlob, args.headerImageName);

      const requestOptions = {
        method: "POST",
        headers: headers,
        body: formData,
      };

      const res = await fetch(
        "https://api.interakt.ai/v1/public/track/files/upload_to_fb/?fileCategory=message_template_media",
        requestOptions,
      );
      const { data } = (await res.json()) as MediaHandlerType;
      body = {
        language: "English",
        display_name: args.display_name,
        category: args.category,
        header_format: args.header_format,
        header_handle: [data.file_handle],
        header_handle_file_url: data.file_url,
        header_handle_file_name: data.file_name,
        body: args.body,
        body_text: bodyVariables,
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
      console.log("RESPONSE NOT OK");
      const res = await response.json();
      throw new ConvexError(res.message);
    }
    const res = await ctx.runMutation(internal.templates.createTemplate, {
      businessId: args.businessId,
      localName: args.localName,
      display_name: args.display_name,
      category: args.category,
      header_format: args.header_format,
      header: args.header,
      header_text: headerVariables,
      header_handle: body.header_handle && body.header_handle[0],
      header_handle_file_url: body.header_handle_file_url,
      header_handle_file_name: body.header_handle_file_name,
      body: args.body,
      body_text: bodyVariables,
      footer: args.footer,
    });
    return "success";
  },
});

export const getTemplatesByBusinessId = query({
  args: {
    businessId: v.id("business"),
  },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("whatsappTemplates")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    return templates;
  },
});

export const getTemplateById = internalQuery({
  args: {
    businessId: v.id("business"),
    templateId: v.id("whatsappTemplates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);

    if (!template) throw new ConvexError("Template not found");
    if (template.businessId !== args.businessId)
      throw new ConvexError("Template not found");

    return template;
  },
});


export const refreshTemplate = action({
  args: {
    businessId: v.id("business")
  },
  handler: async (ctx, args) => {

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Basic ${process.env.INTERAKT_API_KEY!}`);
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
    }

    try {
      const res = await fetch("https://api.interakt.ai/v1/public/track/organization/templates?autosubmitted_for=all&approval_status=APPROVED&language=all", requestOptions)
      if (!res.ok) {
        throw new ConvexError("Failed to fetch templates");
      }
      const data = await res.json();
      const internalRes = await ctx.runMutation(internal.templates.updateTemplateStatus,
        { businessId: args.businessId, templates: data.results.templates })
      if (internalRes === "success") return "success"

    } catch (error) {
      console.log("Catch: ", error)
      throw new ConvexError("Failed to fetch templates.");
    }

  }
})

/* This internal mutation updates the status of the template based on if the fetch call returns 
 * the template. This is because interakt doesn't return explicit status rather it omits
*  un-verified templates and only returns verified templates. 
*/

// REVEIW: How to make templates type safe here. Or API calls in genearl?
export const updateTemplateStatus = internalMutation({
  args: {
    businessId: v.id("business"),
    templates: v.any(),
  },
  handler: async (ctx, args) => {
    const allTemplates = await ctx.db.query("whatsappTemplates").withIndex("by_businessId", (q) => q.eq("businessId", args.businessId)).collect();

    for (const template of args.templates) {
      for (const dbTemplates of allTemplates) {
        if (dbTemplates.display_name === template.display_name) {
          await ctx.db.patch(dbTemplates._id, { status: "Approved" })
        }
      }
    }

    return "success";
  }
})