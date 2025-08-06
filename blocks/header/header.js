// Drop-in Tools
import { events } from '@dropins/tools/event-bus.js';

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

import renderAuthCombine from './renderAuthCombine.js';
import { renderAuthDropdown } from './renderAuthDropdown.js';
import { rootLink } from '../../scripts/commerce.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.querySelector('header').insertAdjacentElement('afterbegin', overlay);

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections);
      overlay.classList.remove('show');
      nav.querySelector('button').focus();
      const navWrapper = document.querySelector('.nav-wrapper');
      navWrapper.classList.remove('active');
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections, false);
      overlay.classList.remove('show');
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections, true);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
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
  sections
    .querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
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
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
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
      drop.classList.remove('active');
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

const subMenuHeader = document.createElement('div');
subMenuHeader.classList.add('submenu-header');
subMenuHeader.innerHTML = '<h5 class="back-link">All Categories</h5><hr />';

/**
 * Sets up the submenu
 * @param {navSection} navSection The nav section element
 */
function setupSubmenu(navSection) {
  if (navSection.querySelector('ul')) {
    let label;
    if (navSection.childNodes.length) {
      [label] = navSection.childNodes;
    }

    const submenu = navSection.querySelector('ul');
    
    // Remove any images from the submenu
    submenu.querySelectorAll('img').forEach(img => img.remove());
    
    const wrapper = document.createElement('div');
    const header = subMenuHeader.cloneNode(true);
    const title = document.createElement('h6');
    title.classList.add('submenu-title');
    title.textContent = label.textContent;

    wrapper.classList.add('submenu-wrapper');
    wrapper.appendChild(header);
    wrapper.appendChild(title);
    
    // Clone submenu after removing images
    const cleanSubmenu = submenu.cloneNode(true);
    wrapper.appendChild(cleanSubmenu);

    navSection.appendChild(wrapper);
    navSection.removeChild(submenu);
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
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  // Clear existing content
  navBrand.innerHTML = '';
  
  // Create brand link with logo
  const brandLink = document.createElement('a');
  brandLink.href = '/';
  brandLink.innerHTML = `<?xml version="1.0" encoding="UTF-8"?>
<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 302">
  <path class="cls-1" fill="#00e47c" d="m65.08,265.2c-20.68-14.9-31.63-25.85-41.97-41.66C8.21,200.42,0,172.44,0,144.76,0,64.78,64.48,0,144.46,0s144.46,64.78,144.46,144.46c0,32.85-11.25,65.69-31.02,90.02-8.21,10.34-15.21,16.42-34.06,30.72v-84.55h14.29v57.78c10.64-12.47,15.82-20.07,20.99-29.2,10.64-18.86,16.42-42.27,16.42-64.78,0-72.99-58.7-132.3-131.08-132.3S13.38,71.47,13.38,145.37c0,33.76,11.86,63.56,37.1,93.06v-57.78h14.6v84.55Zm28.59,14.6c-2.74-.61-9.12-3.65-14.29-6.39v-92.76h14.29v99.14Zm86.98-203.77l-36.19-27.98-36.19,27.98-7.91-10.34,44.1-34.37,44.1,34.37-7.91,10.34Zm-58.09,211.37c-5.17-.91-5.47-.91-7.3-1.52-1.52-.3-2.13-.3-6.99-1.52V86.68h14.29v200.72Zm28.89,1.22c-2.13.3-2.74.3-5.78.3-4.56,0-6.08,0-8.52-.3V86.68h14.29v201.94Zm28.89-4.56c-4.56,1.52-8.52,2.43-14.29,3.65V86.68h14.29v197.38Zm29.2-10.64c-4.56,2.13-7.3,3.35-14.6,6.69v-99.45h14.6v92.76Z"/>
  <path class="cls-1" fill="#00e47c" d="m374.7,14.29c4.56-.3,8.21-.61,9.43-.61,17.33,0,28.89,10.04,28.89,25.55,0,10.64-5.78,18.25-18.25,24.33,15.81,3.35,24.33,13.38,24.33,28.28,0,11.56-6.39,21.29-16.42,25.24-4.56,1.82-10.04,2.43-20.07,2.43h-9.43c-5.17-.3-9.12-.3-12.16-.3h-17.64v-6.08l10.34-1.82V22.81l-10.34-1.82v-6.39h18.55l12.77-.3Zm-30.72,260.33v-6.08l9.73-1.82v-88.8l-9.73-1.52v-6.69h34.97v6.39l-9.12,1.82v88.5l8.82,1.82v6.39h-34.67Zm32.54-213.8c13.08,0,19.16-6.69,19.16-20.98,0-12.17-6.39-19.46-17.33-19.46-3.04,0-5.17.3-9.43,1.82v38.62h7.6Zm-7.6,49.88c3.04,1.82,5.17,2.43,9.43,2.43,14.29,0,23.11-8.82,23.11-23.11s-8.21-21.9-25.85-21.9h-6.69v42.58Zm58.09,163.92v-6.08l7.91-1.52v-44.4c0-8.52-2.74-12.47-8.52-12.47-4.56,0-8.52,1.82-14.29,6.69v49.57l7.91,1.82v6.39h-31.32v-6.08l8.82-1.82v-55.35l-8.82-1.22v-6.08l18.86-4.87h4.26v9.12c9.12-6.99,13.38-8.82,20.07-8.82,11.56,0,17.94,7.3,17.94,19.77v47.14l7.91,1.82v6.39h-30.72Zm63.56-194.03c0,24.03-12.47,40.14-30.72,40.14s-29.2-15.21-29.2-37.41c0-23.72,12.47-40.15,30.72-40.15s29.2,14.9,29.2,37.41Zm-43.79,2.13c0,19.46,4.87,30.41,13.38,30.41,9.12,0,13.99-11.56,13.99-34.37,0-18.25-4.87-28.28-13.38-28.28s-13.99,11.86-13.99,32.24Zm69.65,126.82c4.26,5.47,5.47,9.12,5.47,14.9,0,13.99-10.95,24.33-25.55,24.33-3.04,0-5.47-.3-8.21-1.22-3.65,2.43-5.78,4.87-5.78,6.69s1.82,2.74,6.39,3.04l18.25.91c14.29.61,20.98,6.08,20.98,17.33,0,16.12-14.29,26.46-36.19,26.46-16.42,0-27.07-6.08-27.07-15.51,0-6.08,3.04-10.04,11.86-15.82-6.08-2.43-8.52-5.17-8.52-9.43,0-5.47,3.95-10.34,13.69-16.42-9.12-5.78-12.47-11.56-12.47-20.98,0-14.29,10.95-25.24,25.24-25.24,3.04,0,4.26.3,9.73,1.52,3.04.91,5.17,1.22,6.69,1.22.3,0,1.52,0,2.74-.3h2.74l12.47-.3v8.82h-12.47Zm-31.63,62.35c-3.95,3.65-5.47,6.69-5.47,11.25,0,6.69,6.08,10.64,16.12,10.64,12.47,0,21.9-5.17,21.9-12.47,0-6.39-3.35-7.6-26.76-9.12l-5.78-.3Zm.61-48.66c0,12.77,3.04,18.55,10.34,18.55s10.34-5.78,10.34-17.03c0-13.38-3.65-19.77-10.95-19.77-6.69,0-9.73,5.78-9.73,18.25Zm31.63-142.33c1.52,20.68,6.69,29.2,17.64,29.2,5.47,0,9.43-2.74,13.99-9.73l6.69,2.74c-7.6,13.69-13.08,17.64-24.94,17.64-18.25,0-28.59-13.08-28.59-36.8,0-25.24,10.64-40.45,28.28-40.45s25.24,12.16,25.55,37.41h-38.62Zm23.11-7.3c-.61-16.42-3.65-22.81-10.64-22.81s-10.64,6.99-12.47,22.81h23.11Z"/>
  <path class="cls-1" fill="#00e47c" d="m552.32,236c1.52,20.98,6.69,29.5,17.64,29.5,5.78,0,9.73-2.74,14.29-9.73l6.69,2.74c-6.99,13.08-13.38,17.64-25.24,17.64-18.25,0-28.59-13.69-28.59-37.1,0-25.24,10.64-40.15,28.28-40.15,12.17,0,20.07,6.39,23.72,18.25,1.22,3.95,1.52,8.82,2.13,18.86h-38.93Zm23.11-6.99c-.3-15.81-3.35-22.81-10.34-22.81s-10.95,6.69-12.77,22.81h23.11Zm27.37-109.79v-6.08l7.3-1.52v-41.06c0-10.95-2.43-14.9-8.82-14.9-4.56,0-7.91,1.52-13.99,6.69v48.96l7.3,1.52v6.39h-31.02v-6.08l9.12-1.82V18.55l-8.52-1.82v-5.17l18.86-3.95h4.26v45.92c8.52-6.69,13.38-8.82,19.77-8.82,11.86,0,17.94,6.99,17.94,20.68v45.92l7.91,1.52v6.39h-30.11Zm-2.74,155.41v-6.08l8.82-1.82v-93.67l-8.52-.91v-5.17l19.16-4.26h3.95v103.71l8.21,1.82v6.39h-31.63Zm80.59,0v-6.08l7.3-1.52v-41.36c0-10.95-2.43-14.9-8.82-14.9-4.26,0-7.91,1.82-13.99,7v48.66l7.3,1.82v6.39h-30.72v-6.08l8.82-1.82v-93.06l-8.52-1.52v-5.17l19.16-4.26h3.95v46.23c8.21-6.69,13.08-8.82,20.07-8.82,11.25,0,17.64,6.99,17.64,19.46v46.84l8.21,1.82v6.39h-30.41Zm-14.6-216.54c6.08-10.34,9.12-13.08,14.6-13.08s8.82,3.35,8.82,8.82c0,3.35-1.82,6.08-5.78,9.12l-7.91-4.26c-5.17,2.74-9.43,8.52-9.43,12.77v39.84l10.64,1.52v6.39h-33.76v-6.08l8.82-1.82v-55.96l-8.82-1.52v-4.87l18.25-4.87h4.56v13.99Zm31.02,61.13v-6.08l8.21-1.82v-54.74l-8.21-1.82v-5.17l19.16-4.87h3.65v66.6l8.52,1.52v6.39h-31.32Zm24.02-101.88c0,5.47-4.26,9.73-9.73,9.73s-9.73-4.26-9.73-9.73,4.26-9.73,9.73-9.73,9.73,4.26,9.73,9.73Zm14.9,218.67c1.52,20.98,6.69,29.5,17.64,29.5,5.78,0,9.73-2.74,14.29-9.73l6.69,2.74c-6.99,13.08-13.38,17.64-25.24,17.64-18.25,0-28.59-13.69-28.59-37.1,0-25.24,10.64-40.15,28.28-40.15,12.17,0,20.07,6.39,23.72,18.25,1.22,3.95,1.52,8.82,2.13,18.86h-38.93Zm23.11-6.99c-.31-15.81-3.35-22.81-10.34-22.81s-10.95,6.69-12.77,22.81h23.11Z"/>
  <path class="cls-1" fill="#00e47c" d="m777.38,119.22v-6.08l7.91-1.52v-44.4c0-8.52-2.74-12.47-8.51-12.47-4.56,0-8.52,1.82-14.29,6.69v49.57l7.91,1.82v6.39h-31.32v-6.08l8.82-1.82v-55.35l-8.82-1.22v-6.08l18.86-4.87h4.26v9.12c9.12-6.99,13.38-8.82,20.07-8.82,11.56,0,17.94,7.3,17.94,19.77v47.14l7.91,1.82v6.39h-30.72Zm9.43,155.41v-6.08l8.21-1.82v-55.05l-8.21-1.82v-4.87l19.16-4.87h3.65v66.3l8.52,1.82v6.39h-31.32Zm24.33-102.19c0,5.47-4.56,10.04-10.04,10.04s-9.73-4.26-9.73-9.73,4.56-10.04,10.34-10.04c5.17,0,9.43,4.56,9.43,9.73Zm55.35-118.31c4.26,5.47,5.47,9.12,5.47,14.9,0,13.99-10.95,24.33-25.55,24.33-3.04,0-5.47-.3-8.21-1.22-3.65,2.43-5.78,4.87-5.78,6.39,0,2.13,1.82,3.04,6.39,3.35l18.25.91c14.29.61,20.99,6.08,20.99,17.33,0,16.12-14.29,26.46-36.19,26.46-16.42,0-27.07-6.08-27.07-15.51,0-6.08,3.34-10.34,11.86-15.82-6.08-2.43-8.52-5.47-8.52-9.73,0-5.17,3.95-10.04,13.69-16.12-9.12-5.78-12.47-11.56-12.47-20.98,0-14.29,10.95-25.24,25.24-25.24,3.04,0,4.26.3,9.73,1.52,3.04.91,5.17,1.22,6.69,1.22.31,0,1.52,0,2.74-.3h2.74l12.47-.3v8.82h-12.47Zm39.23,220.49v-6.08l8.21-1.82v-42.27c0-10.04-2.74-13.99-9.12-13.99-4.87,0-8.21,1.82-14.29,7.3v48.66l7.6,1.82v6.39h-30.72v-6.08l8.51-1.82v-42.58c0-9.43-3.04-13.69-9.73-13.69-4.86,0-8.51,1.82-13.69,6.99v48.96l7,1.82v6.39h-31.02v-6.08l8.82-1.82v-55.96l-8.82-1.52v-5.17l19.16-4.87h3.96v10.04c7.6-6.39,13.38-8.82,20.68-8.82s12.77,3.04,17.03,9.73c7.91-7.3,13.08-10.04,20.99-10.04,13.08,0,18.55,6.39,18.55,21.59v44.71l8.52,1.82v6.39h-31.63Zm-76.34-146.89c0,6.69,6.08,10.64,16.12,10.64,12.47,0,21.9-5.47,21.9-12.47s-2.43-7.6-32.54-9.43c-3.95,3.65-5.47,6.69-5.47,11.25Zm6.08-59.91c0,12.77,3.04,18.55,10.34,18.55s10.34-5.78,10.34-17.03c0-13.38-3.65-19.77-10.95-19.77-6.69,0-9.73,5.78-9.73,18.25Zm67.21,13.08c1.52,20.68,6.69,29.2,17.64,29.2,5.47,0,9.43-2.74,13.99-9.73l6.69,2.74c-7.6,13.69-13.08,17.64-24.94,17.64-18.25,0-28.59-13.08-28.59-36.8,0-25.24,10.64-40.45,28.28-40.45s25.24,12.16,25.55,37.41h-38.62Zm23.11-7.3c-.61-16.42-3.65-22.81-10.64-22.81s-10.64,6.99-12.47,22.81h23.11Zm50.79-15.51c6.08-10.34,9.12-13.08,14.6-13.08s8.82,3.35,8.82,8.82c0,3.35-1.82,6.08-5.78,9.12l-7.91-4.26c-5.17,2.74-9.43,8.52-9.43,12.77v39.84l10.64,1.52v6.39h-33.76v-6.08l8.82-1.82v-55.96l-8.82-1.52v-4.87l18.25-4.87h4.56v13.99Z"/>
</svg>`;
  navBrand.appendChild(brandLink);

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections
      .querySelectorAll(':scope .default-content-wrapper > ul > li')
      .forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        setupSubmenu(navSection);
        navSection.addEventListener('click', (event) => {
          if (event.target.tagName === 'A') return;
          if (!isDesktop.matches) {
            navSection.classList.toggle('active');
          }
        });
        navSection.addEventListener('mouseenter', () => {
          toggleAllNavSections(navSections);
          if (isDesktop.matches) {
            if (!navSection.classList.contains('nav-drop')) {
              overlay.classList.remove('show');
              return;
            }
            navSection.setAttribute('aria-expanded', 'true');
            overlay.classList.add('show');
          }
        });
      });
  }

  const navTools = nav.querySelector('.nav-tools');

  /** Wishlist */
  const wishlist = document.createRange().createContextualFragment(`
     <div class="wishlist-wrapper nav-tools-wrapper">
       <button type="button" class="nav-wishlist-button" aria-label="Wishlist"></button>
       <div class="wishlist-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(wishlist);

  const wishlistButton = navTools.querySelector('.nav-wishlist-button');

  const wishlistMeta = getMetadata('wishlist');
  const wishlistPath = wishlistMeta ? new URL(wishlistMeta, window.location).pathname : '/wishlist';

  wishlistButton.addEventListener('click', () => {
    window.location.href = rootLink(wishlistPath);
  });

  /** Mini Cart */
  const excludeMiniCartFromPaths = ['/checkout'];

  const minicart = document.createRange().createContextualFragment(`
     <div class="minicart-wrapper nav-tools-wrapper">
       <button type="button" class="nav-cart-button" aria-label="Cart"></button>
       <div class="minicart-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(minicart);

  const minicartPanel = navTools.querySelector('.minicart-panel');

  const cartButton = navTools.querySelector('.nav-cart-button');

  if (excludeMiniCartFromPaths.includes(window.location.pathname)) {
    cartButton.style.display = 'none';
  }

  /**
   * Handles loading states for navigation panels with state management
   *
   * @param {HTMLElement} panel - The panel element to manage loading state for
   * @param {HTMLElement} button - The button that triggers the panel
   * @param {Function} loader - Async function to execute during loading
   */
  async function withLoadingState(panel, button, loader) {
    if (panel.dataset.loaded === 'true' || panel.dataset.loading === 'true') return;

    button.setAttribute('aria-busy', 'true');
    panel.dataset.loading = 'true';

    try {
      await loader();
      panel.dataset.loaded = 'true';
    } finally {
      panel.dataset.loading = 'false';
      button.removeAttribute('aria-busy');

      // Execute pending toggle if exists
      if (panel.dataset.pendingToggle === 'true') {
        // eslint-disable-next-line no-nested-ternary
        const pendingState = panel.dataset.pendingState === 'true' ? true : (panel.dataset.pendingState === 'false' ? false : undefined);

        // Clear pending flags
        panel.removeAttribute('data-pending-toggle');
        panel.removeAttribute('data-pending-state');

        // Execute the pending toggle
        const show = pendingState ?? !panel.classList.contains('nav-tools-panel--show');
        panel.classList.toggle('nav-tools-panel--show', show);
      }
    }
  }

  function togglePanel(panel, state) {
    // If loading is in progress, queue the toggle action
    if (panel.dataset.loading === 'true') {
      // Store the pending toggle action
      panel.dataset.pendingToggle = 'true';
      panel.dataset.pendingState = state !== undefined ? state.toString() : '';
      return;
    }

    const show = state ?? !panel.classList.contains('nav-tools-panel--show');
    panel.classList.toggle('nav-tools-panel--show', show);
  }

  // Lazy loading for mini cart fragment
  async function loadMiniCartFragment() {
    await withLoadingState(minicartPanel, cartButton, async () => {
      const miniCartMeta = getMetadata('mini-cart');
      const miniCartPath = miniCartMeta ? new URL(miniCartMeta, window.location).pathname : '/mini-cart';
      const miniCartFragment = await loadFragment(miniCartPath);
      minicartPanel.append(miniCartFragment.firstElementChild);
    });
  }

  async function toggleMiniCart(state) {
    if (state) {
      await loadMiniCartFragment();
      const { publishShoppingCartViewEvent } = await import('@dropins/storefront-cart/api.js');
      publishShoppingCartViewEvent();
    }

    togglePanel(minicartPanel, state);
  }

  cartButton.addEventListener('click', () => toggleMiniCart(!minicartPanel.classList.contains('nav-tools-panel--show')));

  // Cart Item Counter
  events.on('cart/data', (data) => {
    // preload mini cart fragment if user has a cart
    if (data) loadMiniCartFragment();

    if (data?.totalQuantity) {
      cartButton.setAttribute('data-count', data.totalQuantity);
    } else {
      cartButton.removeAttribute('data-count');
    }
  }, { eager: true });

  /** Search */
  const search = document.createRange().createContextualFragment(`
  <div class="search-wrapper nav-tools-wrapper">
    <button type="button" class="nav-search-button">Search</button>
    <div class="nav-search-input nav-search-panel nav-tools-panel">
      <div id="search-bar-input"></div>
      <div class="search-bar-result"></div>
    </div>
  </div>
  `);

  navTools.append(search);

  const searchPanel = navTools.querySelector('.nav-search-panel');
  const searchButton = navTools.querySelector('.nav-search-button');
  const searchInput = searchPanel.querySelector('#search-bar-input');
  const searchResult = searchPanel.querySelector('.search-bar-result');

  async function toggleSearch(state) {
    if (state) {
      await withLoadingState(searchPanel, searchButton, async () => {
        await import('../../scripts/initializers/search.js');

        // Load search components in parallel
        const [
          { render },
          { SearchBarInput },
          { SearchBarResults },
        ] = await Promise.all([
          import('@dropins/storefront-product-discovery/render.js'),
          import('@dropins/storefront-product-discovery/containers/SearchBarInput.js'),
          import('@dropins/storefront-product-discovery/containers/SearchBarResults.js'),
        ]);

        await Promise.all([
        // Render the SearchBarInput component
          render.render(SearchBarInput, {
            routeSearch: (searchQuery) => {
              const url = `${rootLink('/search')}?q=${encodeURIComponent(
                searchQuery,
              )}`;
              window.location.href = url;
            },
            slots: {
              SearchIcon: (ctx) => {
              // replace the search icon in the dropin input since theres already one in the header
                const searchIcon = document.createElement('span');
                searchIcon.className = 'search-icon';
                searchIcon.innerHTML = '';
                ctx.replaceWith(searchIcon);
              },
            },
          })(searchInput),
          // Render the SearchBarResult component
          render.render(SearchBarResults, {
            productRouteSearch: ({ urlKey, sku }) => rootLink(`/products/${urlKey}/${sku}`),
            routeSearch: (searchQuery) => {
              const url = `${rootLink('/search')}?q=${encodeURIComponent(
                searchQuery,
              )}`;
              window.location.href = url;
            },
          })(searchResult),
        ]);
      });
    }

    togglePanel(searchPanel, state);
    if (state) searchInput?.querySelector('#search-bar-input-form')?.focus();
  }

  searchButton.addEventListener('click', () => toggleSearch(!searchPanel.classList.contains('nav-tools-panel--show')));

  navTools.querySelector('.nav-search-button').addEventListener('click', () => {
    if (isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
  });

  // Close panels when clicking outside
  document.addEventListener('click', (e) => {
    if (!minicartPanel.contains(e.target) && !cartButton.contains(e.target)) {
      toggleMiniCart(false);
    }

    if (!searchPanel.contains(e.target) && !searchButton.contains(e.target)) {
      toggleSearch(false);
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  navWrapper.addEventListener('mouseout', (e) => {
    if (isDesktop.matches && !nav.contains(e.relatedTarget)) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
  });

  window.addEventListener('resize', () => {
    navWrapper.classList.remove('active');
    overlay.classList.remove('show');
    toggleMenu(nav, navSections, false);
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => {
    navWrapper.classList.toggle('active');
    overlay.classList.toggle('show');
    toggleMenu(nav, navSections);
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  renderAuthCombine(
    navSections,
    () => !isDesktop.matches && toggleMenu(nav, navSections, false),
  );
  renderAuthDropdown(navTools);
}
