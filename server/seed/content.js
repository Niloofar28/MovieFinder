/**
 * AURORA SKINCARE — editable site content (settings).
 *
 * Everything a store owner would want to change without touching code lives
 * here: homepage copy, trust indicators, promotional banner, gallery tiles,
 * newsletter block, footer, contact details and legal / policy pages.
 *
 * Store policy: sample contact details are clearly sample placeholders, and
 * social destinations are placeholders unless real URLs are configured.
 */

const content = {
  brand: {
    name: 'AURORA SKINCARE',
    shortName: 'Aurora',
    tagline: 'Beauty That Defines You',
    description:
      'Empowering your beauty with thoughtful skincare, quality products, and everyday self-care.',
    mission:
      'Aurora Skincare is a fictional demo store built to show how a contemporary beauty brand can present its products. All products, prices and ratings are sample data.',
  },

  hero: {
    eyebrow: 'New season ritual',
    headlineLine1: 'Beauty That',
    headlineAccent: 'Defines',
    headlineLine2: 'You',
    subtext: 'Premium skincare & beauty products for healthy, radiant and glowing skin.',
    primaryCta: { label: 'Shop Now', href: '/shop' },
    secondaryCta: { label: 'Explore More', href: '/categories' },
    badge: '100% SAFE & NATURAL',
    ratingText: '4.9/5 (2.5k+ Reviews)',
    ratingValue: 4.9,
    productChips: [
      { name: 'Brightening Serum', price: 23.99, href: '/product?slug=vitamin-c-brightening-serum' },
      { name: 'Glow Serum', price: 28.99, href: '/product?slug=radiance-night-serum' },
      { name: 'Radiance Day Cream', price: 29.5, href: '/product?slug=radiance-day-cream' },
    ],
  },

  trust: [
    { icon: 'leaf', title: 'Natural Ingredients', sub: 'Safe & Organic' },
    { icon: 'flask', title: 'Clinically Tested', sub: 'Dermatologist Reviewed' },
    { icon: 'shield', title: 'Paraben Free', sub: 'No Harsh Chemicals' },
    { icon: 'heart', title: 'Cruelty Free', sub: 'Not Tested on Animals' },
    { icon: 'sparkle', title: 'Trusted Quality', sub: 'Premium Quality Products' },
  ],
  trustNote:
    'Ingredient, testing and cruelty-free statements describe this fictional brand\u2019s own product claims. They are demonstration content, editable in the admin area, and are not presented as independent certifications.',

  banner: {
    headlineLine1: 'Glow More,',
    headlineLine2: 'Worry Less',
    subtext: 'Discover your new beauty essentials and enjoy special offers on selected products.',
    cta: { label: 'Grab the Offer', href: '/shop?sale=1' },
    badge: { top: 'UP TO', value: '30%', bottom: 'OFF' },
    image: '/assets/img/banner/offer-composition.webp',
    benefits: [
      { icon: 'truck', title: 'Free Shipping', sub: 'On orders over $50' },
      { icon: 'return', title: 'Easy Returns', sub: '30-day return policy' },
      { icon: 'lock', title: 'Secure Payments', sub: 'Secure checkout' },
    ],
  },

  gallery: {
    title: '#AuroraGlow',
    followLabel: 'Follow Us @auroraskincare',
    followHref: '',
    tiles: [
      { image: '/assets/img/gallery/g1.webp', alt: 'Model holding a serum bottle against a pink studio backdrop', href: '' },
      { image: '/assets/img/gallery/g2.webp', alt: 'Hands holding serum bottles in a soft morning light routine', href: '' },
      { image: '/assets/img/gallery/g3.webp', alt: 'Beauty editorial portrait with a clean, glowing complexion', href: '' },
      { image: '/assets/img/gallery/g4.webp', alt: 'Two friends with natural skin smiling in natural light', href: '' },
      { image: '/assets/img/gallery/g5.webp', alt: 'Close-up of glowing skin after a hydrating routine', href: '' },
      { image: '/assets/img/gallery/g6.webp', alt: 'Minimal beauty portrait with soft neutral tones', href: '' },
    ],
  },

  newsletter: {
    title: 'Stay Beautiful, Stay Updated',
    subtext:
      'Subscribe to receive beauty tips, new product updates, exclusive offers, and 10% off your first order.',
    buttonLabel: 'Subscribe Now',
    consentLabel: 'I agree to receive marketing emails and have read the privacy policy.',
    couponNote: 'Use code AURORA10 at checkout for 10% off your first order.',
    successMessage: 'You are subscribed. Use code AURORA10 at checkout for 10% off your first order.',
  },

  footer: {
    columns: [
      {
        title: 'Quick Links',
        links: [
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: 'Categories', href: '/categories' },
          { label: 'About Us', href: '/about' },
          { label: 'Blog', href: '/blog' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Customer Care',
        links: [
          { label: 'Track Order', href: '/info?doc=track-order' },
          { label: 'Shipping Policy', href: '/info?doc=shipping' },
          { label: 'Returns & Refunds', href: '/info?doc=returns' },
          { label: 'FAQs', href: '/info?doc=faq' },
          { label: 'Size & Product Guide', href: '/info?doc=size-guide' },
        ],
      },
      {
        title: 'Information',
        links: [
          { label: 'Privacy Policy', href: '/info?doc=privacy' },
          { label: 'Terms & Conditions', href: '/info?doc=terms' },
          { label: 'Cookie Policy', href: '/info?doc=cookies' },
          { label: 'Disclaimer', href: '/info?doc=disclaimer' },
        ],
      },
    ],
    copyright: '\u00a9 2026 Aurora Skincare. All rights reserved.',
    paymentNote:
      'Demo store — no payment provider is connected. Checkout runs in test mode and no real payment is taken.',
  },

  social: {
    configured: false,
    note: 'Social destinations are placeholders until real profile URLs are added in the admin area.',
    links: [
      { label: 'Facebook', href: '', icon: 'facebook' },
      { label: 'Instagram', href: '', icon: 'instagram' },
      { label: 'TikTok', href: '', icon: 'tiktok' },
      { label: 'Pinterest', href: '', icon: 'pinterest' },
    ],
  },

  contact: {
    isSample: true,
    note: 'The details below are clearly labelled sample information for this demo build. Replace them in the admin area before launch.',
    email: 'hello@auroraskincare.example',
    phone: '+1 (555) 012-3456',
    address: '123 Beauty Lane, Los Angeles, CA 90001',
    hours: 'Mon\u2013Sat, 9:00 AM \u2013 6:00 PM',
  },

  about: {
    heroTitle: 'Beauty Inspired by Nature, Designed for You',
    heroText:
      'Discover our approach to thoughtful beauty, everyday skincare, and products designed to make your routine feel special.',
    image: '/assets/img/about/brand-story.webp',
    story: [
      'Aurora Skincare began with a simple frustration: beauty shelves are loud, but most of us want a short routine we can keep up with. We started with four products and one rule \u2014 nothing goes on the shelf unless we would use it every day ourselves.',
      'Today the collection has grown, but the rule has not changed. We build around a small number of textures that layer well together, keep formulas readable, and design packaging that looks calm on a bathroom shelf.',
    ],
    philosophy: [
      {
        title: 'Fewer, better steps',
        text: 'A routine should fit into a real morning. We would rather perfect four products than launch forty.',
      },
      {
        title: 'Readable formulas',
        text: 'Ingredient lists are published in full on every product page, in plain language, with the function of each key ingredient.',
      },
      {
        title: 'Comfort first',
        text: 'Texture matters as much as ingredients. If something pills, stings or feels heavy, we go back to the lab bench.',
      },
    ],
    principles: [
      'Ingredient lists published in full for every product.',
      'Product claims written in plain language, without treatment promises.',
      'Responsible, recyclable-leaning packaging and refillable where possible.',
      'Sample ratings on this demo store are labelled as demonstration data.',
    ],
    values: [
      { icon: 'leaf', title: 'Thoughtful formulas', text: 'Short, readable ingredient lists built around a calm routine.' },
      { icon: 'flask', title: 'Reviewed in-house', text: 'Every formula goes through an internal review before it ships.' },
      { icon: 'heart', title: 'Considered packaging', text: 'Refillable flacons and recyclable-leaning materials where we can.' },
      { icon: 'sparkle', title: 'Made to be used', text: 'Designed for real bathrooms, real mornings and real hands.' },
    ],
    imageBlocks: {
      care: '/assets/img/about/our-care.webp',
      studio: '/assets/img/about/studio.webp',
    },
  },

  docs: {
    privacy: {
      title: 'Privacy Policy',
      updated: 'Last updated 1 October 2026',
      body: `
<p class="lede">This demo store collects as little as possible. Here is exactly what it stores and why.</p>
<h2>What we store</h2>
<p>When you create an account we store your name, email address, phone number (if you provide one) and a hashed password. When you place an order we store the delivery details you enter, the items in the order and its status. Newsletter sign-ups store an email address and a consent flag. Contact form submissions store the message you send us.</p>
<h2>What we never store</h2>
<p>We never store raw card numbers or card security codes. This demo build has no payment provider connected, so no payment details are collected at all.</p>
<h2>What it is used for</h2>
<p>Order fulfilment, order history, customer support and — only if you tick the consent box — occasional marketing email. Nothing is sold or shared with third parties.</p>
<h2>Your choices</h2>
<p>You can update your profile, remove saved addresses and unsubscribe from marketing email at any time from your account area. Deleting your account removes your profile, addresses and session, while order records are retained for accounting purposes.</p>`,
    },
    terms: {
      title: 'Terms & Conditions',
      updated: 'Last updated 1 October 2026',
      body: `
<p class="lede">Plain-language terms for a demonstration storefront.</p>
<h2>About this store</h2>
<p>Aurora Skincare is a fictional brand. Products, prices, ratings and review counts on this site are demonstration data, and no real goods are sold or shipped.</p>
<h2>Orders</h2>
<p>Placing an order creates a record in this application with a unique order number. Stock and prices are validated on the server when an order is placed, and an order is rejected if an item is no longer available.</p>
<h2>Pricing</h2>
<p>All prices are shown in US dollars and include no tax beyond what is displayed at checkout. Shipping costs are calculated at checkout before an order is confirmed.</p>
<h2>Returns</h2>
<p>The Returns policy described on this site is sample policy content for the demo, and describes a 30-day return window.</p>`,
    },
    cookies: {
      title: 'Cookie Policy',
      updated: 'Last updated 1 October 2026',
      body: `
<p class="lede">This store sets the minimum number of cookies needed to work.</p>
<h2>Essential</h2>
<p>One signed, HTTP-only session cookie keeps you signed in. It contains no personal data beyond a session identifier and expires after 30 days.</p>
<h2>Stored in your browser</h2>
<p>Your shopping bag, wishlist and recently viewed products are stored locally in your browser, not on our servers, so they survive a page reload without an account.</p>
<h2>Analytics</h2>
<p>None. This demo build loads no analytics or advertising scripts.</p>`,
    },
    disclaimer: {
      title: 'Disclaimer',
      updated: 'Last updated 1 October 2026',
      body: `
<p class="lede">Beauty content is not medical advice.</p>
<h2>General information only</h2>
<p>Articles and product descriptions on this site describe cosmetic benefits and general skincare routines. They are not medical advice and do not promise treatment outcomes.</p>
<h2>Individual results vary</h2>
<p>Skin responds differently from person to person. Patch-test new products, and speak to a qualified dermatologist about persistent skin concerns.</p>
<h2>Sample data</h2>
<p>Ratings, review counts, ingredient statements and testing claims on this demo store are sample content for a fictional brand. They have not been independently verified.</p>`,
    },
    shipping: {
      title: 'Shipping Policy',
      updated: 'Last updated 1 October 2026',
      body: `
<p class="lede">How delivery works in this demo store.</p>
<h2>Options and pricing</h2>
<p>Standard delivery is $6.99 and arrives in 3–5 business days; it is free on orders over $50. Express delivery is $14.99 and arrives in 1–2 business days. Shipping is calculated on the server when you place an order, so the total you see at checkout is the total that is stored.</p>
<h2>Tracking</h2>
<p>Each order receives a unique order number. Enter it on the Track Order page (with the email used at checkout) to see its current status and items.</p>
<h2>Note</h2>
<p>No parcels are actually shipped: this is a demonstration storefront without a fulfilment integration.</p>`,
    },
    returns: {
      title: 'Returns & Refunds',
      updated: 'Last updated 1 October 2026',
      body: `
<p class="lede">A 30-day return window, described as sample policy content.</p>
<h2>Window</h2>
<p>Unopened products can be returned within 30 days of delivery. Opened products can be returned if they caused a reaction — tell us what happened and we will take it from there.</p>
<h2>How to start a return</h2>
<p>Contact our customer care team with your order number and the reason for the return. We will reply with return instructions.</p>
<h2>Refunds</h2>
<p>Refunds are issued to the original payment method once the return is received. As no payment provider is connected to this demo store, no real refunds are processed.</p>`,
    },
    'size-guide': {
      title: 'Size & Product Guide',
      updated: 'Last updated 1 October 2026',
      body: `
<p class="lede">What the sizes, textures and shade names on our product pages actually mean.</p>
<h2>Serums and treatments</h2>
<p>30 ml is roughly eight to ten weeks of daily use. 50 ml suits people who use a serum morning and evening.</p>
<h2>Creams and masks</h2>
<p>A 50 ml jar lasts around three months of twice-daily use. Masks are used one to three times a week, so a 75 ml jar lasts a season.</p>
<h2>Fragrance</h2>
<p>50 ml of eau de parfum lasts most people six to eight months with daily wear. Mists are reapplied through the day and last around two months.</p>
<h2>Makeup shades</h2>
<p>Our foundation runs from Porcelain to Espresso across six shades. Lipsticks are named by the colour you see in the tube rather than by number, and the product gallery shows the shade under studio lighting.</p>`,
    },
    faq: {
      title: 'Frequently Asked Questions',
      updated: 'Answers for this demo storefront',
      body: `
<h2>Do I need an account to order?</h2>
<p>No. You can browse, add to your bag and check out as a guest. Creating an account adds order history, saved addresses and a wishlist you can return to.</p>
<h2>How do I use a promo code?</h2>
<p>Enter it in the promo code field in your bag or at checkout and press Apply. Valid codes in this demo: AURORA10 (10% off), WELCOME15 (15% off orders over $40), GLOW20 (20% off orders over $80) and FREESHIP (free standard shipping over $30).</p>
<h2>Are the ratings real?</h2>
<p>No. Ratings and review counts in this demo store are sample data for a fictional brand and are labelled as such. Real customer reviews will appear once the store is live and reviews are collected from orders.</p>
<h2>Can I buy more than the available stock?</h2>
<p>No. Stock is validated on the server when an order is placed, and the bag will not let you exceed the available quantity.</p>
<h2>Is payment real?</h2>
<p>No. No payment provider is connected. Checkout runs in clearly labelled test mode and no card details are collected or stored.</p>`,
    },
    'track-order': {
      title: 'Track Order',
      updated: 'Enter your order number and the email used at checkout',
      trackOrder: true,
      body: '',
    },
  },

  /** Feature flags surfaced in the admin area so nothing looks falsely live. */
  flags: {
    paymentsConfigured: false,
    socialConfigured: false,
    reviewsVerified: false,
  },
};

module.exports = { content };
