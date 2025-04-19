document.addEventListener("DOMContentLoaded", () => {
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
		const size = Math.random() * 2 + 1;
		star.style.position = "absolute";
		star.style.width = `${size}px`;
		star.style.height = `${size}px`;
		star.style.background = "white";
		star.style.borderRadius = "50%";
		star.style.opacity = Math.random();
		star.style.top = `${Math.random() * 100}vh`;
		star.style.left = `${Math.random() * 100}vw`;
		star.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite alternate ease-in-out`;
		container.appendChild(star);
	}

	function createShootingStar() {
		const star = document.createElement("div");
		star.classList.add("shooting-star");

		let x = Math.random() * window.innerWidth * 0.8;
		let y = Math.random() * window.innerHeight * 0.3;
		const angle = (Math.random() * Math.PI) / 6 + Math.PI / 8;
		const speed = 10;
		const totalFrames = 60;

		const deg = angle * (180 / Math.PI);
		star.style.left = `${x}px`;
		star.style.top = `${y}px`;
		star.style.transform = `rotate(${deg}deg)`;

		container.appendChild(star);

		let frame = 0;
		function animate() {
			x += Math.cos(angle) * speed;
			y += Math.sin(angle) * speed;
			star.style.left = `${x}px`;
			star.style.top = `${y}px`;
			star.style.opacity = `${1 - frame / totalFrames}`;

			frame++;
			if (frame < totalFrames) {
				requestAnimationFrame(animate);
			} else {
				container.removeChild(star);
			}
		}

		animate();
	}

	setInterval(() => {
		if (Math.random() < 0.3) createShootingStar();
	}, 1000);
});
