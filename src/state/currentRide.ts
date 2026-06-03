import type { Ride } from '../types';

let latestCompletedRide: Ride | null = null;

export function setLatestCompletedRide(ride: Ride): void {
  latestCompletedRide = ride;
}

export function getLatestCompletedRide(): Ride | null {
  return latestCompletedRide;
}
