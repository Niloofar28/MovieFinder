/**
 * Horizon Properties — content layer.
 *
 * Everything the site renders lives here, so copy and listings can be edited
 * without touching markup or logic. Each collection is a plain array of records
 * with primitive fields, which keeps a later swap to a database / API a matter
 * of replacing these exports with a fetch.
 */

export const COMPANY = {
  name: 'Horizon Properties',
  tagline: 'Premium homes, exceptional investments.',
  description:
    'Horizon Properties is a private brokerage specialising in architecturally significant homes and prime-location investments. We represent a small number of exceptional properties and give every client the attention the search deserves.',
  phone: '(555) 246-7890',
  phoneHref: 'tel:+15552467890',
  email: 'hello@horizonproperties.com',
  address: '1200 Congress Avenue, Suite 400, Austin, TX 78701',
  hours: 'Monday – Saturday, 9:00 – 18:00',
  // Replace with the real profile URLs before launch.
  social: [
    { name: 'Instagram', url: 'https://www.instagram.com/', icon: 'instagram' },
    { name: 'Facebook', url: 'https://www.facebook.com/', icon: 'facebook' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/', icon: 'linkedin' },
    { name: 'YouTube', url: 'https://www.youtube.com/', icon: 'youtube' }
  ]
};

export const STATS = [
  { value: '$1.4B', label: 'Property sold' },
  { value: '640+', label: 'Families placed' },
  { value: '18', label: 'Years advising' },
  { value: '12', label: 'Prime markets' }
];

export const SERVICES = [
  {
    id: 'luxury-home-sales',
    title: 'Luxury Home Sales',
    summary:
      'Discreet representation for architecturally significant homes, from first viewing to closing.',
    detail:
      'We take a limited number of listings so each property gets a tailored campaign: architectural photography, private viewings and a qualified buyer list.',
    image: 'images/service-01.jpg'
  },
  {
    id: 'property-investment',
    title: 'Property Investment',
    summary:
      'Yield-led acquisition advice across prime residential and mixed-use assets.',
    detail:
      'Market analysis, comparable modelling and hold-period planning, so every acquisition is measured against a real return rather than a headline price.',
    image: 'images/service-02.jpg'
  },
  {
    id: 'property-marketing',
    title: 'Property Marketing',
    summary:
      'Editorial-grade campaigns that present a home the way it deserves to be seen.',
    detail:
      'Cinematic photography, film, floor plans and print — produced in-house and placed with a curated national and international audience.',
    image: 'images/service-03.jpg'
  },
  {
    id: 'real-estate-advisory',
    title: 'Real Estate Advisory',
    summary:
      'Independent counsel on portfolio structure, timing and long-term strategy.',
    detail:
      'We work alongside family offices and private clients on acquisitions, disposals and restructuring, with no incentive to transact.'
  },
  {
    id: 'property-valuation',
    title: 'Property Valuation',
    summary:
      'Rigorous, defensible valuations for prime and off-market residences.',
    detail:
      'A written opinion of value built from verified comparable sales, condition surveys and current market depth — suitable for lending, estate or tax purposes.'
  },
  {
    id: 'relocation-services',
    title: 'Relocation Services',
    summary:
      'A single point of contact for moving a household into a new city.',
    detail:
      'Neighbourhood shortlists, school introductions, interim accommodation and settling-in support, coordinated end to end.'
  }
];

export const WHY_US = [
  {
    title: 'A curated portfolio',
    text: 'We list a small number of homes at a time. Every property on this site has been visited, vetted and photographed by our team.'
  },
  {
    title: 'Advisors, not agents',
    text: 'Your advisor works through the whole process — search, negotiation, inspection and settlement — rather than handing you on.'
  },
  {
    title: 'Local depth, global reach',
    text: 'Twelve prime markets covered in person, with a partner network for international buyers and sellers.'
  },
  {
    title: 'Transparent by default',
    text: 'Full disclosure of comparables, fees and known defects before you commit. No surprises at the closing table.'
  }
];

export const AGENTS = [
  {
    id: 'daniel-morgan',
    name: 'Daniel Morgan',
    role: 'Managing Director',
    photo: 'images/agent-01.jpg',
    phone: '(555) 246-7890',
    phoneHref: 'tel:+15552467890',
    email: 'daniel@horizonproperties.com',
    bio: 'Daniel founded Horizon Properties in 2007 after a decade in architectural practice. He leads the firm’s private client work and negotiates its most significant transactions.'
  },
  {
    id: 'olivia-carter',
    name: 'Olivia Carter',
    role: 'Luxury Property Advisor',
    photo: 'images/agent-02.jpg',
    phone: '(555) 246-7891',
    phoneHref: 'tel:+15552467891',
    email: 'olivia@horizonproperties.com',
    bio: 'Olivia represents waterfront and hillside residences across California. She is known for matching buyers with homes they did not know they wanted.'
  },
  {
    id: 'james-wilson',
    name: 'James Wilson',
    role: 'Investment Consultant',
    photo: 'images/agent-03.jpg',
    phone: '(555) 246-7892',
    phoneHref: 'tel:+15552467892',
    email: 'james@horizonproperties.com',
    bio: 'James advises private clients and family offices on yield, structuring and hold strategy. He models every acquisition before it reaches the market.'
  },
  {
    id: 'sophia-bennett',
    name: 'Sophia Bennett',
    role: 'Senior Property Specialist',
    photo: 'images/agent-04.jpg',
    phone: '(555) 246-7893',
    phoneHref: 'tel:+15552467893',
    email: 'sophia@horizonproperties.com',
    bio: 'Sophia looks after first-time buyers moving into prime markets, and runs the firm’s relocation desk across Austin, Seattle and Aspen.'
  }
];

/** Shared interior pool used to build each property gallery. */
const INTERIORS = [
  'images/interior-01.jpg',
  'images/interior-02.jpg',
  'images/interior-03.jpg',
  'images/interior-04.jpg',
  'images/interior-05.jpg',
  'images/interior-06.jpg',
  'images/interior-07.jpg',
  'images/interior-08.jpg'
];

const interiorSet = (offset) =>
  [0, 1, 2, 3].map((i) => INTERIORS[(offset + i) % INTERIORS.length]);

export const PROPERTIES = [
  {
    id: 'lakeside-modern-villa',
    title: 'Lakeside Modern Villa',
    city: 'Austin',
    state: 'Texas',
    country: 'USA',
    location: 'Austin, Texas, USA',
    price: 2350000,
    priceLabel: '$2.35 Million',
    type: 'Villa',
    status: 'For Sale',
    beds: 5,
    baths: 6,
    sqft: 6420,
    lot: '0.82 acres',
    year: 2021,
    featured: true,
    image: 'images/property-01.jpg',
    gallery: ['images/property-01.jpg', ...interiorSet(0)],
    tagline: 'A glass-walled lakeside villa built around its western view.',
    description:
      'Set on a quiet stretch of the lake, this villa opens entirely to the water through sliding glass walls. Living, dining and kitchen occupy a single double-height volume, with a suspended concrete stair leading to four upper bedrooms.',
    features: ['Double-height living volume', 'Sliding glass walls to terrace', 'Infinity-edge pool', 'Private boat dock', 'Wine room', 'Four-car garage'],
    amenities: ['Air conditioning', 'Smart home system', 'Underfloor heating', 'Security system', 'Home cinema', 'Outdoor kitchen', 'Guest house', 'EV charging'],
    agentId: 'daniel-morgan'
  },
  {
    id: 'pacific-glass-house',
    title: 'Pacific Glass House',
    city: 'Malibu',
    state: 'California',
    country: 'USA',
    location: 'Malibu, California, USA',
    price: 4800000,
    priceLabel: '$4.8 Million',
    type: 'House',
    status: 'For Sale',
    beds: 4,
    baths: 5,
    sqft: 5980,
    lot: '0.61 acres',
    year: 2019,
    featured: true,
    image: 'images/property-02.jpg',
    gallery: ['images/property-02.jpg', ...interiorSet(1)],
    tagline: 'Ocean-facing glass pavilion above the Pacific.',
    description:
      'A single-storey pavilion that reads as one continuous room of glass and travertine. The primary suite opens onto a cantilevered terrace with an unbroken line of sight to the horizon.',
    features: ['Cantilevered ocean terrace', 'Floor-to-ceiling glazing', 'Travertine floors', 'Chef’s kitchen', 'Media lounge', 'Direct beach access'],
    amenities: ['Heated pool', 'Spa', 'Outdoor shower', 'Wine cellar', 'Solar array', 'Gated entry', 'Guest suite', 'Smart lighting'],
    agentId: 'olivia-carter'
  },
  {
    id: 'desert-horizon-estate',
    title: 'Desert Horizon Estate',
    city: 'Scottsdale',
    state: 'Arizona',
    country: 'USA',
    location: 'Scottsdale, Arizona, USA',
    price: 3150000,
    priceLabel: '$3.15 Million',
    type: 'Estate',
    status: 'For Sale',
    beds: 5,
    baths: 5,
    sqft: 7240,
    lot: '1.24 acres',
    year: 2016,
    featured: true,
    image: 'images/property-03.jpg',
    gallery: ['images/property-03.jpg', ...interiorSet(2)],
    tagline: 'Low-slung desert estate framing the McDowell ridgeline.',
    description:
      'Rammed-earth walls and deep overhangs keep the house cool through the desert summer. A central courtyard with a reflecting pool separates the guest wing from the main residence.',
    features: ['Central courtyard', 'Reflecting pool', 'Rammed-earth walls', 'Casita and guest wing', 'Desert garden', 'Motor court'],
    amenities: ['Pool and spa', 'Outdoor fireplace', 'Shade pergola', 'Wine room', 'Gym', 'Smart climate control', 'Gated entry', 'Mountain views'],
    agentId: 'james-wilson'
  },
  {
    id: 'oceanfront-residence',
    title: 'Oceanfront Residence',
    city: 'Miami',
    state: 'Florida',
    country: 'USA',
    location: 'Miami, Florida, USA',
    price: 5200000,
    priceLabel: '$5.2 Million',
    type: 'Residence',
    status: 'For Sale',
    beds: 6,
    baths: 7,
    sqft: 8150,
    lot: '0.74 acres',
    year: 2020,
    featured: true,
    image: 'images/property-04.jpg',
    gallery: ['images/property-04.jpg', ...interiorSet(3)],
    tagline: 'Direct oceanfront living with a private beach path.',
    description:
      'Wrapped in terraces on two levels, the residence puts the ocean at the centre of every principal room. The pool terrace steps down to a private path through the dune.',
    features: ['Two-level terraces', 'Private dune path', 'Summer kitchen', 'Primary suite with terrace', 'Elevator', 'Impact glazing'],
    amenities: ['Infinity pool', 'Outdoor shower', 'Home gym', 'Wine fridge', 'Staff quarters', 'Covered parking', 'Smart security', 'Backup generator'],
    agentId: 'olivia-carter'
  },
  {
    id: 'modern-hillside-retreat',
    title: 'Modern Hillside Retreat',
    city: 'Los Angeles',
    state: 'California',
    country: 'USA',
    location: 'Los Angeles, California, USA',
    price: 3750000,
    priceLabel: '$3.75 Million',
    type: 'House',
    status: 'For Sale',
    beds: 4,
    baths: 4,
    sqft: 4320,
    lot: '0.48 acres',
    year: 2018,
    featured: false,
    image: 'images/property-05.jpg',
    gallery: ['images/property-05.jpg', ...interiorSet(4)],
    tagline: 'A stepped hillside house with canyon and city views.',
    description:
      'Three stacked volumes step down the hillside, each opening to its own terrace. The lowest level holds a pool deck that sits level with the treetops.',
    features: ['Three stacked volumes', 'Terrace per level', 'Pool deck in the treetops', 'Gallery wall', 'Screening room', 'Two-car garage'],
    amenities: ['Pool', 'Fire pit', 'Outdoor kitchen', 'Gym', 'Office', 'Smart lighting', 'Security system', 'City views'],
    agentId: 'daniel-morgan'
  },
  {
    id: 'palm-garden-residence',
    title: 'Palm Garden Residence',
    city: 'Beverly Hills',
    state: 'California',
    country: 'USA',
    location: 'Beverly Hills, California, USA',
    price: 6400000,
    priceLabel: '$6.4 Million',
    type: 'Estate',
    status: 'For Sale',
    beds: 7,
    baths: 8,
    sqft: 9840,
    lot: '2.10 acres',
    year: 1932,
    featured: true,
    image: 'images/property-06.jpg',
    gallery: ['images/property-06.jpg', ...interiorSet(5)],
    tagline: 'A mature garden estate behind a quiet Beverly Hills frontage.',
    description:
      'The original 1930s proportions have been opened up and re-clad, giving formal rooms a modern flow into the garden, tennis court and pool pavilion.',
    features: ['Half-acre garden', 'Tennis court', 'Pool pavilion', 'Formal and family rooms', 'Panelled library', 'Gated motor court'],
    amenities: ['Heated pool', 'Tennis court', 'Guest house', 'Wine cellar', 'Home gym', 'Staff quarters', 'Smart security', 'Mature landscaping'],
    agentId: 'sophia-bennett'
  },
  {
    id: 'contemporary-lake-house',
    title: 'Contemporary Lake House',
    city: 'Lake Tahoe',
    state: 'Nevada',
    country: 'USA',
    location: 'Lake Tahoe, Nevada, USA',
    price: 2950000,
    priceLabel: '$2.95 Million',
    type: 'House',
    status: 'For Sale',
    beds: 4,
    baths: 4,
    sqft: 3760,
    lot: '0.55 acres',
    year: 2022,
    featured: false,
    image: 'images/property-07.jpg',
    gallery: ['images/property-07.jpg', ...interiorSet(6)],
    tagline: 'Timber and stone against the pines, a short walk from the water.',
    description:
      'Built for four seasons, with a double-sided fireplace at the centre of the great room and a bunk wing that sleeps six without disturbing the main house.',
    features: ['Double-sided fireplace', 'Bunk wing', 'Ski and boot room', 'Covered outdoor lounge', 'Hot tub deck', 'Two-car garage'],
    amenities: ['Hot tub', 'Fire pit', 'Heated floors', 'Smart climate control', 'Wine room', 'Security system', 'EV charging', 'Lake access'],
    agentId: 'james-wilson'
  },
  {
    id: 'architectural-downtown-penthouse',
    title: 'Architectural Downtown Penthouse',
    city: 'Austin',
    state: 'Texas',
    country: 'USA',
    location: 'Austin, Texas, USA',
    price: 1850000,
    priceLabel: '$1.85 Million',
    type: 'Penthouse',
    status: 'For Sale',
    beds: 3,
    baths: 3,
    sqft: 3140,
    lot: null,
    year: 2023,
    featured: false,
    image: 'images/property-08.jpg',
    gallery: ['images/property-08.jpg', ...interiorSet(7)],
    tagline: 'A full-floor penthouse above the Congress Avenue skyline.',
    description:
      'One of four residences in the building, with a private lift lobby, wrap-around terrace and interiors by a local studio known for restrained material palettes.',
    features: ['Full-floor plan', 'Private lift lobby', 'Wrap-around terrace', 'Custom joinery', 'Climate-controlled storage', 'Two parking bays'],
    amenities: ['Concierge', 'Residents’ gym', 'Roof terrace', 'Pool', 'Smart home system', 'Security system', 'Wine fridge', 'City views'],
    agentId: 'sophia-bennett'
  },
  {
    id: 'the-ridge-house',
    title: 'The Ridge House',
    city: 'Aspen',
    state: 'Colorado',
    country: 'USA',
    location: 'Aspen, Colorado, USA',
    price: 7900000,
    priceLabel: '$7.9 Million',
    type: 'Estate',
    status: 'For Sale',
    beds: 6,
    baths: 7,
    sqft: 10200,
    lot: '3.60 acres',
    year: 2021,
    featured: true,
    image: 'images/property-09.jpg',
    gallery: ['images/property-09.jpg', ...interiorSet(0)],
    tagline: 'A mountain estate with ski access and valley views.',
    description:
      'Glass, stone and blackened steel in equal measure. The great room sits under an exposed truss ceiling, with a spa level carved into the slope below.',
    features: ['Ski-in access', 'Exposed truss great room', 'Spa level', 'Glass wine wall', 'Snow-melt driveway', 'Four-car garage'],
    amenities: ['Indoor pool', 'Sauna and steam', 'Home cinema', 'Gym', 'Heated floors', 'Smart climate control', 'Guest wing', 'Mountain views'],
    agentId: 'daniel-morgan'
  },
  {
    id: 'courtyard-villa',
    title: 'Courtyard Villa',
    city: 'Santa Barbara',
    state: 'California',
    country: 'USA',
    location: 'Santa Barbara, California, USA',
    price: 4350000,
    priceLabel: '$4.35 Million',
    type: 'Villa',
    status: 'For Sale',
    beds: 5,
    baths: 5,
    sqft: 4680,
    lot: '0.52 acres',
    year: 2015,
    featured: false,
    image: 'images/property-10.jpg',
    gallery: ['images/property-10.jpg', ...interiorSet(2)],
    tagline: 'A whitewashed courtyard villa a block from the beach.',
    description:
      'Rooms open onto a central courtyard with an olive tree and long lap pool. Lime-washed walls, oak floors and hand-made tile throughout.',
    features: ['Central courtyard', 'Lap pool', 'Lime-washed walls', 'Oak floors', 'Outdoor dining loggia', 'Guest casita'],
    amenities: ['Pool', 'Outdoor fireplace', 'Pizza oven', 'Wine room', 'Home office', 'Security system', 'Garden irrigation', 'Ocean breeze'],
    agentId: 'olivia-carter'
  },
  {
    id: 'skyline-terrace',
    title: 'Skyline Terrace',
    city: 'Seattle',
    state: 'Washington',
    country: 'USA',
    location: 'Seattle, Washington, USA',
    price: 2650000,
    priceLabel: '$2.65 Million',
    type: 'Residence',
    status: 'For Sale',
    beds: 3,
    baths: 3,
    sqft: 2860,
    lot: null,
    year: 2020,
    featured: false,
    image: 'images/property-11.jpg',
    gallery: ['images/property-11.jpg', ...interiorSet(4)],
    tagline: 'A waterfront residence with Sound and skyline views.',
    description:
      'Corner glazing on three sides frames the Sound, the city and the mountains in turn. A covered terrace makes the view usable through the winter.',
    features: ['Corner glazing', 'Covered all-season terrace', 'Open-plan kitchen', 'Study alcove', 'Two parking bays', 'Storage room'],
    amenities: ['Concierge', 'Residents’ pool', 'Gym', 'Roof deck', 'Smart home system', 'Security system', 'EV charging', 'Water views'],
    agentId: 'james-wilson'
  },
  {
    id: 'glass-pavilion',
    title: 'Glass Pavilion',
    city: 'Palm Springs',
    state: 'California',
    country: 'USA',
    location: 'Palm Springs, California, USA',
    price: 3400000,
    priceLabel: '$3.4 Million',
    type: 'House',
    status: 'For Sale',
    beds: 4,
    baths: 4,
    sqft: 3240,
    lot: '0.44 acres',
    year: 1962,
    featured: false,
    image: 'images/property-12.jpg',
    gallery: ['images/property-12.jpg', ...interiorSet(6)],
    tagline: 'Mid-century proportions rebuilt in glass and steel.',
    description:
      'A faithful reworking of a 1962 desert modern, with the original roofline retained and the interior opened to a pool courtyard on both sides.',
    features: ['1962 roofline retained', 'Pool courtyard', 'Glass and steel structure', 'Desert planting', 'Casita', 'Carport with storage'],
    amenities: ['Saltwater pool', 'Spa', 'Outdoor shower', 'Fire pit', 'Smart climate control', 'Security system', 'Mountain views', 'Desert garden'],
    agentId: 'sophia-bennett'
  }
];

/** Look up a single property by its id. */
export const getProperty = (id) => PROPERTIES.find((p) => p.id === id) || null;

/** Look up the advisor attached to a property. */
export const getAgent = (id) => AGENTS.find((a) => a.id === id) || AGENTS[0];

/** Distinct locations, for the listing filters. */
export const LOCATIONS = [...new Set(PROPERTIES.map((p) => `${p.city}, ${p.state}`))].sort();

/** Distinct property types, for the listing filters. */
export const TYPES = [...new Set(PROPERTIES.map((p) => p.type))].sort();

export const PRICE_BANDS = [
  { id: 'any', label: 'Any price', min: 0, max: Infinity },
  { id: 'under-2', label: 'Under $2M', min: 0, max: 2000000 },
  { id: '2-3', label: '$2M – $3M', min: 2000000, max: 3000000 },
  { id: '3-5', label: '$3M – $5M', min: 3000000, max: 5000000 },
  { id: '5-plus', label: '$5M+', min: 5000000, max: Infinity }
];

/**
 * Properties closest to the given one — same state first, then nearest price.
 * Used for the "Similar properties" rail on the detail page.
 */
export function similarProperties(property, limit = 3) {
  if (!property) return [];
  const others = PROPERTIES.filter((p) => p.id !== property.id);
  const score = (p) =>
    (p.state === property.state ? 0 : 1) * 1e12 +
    Math.abs(p.price - property.price);
  return others.sort((a, b) => score(a) - score(b)).slice(0, limit);
}
