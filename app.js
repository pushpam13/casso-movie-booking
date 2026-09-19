const MOVIES = [
    {
        id: 1,
        name: 'Avengers Endgame Encore',
        genre: 'Action',
        rating: 8.4,
        poster: 'images/avengers.jpg',
        kicker: 'AVENGERS'
    },
    {
        id: 2,
        name: 'Paradise',
        genre: 'Action',
        rating: 8.7,
        poster: 'images/paradise.jpg',
        kicker: 'PARADISE'
    },
    {
        id: 3,
        name: 'Hanuman Ansh',
        genre: 'Mythology & family',
        rating: 8.8,
        poster: 'images/hanuman.jpg',
        kicker: 'HANUMAN'
    },
    {
        id: 4,
        name: 'Mirzapur The Movie',
        genre: 'Drama',
        rating: 8.3,
        poster: 'images/mirzapur.jpg',
        kicker: 'MIRZAPUR'
    }
];
const THEATRES = ['PVR Cinemas', 'INOX', 'Cinepolis'];
const SHOWS = ['10:00 AM', '1:30 PM', '5:00 PM', '8:30 PM'];
const DATES = ['19/09/2026', '20/09/2026', '21/09/2026', '22/09/2026'];
const PRICE = 250;

let currentUser = load('cassoUser', null);
let booking = load('cassoBooking', null);
let registeredUser = load('cassoRegisteredUser', null);
let nextBookingId = Number(localStorage.getItem('cassoNextBookingId') || 1001);
let selectedFilter = 'all';
let bookingDraft = null;
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function showSection(id) {
  $$('.page-section').forEach(s => s.classList.remove('active-section'));
  $('#' + id)?.classList.add('active-section');
  $$('.nav-link').forEach(n => n.classList.toggle('active', n.dataset.section === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'bookings') renderBookings();
}

document.querySelectorAll('.nav-link').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));

document.addEventListener('click', (e) => {
  const filter = e.target.closest('.filter');
  if (!filter) return;
  selectedFilter = filter.dataset.filter;
  $$('.filter').forEach(x => x.classList.toggle('active', x === filter));
  renderMovies();
});

function renderMovieCard(movie) {
  return `
    <article class="movie-card">
      <div class="poster">
    <img src="${movie.poster}" alt="${movie.name}">
    
    <div class="poster-overlay"></div>

    <div class="poster-inner">
        <span class="movie-number">0${movie.id}</span>
        <span class="title">${movie.name}</span>
        <span class="meta">${movie.kicker} • ${movie.genre}</span>
    </div>
</div>
      <div class="movie-info">
        <div class="movie-line">
          <div><h3>${movie.name}</h3><p>${movie.genre}</p></div>
          <span class="rating">★ ${movie.rating}</span>
        </div>
        <div class="movie-actions">
          <button class="btn btn-primary" onclick="startQuickBook(${movie.id - 1})">Book ticket</button>
          <button class="btn btn-ghost" onclick="showMovieDetails(${movie.id - 1})">Details</button>
        </div>
      </div>
    </article>`;
}

function renderMovies() {
  const filtered = selectedFilter === 'all' ? MOVIES : MOVIES.filter(m => m.genre === selectedFilter);
  $('#movieGrid').innerHTML = filtered.map(renderMovieCard).join('');
  $('#homeMovies').innerHTML = MOVIES.slice(0, 4).map(renderMovieCard).join('');
}

function showMovieDetails(index) {
  const m = MOVIES[index];
  toast(`${m.name} • ${m.genre} • ★ ${m.rating}`);
}

