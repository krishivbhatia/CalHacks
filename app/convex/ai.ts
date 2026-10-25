// STUBS owned by Person B. Replace the handler bodies with real Claude calls.
// Keep the names and args: messages.ts schedules these.
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Symbols -> one literal first-person sentence. B: call Claude here.
export const expandSymbols = internalAction({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }): Promise<void> => {
    const m = await ctx.runQuery(internal.messages.get, { messageId });
    if (!m) return;
    const stub = `I see ${m.symbols.join(" and ")}.`; // STUB
    await ctx.runMutation(internal.messages.setDraft, {
      messageId,
      draftText: stub,
    });
  },
});

// Safety check on the CONFIRMED text. On pass -> schedule voice.speak.
// On flag -> messages.setFlagged and stop (never reaches Cartesia).
export const moderate = internalAction({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }): Promise<void> => {
    const m = await ctx.runQuery(internal.messages.get, { messageId });
    if (!m || m.status !== "confirmed") return;
    // STUB: always pass. B: call Claude and flag if unsafe.
    await ctx.scheduler.runAfter(0, internal.voice.speak, { messageId });
  },
});

// Parent intake + matching: B fills these in later (see Person B brief).
