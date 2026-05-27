import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  ...authTables,
  userSettings: defineTable({
    userId: v.id('users'),
    notificationsEnabled: v.boolean(),
    speedUnit: v.union(v.literal('kmh'), v.literal('mph')),
    theme: v.union(v.literal('light'), v.literal('dark')),
    cameraEnabled: v.boolean(),
    gpsEnabled: v.boolean(),
    microphoneEnabled: v.boolean(),
    updatedAt: v.number(),
  }).index('userId', ['userId']),
});
