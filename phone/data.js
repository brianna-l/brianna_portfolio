// Data for images and descriptions
const imageData = [
    { img: "assets/4.png", description: "Description for image 1" },
    { img: "assets/5.png", description: "Description for image 2" },
    { img: "assets/6.png", description: "Description for image 3" },
    { img: "assets/7.png", description: "Description for image 4" },
    { img: "assets/8.png", description: "Description for image 5" },
    { img: "assets/9.png", description: "Description for image 6" },
    { img: "assets/10.png", description: "Description for image 7" },
    { img: "assets/11.png", description: "Description for image 7" },
    { img: "assets/12.png", description: "Description for image 7" },
    { img: "assets/13.png", description: "Description for image 7" },
    { img: "assets/14.png", description: "Description for image 7" },
    { img: "assets/15.png", description: "Description for image 7" },
    { img: "assets/16.png", description: "Description for image 7" },
    { img: "assets/17.png", description: "Description for image 7" }
];

const links = document.querySelectorAll(".links li a");
const infoBox = document.getElementById("info-box");
const infoImage = document.getElementById("info-image");
const infoDescription = document.getElementById("info-description");

links.forEach((link, index) => {
    link.addEventListener("mouseover", (e) => {
        const { img, description } = imageData[index];
        infoImage.src = img;  // Set the image source
        infoDescription.textContent = description; // Set the description
        infoBox.style.display = "block";
        infoBox.style.left = `${e.pageX + 10}px`; // Position next to the mouse pointer
        infoBox.style.top = `${e.pageY + 10}px`;
    });

    link.addEventListener("mouseout", () => {
        infoBox.style.display = "none"; // Hide image and description when mouse leaves
    });
});