function openAuth() {
  $('#authModal').classList.remove('hidden');
  setAuthMode(currentUser ? 'login' : 'login');
}
function closeModal(id) { $('#' + id)?.classList.add('hidden'); }
function setAuthMode(mode) {
  $('#loginTab').classList.toggle('active', mode === 'login');
  $('#registerTab').classList.toggle('active', mode === 'register');
  $('#authFormWrap').innerHTML = mode === 'login' ? loginForm() : registerForm();
}
function loginForm() {
  return `<form class="form" onsubmit="handleLogin(event)">
    <div><span class="eyebrow">WELCOME BACK</span><h2 style="margin:6px 0 4px;font-family:'Space Grotesk';">Sign in to CASSO</h2><p class="muted" style="font-size:13px;margin:0;">Use your registered credentials to continue.</p></div>
    <div class="field"><label>USERNAME</label><input id="loginUsername" required autocomplete="username" /></div>
    <div class="field"><label>PASSWORD</label><input id="loginPassword" type="password" required autocomplete="current-password" /></div>
    <button class="btn btn-primary" type="submit">Sign in</button>
    ${registeredUser ? '' : '<small class="muted">No account yet? Open the Register tab.</small>'}
  </form>`;
}
function registerForm() {
  return `<form class="form" onsubmit="handleRegister(event)">
    <div><span class="eyebrow">CREATE ACCOUNT</span><h2 style="margin:6px 0 4px;font-family:'Space Grotesk';">Join CASSO</h2><p class="muted" style="font-size:13px;margin:0;">Create a simple local demo account.</p></div>
    <div class="field"><label>NAME</label><input id="registerName" required /></div>
    <div class="field"><label>USERNAME</label><input id="registerUsername" required /></div>
    <div class="field"><label>PASSWORD</label><input id="registerPassword" type="password" minlength="4" required /></div>
    <button class="btn btn-primary" type="submit">Create account</button>
  </form>`;
}
function handleRegister(e) {
  e.preventDefault();
  registeredUser = { name: $('#registerName').value.trim(), username: $('#registerUsername').value.trim(), password: $('#registerPassword').value };
  save('cassoRegisteredUser', registeredUser);
  currentUser = { name: registeredUser.name, username: registeredUser.username };
  save('cassoUser', currentUser);
  closeModal('authModal');
  updateHeader();
  toast('Account created. You are signed in.');
}
function handleLogin(e) {
  e.preventDefault();
  const username = $('#loginUsername').value.trim();
  const password = $('#loginPassword').value;
  if (!registeredUser || username !== registeredUser.username || password !== registeredUser.password) {
    toast('Wrong username or password.');
    return;
  }
  currentUser = { name: registeredUser.name, username: registeredUser.username };
  save('cassoUser', currentUser);
  closeModal('authModal');
  updateHeader();
  toast('Login successful.');
}
function signOut() {
  currentUser = null;
  localStorage.removeItem('cassoUser');
  updateHeader();
  toast('Logged out.');
}
function updateHeader() {
  const chip = $('#userChip');
  const btn = $('#authBtn');
  if (currentUser) {
    chip.textContent = `Hi, ${currentUser.name}`;
    chip.classList.remove('hidden');
    btn.textContent = 'Logout';
    btn.onclick = signOut;
  } else {
    chip.classList.add('hidden');
    btn.textContent = 'Sign in';
    btn.onclick = openAuth;
  }
}

function requireAuth(next) {
  if (!currentUser) {
    openAuth();
    toast('Sign in first to book a ticket.');
    return false;
  }
  return next();
}

function startQuickBook(movieIndex) {
  requireAuth(() => {
    bookingDraft = {
      movieIndex,
      dateIndex: 0,
      theatreIndex: 0,
      showIndex: 0,
      seats: [],
      passengers: [],
      promo: ''
    };
    $('#bookingModal').classList.remove('hidden');
    renderBookingStep(1);
  });
}

