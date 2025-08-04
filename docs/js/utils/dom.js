// DOM utility functions

export const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const createElement = (tag, className = '', content = '') => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) {
    if (typeof content === 'string') {
      element.innerHTML = content;
    } else {
      element.appendChild(content);
    }
  }
  return element;
};

export const createIcon = (pathData, className = 'w-4 h-4') => {
  return `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24">${pathData}</svg>`;
};

export const toggleClass = (element, className, condition) => {
  if (condition) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString(),
      date: date.toLocaleDateString(),
      full: date.toLocaleString()
    };
  } catch {
    return { time: 'Invalid', date: 'Invalid', full: 'Invalid' };
  }
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== 'string') return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};