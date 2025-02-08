// Detect
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

let toggled = false;

// DOM
const scene = document.getElementById('scene');
const objectBack = document.getElementById('object-back');
const objectFront1 = document.getElementById('object-front-1');
const objectFront2 = document.getElementById('object-front-2');
const toggleButton = document.getElementById('toggleBackground');

if (isMobile) {
    // Mobile
    window.addEventListener('deviceorientation', (event) => {
        const beta = event.beta;
        const gamma = event.gamma;
        const randomZ = Math.random() * 10;

        //
        scene.style.transform = `rotateX(${beta}deg) rotateY(${gamma}deg)`;
        objectBack.style.transform = `translate(-50%, -50%) translateZ(${randomZ}px) rotateY(${gamma}deg) rotateX(${beta}deg)`;
        objectFront1.style.transform = `translate(-50%, -50%) translateZ(${randomZ}px) rotateY(${gamma}deg) rotateX(${beta}deg)`;
        objectFront2.style.transform = `translate(-50%, -50%) translateZ(${randomZ}px) rotateY(${gamma}deg) rotateX(${beta}deg)`;
    });
} else {
    // Desktop
    window.addEventListener('mousemove', (event) => {
        const x = event.clientX;
        const y = event.clientY;
        
        const rotateY = (x / window.innerWidth) * 180 - 90;
        const rotateX = (y / window.innerHeight) * 120 - 60;

        //
        scene.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        objectBack.style.transform = `translate(-50%, -50%) translateZ(-100px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;

        objectFront1.style.transform = `translate(-50%, -50%) translateZ(100px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;

        objectFront2.style.transform = `translate(-50%, -50%) translateZ(200px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;

    });
}

document.addEventListener('DOMContentLoaded', () => {
toggleButton.addEventListener('click', () => {
    toggled = !toggled;

    if (toggled) {
      objectBack.style.backgroundImage   = "url('assets/1-1.png')";
      objectFront1.style.backgroundImage = "url('assets/2-1.png')";
      objectFront2.style.backgroundImage = "url('assets/3-1.png')";
    } else {
      objectBack.style.backgroundImage   = "url('assets/1.png')";
      objectFront1.style.backgroundImage = "url('assets/2.png')";
      objectFront2.style.backgroundImage = "url('assets/3.png')";
    }
  });
});