function renderBookingStep(step) {
  const m = MOVIES[bookingDraft.movieIndex];
  const summary = `<div class="booking-summary">
      <strong>${m.name}</strong><div class="booking-summary-grid">
      <div class="summary-cell"><span>Date</span><strong>${DATES[bookingDraft.dateIndex]}</strong></div>
      <div class="summary-cell"><span>Theatre</span><strong>${THEATRES[bookingDraft.theatreIndex]}</strong></div>
      <div class="summary-cell"><span>Show</span><strong>${SHOWS[bookingDraft.showIndex]}</strong></div></div></div>`;

  if (step === 1) {
    $('#bookingStepContent').innerHTML = `<div class="booking-header"><div><span class="eyebrow">STEP 01 / 03</span><h2>Choose your show</h2><p class="muted">Select when and where you want to watch.</p></div><div class="step-indicator"><span class="active">Show</span><span>Seats</span><span>Passengers</span></div></div>
      <div class="form">
        <div class="field"><label>SHOW DATE</label><select id="bookDate">${DATES.map((d,i)=>`<option value="${i}" ${i===bookingDraft.dateIndex?'selected':''}>${d}</option>`).join('')}</select></div>
        <div class="field"><label>THEATRE</label><select id="bookTheatre">${THEATRES.map((d,i)=>`<option value="${i}" ${i===bookingDraft.theatreIndex?'selected':''}>${d}</option>`).join('')}</select></div>
        <div class="field"><label>SHOW TIME</label><select id="bookShow">${SHOWS.map((d,i)=>`<option value="${i}" ${i===bookingDraft.showIndex?'selected':''}>${d}</option>`).join('')}</select></div>
      </div>
      <div class="booking-footer"><button class="btn btn-ghost" onclick="closeModal('bookingModal')">Cancel</button><button class="btn btn-primary" onclick="saveShowAndContinue()">Continue to seats →</button></div>`;
  }

  if (step === 2) {
    const bookedSeats = booking?.active ? (booking.seatKeys || []) : [];
    const prefix = seatPrefix();
    const taken = new Set(bookedSeats.filter(k => k.startsWith(prefix)).map(k => Number(k.split(':').pop())));
    const picked = new Set(bookingDraft.seats);
    $('#bookingStepContent').innerHTML = `<div class="booking-header"><div><span class="eyebrow">STEP 02 / 03</span><h2>Pick your seats</h2><p class="muted">${DATES[bookingDraft.dateIndex]} • ${THEATRES[bookingDraft.theatreIndex]} • ${SHOWS[bookingDraft.showIndex]}</p></div><div class="step-indicator"><span>Show</span><span class="active">Seats</span><span>Passengers</span></div></div>
      ${summary}
      <div class="seat-legend"><span class="legend-item"><i class="legend-dot legend-available"></i> Available</span><span class="legend-item"><i class="legend-dot legend-selected"></i> Selected</span><span class="legend-item"><i class="legend-dot legend-booked"></i> Booked</span></div>
      <div class="screen">SCREEN</div>
      <div class="seat-grid">${Array.from({length:20},(_,i)=>{
        const n=i+1, booked=taken.has(n), selected=picked.has(n); 
        return `<button class="seat ${booked?'booked':''} ${selected?'selected':''}" ${booked?'disabled':''} onclick="toggleSeat(${n})">${n}</button>`;
      }).join('')}</div>
      <div class="selection-bar"><span>Selected seats</span><strong>${bookingDraft.seats.length ? bookingDraft.seats.join(', ') : 'None'}</strong></div>
      <div class="booking-footer"><button class="btn btn-ghost" onclick="renderBookingStep(1)">← Back</button><button class="btn btn-primary" onclick="continueFromSeats()" ${bookingDraft.seats.length ? '' : 'disabled'}>Continue →</button></div>`;
  }

  if (step === 3) {
    $('#bookingStepContent').innerHTML = `<div class="booking-header"><div><span class="eyebrow">STEP 03 / 03</span><h2>Passenger details</h2><p class="muted">One passenger per selected seat.</p></div><div class="step-indicator"><span>Show</span><span>Seats</span><span class="active">Passengers</span></div></div>
      ${summary}
      <div class="passenger-grid">${bookingDraft.seats.map((seat,i)=>`<div class="passenger-card"><div class="seat-label">Seat ${seat}</div><div class="field"><label>PASSENGER NAME</label><input id="passengerName${i}" placeholder="Full name" value="${bookingDraft.passengers[i]?.name || currentUser.name || ''}" /></div><div class="field age-field"><label>AGE</label><input id="passengerAge${i}" type="number" min="1" max="120" placeholder="Age" value="${bookingDraft.passengers[i]?.age || ''}" /></div></div>`).join('')}</div>
      <div class="booking-footer"><button class="btn btn-ghost" onclick="renderBookingStep(2)">← Back</button><button class="btn btn-primary" onclick="continueToBill()">Review bill →</button></div>`;
  }

  if (step === 4) {
    const subtotal = bookingDraft.seats.length * PRICE;
    const discount = bookingDraft.promo === 'MOVIE10' ? subtotal * .10 : 0;
    const total = subtotal - discount;
    $('#bookingStepContent').innerHTML = `<div class="booking-header"><div><span class="eyebrow">FINAL REVIEW</span><h2>Confirm booking</h2><p class="muted">Apply a promo code, then confirm your reservation.</p></div></div>
      ${summary}
      <div class="bill-box">
        <div class="price-row"><span>Tickets (${bookingDraft.seats.length} × ₹${PRICE})</span><strong>₹${subtotal.toFixed(0)}</strong></div>
        <div class="price-row"><span>Promo discount</span><strong id="discountValue">- ₹${discount.toFixed(0)}</strong></div>
        <div class="promo-row"><input id="promoInput" placeholder="Promo code (try MOVIE10)" value="${bookingDraft.promo}"><button class="btn btn-ghost" onclick="applyPromo()">Apply</button></div>
        <div id="promoMessage" class="promo-message ${discount ? 'success' : ''}">${discount ? 'MOVIE10 applied — 10% discount' : ''}</div>
        <div class="price-row total"><span>Final total</span><strong id="finalTotal">₹${total.toFixed(0)}</strong></div>
      </div>
      <div class="booking-footer"><button class="btn btn-ghost" onclick="renderBookingStep(3)">← Back</button><button class="btn btn-primary" onclick="confirmBooking()">Confirm booking</button></div>`;
  }
}

