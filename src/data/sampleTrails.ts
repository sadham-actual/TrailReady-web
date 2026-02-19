/**
 * TrailReady Sample Trail Data
 *
 * 12 real-world off-road trails across the American West.
 * Used as mock data for local dev when no database is connected.
 * This dataset gives a rich MVP demo experience.
 *
 * Trail difficulty scale:
 *   1 = Easy (suitable for stock AWD)
 *   2 = Moderate (high clearance 4x4)
 *   3 = Difficult (modified 4x4, lockers recommended)
 *   4 = Extreme (dedicated rock crawlers / extreme builds)
 */

export interface SampleTrail {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  description: string;
  baseDifficulty: number;
  latestStatus?: 'clear' | 'rough' | 'impassable';
  lastReportAt?: string;
}

export interface SampleReport {
  id: string;
  trailId: string;
  userId: string;
  status: 'clear' | 'rough' | 'impassable';
  confidence: 'low' | 'medium' | 'high';
  vehicleType:
    | 'stockSUV_solidAxle'
    | 'stockSUV_IFS'
    | 'stockSUV_IFRS'
    | 'lifted4x4_solidAxle'
    | 'lifted4x4_IFS'
    | 'lifted4x4_IFRS'
    | 'sideBySide'
    | 'dirtBike';
  notes?: string;
  timestamp: string;
}

const NOW = Date.now();
const hrs = (n: number) => new Date(NOW - n * 3_600_000).toISOString();
const days = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

// ─────────────────────────────────────────────
// TRAILS
// ─────────────────────────────────────────────

