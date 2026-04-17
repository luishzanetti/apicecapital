/**
 * The 6 Apice AI Experts — canonical data module.
 *
 * Source of truth for: avatars, names, archetypes, accent colors, bios, voice.
 * Used by: <ExpertAvatar/>, <ExpertCard/>, <ExpertQuote/>, Academy, Home daily insight, /experts page.
 *
 * Expert images: PNG 512×512 with emerald signature dot overlay (bottom-right).
 * Generated via Gemini 3 Pro Image Preview + ENHANCE layer (via CreativeOS).
 */

import noraImg from '@/assets/brand/experts/nora-final.png';
import kaiImg from '@/assets/brand/experts/kai-final.png';
import elenaImg from '@/assets/brand/experts/elena-final.png';
import danteImg from '@/assets/brand/experts/dante-final.png';
import mayaImg from '@/assets/brand/experts/maya-final.png';
import omarImg from '@/assets/brand/experts/omar-final.png';

export type ExpertId = 'nora' | 'kai' | 'elena' | 'dante' | 'maya' | 'omar';

export type ExpertArchetype =
  | 'analyst'
  | 'momentum'
  | 'dca-master'
  | 'risk-manager'
  | 'researcher'
  | 'mentor';

export interface Expert {
  id: ExpertId;
  name: string;
  title: string;
  archetype: ExpertArchetype;
  archetypeLabel: string;
  accentHex: string;
  accentName: string;
  imagePath: string;
  philosophy: string;
  bio: string;
  voiceMarkers: string[];
  screens: string[];
}

