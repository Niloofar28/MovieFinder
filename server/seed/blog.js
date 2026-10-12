/**
 * AURORA SKINCARE — beauty journal seed content.
 *
 * Editorial, non-medical content. Nothing here is medical advice and no
 * treatment outcomes are promised. All posts are editable from the admin area.
 */

const posts = [
  {
    slug: 'how-to-build-a-simple-skincare-routine',
    title: 'How to Build a Simple Skincare Routine',
    category: 'Routines',
    author: 'Aurora Editorial',
    readingTime: 6,
    publishedAt: '2026-09-18',
    image: '/assets/img/blog/skincare-routine.webp',
    excerpt:
      'A routine only works if it fits your life. Here is a calm, four-step starting point you can build on.',
    relatedProducts: ['gentle-facial-cleanser', 'hydrating-face-serum', 'hyaluronic-acid-moisturizer', 'daily-sunscreen-spf-50'],
    featured: true,
    body: `
<p class="lede">Most skincare advice fails for the same reason: it asks for twelve steps when you have four minutes. The routines that last are the ones built around what you will actually do on a tired Tuesday.</p>
<h2 id="start-with-four">Start with four steps</h2>
<p>Cleanse, hydrate, moisturise, protect. That is the whole skeleton. A cream cleanser in the evening, a hydrating serum while skin is still damp, a moisturiser to seal it in, and sunscreen in the morning. Everything else — treatments, masks, oils — is an addition, not a foundation.</p>
<h2 id="morning">Morning: keep it fast</h2>
<p>Rinse with lukewarm water or use a gentle cleanser if your skin is oily. Press in a hydrating serum, follow with a light moisturiser, then finish with SPF 50. If you wear makeup, give the sunscreen a minute to settle first — it makes a real difference to how your base sits.</p>
<h2 id="evening">Evening: take your time</h2>
<p>If you wore sunscreen or makeup, start with a micellar water on a cotton pad, then go in with a cream cleanser. Apply your treatment step — this is where a brightening serum or a barrier cream belongs — and finish with something occlusive enough to keep skin comfortable overnight.</p>
<h2 id="add-one-thing">Add one thing at a time</h2>
<p>When you introduce something new, give it two to three weeks before adding the next. If your skin reacts, you will know exactly what to pause. Patch-testing on the jawline for a few nights is unglamorous and extremely effective.</p>
<h2 id="consistency">Consistency beats intensity</h2>
<p>Four steps done most days will outperform an elaborate routine done twice a month. Keep your products where you can see them, and let the routine be a pause in your day rather than another task.</p>
`,
  },
  {
    slug: 'understanding-the-role-of-moisturizers',
    title: 'Understanding the Role of Moisturizers',
    category: 'Ingredients',
    author: 'Dr. Lena Moreau, formulation consultant',
    readingTime: 7,
    publishedAt: '2026-09-05',
    image: '/assets/img/blog/moisturizers.webp',
    excerpt:
      'Humectants, emollients and occlusives do three different jobs. Knowing which is which makes choosing a moisturiser much easier.',
    relatedProducts: ['hyaluronic-acid-moisturizer', 'barrier-repair-cream', 'hydra-glow-gel-cream', 'vitamin-rich-face-oil'],
    featured: false,
    body: `
<p class="lede">"Moisturiser" is a catch-all word for three quite different kinds of ingredient. Understanding them makes the difference between a cream that feels lovely and a cream that actually suits your skin.</p>
<h2 id="humectants">Humectants: they attract water</h2>
<p>Glycerin, hyaluronic acid, betaine and panthenol pull water towards the skin. They are the reason a serum can feel instantly plumping. On their own, in very dry air, they can also pull water from deeper layers — which is why humectants work best followed by something that holds them in.</p>
<h2 id="emollients">Emollients: they soften</h2>
<p>Squalane, jojoba and plant oils fill the spaces between skin cells so the surface feels smooth and flexible. This is the "softness" you notice a minute after applying a good cream.</p>
<h2 id="occlusives">Occlusives: they seal</h2>
<p>Shea butter, waxes and heavier butters slow water loss by forming a light film. A little goes a long way; too much and a cream feels like a mask rather than skincare.</p>
<h2 id="choosing">Choosing for your skin</h2>
<p>Oily or combination skin usually prefers a gel-cream built mostly on humectants with light emollients. Dry or reactive-feeling skin tends to do better with a balance of all three — our Barrier Repair Cream is deliberately built that way. In humid weather, most people need less occlusion, not more.</p>
<h2 id="layer-order">Order matters less than you think</h2>
<p>Thinnest to thickest is a useful rule, but the real principle is simpler: water-based products first, oil-based products after, sunscreen last in the morning.</p>
`,
  },
  {
    slug: 'how-to-layer-skincare-products',
    title: 'How to Layer Skincare Products',
    category: 'Routines',
    author: 'Aurora Editorial',
    readingTime: 5,
    publishedAt: '2026-08-22',
    image: '/assets/img/blog/layering-skincare.webp',
    excerpt:
      'Which order, how long to wait, and how to combine actives without irritating your skin.',
    relatedProducts: ['vitamin-c-brightening-serum', 'radiance-night-serum', 'refreshing-micellar-water', 'daily-sunscreen-spf-50'],
    featured: false,
    body: `
<p class="lede">Layering is mostly about patience and moderation. Two good products used well will beat five used hastily.</p>
<h2 id="the-order">The order, in one line</h2>
<p>Cleanser → toner or mist → water-based serum → treatment → moisturiser → facial oil → sunscreen (mornings only). If a product is a thin liquid, it goes earlier; if it feels oily, it goes later.</p>
<h2 id="waiting">How long to wait between layers</h2>
<p>Thirty to sixty seconds is enough for most products. The exception is a strong active — give it a minute before you layer a cream over it, especially if it stings on application.</p>
<h2 id="actives">Mixing actives carefully</h2>
<p>Vitamin C in the morning and niacinamide at night is a comfortable, well-tolerated combination for most people. Strong exfoliating acids and retinoids are better on separate evenings. If your skin feels tight, stings or flakes, that is a signal to reduce frequency rather than add a soothing product on top.</p>
<h2 id="mistakes">Three common mistakes</h2>
<p>Applying serum to completely dry skin (mist first — it helps absorption), using too much product (a pea-sized amount of cream is genuinely enough for the whole face), and skipping sunscreen on cloudy days. Nothing in a routine works as hard as daily sun protection.</p>
`,
  },
  {
    slug: 'everyday-makeup-essentials',
    title: 'Everyday Makeup Essentials',
    category: 'Makeup',
    author: 'Nina Alvarez, makeup artist',
    readingTime: 4,
    publishedAt: '2026-08-08',
    image: '/assets/img/blog/everyday-makeup.webp',
    excerpt:
      'Five products, one ten-minute face. A makeup artist on the small kit that does the most work.',
    relatedProducts: ['lightweight-foundation', 'volumizing-mascara', 'velvet-matte-lipstick', 'hydrating-lip-gloss'],
    featured: false,
    body: `
<p class="lede">An everyday face does not need a suitcase of products. It needs five that you know how to use.</p>
<h2 id="skin-first">Skin first</h2>
<p>Good makeup starts with prepared skin. Hydrated, settled skin keeps base looking like skin instead of paint. Let your moisturiser and sunscreen sit for a couple of minutes before you start.</p>
<h2 id="the-five">The five</h2>
<p>A lightweight foundation or tint pressed in with fingers where you want coverage. A cream blush on the cheekbones and, in a pinch, on the lids. Mascara — one coat for daytime, two for evening. A lipstick that doubles as a soft cheek colour. Brow gel. That is genuinely it.</p>
<h2 id="tools">Tools that help</h2>
<p>Two brushes are enough: something fluffy for powder and something firm for base. Wash them weekly with mild soap — clean tools apply product more evenly and last years longer.</p>
<h2 id="finish">Finish with restraint</h2>
<p>Set only where you shine. Powder everything and you lose the glow that makes a face look alive.</p>
`,
  },
  {
    slug: 'choosing-products-for-different-skin-types',
    title: 'Choosing Products for Different Skin Types',
    category: 'Guides',
    author: 'Aurora Editorial',
    readingTime: 6,
    publishedAt: '2026-07-25',
    image: '/assets/img/blog/skin-types.webp',
    excerpt:
      'Oily, dry, combination, sensitive — a practical guide to textures rather than rigid rules.',
    relatedProducts: ['hydra-glow-gel-cream', 'barrier-repair-cream', 'hydrating-body-lotion', 'gentle-facial-cleanser'],
    featured: false,
    body: `
<p class="lede">Skin type is a moving target: it changes with seasons, hormones, travel and stress. Treat these as starting points, not diagnoses.</p>
<h2 id="oily">Oily skin</h2>
<p>Look for gel and fluid textures, humectant-heavy formulas, and a cleanser that removes oil without a squeaky finish. Skipping moisturiser often makes oiliness feel worse; choose a light gel-cream instead.</p>
<h2 id="dry">Dry skin</h2>
<p>Layer: hydrating serum on damp skin, then a cream with both emollients and occlusives. A few drops of facial oil at night, or an overnight mask two nights a week, makes a noticeable difference.</p>
<h2 id="combination">Combination skin</h2>
<p>The most common pattern, and the easiest to over-treat. Use one moisturiser everywhere and a clay mask only on the areas that need it, rather than two full routines.</p>
<h2 id="sensitive">Sensitive-feeling skin</h2>
<p>Fewer ingredients, no fragrance, and slow introductions. A minimal barrier cream is usually a better first step than a targeted treatment. If skin is persistently reactive or painful, that is a question for a dermatologist, not a product page.</p>
<h2 id="seasons">Adjust with the season</h2>
<p>Most people need a lighter texture in summer and something richer in winter. Changing one product at a time is the easiest way to adjust.</p>
`,
  },
  {
    slug: 'how-to-read-a-skincare-ingredient-list',
    title: 'How to Read a Skincare Ingredient List',
    category: 'Ingredients',
    author: 'Dr. Lena Moreau, formulation consultant',
    readingTime: 5,
    publishedAt: '2026-07-10',
    image: '/assets/img/blog/ingredient-lists.webp',
    excerpt:
      'Ingredients appear in descending order of concentration. Here is how to use that, without falling for the fear-mongering.',
    relatedProducts: ['rose-water-toner-mist', 'radiance-night-serum', 'purifying-clay-mask', 'vitamin-c-brightening-serum'],
    featured: false,
    body: `
<p class="lede">An ingredient list is a concentration map read from top to bottom. That single fact answers most questions people have about a product.</p>
<h2 id="order">The order is the information</h2>
<p>Ingredients are listed in descending order of concentration, up to one percent. Anything below that threshold can be listed in any order, which is why two products can both claim "with vitamin C" and behave completely differently.</p>
<h2 id="hero-vs-support">Hero ingredients versus support</h2>
<p>The first five entries tell you what the product mostly is — usually water, a humectant and the base oils or esters. The ingredient on the front of the bottle may be far down the list. That is not automatically bad; it tells you the product is a supporting formula rather than a concentrated treatment.</p>
<h2 id="allergens">Allergens and fragrance</h2>
<p>If your skin is reactive, look for "fragrance free" rather than "unscented", and check for essential oils high in the list. Patch-test anything new for several nights.</p>
<h2 id="claims">On claims</h2>
<p>"Clinically tested", "dermatologist approved" and similar phrases describe an assessment process, not a guarantee of results. Read them as a signal about how careful a brand is, not as a promise.</p>
`,
  },
];

module.exports = { posts };
