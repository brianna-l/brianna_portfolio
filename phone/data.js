// Data for images and descriptions
const imageData = [
    { img: "assets/4.png", description: "On the starship, the moon's massive body was close at hand. The lights of another planet twinkled in the distance." },
    { img: "assets/5.png", description: "A small paper boat drifting on the lake, not knowing who folded it." },
    { img: "assets/6.png", description: "It looks like there is a platform in front of the river that is visible, can a jump be made over it?" },
    { img: "assets/7.png", description: "It was a beautiful sunset today and the light it gave off warmed the whole place." },
    { img: "assets/8.png", description: "There appears to be a giant black creature underneath this reflective, thick ice." },
    { img: "assets/9.png", description: "The street lights were on, dispelling the fear that the darkness of the night brings." },
    { img: "assets/10.png", description: "Going to the park at noon, you can see the stunning light created by the sun on the trees." },
    { img: "assets/11.png", description: "This particular vine knot produced an angular grape. Really curious if anyone will eat it." },
    { img: "assets/12.png", description: "The grand white theatre is very prominent in the sky overlooking the city on the ground." },
    { img: "assets/13.png", description: "The surfers' reflective skateboards can be seen in the giant waves." },
    { img: "assets/14.png", description: "These alien creatures seem to have gathered together to guard something." },
    { img: "assets/15.png", description: "The rear end of the car in front is so reflective, I feel like the eyes are stabbed out." },
    { img: "assets/16.png", description: "The sushi chef is performing the process of making the course." },
    { img: "assets/17.png", description: "It's like the gaze of some sacred species." }
];

const links = document.querySelectorAll(".links li p");
const infoBox = document.getElementById("info-box");
const infoImage = document.getElementById("info-image");
const infoDescription = document.getElementById("info-description");

links.forEach((link, index) => {
    link.addEventListener("mouseover", (e) => {
        const { img, description } = imageData[index];
        infoImage.src = img;
        infoDescription.textContent = description;
        infoBox.style.display = "flex";
    });

    link.addEventListener("mouseout", () => {
        infoBox.style.display = "none";
    });
});