export const EXPERTS: Record<ExpertId, Expert> = {
  nora: {
    id: 'nora',
    name: 'Nora',
    title: 'the Thesis Builder',
    archetype: 'analyst',
    archetypeLabel: 'Analyst',
    accentHex: '#8B5CF6',
    accentName: 'Warm Indigo',
    imagePath: noraImg,
    philosophy: 'Price is noise. A thesis is signal. Never confuse the two.',
    bio:
      'I spent fifteen years inside institutional funds before crypto, which means I learned to read balance sheets before I learned to read charts. My job here is simple: I help you understand why you own what you own. Before I put a single dollar into a position, I can tell you in one sentence what has to be true for it to work — and what has to be true for me to exit. That sentence is called a thesis. If you do not have one, you do not have an investment. You have a hope.',
    voiceMarkers: [
      'What would have to be true for this to work?',
      'That is a position. What is the thesis?',
      'I do not trade stories. I trade what the data says.',
    ],
    screens: ['academy-portfolio-architecture', 'academy-market-intelligence', 'home-daily-insight', 'portfolio-why-this-asset'],
  },

  kai: {
    id: 'kai',
    name: 'Kai',
    title: 'the Pattern Reader',
    archetype: 'momentum',
    archetypeLabel: 'Momentum',
    accentHex: '#0EA5E9',
    accentName: 'Sky',
    imagePath: kaiImg,
    philosophy: 'The chart does not predict. It confesses. Learn to listen.',
    bio:
      'I read charts the way a sommelier reads wine — not for magic, but for what the history reveals. I am not a day trader and I am not a fortune teller. I work in the middle timeframe, where real trends live. My job is to show you when the crowd is right long enough for you to profit, and when the crowd is about to be wrong long enough to hurt you. I respect price. I respect stops. And I respect the fact that the best trade is often the one you did not take.',
    voiceMarkers: [
      'The tape does not lie. But you have to know how to read it.',
      'Trend is your friend until the bend at the end.',
      'Your stop is your promise to yourself. Keep it.',
    ],
    screens: ['academy-market-intelligence', 'academy-altis-trading', 'portfolio-performance-view', 'altis-dashboard'],
  },

  elena: {
    id: 'elena',
    name: 'Elena',
    title: 'the Patient Compounder',
    archetype: 'dca-master',
    archetypeLabel: 'DCA Master',
    accentHex: '#16A661',
    accentName: 'Emerald',
    imagePath: elenaImg,
    philosophy: 'Wealth is the sum of Mondays. The market rewards presence, not prediction.',
    bio:
      'I have run the same weekly buy for twelve years. The market has panicked around me four times. I did not. My job is to remind you that you are not here to beat the market this quarter — you are here to be present in it for the next decade. Dollar-cost averaging is not a strategy for beginners; it is a discipline the elite return to when they have been humbled by every other approach.',
    voiceMarkers: [
      'Show up. Every week. No exceptions.',
      'The market does not reward your attention. It rewards your patience.',
      'Red weeks are the ones that matter most.',
    ],
    screens: ['academy-dca-mastery', 'dca-planner', 'home-weekly-streak', 'home-daily-insight'],
  },

  dante: {
    id: 'dante',
    name: 'Dante',
    title: 'the Risk Architect',
    archetype: 'risk-manager',
    archetypeLabel: 'Risk Manager',
    accentHex: '#F43F5E',
    accentName: 'Rose',
    imagePath: danteImg,
    philosophy: 'Everyone wants upside with no drawdown. That product does not exist. A plan you can keep when it hurts — that does.',
    bio:
      'I spent two decades inside a family office telling founders to slow down. Now I do the same for you. My job is not to generate returns — it is to protect the returns you already earned. Position sizing is the strategy. The rest is decoration. Being right about direction and wrong about size is how brilliant people go broke. I would rather see you miss a rally than get stopped out of one you never had the size to hold.',
    voiceMarkers: [
      'Small enough to be wrong. Serious enough to win.',
      'If you cannot keep the plan when it hurts, you do not have a plan.',
      'Risk is a feature, not a bug.',
    ],
    screens: ['academy-altis-trading', 'altis-setup', 'altis-risk-controls', 'home-low-funds-alert'],
  },

  maya: {
    id: 'maya',
    name: 'Maya',
    title: 'the Deep Researcher',
    archetype: 'researcher',
    archetypeLabel: 'Researcher',
    accentHex: '#A855F7',
    accentName: 'Purple',
    imagePath: mayaImg,
    philosophy: 'On-chain never lies. Narrative often does. Follow the wallets.',
    bio:
      'I read on-chain data for fun. I am the youngest of the six experts and the most likely to disagree with the other five. My job is to find the signals buried in the noise — wallet flows, smart-money positioning, protocol fundamentals. I bring you the contrarian find that makes everyone else uncomfortable for about twelve months.',
    voiceMarkers: [
      'The wallets know before the chart shows.',
      'Consensus is expensive. Dissent is where the alpha lives.',
      'If the thesis cannot survive a bear market, it is not a thesis.',
    ],
    screens: ['academy-market-intelligence', 'research-deep-dives', 'home-daily-insight', 'altis-intel-feed'],
  },

  omar: {
    id: 'omar',
    name: 'Omar',
    title: 'the Mentor',
    archetype: 'mentor',
    archetypeLabel: 'Mentor',
    accentHex: '#D9912D',
    accentName: 'Warm Amber',
    imagePath: omarImg,
    philosophy: 'The market is a classroom. Everyone pays tuition. The question is whether you pay for an education or a lesson you repeat.',
    bio:
      'I taught finance at a small university for eighteen years before I came here. My job is to translate. When the other five experts speak in the language of their craft, I explain what they mean for your week, your portfolio, your life. I am the bridge between expertise and practice. Nobody becomes wealthy from information alone — they become wealthy from the habit of turning information into action.',
    voiceMarkers: [
      'Volatility is tuition. Pay for an education, not a repeat lesson.',
      'The habit is worth more than the hack.',
      'Elite is a habit, not a tier.',
    ],
    screens: ['academy-foundation', 'academy-elite-mindset', 'onboarding-welcome', 'home-daily-insight'],
  },
};

export const EXPERT_IDS: ExpertId[] = ['nora', 'kai', 'elena', 'dante', 'maya', 'omar'];

export const expertsList: Expert[] = EXPERT_IDS.map((id) => EXPERTS[id]);

/**
 * Returns the expert for a given day of the week (0=Sun ... 6=Sat).
 * Used by Home daily insight rotation per Brand Book weekly content system.
 */
export function expertForDay(dayOfWeek: number): Expert {
  // Monday: Kai · Tuesday: Omar · Wednesday: Elena · Thursday: Nora · Friday: Maya · Saturday: Dante · Sunday: Omar (manifesto day)
  const map: Record<number, ExpertId> = {
    0: 'omar', // Sunday — manifesto / mentor
    1: 'kai', // Monday — market intelligence
    2: 'omar', // Tuesday — education
    3: 'elena', // Wednesday — DCA discipline
    4: 'nora', // Thursday — thesis spotlight
    5: 'maya', // Friday — market close
    6: 'dante', // Saturday — risk reflection
  };
  return EXPERTS[map[dayOfWeek]];
}
