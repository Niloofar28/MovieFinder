/** Site footer: brand, navigation, contact details, newsletter and socials. */
import { COMPANY } from '../data/properties.js';
import { brand, icons } from '../lib/icons.js';
import { qs, qsa, isEmail } from '../lib/utils.js';
import { toast } from './toast.js';

const NAV = [
  { href: 'index.html', label: 'Home' },
  { href: 'properties.html', label: 'Properties' },
  { href: 'about.html', label: 'About Us' },
  { href: 'services.html', label: 'Services' },
  { href: 'team.html', label: 'Team' },
  { href: 'contact.html', label: 'Contact' }
];

export function renderFooter() {
  const footer = qs('[data-footer]');
  if (!footer) return;

  const year = new Date().getFullYear();

  footer.innerHTML = `
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          ${brand()}
          <p class="footer__about">${COMPANY.description}</p>
          <div class="footer__social">
            ${COMPANY.social
              .map(
                (item) =>
                  `<a href="${item.url}" target="_blank" rel="noopener noreferrer" aria-label="${COMPANY.name} on ${item.name}">${
                    icons[item.icon] || icons.star
                  }</a>`
              )
              .join('')}
          </div>
        </div>

        <div>
          <h2 class="footer__title">Explore</h2>
          <ul class="footer__links">
            ${NAV.map(({ href, label }) => `<li><a href="${href}">${label}</a></li>`).join('')}
          </ul>
        </div>

        <div>
          <h2 class="footer__title">Contact</h2>
          <ul class="footer__contact">
            <li><span>Phone</span><a href="${COMPANY.phoneHref}">${COMPANY.phone}</a></li>
            <li><span>Email</span><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></li>
            <li><span>Office</span>${COMPANY.address}</li>
          </ul>
        </div>

        <div>
          <h2 class="footer__title">Newsletter</h2>
          <p>New listings and market notes, sent twice a month. No noise.</p>
          <form class="footer__newsletter" data-newsletter novalidate>
            <div class="newsletter__field">
              <label class="sr-only" for="newsletter-email">Email address</label>
              <input id="newsletter-email" name="email" type="email" placeholder="you@example.com" data-validate="required|email" data-error="Enter a valid email address.">
              <button class="btn btn--gold btn--sm" type="submit">Join</button>
            </div>
          </form>
        </div>
      </div>

      <div class="footer__bottom">
        <p>© ${year} ${COMPANY.name}. All rights reserved.</p>
        <div class="footer__legal">
          <a href="contact.html">Privacy</a>
          <a href="contact.html">Terms</a>
          <a href="contact.html">Cookies</a>
        </div>
      </div>
    </div>`;

  initFooter(footer);
}

function initFooter(footer) {
  const form = qs('[data-newsletter]', footer);
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = qs('input[name="email"]', form);
    const value = (input.value || '').trim();

    if (!isEmail(value)) {
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      toast('Please enter a valid email address.', 'error');
      return;
    }

    input.removeAttribute('aria-invalid');
    form.reset();
    toast('You are on the list — thank you.', 'success');
  });

  qsa('input', form).forEach((input) =>
    input.addEventListener('input', () => input.removeAttribute('aria-invalid'))
  );
}
