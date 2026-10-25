/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "./schema";
import { internal, api } from "./_generated/api";
const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
it("refuses deletion of active rooms, preserves shared audio, and respects cutoff", async () => {
 const t = convexTest(schema, modules);
 const f = await t.mutation(internal.diagnostics.createSmokeRoom, {});
 const file = await t.run(ctx => ctx.storage.store(new Blob(["synthetic WAV"])));
 const args = { roomId: f.roomId, before: Date.now() - 1, confirm: "DELETE CLOSED ROOM HISTORY" as const };
 await expect(t.mutation(internal.retention.deleteClosedRoomBatch, args)).rejects.toThrow("Only closed");
 await t.run(async ctx => {
  await ctx.db.patch(f.roomId, { status: "closed" });
  await ctx.db.insert("messages", { roomId: f.roomId, senderChildId: f.childAId, symbols: ["hi"], status: "spoken", audioStorageId: file });
  const other = await ctx.db.insert("rooms", { matchId: f.matchId, status: "closed" });
  await ctx.db.insert("messages", { roomId: other, senderChildId: f.childAId, symbols: ["hi"], status: "spoken", audioStorageId: file });
 });
 const empty = await t.mutation(internal.retention.deleteClosedRoomBatch, { ...args, before: 0 });
 expect(empty.deletedMessages).toBe(0);
 const result = await t.mutation(internal.retention.deleteClosedRoomBatch, { ...args, before: Date.now() });
 expect(result.deletedMessages).toBe(1); expect(result.deletedAudio).toBe(0);
 expect(await t.run(async ctx => Boolean(await ctx.storage.get(file)))).toBe(true);
});
it("deletes unreferenced audio and returns only the latest 100 live rows", async () => {
 const t = convexTest(schema, modules);
 const f = await t.mutation(internal.diagnostics.createSmokeRoom, {});
 const file = await t.run(ctx => ctx.storage.store(new Blob(["synthetic WAV"])));
 await t.run(async ctx => {
  await ctx.db.patch(f.roomId, { status: "closed" });
  for (let i = 0; i < 105; i++) await ctx.db.insert("messages", { roomId: f.roomId, senderChildId: f.childAId, symbols: [String(i)], status: "spoken", audioStorageId: file });
 });
 const live = await t.query(api.messages.listByRoom, { roomId: f.roomId });
 expect(live.length).toBe(100); expect(live[0].symbols).toEqual(["5"]); expect(live[99].symbols).toEqual(["104"]);
 const page = await t.query(api.messages.historyByRoom, { roomId: f.roomId, paginationOpts: { numItems: 50, cursor: null } });
 expect(page.page.length).toBe(50); expect(page.isDone).toBe(false);
 const args = { roomId: f.roomId, before: Date.now(), confirm: "DELETE CLOSED ROOM HISTORY" as const };
 expect((await t.mutation(internal.retention.deleteClosedRoomBatch, args)).deletedAudio).toBe(0);
 expect((await t.mutation(internal.retention.deleteClosedRoomBatch, args)).deletedAudio).toBe(0);
 const final = await t.mutation(internal.retention.deleteClosedRoomBatch, args);
 expect(final.deletedMessages).toBe(5); expect(final.deletedAudio).toBe(1);
 expect(await t.run(ctx => ctx.storage.get(file))).toBeNull();
});
