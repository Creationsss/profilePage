document.addEventListener("DOMContentLoaded", () => {
	const snowContainer = document.createElement("div");
	snowContainer.style.position = "fixed";
	snowContainer.style.top = "0";
	snowContainer.style.left = "0";
	snowContainer.style.width = "100vw";
	snowContainer.style.height = "100vh";
	snowContainer.style.pointerEvents = "none";
	document.body.appendChild(snowContainer);

	const maxSnowflakes = 60;
	const snowflakes = [];
	const mouse = { x: -100, y: -100 };

	document.addEventListener("mousemove", (e) => {
		mouse.x = e.clientX;
		mouse.y = e.clientY;
	});

	const createSnowflake = () => {
		if (snowflakes.length >= maxSnowflakes) {
			const oldestSnowflake = snowflakes.shift();
			snowContainer.removeChild(oldestSnowflake);
		}

		const snowflake = document.createElement("div");
		snowflake.classList.add("snowflake");
		snowflake.style.position = "absolute";
		snowflake.style.width = `${Math.random() * 3 + 2}px`;
		snowflake.style.height = snowflake.style.width;
		snowflake.style.background = "white";
		snowflake.style.borderRadius = "50%";
		snowflake.style.opacity = Math.random();
		snowflake.style.left = `${Math.random() * window.innerWidth}px`;
		snowflake.style.top = `-${snowflake.style.height}`;
		snowflake.speed = Math.random() * 3 + 2;
		snowflake.directionX = (Math.random() - 0.5) * 0.5;
		snowflake.directionY = Math.random() * 0.5 + 0.5;

		snowflakes.push(snowflake);
		snowContainer.appendChild(snowflake);
	};

	setInterval(createSnowflake, 80);

	function updateSnowflakes() {
		snowflakes.forEach((snowflake, index) => {
			const rect = snowflake.getBoundingClientRect();

			const dx = rect.left + rect.width / 2 - mouse.x;
			const dy = rect.top + rect.height / 2 - mouse.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < 30) {
				snowflake.directionX += (dx / distance) * 0.02;
				snowflake.directionY += (dy / distance) * 0.02;
			} else {
				snowflake.directionX += (Math.random() - 0.5) * 0.01;
				snowflake.directionY += (Math.random() - 0.5) * 0.01;
			}

			snowflake.style.left = `${rect.left + snowflake.directionX * snowflake.speed}px`;
			snowflake.style.top = `${rect.top + snowflake.directionY * snowflake.speed}px`;

			if (rect.top + rect.height >= window.innerHeight) {
				snowContainer.removeChild(snowflake);
				snowflakes.splice(index, 1);
			}

			if (
				rect.left > window.innerWidth ||
				rect.top > window.innerHeight ||
				rect.left < 0
			) {
				snowflake.style.left = `${Math.random() * window.innerWidth}px`;
				snowflake.style.top = `-${snowflake.style.height}`;
			}
		});

		requestAnimationFrame(updateSnowflakes);
	}

	updateSnowflakes();
});
