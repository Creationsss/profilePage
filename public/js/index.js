const activityProgressMap = new Map();

function formatTime(ms) {
	const totalSecs = Math.floor(ms / 1000);
	const hours = Math.floor(totalSecs / 3600);
	const mins = Math.floor((totalSecs % 3600) / 60);
	const secs = totalSecs % 60;

	return `${String(hours).padStart(1, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatVerbose(ms) {
	const totalSecs = Math.floor(ms / 1000);
	const hours = Math.floor(totalSecs / 3600);
	const mins = Math.floor((totalSecs % 3600) / 60);
	const secs = totalSecs % 60;

	return `${hours}h ${mins}m ${secs}s`;
}

function updateElapsedAndProgress() {
	const now = Date.now();

	for (const el of document.querySelectorAll(".activity-timestamp")) {
		const start = Number(el.dataset.start);
		if (!start) continue;

		const elapsed = now - start;
		const display = el.querySelector(".elapsed");
		if (display) display.textContent = `(${formatVerbose(elapsed)} ago)`;
	}

	for (const bar of document.querySelectorAll(".progress-bar")) {
		const start = Number(bar.dataset.start);
		const end = Number(bar.dataset.end);
		if (!start || !end || end <= start) continue;

		const duration = end - start;
		const elapsed = Math.min(now - start, duration);
		const progress = Math.min(
			100,
			Math.max(0, Math.floor((elapsed / duration) * 100)),
		);

		const fill = bar.querySelector(".progress-fill");
		if (fill) fill.style.width = `${progress}%`;
	}

	for (const label of document.querySelectorAll(".progress-time-labels")) {
		const start = Number(label.dataset.start);
		const end = Number(label.dataset.end);
		if (!start || !end || end <= start) continue;

		const isPaused = now > end;
		const current = isPaused ? end - start : Math.max(0, now - start);
		const total = end - start;

		const currentEl = label.querySelector(".progress-current");
		const totalEl = label.querySelector(".progress-total");

		const id = `${start}-${end}`;
		const last = activityProgressMap.get(id);

		if (isPaused || (last !== undefined && last === current)) {
			label.classList.add("paused");
		} else {
			label.classList.remove("paused");
		}

		activityProgressMap.set(id, current);

		if (currentEl) {
			currentEl.textContent = isPaused
				? `Paused at ${formatTime(current)}`
				: formatTime(current);
		}
		if (totalEl) totalEl.textContent = formatTime(total);
	}
}

updateElapsedAndProgress();
setInterval(updateElapsedAndProgress, 1000);

const head = document.querySelector("head");
const userId = head?.dataset.userId;
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

	let heartbeatInterval = null;

	socket.addEventListener("open", () => {});

	socket.addEventListener("message", (event) => {
		const payload = JSON.parse(event.data);

		if (payload.op === 1 && payload.d?.heartbeat_interval) {
			heartbeatInterval = setInterval(() => {
				socket.send(JSON.stringify({ op: 3 }));
			}, payload.d.heartbeat_interval);

			socket.send(
				JSON.stringify({
					op: 2,
					d: {
						subscribe_to_id: userId,
					},
				}),
			);
		}

		if (payload.t === "INIT_STATE" || payload.t === "PRESENCE_UPDATE") {
			updatePresence(payload.d);
			requestAnimationFrame(() => updateElapsedAndProgress());
		}
	});

	socket.addEventListener("close", () => {
		if (heartbeatInterval) clearInterval(heartbeatInterval);
	});
}

function resolveActivityImage(img, applicationId) {
	if (!img) return null;

	if (img.startsWith("mp:external/")) {
		return `https://media.discordapp.net/external/${img.slice("mp:external/".length)}`;
	}

	if (img.includes("/https/")) {
		const clean = img.split("/https/")[1];
		return clean ? `https://${clean}` : null;
	}

	if (img.startsWith("spotify:")) {
		return `https://i.scdn.co/image/${img.split(":")[1]}`;
	}

	return `https://cdn.discordapp.com/app-assets/${applicationId}/${img}.png`;
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

	let art = null;
	let smallArt = null;

	if (activity.assets) {
		art = resolveActivityImage(
			activity.assets.large_image,
			activity.application_id,
		);
		smallArt = resolveActivityImage(
			activity.assets.small_image,
			activity.application_id,
		);
	}

	const activityTypeMap = {
		0: "Playing",
		1: "Streaming",
		2: "Listening",
		3: "Watching",
		4: "Custom Status",
		5: "Competing",
	};

	const activityType =
		activity.name === "Spotify"
			? "Listening to Spotify"
			: activity.name === "TIDAL"
				? "Listening to TIDAL"
				: activityTypeMap[activity.type] || "Playing";

	const activityTimestamp =
		start && progress === null
			? `<div class="activity-timestamp" data-start="${start}">
						<span>Since: ${new Date(start).toLocaleTimeString("en-GB", {
							hour: "2-digit",
							minute: "2-digit",
							second: "2-digit",
						})} <span class="elapsed"></span></span>
					</div>`
			: "";

	const activityButtons =
		activity.buttons && activity.buttons.length > 0
			? `<div class="activity-buttons">
					${activity.buttons
						.map((button, index) => {
							const label = typeof button === "string" ? button : button.label;
							let url = null;
							if (typeof button === "object" && button.url) {
								url = button.url;
							} else if (index === 0 && activity.url) {
								url = activity.url;
							}
							return url
								? `<a href="${url}" class="activity-button" target="_blank" rel="noopener noreferrer">${label}</a>`
								: null;
						})
						.filter(Boolean)
						.join("")}
				</div>`
			: "";

	const progressBar =
		progress !== null
			? `<div class="progress-bar" data-start="${start}" data-end="${end}">
					<div class="progress-fill" style="width: ${progress}%"></div>
				</div>
				<div class="progress-time-labels" data-start="${start}" data-end="${end}">
					<span class="progress-current">${formatTime(elapsed)}</span>
					<span class="progress-total">${formatTime(total)}</span>
				</div>`
			: "";

	const isMusic = activity.type === 2 || activity.type === 3;

	const primaryLine = isMusic ? activity.details : activity.name;
	const secondaryLine = isMusic ? activity.state : activity.details;
	const tertiaryLine = isMusic ? activity.assets?.large_text : activity.state;

	const activityArt = art
		? `<div class="activity-image-wrapper">
				<img class="activity-image" src="${art}" alt="Art" ${activity.assets?.large_text ? `title="${activity.assets.large_text}"` : ""}>
				${smallArt ? `<img class="activity-image-small" src="${smallArt}" alt="Small Art" ${activity.assets?.small_text ? `title="${activity.assets.small_text}"` : ""}>` : ""}
			</div>`
		: "";

	return `
		<li class="activity">
			<div class="activity-wrapper">
				<div class="activity-type-wrapper">
					<span class="activity-type-label" data-type="${activity.type}">${activityType}</span>
					${activityTimestamp}
				</div>
				<div class="activity-wrapper-inner">
					${activityArt}
					<div class="activity-content">
						<div class="inner-content">
							<div class="activity-top">
								<div class="activity-header ${progress !== null ? "no-timestamp" : ""}">
									<span class="activity-name">${primaryLine}</span>
								</div>
								${secondaryLine ? `<div class="activity-detail">${secondaryLine}</div>` : ""}
								${tertiaryLine ? `<div class="activity-detail">${tertiaryLine}</div>` : ""}
							</div>
							<div class="activity-bottom">
								${activityButtons}
							</div>
						</div>
					</div>
				</div>
				${progressBar}
			</div>
		</li>
	`;
}

