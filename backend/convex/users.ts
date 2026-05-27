import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      return null;
    }

    const user = await ctx.db.get(userId);

    if (user === null) {
      return null;
    }

    return {
      id: user._id,
      name: user.name ?? null,
      email: user.email ?? null,
      image: user.image ?? null,
      createdAt: user._creationTime,
    };
  },
});

export const updateProfile = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error('Client is not authenticated.');
    }

    const name = args.name.trim();

    if (name.length < 2) {
      throw new Error('Name must be at least 2 characters.');
    }

    await ctx.db.patch(userId, { name });

    return { name };
  },
});
