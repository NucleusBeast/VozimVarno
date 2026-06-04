import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

const incidentType = v.union(
  v.literal('hard_acceleration'),
  v.literal('hard_braking'),
  v.literal('sharp_turn'),
  v.literal('speed_exceeded'),
  v.literal('noise_alert'),
);

const ridePoint = v.object({
  latitude: v.number(),
  longitude: v.number(),
  speedKmh: v.number(),
  timestamp: v.number(),
  altitude: v.optional(v.number()),
});

const rideIncident = v.object({
  id: v.string(),
  type: incidentType,
  timestamp: v.number(),
  intensity: v.number(),
  speedKmh: v.optional(v.number()),
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
});

export const createRide = mutation({
  args: {
    startTime: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error('Client is not authenticated.');

    return await ctx.db.insert('rides', {
      userId,
      startTime: args.startTime,
      durationSeconds: 0,
      distanceKm: 0,
      score: 100,
      maxSpeedKmh: 0,
      avgSpeedKmh: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const syncLocalRide = mutation({
  args: {
    clientRideId: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    durationSeconds: v.number(),
    distanceKm: v.number(),
    score: v.number(),
    maxSpeedKmh: v.number(),
    avgSpeedKmh: v.number(),
    userRating: v.optional(v.number()),
    userComment: v.optional(v.string()),
    weatherCondition: v.optional(v.string()),
    temperatureC: v.optional(v.number()),
    windSpeedKmh: v.optional(v.number()),
    points: v.array(ridePoint),
    incidents: v.array(rideIncident),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error('Client is not authenticated.');

    const now = Date.now();
    const existingByClientId = await ctx.db
      .query('rides')
      .withIndex('userId_clientRideId', (q) => q.eq('userId', userId).eq('clientRideId', args.clientRideId))
      .unique();

    const existingByStartTime = existingByClientId ?? await ctx.db
      .query('rides')
      .withIndex('userId_startTime', (q) => q.eq('userId', userId).eq('startTime', args.startTime))
      .first();

    const ridePatch = {
      clientRideId: args.clientRideId,
      startTime: args.startTime,
      endTime: args.endTime,
      durationSeconds: args.durationSeconds,
      distanceKm: args.distanceKm,
      score: args.score,
      maxSpeedKmh: args.maxSpeedKmh,
      avgSpeedKmh: args.avgSpeedKmh,
      ...(args.userRating !== undefined ? { userRating: args.userRating } : {}),
      ...(args.userComment !== undefined ? { userComment: args.userComment } : {}),
      ...(args.weatherCondition !== undefined ? { weatherCondition: args.weatherCondition } : {}),
      ...(args.temperatureC !== undefined ? { temperatureC: args.temperatureC } : {}),
      ...(args.windSpeedKmh !== undefined ? { windSpeedKmh: args.windSpeedKmh } : {}),
      updatedAt: now,
    };

    const rideId = existingByStartTime?._id ?? await ctx.db.insert('rides', {
      userId,
      ...ridePatch,
      createdAt: now,
    });

    if (existingByStartTime !== null) {
      await ctx.db.patch(rideId, ridePatch);
    }

    const [existingPoints, existingIncidents] = await Promise.all([
      ctx.db.query('ridePoints').withIndex('rideId', (q) => q.eq('rideId', rideId)).collect(),
      ctx.db.query('rideIncidents').withIndex('rideId', (q) => q.eq('rideId', rideId)).collect(),
    ]);

    await Promise.all([
      ...existingPoints.map((point) => ctx.db.delete(point._id)),
      ...existingIncidents.map((incident) => ctx.db.delete(incident._id)),
    ]);

    for (const point of args.points) {
      await ctx.db.insert('ridePoints', {
        userId,
        rideId,
        ...point,
      });
    }

    for (const incident of args.incidents) {
      const { id: _clientIncidentId, ...incidentData } = incident;
      await ctx.db.insert('rideIncidents', {
        userId,
        rideId,
        ...incidentData,
      });
    }

    return rideId;
  },
});

export const addPoint = mutation({
  args: {
    rideId: v.id('rides'),
    latitude: v.number(),
    longitude: v.number(),
    speedKmh: v.number(),
    timestamp: v.number(),
    altitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireRideOwner(ctx, args.rideId);

    await ctx.db.insert('ridePoints', {
      userId,
      ...args,
    });
  },
});

export const addIncident = mutation({
  args: {
    rideId: v.id('rides'),
    type: incidentType,
    timestamp: v.number(),
    intensity: v.number(),
    speedKmh: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireRideOwner(ctx, args.rideId);

    await ctx.db.insert('rideIncidents', {
      userId,
      ...args,
    });
  },
});

export const finishRide = mutation({
  args: {
    rideId: v.id('rides'),
    endTime: v.number(),
    durationSeconds: v.number(),
    distanceKm: v.number(),
    score: v.number(),
    maxSpeedKmh: v.number(),
    avgSpeedKmh: v.number(),
    weatherCondition: v.optional(v.string()),
    temperatureC: v.optional(v.number()),
    windSpeedKmh: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRideOwner(ctx, args.rideId);
    const { rideId, ...patch } = args;

    await ctx.db.patch(rideId, {
      ...patch,
      updatedAt: Date.now(),
    });
  },
});

export const history = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const rides = await ctx.db
      .query('rides')
      .withIndex('userId_startTime', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();

    return Promise.all(
      rides.map(async (ride) => {
        const incidents = await ctx.db
          .query('rideIncidents')
          .withIndex('rideId', (q) => q.eq('rideId', ride._id))
          .collect();

        return {
          id: ride._id,
          clientRideId: ride.clientRideId,
          startTime: ride.startTime,
          durationSeconds: ride.durationSeconds,
          distanceKm: ride.distanceKm,
          score: ride.score,
          incidentCount: incidents.length,
          userRating: ride.userRating,
          userComment: ride.userComment,
        };
      }),
    );
  },
});

export const details = query({
  args: {
    rideId: v.id('rides'),
  },
  handler: async (ctx, args) => {
    await requireRideOwner(ctx, args.rideId);
    const ride = await ctx.db.get(args.rideId);
    if (ride === null) return null;

    const [points, incidents] = await Promise.all([
      ctx.db.query('ridePoints').withIndex('rideId', (q) => q.eq('rideId', args.rideId)).collect(),
      ctx.db.query('rideIncidents').withIndex('rideId', (q) => q.eq('rideId', args.rideId)).collect(),
    ]);

    return {
      ...ride,
      points,
      incidents,
    };
  },
});

async function requireRideOwner(ctx: any, rideId: any) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error('Client is not authenticated.');

  const ride = await ctx.db.get(rideId);
  if (ride === null || ride.userId !== userId) {
    throw new Error('Ride not found.');
  }

  return userId;
}
