import { AnimalOption, PartDef, PartKey, BASE_PARTS, S } from './builder-types';

export const PARTS: ReadonlyArray<PartDef> = [
  { key: 'head', name: 'Head', image: 'images/bodyparts/face.webp' },
  { key: 'body', name: 'Body', image: 'images/bodyparts/body.webp' },
  { key: 'arms', name: 'Arms', image: 'images/bodyparts/hands.webp' },
  { key: 'legs', name: 'Legs', image: 'images/bodyparts/legs.webp' },
  { key: 'tail', name: 'Tail', image: 'images/bodyparts/tail.webp' },
  { key: 'wings', name: 'Wings', image: 'images/bodyparts/wings.webp' },
  { key: 'horn', name: 'Horn', image: 'images/bodyparts/horn.webp' },
  { key: 'horns', name: 'Horns', image: 'images/bodyparts/horns.webp' },
] as const;

export const ANIMALS: ReadonlyArray<AnimalOption> = [
  { src: 'images/animals/base/bunny.jpg',   label: 'Bunny',    supports: S([...BASE_PARTS]) },
  { src: 'images/animals/base/cat.jpg',     label: 'Cat',      supports: S([...BASE_PARTS]) },
  { src: 'images/animals/base/giraffe.jpg', label: 'Giraffe',  supports: S([...BASE_PARTS, 'horn', 'horns']) },
  { src: 'images/animals/base/dog.jpg',     label: 'Dog',      supports: S([...BASE_PARTS]) },
  { src: 'images/animals/base/fox.jpg',     label: 'Fox',      supports: S([...BASE_PARTS]) },
  { src: 'images/animals/base/hippo.jpg',   label: 'Hippo',    supports: S([...BASE_PARTS]) },
  { src: 'images/animals/base/monkey.jpg',  label: 'Monkey',   supports: S([...BASE_PARTS]) },
  { src: 'images/animals/base/camel.jpg',   label: 'Camel',    supports: S([...BASE_PARTS]) },
  { src: 'images/animals/base/deer.jpg',    label: 'Deer',     supports: S([...BASE_PARTS, 'horn', 'horns']) },
  { src: 'images/animals/base/duck.jpg',    label: 'Duck',     supports: S([...BASE_PARTS, 'wings']) },
  { src: 'images/animals/base/eagle.jpg',   label: 'Eagle',    supports: S([...BASE_PARTS, 'wings']) },
  { src: 'images/animals/base/elephant.jpg',label: 'Elephant', supports: S([...BASE_PARTS]) },
  { src: 'images/animals/base/ostrich.jpg', label: 'Ostrich',  supports: S([...BASE_PARTS, 'wings']) },
  { src: 'images/animals/base/parrot.jpg',  label: 'Parrot',   supports: S([...BASE_PARTS, 'wings']) },
] as const;

export const BASE_UNLOCKED_ANIMAL_COUNT = 3;
export const BASE_LOCKED_PARTS = new Set<PartKey>(['legs', 'tail', 'wings', 'horn', 'horns']);