export const SAMPLE_TRAILS: SampleTrail[] = [
  {
    id: 'trail-alpine-loop',
    name: 'Alpine Loop',
    region: 'Colorado',
    latitude: 37.9872,
    longitude: -107.6714,
    description:
      'A spectacular 65-mile loop through the San Juan Mountains visiting Ouray, Silverton, and Lake City. ' +
      'Crosses multiple 12,000+ ft passes including Engineer and Cinnamon. Absolutely stunning scenery with cascading waterfalls, wildflowers in summer, and golden aspens in fall.',
    baseDifficulty: 2,
    latestStatus: 'clear',
    lastReportAt: hrs(3),
  },
  {
    id: 'trail-rubicon',
    name: 'Rubicon Trail',
    region: 'California',
    latitude: 38.9847,
    longitude: -120.1432,
    description:
      'The most famous off-road trail in the US. 22 miles of punishing granite slabs, ledges, and boulder gardens connecting Loon Lake to Lake Tahoe. ' +
      'Home of the Jeepers Jamboree since 1953. Not for the faint of heart or the unprepared. Mechanical breakdowns are common — bring a full toolkit.',
    baseDifficulty: 4,
    latestStatus: 'rough',
    lastReportAt: hrs(18),
  },
  {
    id: 'trail-moab-slickrock',
    name: 'Slickrock Bike Trail',
    region: 'Utah',
    latitude: 38.5734,
    longitude: -109.5003,
    description:
      "Moab's iconic slickrock terrain offers grippy sandstone surfaces that defy gravity. " +
      'Highly technical with steep ledge climbs and drops. Best tackled with a well-equipped rig and experienced spotter. ' +
      'Sand washes in the approach can be deceptively soft — aired-down tires essential.',
    baseDifficulty: 3,
    latestStatus: 'rough',
    lastReportAt: hrs(6),
  },
  {
    id: 'trail-white-rim',
    name: 'White Rim Road',
    region: 'Utah',
    latitude: 38.3742,
    longitude: -109.8481,
    description:
      "Canyonlands National Park's crown jewel — a 100-mile loop above the Colorado and Green River canyons. " +
      'Mostly moderate dirt road with some technical sections at Murphy Hogback and Hardscrabble Hill. ' +
      'Permit required. 3-4 day commitment. Otherworldly canyon scenery at every turn.',
    baseDifficulty: 2,
    latestStatus: 'clear',
    lastReportAt: days(1),
  },
  {
    id: 'trail-black-bear',
    name: 'Black Bear Pass',
    region: 'Colorado',
    latitude: 37.8833,
    longitude: -107.7167,
    description:
      "One of Colorado's most notorious trails. A one-way descent into Telluride via shelf roads carved into sheer cliffs. " +
      "The Stairs section near the top is a knuckle-whitening series of switchbacks. Once you start down, there's no turning back. " +
      'Only suitable for experienced drivers in well-equipped rigs with good lockers. Snow possible even in summer.',
    baseDifficulty: 4,
    latestStatus: 'impassable',
    lastReportAt: hrs(12),
  },
  {
    id: 'trail-shelf-road',
    name: 'Shelf Road',
    region: 'Colorado',
    latitude: 38.8008,
    longitude: -105.2289,
    description:
      'A historic freight road above Cañon City that follows a dramatic narrow shelf cut into the canyon wall. ' +
      'Moderate difficulty with incredible views of the Arkansas River Valley below. Suitable for stock high-clearance 4x4. ' +
      'Popular with rock climbers who access world-class limestone crags from the road.',
    baseDifficulty: 2,
    latestStatus: 'clear',
    lastReportAt: days(2),
  },
  {
    id: 'trail-backdoor-trail',
    name: 'Backdoor Trail',
    region: 'Arizona',
    latitude: 34.8697,
    longitude: -111.7608,
    description:
      'A technical loop through central Arizona red rock country near Sedona. ' +
      'Features a mix of rocky terrain, creek crossings, and tight canyon slots. ' +
      'Best run early morning before ATV traffic. High clearance required; lockers strongly recommended for the canyon slot section.',
    baseDifficulty: 3,
    latestStatus: 'clear',
    lastReportAt: hrs(8),
  },
  {
    id: 'trail-mojave-road',
    name: 'Mojave Road',
    region: 'California',
    latitude: 34.9875,
    longitude: -115.3486,
    description:
      "A 140-mile historic desert trail crossing the Mojave National Preserve, tracing a route used by Native Americans and later the US Army. " +
      'Generally easy driving on sandy desert tracks, with the Soda Dry Lake and lava flow sections adding variety. ' +
      'Great for overlanding — multiple primitive campsites along the route. Watch for deep sand.',
    baseDifficulty: 1,
    latestStatus: 'clear',
    lastReportAt: days(3),
  },
  {
    id: 'trail-ophir-pass',
    name: 'Ophir Pass',
    region: 'Colorado',
    latitude: 37.8594,
    longitude: -107.7786,
    description:
      'A classic Colorado mountain pass at 11,789 ft connecting Silverton and Telluride. ' +
      'Moderate difficulty with rocky, narrow sections near the top. Breathtaking views of the Wilson Mountains. ' +
      'Subject to afternoon thunderstorms — start early. Seasonal; typically open July through September.',
    baseDifficulty: 2,
    latestStatus: 'clear',
    lastReportAt: hrs(24),
  },
  {
    id: 'trail-hell-hole-canyon',
    name: "Hell Hole Canyon",
    region: 'Nevada',
    latitude: 36.1234,
    longitude: -114.9876,
    description:
      'A remote and rugged canyon system in the Nevada desert. Twisted canyon walls, dry waterfalls, and technical ledge climbs. ' +
      'Very remote — no cell service, bring extra water, fuel, and recovery gear. ' +
      "The 'Hell Hole' drop is a 4-foot ledge that catches most stock vehicles. Plan a full day.",
    baseDifficulty: 3,
    latestStatus: 'rough',
    lastReportAt: days(5),
  },
  {
    id: 'trail-san-rafael-swell',
    name: 'San Rafael Swell',
    region: 'Utah',
    latitude: 38.8167,
    longitude: -110.7167,
    description:
      'An enormous geological feature in central Utah with hundreds of miles of off-road tracks. ' +
      'Routes range from easy dirt roads to technical canyon runs. The Wedge Overlook and Crack Canyon are highlights. ' +
      'Great multi-day overland destination. Low traffic compared to Moab.',
    baseDifficulty: 2,
    latestStatus: 'clear',
    lastReportAt: days(4),
  },
  {
    id: 'trail-crown-king',
    name: 'Crown King Backroad',
    region: 'Arizona',
    latitude: 34.2058,
    longitude: -112.3400,
    description:
      'A scenic 30-mile backroad through the Bradshaw Mountains to the old mining town of Crown King. ' +
      'Rocky creek crossings, steep grades, and narrow shelf roads. Best in spring and fall. ' +
      'The town has a historic saloon — worth the drive. Moderate difficulty; good for experienced beginners.',
    baseDifficulty: 2,
    latestStatus: 'clear',
    lastReportAt: hrs(36),
  },
];

