export const $ = id => document.getElementById(id);

export const createElement = (tag, options = {}) => {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.id) el.id = options.id;
  if (options.textContent !== undefined) el.textContent = options.textContent;
  if (options.innerHTML !== undefined) el.innerHTML = options.innerHTML;
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([k, v]) => el.setAttribute(k, v));
  }
  if (options.parent) options.parent.appendChild(el);
  return el;
};
