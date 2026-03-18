export const toast = {
  success: (message: string) => {
    const toastEl = document.createElement('div');
    toastEl.className = 'toast toast-top toast-end z-50';
    toastEl.innerHTML = `
      <div class="alert alert-success text-white">
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3000);
  },

  error: (message: string) => {
    const toastEl = document.createElement('div');
    toastEl.className = 'toast toast-top toast-end z-50';
    toastEl.innerHTML = `
      <div class="alert alert-error">
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3000);
  },

  info: (message: string) => {
    const toastEl = document.createElement('div');
    toastEl.className = 'toast toast-top toast-end z-50';
    toastEl.innerHTML = `
      <div class="alert alert-info">
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3000);
  },

  warning: (message: string) => {
    const toastEl = document.createElement('div');
    toastEl.className = 'toast toast-top toast-end z-50';
    toastEl.innerHTML = `
      <div class="alert alert-warning">
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3000);
  },
};
