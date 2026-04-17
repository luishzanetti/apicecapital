/**
 * Apice Brand v2 — component index.
 * Import via `@/components/brand`.
 */

export { ApiceLogo } from './ApiceLogo';
export type { ApiceLogoProps, ApiceLogoVariant } from './ApiceLogo';

export { AltisIcon } from './AltisIcon';
export type { AltisIconProps } from './AltisIcon';

export { ExpertAvatar } from './ExpertAvatar';
export type { ExpertAvatarProps } from './ExpertAvatar';

export { ClientAvatar } from './ClientAvatar';
export type { ClientAvatarProps } from './ClientAvatar';

export { Testimonial } from './Testimonial';
export type { TestimonialProps } from './Testimonial';

export { EXPERTS, EXPERT_IDS, expertsList, expertForDay } from '@/data/experts';
export type { Expert, ExpertId, ExpertArchetype } from '@/data/experts';

export { CLIENTS, clientsByGender, getClient, rotateClients } from '@/data/clients';
export type { Client, Gender } from '@/data/clients';
