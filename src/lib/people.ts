import { getEntry, type CollectionEntry } from 'astro:content';

export type Person = CollectionEntry<'people'>['data'];

export const TEAM_NAME = 'Zespół Aura Consulting';

/** Czy osoba ma już podane prawdziwe dane (nie „TODO …”). */
export function isKnownPerson(p: Person | undefined): p is Person {
  return !!p && !/^\s*TODO/i.test(p.name);
}

/** Nazwa do wyświetlenia: imię i nazwisko albo „Zespół Aura Consulting”. */
export function displayName(p: Person | undefined): string {
  return isKnownPerson(p) ? p.name : TEAM_NAME;
}

export async function getPerson(id: string): Promise<Person> {
  const e = await getEntry('people', id);
  if (!e) throw new Error(`Autor „${id}” nie istnieje w src/content/people.yaml`);
  return e.data;
}

export function personPath(p: Person): string {
  return p.path ?? `/zespol/${p.id}/`;
}
