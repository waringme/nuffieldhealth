import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navMenu = nav.querySelector('.nav-menu');
    if (navMenu) {
      const activeDropdown = navMenu.querySelector('li.active');
      if (activeDropdown) {
        activeDropdown.classList.remove('active');
      }
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';

  // Create brand section
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const brandLink = document.createElement('a');
  brandLink.href = '/';
  const brandImg = document.createElement('img');
  brandImg.src = '/images/logo.svg';
  brandImg.alt = 'Nuffield Health';
  brandLink.appendChild(brandImg);
  brand.appendChild(brandLink);
  nav.appendChild(brand);

  // Create search section
  const search = document.createElement('div');
  search.className = 'nav-search';
  search.innerHTML = `
    <input type="text" placeholder="What would you like to do today?" aria-label="Search">
    <button type="button" aria-label="Submit search">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;
  nav.appendChild(search);

  // Create tools section
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  tools.innerHTML = `
    <a href="/login">Login</a>

  `;
  nav.appendChild(tools);

  // Create navigation menu
  const menu = document.createElement('div');
  menu.className = 'nav-menu';
  const menuContent = fragment.querySelector('.nav-sections');
  if (menuContent) {
    menu.innerHTML = menuContent.innerHTML;
    
    // Add click handlers for mobile dropdowns
    menu.querySelectorAll('li').forEach(item => {
      const submenu = item.querySelector('ul');
      if (submenu) {
        item.addEventListener('click', (e) => {
          if (!isDesktop.matches) {
            e.preventDefault();
            item.classList.toggle('active');
          }
        });
      }
    });
  }
  nav.appendChild(menu);

  // Create wrapper and append nav
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Add event listeners
  window.addEventListener('keydown', closeOnEscape);
  
  // Handle mobile menu toggle
  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.className = 'mobile-menu-toggle';
  mobileMenuBtn.setAttribute('aria-label', 'Toggle menu');
  mobileMenuBtn.innerHTML = `
    <span></span>
    <span></span>
    <span></span>
  `;
  nav.insertBefore(mobileMenuBtn, nav.firstChild);

  mobileMenuBtn.addEventListener('click', () => {
    nav.classList.toggle('menu-open');
    document.body.classList.toggle('menu-open');
  });
}
