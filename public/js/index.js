/* eslint-disable indent */

const activityProgressMap = new Map();

function formatTime(ms) {
	const totalSecs = Math.floor(ms / 1000);
	const mins = Math.floor(totalSecs / 60);
	const secs = totalSecs % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function updateElapsedAndProgress() {
	const now = Date.now();

	document.querySelectorAll(".activity-timestamp").forEach((el) => {
		const start = Number(el.dataset.start);
		if (!start) return;

		const elapsed = now - start;
		const mins = Math.floor(elapsed / 60000);
		const secs = Math.floor((elapsed % 60000) / 1000);
		const display = el.querySelector(".elapsed");
		if (display)
			display.textContent = `(${mins}m ${secs.toString().padStart(2, "0")}s ago)`;
	});

	document.querySelectorAll(".progress-bar").forEach((bar) => {
		const start = Number(bar.dataset.start);
		const end = Number(bar.dataset.end);
		if (!start || !end || end <= start) return;

		const duration = end - start;
		const elapsed = now - start;
		const progress = Math.min(
			100,
			Math.max(0, Math.floor((elapsed / duration) * 100)),
		);

		const fill = bar.querySelector(".progress-fill");
		if (fill) fill.style.width = `${progress}%`;
	});

	document.querySelectorAll(".progress-time-labels").forEach((label) => {
		const start = Number(label.dataset.start);
		const end = Number(label.dataset.end);
		if (!start || !end || end <= start) return;

		const current = Math.max(0, now - start);
		const total = end - start;

		const currentEl = label.querySelector(".progress-current");
		const totalEl = label.querySelector(".progress-total");

		const id = `${start}-${end}`;
		const last = activityProgressMap.get(id);

		if (last !== undefined && last === current) {
			label.classList.add("paused");
		} else {
			label.classList.remove("paused");
		}

		activityProgressMap.set(id, current);

		if (currentEl) currentEl.textContent = formatTime(current);
		if (totalEl) totalEl.textContent = formatTime(total);
	});
}

updateElapsedAndProgress();
setInterval(updateElapsedAndProgress, 1000);

const head = document.querySelector("head");
let userId = head?.dataset.userId;
let instanceUri = head?.dataset.instanceUri;

if (userId && instanceUri) {
	if (!instanceUri.startsWith("http")) {
		instanceUri = `https://${instanceUri}`;
	}

	const wsUri = instanceUri
		.replace(/^http:/, "ws:")
		.replace(/^https:/, "wss:")
		.replace(/\/$/, "");

	const socket = new WebSocket(`${wsUri}/socket`);

	socket.addEventListener("open", () => {
		socket.send(
			JSON.stringify({
				op: 2,
				d: {
					subscribe_to_id: userId,
				},
			}),
		);
	});

	socket.addEventListener("message", (event) => {
		const payload = JSON.parse(event.data);

		if (payload.t === "INIT_STATE" || payload.t === "PRESENCE_UPDATE") {
			updatePresence(payload.d);
			updateElapsedAndProgress();
		}
	});
}

function buildActivityHTML(activity) {
	const start = activity.timestamps?.start;
	const end = activity.timestamps?.end;
	const now = Date.now();
	const elapsed = start ? now - start : 0;
	const total = start && end ? end - start : null;
	const progress =
		total && elapsed > 0
			? Math.min(100, Math.floor((elapsed / total) * 100))
			: null;

	const img = activity.assets?.large_image;
	let art = null;
	if (img?.includes("https")) {
		const clean = img.split("/https/")[1];
		if (clean) art = `https://${clean}`;
	} else if (img?.startsWith("spotify:")) {
		art = `https://i.scdn.co/image/${img.split(":")[1]}`;
	} else if (img) {
		art = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${img}.png`;
	}

	const activityTimestamp =
		!total && start
			? `
		<div class="activity-timestamp" data-start="${start}">
			<span>
				Since: ${new Date(start).toLocaleTimeString("en-GB", {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				})} <span class="elapsed"></span>
			</span>
		</div>`
			: "";

	const progressBar =
		progress !== null
			? `
				<div class="progress-bar" data-start="${start}" data-end="${end}">
					<div class="progress-fill" style="width: ${progress}%"></div>
				</div>
				<div class="progress-time-labels" data-start="${start}" data-end="${end}">
					<span class="progress-current">${formatTime(elapsed)}</span>
					<span class="progress-total">${formatTime(total)}</span>
				</div>
			`
			: "";

	const activityButtons = activity.buttons && activity.buttons.length > 0
		? `<div class="activity-buttons">
			${activity.buttons.map((button, index) => {
				const buttonLabel = typeof button === 'string' ? button : button.label;
				let buttonUrl = null;
				if (typeof button === 'object' && button.url) {
					buttonUrl = button.url;
				}
				else if (index === 0 && activity.url) {
					buttonUrl = activity.url;
				}
				if (buttonUrl) {
					return `<a href="${buttonUrl}" class="activity-button" target="_blank" rel="noopener noreferrer">${buttonLabel}</a>`;
				} else {
					return `<span class="activity-button disabled">${buttonLabel}</span>`;
				}
			}).join('')}
		</div>`
		: '';

	return `
		<li class="activity">
			${art ? `<img class="activity-art" src="${art}" alt="Art">` : ""}
			<div class="activity-content">
				<div class="activity-header ${progress !== null ? "no-timestamp" : ""}">
					<span class="activity-name">${activity.name}</span>
					${activityTimestamp}
				</div>
				${activity.details ? `<div class="activity-detail">${activity.details}</div>` : ""}
				${activity.state ? `<div class="activity-detail">${activity.state}</div>` : ""}
				${activityButtons}
				${progressBar}
			</div>
		</li>
	`;
}

function updatePresence(data) {
	const avatarWrapper = document.querySelector(".avatar-wrapper");
	const statusIndicator = avatarWrapper?.querySelector(".status-indicator");
	const mobileIcon = avatarWrapper?.querySelector(
		".platform-icon.mobile-only",
	);

	const userInfo = document.querySelector(".user-info");
	const customStatus = userInfo?.querySelector(".custom-status");

	const platform = {
		mobile: data.active_on_discord_mobile,
		web: data.active_on_discord_web,
		desktop: data.active_on_discord_desktop,
	};

	if (statusIndicator) {
		statusIndicator.className = `status-indicator ${data.discord_status}`;
	}

	if (platform.mobile && !mobileIcon) {
		avatarWrapper.innerHTML += `
			<svg class="platform-icon mobile-only" viewBox="0 0 1000 1500" fill="#43a25a" aria-label="Mobile" width="17" height="17">
				<path d="M 187 0 L 813 0 C 916.277 0 1000 83.723 1000 187 L 1000 1313 C 1000 1416.277 916.277 1500 813 1500 L 187 1500 C 83.723 1500 0 1416.277 0 1313 L 0 187 C 0 83.723 83.723 0 187 0 Z M 125 1000 L 875 1000 L 875 250 L 125 250 Z M 500 1125 C 430.964 1125 375 1180.964 375 1250 C 375 1319.036 430.964 1375 500 1375 C 569.036 1375 625 1319.036 625 1250 C 625 1180.964 569.036 1125 500 1125 Z"/>
			</svg>
		`;
	} else if (!platform.mobile && mobileIcon) {
		mobileIcon.remove();
		avatarWrapper.innerHTML += `<div class="status-indicator ${data.discord_status}"></div>`;
	}

	const custom = data.activities?.find((a) => a.type === 4);
	if (customStatus && custom) {
		let emojiHTML = "";
		const emoji = custom.emoji;
		if (emoji?.id) {
			const emojiUrl = `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}`;
			emojiHTML = `<img src="${emojiUrl}" alt="${emoji.name}" class="custom-emoji">`;
		} else if (emoji?.name) {
			emojiHTML = `${emoji.name} `;
		}
		customStatus.innerHTML = `${emojiHTML}${custom.state}`;
	}

	const filtered = data.activities?.filter((a) => a.type !== 4);
	const activityList = document.querySelector(".activities");

	if (activityList) {
		activityList.innerHTML = "";
		if (filtered?.length) {
			activityList.innerHTML = filtered.map(buildActivityHTML).join("");
		}
		updateElapsedAndProgress();
	}
}
