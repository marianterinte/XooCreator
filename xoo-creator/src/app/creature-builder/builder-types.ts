// Shared types and helpers for the Creature Builder

export type PartKey = 'head' | 'body' | 'arms' | 'legs' | 'tail' | 'wings' | 'horn' | 'horns';
export type PartDef = { key: PartKey; name: string; image: string };
export type AnimalOption = { src: string; label: string; supports: ReadonlySet<PartKey> };

// Base parts all animals support by default
export const BASE_PARTS: ReadonlyArray<PartKey> = ['head', 'body', 'arms', 'legs', 'tail'] as const;

// Helper to create a ReadonlySet from a list of PartKeys
export const S = (arr: readonly PartKey[]) => new Set(arr as PartKey[]);
