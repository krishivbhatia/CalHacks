// STUB owned by Person B. Replace with the real Cartesia call.
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const speak = internalAction({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }): Promise<void> => {
    const m = await ctx.runQuery(internal.messages.get, { messageId });
    if (!m || m.status !== "confirmed") return;
    // STUB: no audio yet, just flip to spoken so the UI flow can be tested.
    // B: call Cartesia, then:
    //   const audioStorageId = await ctx.storage.store(new Blob([bytes], { type: "audio/wav" }));
    //   await ctx.runMutation(internal.messages.setSpoken, { messageId, audioStorageId });
    await ctx.runMutation(internal.messages.setSpoken, { messageId });
  },
});