function updatePresence(data) {
	const avatarWrapper = document.querySelector(".avatar-wrapper");
	const statusIndicator = avatarWrapper?.querySelector(".status-indicator");
	const mobileIcon = avatarWrapper?.querySelector(".platform-icon.mobile-only");

	const userInfo = document.querySelector(".user-info");
	const customStatus = userInfo?.querySelector(".custom-status");

	const platform = {
		mobile: data.active_on_discord_mobile,
		web: data.active_on_discord_web,
		desktop: data.active_on_discord_desktop,
	};

	let status = "offline";
	console.log(data.activities.some((activity) => activity.type === 1));
	if (data.activities.some((activity) => activity.type === 1)) {
		status = "streaming";
	} else {
		status = data.discord_status;
	}

	if (statusIndicator) {
		statusIndicator.className = `status-indicator ${status}`;
	}

	if (platform.mobile && !mobileIcon) {
		avatarWrapper.innerHTML += `
			<svg class="platform-icon mobile-only" viewBox="0 0 1000 1500" fill="#43a25a" aria-label="Mobile" width="17" height="17">
				<path d="M 187 0 L 813 0 C 916.277 0 1000 83.723 1000 187 L 1000 1313 C 1000 1416.277 916.277 1500 813 1500 L 187 1500 C 83.723 1500 0 1416.277 0 1313 L 0 187 C 0 83.723 83.723 0 187 0 Z M 125 1000 L 875 1000 L 875 250 L 125 250 Z M 500 1125 C 430.964 1125 375 1180.964 375 1250 C 375 1319.036 430.964 1375 500 1375 C 569.036 1375 625 1319.036 625 1250 C 625 1180.964 569.036 1125 500 1125 Z"/>
			</svg>
		`;
	} else if (!platform.mobile && mobileIcon) {
		mobileIcon.remove();
		avatarWrapper.innerHTML += `<div class="status-indicator ${status}"></div>`;
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
		customStatus.innerHTML = `
			${emojiHTML}
			${custom.state ? `<span class="custom-status-text">${custom.state}</span>` : ""}
		`;
	}

	const filtered = data.activities
		?.filter((a) => a.type !== 4)
		?.sort((a, b) => {
			const priority = { 2: 0, 1: 1, 3: 2 }; // Listening, Streaming, Watching ? should i keep this
			const aPriority = priority[a.type] ?? 99;
			const bPriority = priority[b.type] ?? 99;
			return aPriority - bPriority;
		});

	const activityList = document.querySelector(".activities");

	if (activityList) {
		activityList.innerHTML = "";
		if (filtered?.length) {
			activityList.innerHTML = filtered.map(buildActivityHTML).join("");
		}
		updateElapsedAndProgress();
	}
}
