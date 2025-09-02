
  const nav = document.querySelector('nav');
  const burger = document.querySelector('.hamburger');

  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a link is clicked
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