function saveShowAndContinue() {
  bookingDraft.dateIndex = Number($('#bookDate').value);
  bookingDraft.theatreIndex = Number($('#bookTheatre').value);
  bookingDraft.showIndex = Number($('#bookShow').value);
  bookingDraft.seats = [];
  renderBookingStep(2);
}
function seatPrefix() { return `${bookingDraft.movieIndex}:${bookingDraft.dateIndex}:${bookingDraft.theatreIndex}:${bookingDraft.showIndex}`; }
function toggleSeat(seat) {
  if (bookingDraft.seats.includes(seat)) bookingDraft.seats = bookingDraft.seats.filter(s => s !== seat);
  else if (bookingDraft.seats.length < 10) bookingDraft.seats.push(seat);
  else return toast('Maximum 10 seats per booking.');
  renderBookingStep(2);
}
function continueFromSeats() { renderBookingStep(3); }
function continueToBill() {
  bookingDraft.passengers = bookingDraft.seats.map((_,i)=>({name: $('#passengerName'+i).value.trim(), age: Number($('#passengerAge'+i).value)}));
  if (bookingDraft.passengers.some(p => !p.name || !p.age || p.age < 1 || p.age > 120)) return toast('Enter a valid name and age for every passenger.');
  renderBookingStep(4);
}
function applyPromo() {
  const value = $('#promoInput').value.trim().toUpperCase();
  bookingDraft.promo = value === 'MOVIE10' ? value : '';
  const subtotal = bookingDraft.seats.length * PRICE;
  const discount = bookingDraft.promo ? subtotal * .10 : 0;
  $('#discountValue').textContent = `- ₹${discount.toFixed(0)}`;
  $('#finalTotal').textContent = `₹${(subtotal-discount).toFixed(0)}`;
  $('#promoMessage').textContent = bookingDraft.promo ? 'MOVIE10 applied — 10% discount' : 'Invalid promo code.';
  $('#promoMessage').className = `promo-message ${bookingDraft.promo ? 'success' : 'error'}`;
}
function confirmBooking() {
  const subtotal = bookingDraft.seats.length * PRICE;
  const discount = bookingDraft.promo === 'MOVIE10' ? subtotal * .10 : 0;
  const prefix = seatPrefix();
  const seatKeys = booking?.seatKeys ? [...booking.seatKeys] : [];
  bookingDraft.seats.forEach(seat => seatKeys.push(`${prefix}:${seat}`));
  const movie = MOVIES[bookingDraft.movieIndex];
  booking = {
    bookingId: nextBookingId++,
    movieIndex: bookingDraft.movieIndex,
    movie: movie.name,
    date: DATES[bookingDraft.dateIndex],
    dateIndex: bookingDraft.dateIndex,
    theatre: THEATRES[bookingDraft.theatreIndex],
    theatreIndex: bookingDraft.theatreIndex,
    show: SHOWS[bookingDraft.showIndex],
    showIndex: bookingDraft.showIndex,
    seats: [...bookingDraft.seats],
    passengers: [...bookingDraft.passengers],
    promo: bookingDraft.promo,
    total: subtotal - discount,
    active: true,
    seatKeys
  };
  save('cassoBooking', booking);
  localStorage.setItem('cassoNextBookingId', nextBookingId);
  closeModal('bookingModal');
  renderBookings();
  showSection('bookings');
  toast('Booking successful! 🎟');
}

