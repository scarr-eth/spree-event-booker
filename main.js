/* --------------------------
   Data & Helpers
   -------------------------- */
const EVENTS = [
    { id: 'EVT001', title: 'Web3 Conference 2025', category: 'Conference', date: '2025-01-29T10:00:00Z', location: 'Grand Chapiteau', capacity: 120, booked: 12, price: 20, image: 'https://images.unsplash.com/photo-1575029645663-d8faa1ac2880?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=869' },
    { id: 'EVT002', title: 'Web design conference 2023', category: 'Conference', date: '2025-02-15T16:00:00Z', location: 'Grand Chapiteau', capacity: 80, booked: 40, price: 50, image: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=871' },
    { id: 'EVT003', title: 'Digital Economy Conference 2023', category: 'Conference', date: '2025-03-09T09:00:00Z', location: 'Convention Center', capacity: 200, booked: 160, price: 65, image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=870' },
    { id: 'EVT004', title: 'Fashion Pop-up', category: 'Fashion', date: '2025-04-02T11:00:00Z', location: 'Market Hall', capacity: 80, booked: 22, price: 10, image: 'https://images.unsplash.com/photo-1543728069-a3f97c5a2f32?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=869' },
    { id: 'EVT005', title: 'Indie Music Night', category: 'Music', date: '2025-04-25T19:00:00Z', location: 'Blue Stage', capacity: 150, booked: 72, price: 25, image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=60' },
    { id: 'EVT006', title: 'Art & Lifestyle Fair', category: 'Art', date: '2025-05-10T09:00:00Z', location: 'East Wing', capacity: 60, booked: 6, price: 0, image: 'https://images.unsplash.com/photo-1603228254119-e6a4d095dc59?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=871' }
];

// storage helpers
const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch (e) { return null } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// mock auth/session
const getUser = () => sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;
const setUser = u => { sessionStorage.setItem('user', JSON.stringify(u)); renderAuth(); };
const logout = () => { sessionStorage.removeItem('user'); renderAuth(); };

// bookings (per-user)
const getBookings = () => read('bookings') || {};
const saveBooking = (user, eventId) => {
    const b = getBookings();
    b[user] = b[user] || [];
    if (!b[user].includes(eventId)) b[user].push(eventId);
    write('bookings', b);
}
const userHasBooked = (user, eid) => (getBookings()[user] || []).includes(eid);

/* --------------------------
   DOM References
   -------------------------- */
const eventsGrid = document.getElementById('eventsGrid');
const catSelect = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const categoriesGrid = document.getElementById('categoriesGrid');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
const confirmBtn = document.getElementById('confirmBtn');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const joinBtn = document.getElementById('joinBtn');
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

let filteredEvents = [...EVENTS];
let activeEvent = null;

/* --------------------------
   INIT
   -------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    populateCategories();
    renderEvents(filteredEvents);
    renderAuth();
    attachUI();
});

function populateCategories() {
    const cats = [...new Set(EVENTS.map(e => e.category))];
    catSelect.innerHTML = '<option value="all">All categories</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
    categoriesGrid.innerHTML = cats.map(c => `
        <div class="category" tabindex="0" role="button" aria-label="${c} category">
          
          <div class="label">${c}</div>
        </div>
      `).join('');
    // quick click -> filter
    categoriesGrid.querySelectorAll('.category').forEach(el => {
        el.addEventListener('click', () => {
            const label = el.querySelector('.label').textContent;
            catSelect.value = label;
            applyFilter();
            window.scrollTo({ top: document.getElementById('events').offsetTop - 30, behavior: 'smooth' });
        });
    });
}

/* --------------------------
   Render Events
   -------------------------- */
function renderEvents(list) {
    if (!list.length) { eventsGrid.innerHTML = '<div class="small-muted">No events found.</div>'; return; }
    eventsGrid.innerHTML = list.map(ev => `
        <article class="event-card" data-id="${ev.id}" tabindex="0" role="article">
          <img src="${ev.image}" alt="${ev.title}">
          <div class="event-meta">
            <div style="flex:1">
              <div class="event-title">${ev.title}</div>
              <div class="event-sub">${new Date(ev.date).toLocaleDateString()} • ${ev.location}</div>
            </div>
            <div style="text-align:right">
              <div class="small-muted">${ev.price ? '$' + ev.price : 'Free'}</div>
              <div class="small-muted">Seats: ${Math.max(0, ev.capacity - (ev.booked || 0))}</div>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn ghost" data-action="details">Preview</button>
            <button class="btn" data-action="book">Get Tickets</button>
          </div>
        </article>
      `).join('');

    // attach per-card listeners
    eventsGrid.querySelectorAll('.event-card').forEach(card => {
        const id = card.dataset.id;
        const ev = EVENTS.find(e => e.id === id);
        const detailsBtn = card.querySelector('[data-action="details"]');
        const bookBtn = card.querySelector('[data-action="book"]');

        detailsBtn.addEventListener('click', () => openModal(id));
        bookBtn.addEventListener('click', () => openModal(id, true));

        // disable state
        if ((ev.capacity - (ev.booked || 0)) <= 0) {
            bookBtn.disabled = true; bookBtn.textContent = 'Full';
        } else {
            const u = getUser();
            if (u && userHasBooked(u.name, id)) { bookBtn.disabled = true; bookBtn.textContent = 'Booked'; }
        }
    });
}

/* --------------------------
   Filters & Search
   -------------------------- */
searchInput.addEventListener('input', applyFilter);
catSelect.addEventListener('change', applyFilter);

function applyFilter() {
    const q = (searchInput.value || '').toLowerCase();
    const cat = catSelect.value;
    filteredEvents = EVENTS.filter(ev => {
        const matchQ = !q || (ev.title + ' ' + (ev.description || '') + ' ' + ev.location).toLowerCase().includes(q);
        const matchC = cat === 'all' || ev.category === cat;
        return matchQ && matchC;
    });
    renderEvents(filteredEvents);
}

/* --------------------------
   Modal & Booking
   -------------------------- */
function openModal(id, focusBook = false) {
    const ev = EVENTS.find(e => e.id === id);
    activeEvent = ev;
    modalContent.innerHTML = `
        <h3 id="modalTitle" style="margin:0 0 8px">${ev.title}</h3>
        <img src="${ev.image}" alt="${ev.title}" style="width:100%;height:220px;object-fit:cover;border-radius:8px;margin-bottom:10px"/>
        <p class="small-muted">${new Date(ev.date).toLocaleString()} • ${ev.location}</p>
        <p class="small-muted" style="margin-top:8px">${ev.description || 'No description available.'}</p>
        <p style="margin-top:8px"><strong>Available seats:</strong> ${Math.max(0, ev.capacity - (ev.booked || 0))}</p>
        <p class="small-muted">Price: ${ev.price ? '$' + ev.price : 'Free'}</p>
      `;
    modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false');
    if (focusBook) confirmBtn.focus();
}

function closeModal() {
    modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); activeEvent = null;
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

confirmBtn.addEventListener('click', () => {
    const u = getUser();
    if (!u) { promptLogin(); return; }
    if (!activeEvent) return showToast('No event selected', 'error');
    if ((activeEvent.capacity - (activeEvent.booked || 0)) <= 0) return showToast('Event is full', 'error');
    if (userHasBooked(u.name, activeEvent.id)) return showToast('You already booked this event', 'info');

    // persist booking
    saveBooking(u.name, activeEvent.id);
    activeEvent.booked = (activeEvent.booked || 0) + 1;
    showToast('Booking successful', 'success');
    closeModal();
    renderEvents(filteredEvents);
});

/* --------------------------
   Auth (mock)
   -------------------------- */
loginBtn.addEventListener('click', () => {
    if (getUser()) { logout(); showToast('Logged out', 'info'); return; }
    promptLogin();
});
signupBtn.addEventListener('click', promptLogin);
joinBtn && joinBtn.addEventListener('click', promptLogin);

function promptLogin() {
    const name = prompt('Enter your name to sign in (mock):');
    if (!name) { showToast('Login cancelled', 'info'); return; }
    setUser({ name, role: 'user' });
    showToast('Welcome ' + name, 'success');
}

function renderAuth() {
    const u = getUser();
    if (u) {
        loginBtn.textContent = 'Log out';
        signupBtn.textContent = u.name;
        signupBtn.disabled = false;
    } else {
        loginBtn.textContent = 'Log In';
        signupBtn.textContent = 'Sign Up';
    }
}

/* --------------------------
   Mobile nav
   -------------------------- */
hamburger.addEventListener('click', () => {
    const open = mobileNav.style.display === 'block';
    mobileNav.style.display = open ? 'none' : 'block';
    hamburger.setAttribute('aria-expanded', String(!open));
});

/* --------------------------
   Toast
   -------------------------- */
function showToast(message, type = 'info') {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    t.style.background = type === 'error' ? '#ff5666' : type === 'success' ? '#1fb57a' : '#11121a';
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-8px)'; setTimeout(() => t.remove(), 350); }, 3200);
}

/* --------------------------
   quick scroll to events
   -------------------------- */
document.getElementById('viewEventsBtn').addEventListener('click', () => {
    document.getElementById('events').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* --------------------------
   Contact Form Submission
   -------------------------- */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const message = contactForm.message.value.trim();

    if (!name || !email || !message) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    // Simulate sending (you can connect to Formspree or EmailJS here)
    showToast('Sending message...', 'info');
    setTimeout(() => {
      showToast('Message sent successfully! I’ll get back to you soon.', 'success');
      contactForm.reset();
    }, 1200);
  });
}

/* --------------------------
   Contact Form Submission
   -------------------------- */
// Contact form handler (safe, non-blocking)
document.addEventListener('DOMContentLoaded', () => {
  try {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return; // nothing to do if form not present

    // safe toast function: prefer existing showToast, otherwise fallback
    const toast = (typeof window.showToast === 'function')
      ? window.showToast
      : function(message = '', type = 'info') {
          // simple fallback toast so nothing breaks
          const t = document.createElement('div');
          t.textContent = message;
          Object.assign(t.style, {
            position: 'fixed',
            right: '18px',
            top: '18px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: type === 'error' ? '#ff5666' : type === 'success' ? '#1fb57a' : '#11121a',
            color: '#fff',
            zIndex: 99999,
            opacity: 0,
            transition: 'all .28s'
          });
          document.body.appendChild(t);
          requestAnimationFrame(()=>{ t.style.opacity = 1; t.style.transform = 'translateY(0)'; });
          setTimeout(()=>{ t.style.opacity = 0; setTimeout(()=> t.remove(), 300); }, 3200);
        };

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const name = (contactForm.name?.value || '').trim();
        const email = (contactForm.email?.value || '').trim();
        const message = (contactForm.message?.value || '').trim();

        if (!name || !email || !message) {
          toast('Please fill in all fields.', 'error');
          return;
        }

        // simulate sending
        toast('Sending message...', 'info');
        setTimeout(() => {
          toast('Message sent successfully! I’ll get back to you soon.', 'success');
          contactForm.reset();
        }, 1200);

      } catch (innerErr) {
        // catch internal errors so they don't bubble up and break other scripts
        console.error('Contact form submit error:', innerErr);
        toast('Unable to send message. Try again later.', 'error');
      }
    });

  } catch (err) {
    // top-level protection: log, but don't throw
    console.error('Contact form init failed:', err);
  }
});
