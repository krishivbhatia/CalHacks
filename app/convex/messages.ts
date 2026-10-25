import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ---------- Public API (kid view + parent view) ----------

// Live transcript. Includes audioUrl so the client can just play it.
export const listByRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .order("asc")
      .collect();
    return await Promise.all(
      msgs.map(async (m) => ({
        ...m,
        audioUrl: m.audioStorageId
          ? await ctx.storage.getUrl(m.audioStorageId)
          : null,
      })),
    );
  },
});

export const sendSymbols = mutation({
  args: {
    roomId: v.id("rooms"),
    childId: v.id("children"),
    symbols: v.array(v.string()),
  },
  handler: async (ctx, { roomId, childId, symbols }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.status !== "active") throw new Error("Room is not active");
    const match = await ctx.db.get(room.matchId);
    if (!match || (match.childAId !== childId && match.childBId !== childId)) {
      throw new Error("Child is not in this room");
    }
    if (symbols.length === 0 || symbols.length > 6) {
      throw new Error("Send between 1 and 6 symbols");
    }

    // One unfinished draft per child at a time. Drafts older than 30s are
    // treated as stuck and auto-rejected so a child is never locked out.
    const recent = await ctx.db
      .query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .order("desc")
      .take(10);
    const now = Date.now();
    const pending = recent.filter(
      (m) =>
        m.senderChildId === childId &&
        (m.status === "drafting" || m.status === "draft"),
    );
    if (pending.some((m) => now - m._creationTime < 30_000)) {
      throw new Error("Finish or reject your current message first");
    }
    for (const m of pending) {
      await ctx.db.patch(m._id, { status: "rejected" });
    }

    const messageId = await ctx.db.insert("messages", {
      roomId,
      senderChildId: childId,
      symbols,
      status: "drafting",
    });
    await ctx.scheduler.runAfter(0, internal.ai.expandSymbols, { messageId });
    return messageId;
  },
});

// Child taps the tick. Hard gate: nothing is moderated or spoken before this.
export const confirm = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const m = await ctx.db.get(messageId);
    if (!m) throw new Error("Message not found");
    if (m.status !== "draft") return; // idempotent against double taps
    const room = await ctx.db.get(m.roomId);
    if (!room || room.status !== "active") throw new Error("Room is not active");
    await ctx.db.patch(messageId, {
      status: "confirmed",
      finalText: m.draftText,
    });
    // moderate -> (on pass) speak. Person B's moderate schedules voice.speak.
    await ctx.scheduler.runAfter(0, internal.ai.moderate, { messageId });
  },
});

// Child taps the cross.
export const reject = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const m = await ctx.db.get(messageId);
    if (!m) throw new Error("Message not found");
    if (m.status !== "draft" && m.status !== "drafting") return;
    await ctx.db.patch(messageId, { status: "rejected" });
  },
});

// ---------- Internal helpers (Person B's actions call these) ----------

export const get = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => ctx.db.get(messageId),
});

// Recent context for Claude: last N messages in the room, oldest first.
export const recentForRoom = internalQuery({
  args: { roomId: v.id("rooms"), limit: v.optional(v.number()) },
  handler: async (ctx, { roomId, limit }) => {
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .order("desc")
      .take(limit ?? 5);
    return msgs.reverse();
  },
});

export const setDraft = internalMutation({
  args: { messageId: v.id("messages"), draftText: v.string() },
  handler: async (ctx, { messageId, draftText }) => {
    const m = await ctx.db.get(messageId);
    if (!m || m.status !== "drafting") return; // child may have rejected already
    await ctx.db.patch(messageId, { draftText, status: "draft" });
  },
});

export const setFlagged = internalMutation({
  args: { messageId: v.id("messages"), moderationNote: v.string() },
  handler: async (ctx, { messageId, moderationNote }) => {
    await ctx.db.patch(messageId, { status: "flagged", moderationNote });
  },
});

export const setSpoken = internalMutation({
  args: {
    messageId: v.id("messages"),
    audioStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { messageId, audioStorageId }) => {
    await ctx.db.patch(messageId, { status: "spoken", audioStorageId });
  },
});
