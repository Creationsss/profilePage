const container = document.createElement("div");
container.style.position = "fixed";
container.style.top = "0";
container.style.left = "0";
container.style.width = "100vw";
container.style.height = "100vh";
container.style.pointerEvents = "none";
container.style.overflow = "hidden";
container.style.zIndex = "9999";
document.body.appendChild(container);

for (let i = 0; i < 60; i++) {
	const star = document.createElement("div");
	star.className = "star";
	const size = Math.random() * 2 + 1;
	star.style.width = `${size}px`;
	star.style.height = `${size}px`;
	star.style.opacity = Math.random();
	star.style.top = `${Math.random() * 100}vh`;
	star.style.left = `${Math.random() * 100}vw`;
	star.style.animationDuration = `${Math.random() * 3 + 2}s`;
	container.appendChild(star);
}

function createShootingStar() {
	const star = document.createElement("div");
	star.className = "shooting-star";

	star.x = Math.random() * window.innerWidth * 0.8;
	star.y = Math.random() * window.innerHeight * 0.3;
	const angle = (Math.random() * Math.PI) / 6 + Math.PI / 8;
	const speed = 10;
	const totalFrames = 60;
	let frame = 0;

	const deg = angle * (180 / Math.PI);
	star.style.left = `${star.x}px`;
	star.style.top = `${star.y}px`;
	star.style.transform = `rotate(${deg}deg)`;

	container.appendChild(star);

	function animate() {
		star.x += Math.cos(angle) * speed;
		star.y += Math.sin(angle) * speed;
		star.style.left = `${star.x}px`;
		star.style.top = `${star.y}px`;
		star.style.opacity = `${1 - frame / totalFrames}`;

		frame++;
		if (frame < totalFrames) {
			requestAnimationFrame(animate);
		} else if (star.parentNode === container) {
			container.removeChild(star);
		}
	}

	animate();
}

setInterval(() => {
	if (Math.random() < 0.3) createShootingStar();
}, 1000);
