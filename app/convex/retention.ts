// Operator-only deletion. No automatic retention period or public destructive endpoint.
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
export const deleteClosedRoomBatch = internalMutation({
  args: { roomId: v.id("rooms"), before: v.number(), confirm: v.literal("DELETE CLOSED ROOM HISTORY") },
  handler: async (ctx, { roomId, before }) => {
    if (!Number.isFinite(before) || before > Date.now()) throw new Error("Choose a finite past cutoff timestamp");
    const room = await ctx.db.get(roomId);
    if (!room || room.status !== "closed") throw new Error("Only closed rooms can be cleaned up");
    const rows = await ctx.db.query("messages").withIndex("by_room", q => q.eq("roomId", roomId).lt("_creationTime", before)).take(50);
    const files = new Set(rows.flatMap(m => m.audioStorageId ? [m.audioStorageId] : []));
    for (const row of rows) await ctx.db.delete(row._id);
    let deletedAudio = 0;
    for (const id of files) {
      const referenced = await ctx.db.query("messages").withIndex("by_audioStorageId", q => q.eq("audioStorageId", id)).first();
      if (!referenced) { await ctx.storage.delete(id); deletedAudio++; }
    }
    return { deletedMessages: rows.length, deletedAudio, mayHaveMore: rows.length === 50 };
  },
});
