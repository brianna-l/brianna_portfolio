function getRandomBlendMode() {
    const blendModes = ['multiply', 'hard-light', 'darken'];
    const randomIndex = Math.floor(Math.random() * blendModes.length);
    return blendModes[randomIndex];
  }

function placeRandomly() {
    const images = document.querySelectorAll('.floral');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    images.forEach((img) => {
      const randomX = Math.floor(Math.random() * (windowWidth - img.offsetWidth));
      const randomY = Math.floor(Math.random() * (windowHeight - img.offsetHeight));

      img.style.left = `${randomX}px`;
      img.style.top = `${randomY}px`;

      const randomBlendMode = getRandomBlendMode();
        img.style.mixBlendMode = randomBlendMode;
    });
  }

  function duplicateFloral() {
    const originalFloralElements = document.querySelectorAll('.floral');

    originalFloralElements.forEach((img) => {
      for (let i = 0; i < 2; i++) {
        const clone = img.cloneNode(true);
        document.body.appendChild(clone);
      }
    });
  }

  window.onload = () => {
    duplicateFloral();
    placeRandomly();
    setInterval(placeRandomly, 4000);
  };