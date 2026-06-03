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
    hardAccelerationMs2: v.optional(v.number()),
    hardBrakingMs2: v.optional(v.number()),
    sharpTurnDegS: v.optional(v.number()),
    noiseAlertDb: v.optional(v.number()),
    updatedAt: v.number(),
  }).index('userId', ['userId']),
  rides: defineTable({
    userId: v.id('users'),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    durationSeconds: v.number(),
    distanceKm: v.number(),
    score: v.number(),
    maxSpeedKmh: v.number(),
    avgSpeedKmh: v.number(),
    weatherCondition: v.optional(v.string()),
    temperatureC: v.optional(v.number()),
    windSpeedKmh: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('userId', ['userId'])
    .index('userId_startTime', ['userId', 'startTime']),
  ridePoints: defineTable({
    rideId: v.id('rides'),
    userId: v.id('users'),
    latitude: v.number(),
    longitude: v.number(),
    speedKmh: v.number(),
    timestamp: v.number(),
    altitude: v.optional(v.number()),
  }).index('rideId', ['rideId']),
  rideIncidents: defineTable({
    rideId: v.id('rides'),
    userId: v.id('users'),
    type: v.union(
      v.literal('hard_acceleration'),
      v.literal('hard_braking'),
      v.literal('sharp_turn'),
      v.literal('speed_exceeded'),
      v.literal('noise_alert'),
    ),
    timestamp: v.number(),
    intensity: v.number(),
    speedKmh: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  }).index('rideId', ['rideId']),
});
