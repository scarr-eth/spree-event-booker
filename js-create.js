// Utilities
const el = id => document.getElementById(id);
const showToast = (msg, type = 'info') => {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    t.style.background = type === 'error' ? '#ff5666' : type === 'success' ? '#1fb57a' : '#11121a';
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = 1; t.style.transform = 'translateY(0)'; });
    setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 3200);
};

// Image upload preview
const imageUpload = el('imageUpload');
const imagePreview = el('imagePreview');
const imagePlaceholder = el('imagePlaceholder');
const imagePreviewWrap = el('imagePreviewWrap');
const removeImageBtn = el('removeImage');

imageUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Select an image file', 'error'); return; }
    const url = URL.createObjectURL(file);
    imagePreview.src = url;
    imagePreview.classList.remove('hidden');
    imagePlaceholder.style.display = 'none';
});

removeImageBtn.addEventListener('click', () => {
    imageUpload.value = '';
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    imagePlaceholder.style.display = 'block';
});

// Ticket toggle
const ticketToggle = el('ticketToggle');
const priceRow = el('priceRow');
let ticketPaid = false;
ticketToggle.addEventListener('click', () => {
    ticketPaid = !ticketPaid;
    ticketToggle.classList.toggle('on', ticketPaid);
    ticketToggle.setAttribute('aria-checked', ticketPaid);
    priceRow.style.display = ticketPaid ? 'block' : 'none';
});

// Approval toggle
const approvalToggle = el('approvalToggle');
let requireApproval = false;
approvalToggle.addEventListener('click', () => {
    requireApproval = !requireApproval;
    approvalToggle.classList.toggle('on', requireApproval);
    approvalToggle.setAttribute('aria-checked', requireApproval);
});

// Unlimited capacity
const unlimitedCB = el('unlimited');
unlimitedCB.addEventListener('change', () => {
    el('capacity').disabled = unlimitedCB.checked;
    if (unlimitedCB.checked) el('capacity').value = '';
});

// Set timezone label
try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    el('tzLabel').textContent = `${Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'}`;
} catch (e) { /* ignore */ }

// Create event handler
el('createEvent').addEventListener('click', () => {
    const title = el('title').value.trim();
    const description = el('description').value.trim();
    const location = el('location').value.trim();
    const start = el('start').value;
    const end = el('end').value;
    const theme = el('themeSelect').value;
    const price = el('price').value;
    const capacity = unlimitedCB.checked ? null : (el('capacity').value ? parseInt(el('capacity').value, 10) : null);
    const ticketType = ticketPaid ? 'paid' : 'free';
    const approval = requireApproval;

    if (!title) return showToast('Please enter an event name', 'error');
    if (!start || !end) return showToast('Please select start and end time', 'error');
    if (new Date(start) >= new Date(end)) return showToast('End must be after start', 'error');
    if (ticketPaid && (!price || parseFloat(price) <= 0)) return showToast('Enter valid ticket price', 'error');

    // image data (store object URL or empty). For real persistence convert to base64 if needed.
    const imgSrc = imagePreview.src || '';

    // build event object
    const ev = {
        id: 'EVT' + Date.now(),
        title, description, location, start, end, theme,
        ticketType, price: ticketPaid ? parseFloat(price) : 0,
        capacity, approval, image: imgSrc,
        createdAt: new Date().toISOString()
    };

    // persist to localStorage
    try {
        const stored = JSON.parse(localStorage.getItem('events') || '[]');
        stored.unshift(ev);
        localStorage.setItem('events', JSON.stringify(stored));
        showToast('Event created successfully', 'success');
        // optional: redirect to index or open event view
        setTimeout(() => { window.location.href = 'index.html'; }, 900);
    } catch (err) {
        console.error(err);
        showToast('Failed to save event', 'error');
    }
});