// ─────────────────────────────────────────────
// CONDITION REPORTS
// ─────────────────────────────────────────────

export const SAMPLE_REPORTS: SampleReport[] = [
  // Alpine Loop - good conditions
  {
    id: 'rpt-al-1',
    trailId: 'trail-alpine-loop',
    userId: 'mock-user-1',
    status: 'clear',
    confidence: 'high',
    vehicleType: 'lifted4x4_solidAxle',
    notes: 'Engineer Pass fully clear. Cinnamon Pass had some soft spots on the north face but totally passable.',
    timestamp: hrs(3),
  },
  {
    id: 'rpt-al-2',
    trailId: 'trail-alpine-loop',
    userId: 'mock-user-2',
    status: 'clear',
    confidence: 'medium',
    vehicleType: 'stockSUV_IFS',
    notes: 'Did the whole loop in a day. Road is in good shape for summer.',
    timestamp: hrs(8),
  },

  // Rubicon - challenging
  {
    id: 'rpt-rub-1',
    trailId: 'trail-rubicon',
    userId: 'mock-user-3',
    status: 'rough',
    confidence: 'high',
    vehicleType: 'lifted4x4_solidAxle',
    notes: 'Buck Island Lake section has a new rock fall blocking the main line — bypass is tight. Took 3 hours to get through.',
    timestamp: hrs(18),
  },
  {
    id: 'rpt-rub-2',
    trailId: 'trail-rubicon',
    userId: 'mock-user-4',
    status: 'impassable',
    confidence: 'high',
    vehicleType: 'stockSUV_solidAxle',
    notes: 'Not for stock rigs. Watched 3 vehicles get stuck in the first mile. We turned around.',
    timestamp: hrs(24),
  },

  // Moab Slickrock
  {
    id: 'rpt-mslick-1',
    trailId: 'trail-moab-slickrock',
    userId: 'mock-user-5',
    status: 'rough',
    confidence: 'high',
    vehicleType: 'lifted4x4_IFS',
    notes: 'Sand in the approach washes is deep from recent wind. Aired down to 12psi. Trail itself is fantastic.',
    timestamp: hrs(6),
  },

  // White Rim
  {
    id: 'rpt-wr-1',
    trailId: 'trail-white-rim',
    userId: 'mock-user-6',
    status: 'clear',
    confidence: 'high',
    vehicleType: 'lifted4x4_solidAxle',
    notes: 'Incredible route. Murphy Hogback was rough but doable. Hardscrabble is a proper test. Permit system was easy.',
    timestamp: days(1),
  },
  {
    id: 'rpt-wr-2',
    trailId: 'trail-white-rim',
    userId: 'mock-user-7',
    status: 'clear',
    confidence: 'medium',
    vehicleType: 'stockSUV_IFS',
    notes: 'Completed in a stock Tacoma. Just watch the ledges near Hardscrabble.',
    timestamp: days(2),
  },

  // Black Bear - closed
  {
    id: 'rpt-bb-1',
    trailId: 'trail-black-bear',
    userId: 'mock-user-8',
    status: 'impassable',
    confidence: 'high',
    vehicleType: 'lifted4x4_solidAxle',
    notes: 'Snow on the upper section above 12,000ft. The stairs are iced over. Turned back at the top.',
    timestamp: hrs(12),
  },
  {
    id: 'rpt-bb-2',
    trailId: 'trail-black-bear',
    userId: 'mock-user-9',
    status: 'impassable',
    confidence: 'high',
    vehicleType: 'lifted4x4_IFRS',
    notes: 'Confirmed impassable — ice on the stairs. Come back in July.',
    timestamp: hrs(14),
  },

  // Shelf Road
  {
    id: 'rpt-shelf-1',
    trailId: 'trail-shelf-road',
    userId: 'mock-user-10',
    status: 'clear',
    confidence: 'high',
    vehicleType: 'stockSUV_IFS',
    notes: 'Great afternoon run. Road is dry and in good shape. Met some rock climbers heading to the sport crags.',
    timestamp: days(2),
  },

  // Backdoor Trail
  {
    id: 'rpt-bd-1',
    trailId: 'trail-backdoor-trail',
    userId: 'mock-user-11',
    status: 'clear',
    confidence: 'high',
    vehicleType: 'lifted4x4_solidAxle',
    notes: 'The creek crossing was running about 12 inches. Totally fine with a locker and aired down.',
    timestamp: hrs(8),
  },
  {
    id: 'rpt-bd-2',
    trailId: 'trail-backdoor-trail',
    userId: 'mock-user-12',
    status: 'rough',
    confidence: 'medium',
    vehicleType: 'stockSUV_IFS',
    notes: "Creek crossing was sketchy for my bone stock Bronco. Made it but scraped the belly once. Would advise against stock rigs.",
    timestamp: hrs(10),
  },

  // Mojave Road
  {
    id: 'rpt-moj-1',
    trailId: 'trail-mojave-road',
    userId: 'mock-user-13',
    status: 'clear',
    confidence: 'high',
    vehicleType: 'stockSUV_solidAxle',
    notes: 'Easy and beautiful. Soda Dry Lake is bone dry this time of year. Great camping at the Mojave Cross.',
    timestamp: days(3),
  },

  // Ophir Pass
  {
    id: 'rpt-oph-1',
    trailId: 'trail-ophir-pass',
    userId: 'mock-user-14',
    status: 'clear',
    confidence: 'high',
    vehicleType: 'stockSUV_IFS',
    notes: 'Summit was clear. A few loose rocks on the Telluride side but nothing sketchy. Wildflowers are insane right now.',
    timestamp: hrs(24),
  },

  // Hell Hole Canyon
  {
    id: 'rpt-hh-1',
    trailId: 'trail-hell-hole-canyon',
    userId: 'mock-user-15',
    status: 'rough',
    confidence: 'medium',
    vehicleType: 'lifted4x4_solidAxle',
    notes: 'The Hell Hole drop is nasty — maybe 5ft now after the last washout. Long arms and a belly skid required.',
    timestamp: days(5),
  },

  // San Rafael Swell
  {
    id: 'rpt-srs-1',
    trailId: 'trail-san-rafael-swell',
    userId: 'mock-user-16',
    status: 'clear',
    confidence: 'high',
    vehicleType: 'stockSUV_IFS',
    notes: 'Low traffic, amazing geology. The Wedge Overlook road is totally fine in a stock vehicle.',
    timestamp: days(4),
  },

  // Crown King
  {
    id: 'rpt-ck-1',
    trailId: 'trail-crown-king',
    userId: 'mock-user-17',
    status: 'clear',
    confidence: 'medium',
    vehicleType: 'stockSUV_IFS',
    notes: 'Great trail with a cold beer reward at the end. Rocky in the upper sections. Aired down made it much smoother.',
    timestamp: hrs(36),
  },
];

// ─────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────

export function getMockTrail(id: string): SampleTrail | undefined {
  return SAMPLE_TRAILS.find((t) => t.id === id);
}

export function getMockReports(trailId: string): SampleReport[] {
  return SAMPLE_REPORTS.filter((r) => r.trailId === trailId);
}

export function searchMockTrails(query?: string, region?: string): SampleTrail[] {
  let results = [...SAMPLE_TRAILS];

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.region.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }

  if (region) {
    results = results.filter((t) => t.region.toLowerCase() === region.toLowerCase());
  }

  return results;
}
