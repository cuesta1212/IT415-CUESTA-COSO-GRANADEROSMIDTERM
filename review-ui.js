let instance = 0;
const storageKey = 'powerpuff-customer-reviews';

/** Customer feedback stays on this device; no database or public submission. */
export function renderReviewForm(reference) {
  const section = document.createElement('section'); section.className = 'customer-review';
  const heading = document.createElement('h2'); heading.textContent = 'How was your experience?';
  const note = document.createElement('p'); note.textContent = 'Rate your visit and leave an optional comment. Reviews are saved only on this device.';
  const form = document.createElement('form'); form.className = 'customer-review-form';
  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend'); legend.textContent = 'Your rating'; fieldset.append(legend);
  const stars = document.createElement('div'); stars.className = 'review-stars';
  const group = `rating-${++instance}`;
  for (let value = 1; value <= 5; value++) {
    const label = document.createElement('label');
    const radio = document.createElement('input'); radio.type = 'radio'; radio.name = group; radio.value = String(value);
    radio.setAttribute('aria-label', `${value} ${value === 1 ? 'star' : 'stars'}`);
    const star = document.createElement('span'); star.textContent = '★'; star.setAttribute('aria-hidden', 'true');
    radio.addEventListener('change', () => {
      for (const item of stars.children) item.classList.toggle('selected', Number(item.querySelector('input').value) <= value);
    });
    label.append(radio, star); stars.append(label);
  }
  fieldset.append(stars);
  const commentLabel = document.createElement('label'); commentLabel.className = 'review-comment-label'; commentLabel.textContent = 'Your review (optional)';
  const comment = document.createElement('textarea'); comment.rows = 3; comment.maxLength = 500; comment.placeholder = 'Tell us about your visit…'; commentLabel.append(comment);
  const save = document.createElement('button'); save.type = 'submit'; save.className = 'review-save'; save.textContent = 'Save Review';
  const status = document.createElement('p'); status.className = 'review-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const selected = form.querySelector('input:checked');
    if (!selected) { status.textContent = 'Please choose a star rating.'; form.querySelector('input').focus(); return; }
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const reviews = Array.isArray(parsed) ? parsed : [];
      const entry = { reference, rating: Number(selected.value), comment: comment.value.trim(), date: new Date().toISOString() };
      localStorage.setItem(storageKey, JSON.stringify([...reviews.filter(item => item.reference !== reference), entry].slice(-20)));
      status.textContent = 'Thank you! Your review has been saved on this device.';
      save.textContent = 'Review Saved'; save.disabled = true;
      for (const control of form.querySelectorAll('input, textarea')) control.disabled = true;
    } catch { status.textContent = 'Your browser could not save the review. Please try again.'; }
  });
  form.append(fieldset, commentLabel, save, status); section.append(heading, note, form);
  return section;
}
