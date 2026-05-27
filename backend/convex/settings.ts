import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';

const defaultSettings = {
  notificationsEnabled: true,
  speedUnit: 'kmh' as const,
  theme: 'light' as const,
  cameraEnabled: true,
  gpsEnabled: true,
  microphoneEnabled: true,
};

async function getSettingsDoc(ctx: QueryCtx | MutationCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('userSettings')
    .withIndex('userId', (q) => q.eq('userId', userId))
    .unique();
}

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      return null;
    }

    const settings = await ctx.db
      .query('userSettings')
      .withIndex('userId', (q) => q.eq('userId', userId))
      .unique();

    return {
      ...defaultSettings,
      ...settings,
    };
  },
});

export const update = mutation({
  args: {
    notificationsEnabled: v.optional(v.boolean()),
    speedUnit: v.optional(v.union(v.literal('kmh'), v.literal('mph'))),
    theme: v.optional(v.union(v.literal('light'), v.literal('dark'))),
    cameraEnabled: v.optional(v.boolean()),
    gpsEnabled: v.optional(v.boolean()),
    microphoneEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error('Client is not authenticated.');
    }

    const existing = await getSettingsDoc(ctx, userId);
    const patch = {
      ...args,
      updatedAt: Date.now(),
    };

    if (existing === null) {
      await ctx.db.insert('userSettings', {
        userId,
        ...defaultSettings,
        ...patch,
      });
      return;
    }

    await ctx.db.patch(existing._id, patch);
  },
});
