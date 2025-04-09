const rainContainer = document.createElement("div");
rainContainer.style.position = "fixed";
rainContainer.style.top = "0";
rainContainer.style.left = "0";
rainContainer.style.width = "100vw";
rainContainer.style.height = "100vh";
rainContainer.style.pointerEvents = "none";
document.body.appendChild(rainContainer);

const maxRaindrops = 100;
const raindrops = [];
const mouse = { x: -100, y: -100 };

document.addEventListener("mousemove", (e) => {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
});

const getRaindropColor = () => {
	const htmlTag = document.documentElement;
	return htmlTag.getAttribute("data-theme") === "dark"
		? "rgba(173, 216, 230, 0.8)"
		: "rgba(70, 130, 180, 0.8)";
};

const createRaindrop = () => {
	if (raindrops.length >= maxRaindrops) {
		const oldestRaindrop = raindrops.shift();
		rainContainer.removeChild(oldestRaindrop);
	}

	const raindrop = document.createElement("div");
	raindrop.classList.add("raindrop");
	raindrop.style.position = "absolute";
	raindrop.style.width = "2px";
	raindrop.style.height = `${Math.random() * 10 + 10}px`;
	raindrop.style.background = getRaindropColor();
	raindrop.style.borderRadius = "1px";
	raindrop.style.left = `${Math.random() * window.innerWidth}px`;
	raindrop.style.top = `-${raindrop.style.height}`;
	raindrop.style.opacity = Math.random() * 0.5 + 0.3;
	raindrop.speed = Math.random() * 6 + 4;
	raindrop.directionX = (Math.random() - 0.5) * 0.2;
	raindrop.directionY = Math.random() * 0.5 + 0.8;

	raindrops.push(raindrop);
	rainContainer.appendChild(raindrop);
};

setInterval(createRaindrop, 50);

function updateRaindrops() {
	raindrops.forEach((raindrop, index) => {
		const rect = raindrop.getBoundingClientRect();

		raindrop.style.left = `${rect.left + raindrop.directionX * raindrop.speed}px`;
		raindrop.style.top = `${rect.top + raindrop.directionY * raindrop.speed}px`;

		if (rect.top + rect.height >= window.innerHeight) {
			rainContainer.removeChild(raindrop);
			raindrops.splice(index, 1);
		}

		if (
			rect.left > window.innerWidth ||
			rect.top > window.innerHeight ||
			rect.left < 0
		) {
			raindrop.style.left = `${Math.random() * window.innerWidth}px`;
			raindrop.style.top = `-${raindrop.style.height}`;
		}
	});

	requestAnimationFrame(updateRaindrops);
}

updateRaindrops();
