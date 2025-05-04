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
		const oldest = raindrops.shift();
		rainContainer.removeChild(oldest);
	}

	const raindrop = document.createElement("div");
	raindrop.classList.add("raindrop");
	raindrop.style.position = "absolute";
	const height = Math.random() * 10 + 10;
	raindrop.style.width = "2px";
	raindrop.style.height = `${height}px`;
	raindrop.style.background = getRaindropColor();
	raindrop.style.borderRadius = "1px";
	raindrop.style.opacity = Math.random() * 0.5 + 0.3;

	raindrop.x = Math.random() * window.innerWidth;
	raindrop.y = -height;
	raindrop.speed = Math.random() * 6 + 4;
	raindrop.directionX = (Math.random() - 0.5) * 0.2;
	raindrop.directionY = Math.random() * 0.5 + 0.8;

	raindrop.style.left = `${raindrop.x}px`;
	raindrop.style.top = `${raindrop.y}px`;

	raindrops.push(raindrop);
	rainContainer.appendChild(raindrop);
};

setInterval(createRaindrop, 50);

function updateRaindrops() {
	raindrops.forEach((raindrop, index) => {
		const height = Number.parseFloat(raindrop.style.height);

		raindrop.x += raindrop.directionX * raindrop.speed;
		raindrop.y += raindrop.directionY * raindrop.speed;

		raindrop.style.left = `${raindrop.x}px`;
		raindrop.style.top = `${raindrop.y}px`;

		if (raindrop.y > window.innerHeight) {
			rainContainer.removeChild(raindrop);
			raindrops.splice(index, 1);
			return;
		}

		if (
			raindrop.x > window.innerWidth ||
			raindrop.y > window.innerHeight ||
			raindrop.x < 0
		) {
			raindrop.x = Math.random() * window.innerWidth;
			raindrop.y = -height;
			raindrop.style.left = `${raindrop.x}px`;
			raindrop.style.top = `${raindrop.y}px`;
		}
	});

	requestAnimationFrame(updateRaindrops);
}

updateRaindrops();
