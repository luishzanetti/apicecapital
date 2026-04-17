/**
 * 20 Apice Client Portraits — social proof library.
 *
 * Used for: <Testimonial/>, <TestimonialMarquee/>, Landing social proof, Upgrade page, Quiz page.
 * Images: 512×512 (+ 256×256 inline variant) PNG · generated via Gemini 3 Pro Image + ENHANCE.
 *
 * When real user testimonials become available, replace this data module with API-backed source.
 */

import sarahUs from '@/assets/brand/clients/women/sarah-us.png';
import emmaUk from '@/assets/brand/clients/women/emma-uk.png';
import yukiJp from '@/assets/brand/clients/women/yuki-jp.png';
import mariaEs from '@/assets/brand/clients/women/maria-es.png';
import amaraNg from '@/assets/brand/clients/women/amara-ng.png';
import isabellaBr from '@/assets/brand/clients/women/isabella-br.png';
import priyaIn from '@/assets/brand/clients/women/priya-in.png';
import annaDe from '@/assets/brand/clients/women/anna-de.png';
import meiCn from '@/assets/brand/clients/women/mei-cn.png';
import sofiaIt from '@/assets/brand/clients/women/sofia-it.png';

import jamesUs from '@/assets/brand/clients/men/james-us.png';
import oliverUk from '@/assets/brand/clients/men/oliver-uk.png';
import carlosMx from '@/assets/brand/clients/men/carlos-mx.png';
import kenjiJp from '@/assets/brand/clients/men/kenji-jp.png';
import marcusDe from '@/assets/brand/clients/men/marcus-de.png';
import rafaelBr from '@/assets/brand/clients/men/rafael-br.png';
import samirIn from '@/assets/brand/clients/men/samir-in.png';
import hugoFr from '@/assets/brand/clients/men/hugo-fr.png';
import danielZa from '@/assets/brand/clients/men/daniel-za.png';
import alexAu from '@/assets/brand/clients/men/alex-au.png';

export type Gender = 'female' | 'male';

export interface Client {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  country: string;
  countryCode: string;
  city: string;
  imagePath: string;
  plan?: 'free' | 'pro' | 'club';
  since?: string;
}

export const CLIENTS: Client[] = [
  // Women
  { id: 'sarah-us',    name: 'Sarah',    age: 32, gender: 'female', country: 'United States',  countryCode: 'US', city: 'Austin',      imagePath: sarahUs,    plan: 'pro',  since: '2025' },
  { id: 'emma-uk',     name: 'Emma',     age: 28, gender: 'female', country: 'United Kingdom', countryCode: 'UK', city: 'London',      imagePath: emmaUk,     plan: 'free', since: '2025' },
  { id: 'yuki-jp',     name: 'Yuki',     age: 35, gender: 'female', country: 'Japan',          countryCode: 'JP', city: 'Tokyo',       imagePath: yukiJp,     plan: 'pro',  since: '2024' },
  { id: 'maria-es',    name: 'Maria',    age: 45, gender: 'female', country: 'Spain',          countryCode: 'ES', city: 'Madrid',      imagePath: mariaEs,    plan: 'club', since: '2024' },
  { id: 'amara-ng',    name: 'Amara',    age: 30, gender: 'female', country: 'Nigeria',        countryCode: 'NG', city: 'Lagos',       imagePath: amaraNg,    plan: 'pro',  since: '2025' },
  { id: 'isabella-br', name: 'Isabella', age: 26, gender: 'female', country: 'Brazil',         countryCode: 'BR', city: 'São Paulo',   imagePath: isabellaBr, plan: 'free', since: '2025' },
  { id: 'priya-in',    name: 'Priya',    age: 38, gender: 'female', country: 'India',          countryCode: 'IN', city: 'Bengaluru',   imagePath: priyaIn,    plan: 'pro',  since: '2024' },
  { id: 'anna-de',     name: 'Anna',     age: 42, gender: 'female', country: 'Germany',        countryCode: 'DE', city: 'Berlin',      imagePath: annaDe,     plan: 'club', since: '2024' },
  { id: 'mei-cn',      name: 'Mei',      age: 29, gender: 'female', country: 'China',          countryCode: 'CN', city: 'Vancouver',   imagePath: meiCn,      plan: 'pro',  since: '2025' },
  { id: 'sofia-it',    name: 'Sofia',    age: 50, gender: 'female', country: 'Italy',          countryCode: 'IT', city: 'Florence',    imagePath: sofiaIt,    plan: 'club', since: '2023' },

  // Men
  { id: 'james-us',    name: 'James',    age: 34, gender: 'male', country: 'United States',  countryCode: 'US', city: 'New York',    imagePath: jamesUs,    plan: 'pro',  since: '2025' },
  { id: 'oliver-uk',   name: 'Oliver',   age: 40, gender: 'male', country: 'United Kingdom', countryCode: 'UK', city: 'Manchester',  imagePath: oliverUk,   plan: 'club', since: '2024' },
  { id: 'carlos-mx',   name: 'Carlos',   age: 38, gender: 'male', country: 'Mexico',         countryCode: 'MX', city: 'Mexico City', imagePath: carlosMx,   plan: 'pro',  since: '2024' },
  { id: 'kenji-jp',    name: 'Kenji',    age: 45, gender: 'male', country: 'Japan',          countryCode: 'JP', city: 'Osaka',       imagePath: kenjiJp,    plan: 'club', since: '2023' },
  { id: 'marcus-de',   name: 'Marcus',   age: 33, gender: 'male', country: 'Germany',        countryCode: 'DE', city: 'Munich',      imagePath: marcusDe,   plan: 'pro',  since: '2025' },
  { id: 'rafael-br',   name: 'Rafael',   age: 29, gender: 'male', country: 'Brazil',         countryCode: 'BR', city: 'Rio',         imagePath: rafaelBr,   plan: 'free', since: '2025' },
  { id: 'samir-in',    name: 'Samir',    age: 36, gender: 'male', country: 'India',          countryCode: 'IN', city: 'Mumbai',      imagePath: samirIn,    plan: 'pro',  since: '2024' },
  { id: 'hugo-fr',     name: 'Hugo',     age: 47, gender: 'male', country: 'France',         countryCode: 'FR', city: 'Paris',       imagePath: hugoFr,     plan: 'club', since: '2023' },
  { id: 'daniel-za',   name: 'Daniel',   age: 31, gender: 'male', country: 'South Africa',   countryCode: 'ZA', city: 'Cape Town',   imagePath: danielZa,   plan: 'pro',  since: '2025' },
  { id: 'alex-au',     name: 'Alex',     age: 52, gender: 'male', country: 'Australia',      countryCode: 'AU', city: 'Sydney',      imagePath: alexAu,     plan: 'club', since: '2024' },
];

export const clientsByGender = {
  female: CLIENTS.filter((c) => c.gender === 'female'),
  male: CLIENTS.filter((c) => c.gender === 'male'),
};

export function getClient(id: string): Client | undefined {
  return CLIENTS.find((c) => c.id === id);
}

/**
 * Returns a deterministic rotation of N clients — useful for marquee + landing grids.
 */
export function rotateClients(count: number, seed = 0): Client[] {
  const start = seed % CLIENTS.length;
  const result: Client[] = [];
  for (let i = 0; i < count; i++) {
    result.push(CLIENTS[(start + i) % CLIENTS.length]);
  }
  return result;
}