function renderBookings() {
  const empty = $('#bookingEmpty');
  const card = $('#bookingCard');
  if (!booking || !booking.active) {
    empty.classList.remove('hidden');
    card.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  card.classList.remove('hidden');
  card.innerHTML = `<div class="booking-panel">
      <span class="booking-id">BOOKING #${booking.bookingId}</span>
      <h3 style="margin-top:12px;">${booking.movie}</h3>
      <div class="booking-meta">
        <div class="meta-item"><span>Date</span><strong>${booking.date}</strong></div>
        <div class="meta-item"><span>Theatre</span><strong>${booking.theatre}</strong></div>
        <div class="meta-item"><span>Show</span><strong>${booking.show}</strong></div>
        <div class="meta-item"><span>Seats</span><strong>${booking.seats.join(', ')}</strong></div>
      </div>
      <table class="passenger-table"><thead><tr><th>Seat</th><th>Passenger</th><th>Age</th></tr></thead><tbody>${booking.seats.map((s,i)=>`<tr><td>${s}</td><td>${booking.passengers[i].name}</td><td>${booking.passengers[i].age}</td></tr>`).join('')}</tbody></table>
      <div class="side-actions"><button class="btn btn-success" onclick="openTransfer()">Transfer a seat</button><button class="btn btn-danger" onclick="cancelBooking()">Cancel booking</button></div>
    </div>
    <aside class="side-panel"><span class="eyebrow">PAYMENT SUMMARY</span><h3>₹${booking.total.toFixed(0)}</h3><div class="price-row"><span>${booking.seats.length} tickets</span><strong>₹${(booking.seats.length*PRICE).toFixed(0)}</strong></div><div class="price-row"><span>Promo</span><strong>${booking.promo || '—'}</strong></div><div class="price-row total"><span>Paid</span><strong>₹${booking.total.toFixed(0)}</strong></div><p class="muted" style="font-size:11px;line-height:1.6;">This demo stores booking data in your browser using localStorage. No real payment is processed.</p></aside>`;
}

function openTransfer() {
  $('#transferModal').classList.remove('hidden');
  $('#transferForm').innerHTML = `<form class="form" onsubmit="handleTransfer(event)">
    <div class="field"><label>SELECT SEAT</label><select id="transferSeat">${booking.seats.map((s,i)=>`<option value="${i}">Seat ${s} — ${booking.passengers[i].name}</option>`).join('')}</select></div>
    <div class="field"><label>NEW PASSENGER NAME</label><input id="transferName" required /></div>
    <div class="field"><label>NEW PASSENGER AGE</label><input id="transferAge" type="number" min="1" max="120" required /></div>
    <button class="btn btn-primary" type="submit">Transfer seat</button>
  </form>`;
}
function handleTransfer(e) {
  e.preventDefault();
  const i = Number($('#transferSeat').value);
  booking.passengers[i] = { name: $('#transferName').value.trim(), age: Number($('#transferAge').value) };
  save('cassoBooking', booking);
  closeModal('transferModal');
  renderBookings();
  toast(`Seat ${booking.seats[i]} transferred successfully.`);
}
function cancelBooking() {
  if (!booking?.active) return;
  if (!confirm('Cancel this booking and release all selected seats?')) return;
  booking.active = false;
  save('cassoBooking', booking);
  renderBookings();
  toast('Booking cancelled successfully.');
}

function toast(message) {
  const t = $('#toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function init() {
  renderMovies();
  renderBookings();
  updateHeader();
}
init();
