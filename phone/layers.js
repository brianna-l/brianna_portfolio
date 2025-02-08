document.addEventListener('DOMContentLoaded', () => {
// Get scene objects
const objectBack = document.getElementById('object-back');
const objectFront1 = document.getElementById('object-front-1');
const objectFront2 = document.getElementById('object-front-2');

let activeLayers = [];

let cleared = false;

function updateOpacities() {
  if (activeLayers.length === 0) {
    if (cleared) {
      objectBack.style.opacity   = 0;
      objectFront1.style.opacity = 0;
      objectFront2.style.opacity = 0;
    } else {
      objectBack.style.opacity   = 0.8;
      objectFront1.style.opacity = 0.6;
      objectFront2.style.opacity = 0.4;
    }
    return;
  }

  objectBack.style.opacity   = 0;
  objectFront1.style.opacity = 0;
  objectFront2.style.opacity = 0;

  if (activeLayers.length === 1) {
    const layer = activeLayers[0];
    if (layer === 'layer1') {
      objectBack.style.opacity = 1;
    } else if (layer === 'layer2') {
      objectFront1.style.opacity = 1;
    } else if (layer === 'layer3') {
      objectFront2.style.opacity = 1;
    }
  } else if (activeLayers.length === 2) {
    const [first, second] = activeLayers;
    if (first === 'layer1') {
      objectBack.style.opacity = 0.5;
    } else if (first === 'layer2') {
      objectFront1.style.opacity = 0.5;
    } else if (first === 'layer3') {
      objectFront2.style.opacity = 0.5;
    }
    if (second === 'layer1') {
      objectBack.style.opacity = 0.5;
    } else if (second === 'layer2') {
      objectFront1.style.opacity = 0.5;
    } else if (second === 'layer3') {
      objectFront2.style.opacity = 0.5;
    }
  } else if (activeLayers.length === 3) {
    const [first, second, third] = activeLayers;
    if (first === 'layer1') {
      objectBack.style.opacity = 0.3;
    } else if (first === 'layer2') {
      objectFront1.style.opacity = 0.3;
    } else if (first === 'layer3') {
      objectFront2.style.opacity = 0.3;
    }
    if (second === 'layer1') {
      objectBack.style.opacity = 0.3;
    } else if (second === 'layer2') {
      objectFront1.style.opacity = 0.3;
    } else if (second === 'layer3') {
      objectFront2.style.opacity = 0.3;
    }
    if (third === 'layer1') {
      objectBack.style.opacity = 0.3;
    } else if (third === 'layer2') {
      objectFront1.style.opacity = 0.3;
    } else if (third === 'layer3') {
      objectFront2.style.opacity = 0.3;
    }
  }
}


const indexElements = document.querySelectorAll('#index .title');

indexElements.forEach(elem => {
  elem.addEventListener('click', () => {
    const text = elem.textContent.trim().toUpperCase();

    if (text === 'CLEAR') {
      activeLayers = [];
      cleared = true;
      updateOpacities();
    } else if (text === 'LAYER 1') {
      cleared = false;
      if (!activeLayers.includes('layer1')) {
        activeLayers.push('layer1');
        updateOpacities();
      }
    } else if (text === 'LAYER 2') {
      cleared = false;
      if (!activeLayers.includes('layer2')) {
        activeLayers.push('layer2');
        updateOpacities();
      }
    } else if (text === 'LAYER 3') {
      cleared = false;
      if (!activeLayers.includes('layer3')) {
        activeLayers.push('layer3');
        updateOpacities();
      }
    }
  });
});

updateOpacities();
});