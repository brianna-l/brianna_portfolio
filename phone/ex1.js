// 检测设备类型
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 获取 DOM 元素
const scene = document.getElementById('scene');
const object = document.getElementById('object');

if (isMobile) {
    // 手机端：使用陀螺仪
    window.addEventListener('deviceorientation', (event) => {
        const beta = event.beta;  // 前后倾斜角度
        const gamma = event.gamma; // 左右倾斜角度

        // 根据陀螺仪数据调整场景的旋转角度
        scene.style.transform = `rotateX(${beta}deg) rotateY(${gamma}deg)`;
        object.style.transform = `translate(-50%, -50%) rotateY(${gamma}deg) rotateX(${beta}deg)`;
    });
} else {
    // 电脑端：使用视线追踪
    webgazer.setGazeListener((data, elapsedTime) => {
        if (data) {
            const x = data.x; // 视线水平位置
            const y = data.y; // 视线垂直位置

            // 将视线位置映射到旋转角度
            const rotateY = (x / window.innerWidth) * 180 - 90; // -90 到 90 度
            const rotateX = (y / window.innerHeight) * 180 - 90; // -90 到 90 度

            // 根据视线位置调整场景的旋转角度
            scene.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            object.style.transform = `translate(-50%, -50%) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
        }
    }).begin();
}