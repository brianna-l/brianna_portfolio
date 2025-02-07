// Detect device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Get DOM elements
const scene = document.getElementById('scene');
const objectBack = document.getElementById('object-back');
const objectFront1 = document.getElementById('object-front-1');
const objectFront2 = document.getElementById('object-front-2');

if (isMobile) {
    // Mobile: Use deviceorientation
    window.addEventListener('deviceorientation', (event) => {
        const beta = event.beta; // front-back tilt
        const gamma = event.gamma; // left-right tilt
        const randomZ = Math.random() * 10; // Add random depth to each object

        // Apply transformations
        scene.style.transform = `rotateX(${beta}deg) rotateY(${gamma}deg)`;
        objectBack.style.transform = `translate(-50%, -50%) translateZ(${randomZ}px) rotateY(${gamma}deg) rotateX(${beta}deg)`;
        objectFront1.style.transform = `translate(-50%, -50%) translateZ(${randomZ}px) rotateY(${gamma}deg) rotateX(${beta}deg)`;
        objectFront2.style.transform = `translate(-50%, -50%) translateZ(${randomZ}px) rotateY(${gamma}deg) rotateX(${beta}deg)`;
    });
} else {
    // Desktop: Use Webgazer
    webgazer.setGazeListener((data, elapsedTime) => {
        if (data) {
            const x = data.x;
            const y = data.y;
            const rotateY = (x / window.innerWidth) * 180 - 90;
            const rotateX = (y / window.innerHeight) * 120 - 60;
            const randomZ = Math.random() * 10; // Add random depth to each object

            // Apply transformations
            scene.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            objectBack.style.transform = `translate(-50%, -50%) translateZ(${randomZ}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
            objectFront1.style.transform = `translate(-50%, -50%) translateZ(${randomZ}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
            objectFront2.style.transform = `translate(-50%, -50%) translateZ(${randomZ}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
        }
    }).begin();
}
