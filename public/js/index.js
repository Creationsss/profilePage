const head = document.querySelector("head");
const userId = head?.dataset.userId;
const activityProgressMap = new Map();

let instanceUri = head?.dataset.instanceUri;
let badgeURL = head?.dataset.badgeUrl;
let socket;
let badgesLoaded = false;

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

function loadEffectScript(effect) {
	const existing = document.querySelector(`script[data-effect="${effect}"]`);
	if (existing) return;

	const script = document.createElement("script");
	script.src = `/public/js/${effect}.js`;
	script.dataset.effect = effect;
	document.head.appendChild(script);
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

	const activityArt = `<div class="activity-image-wrapper ${art ?? "no-asset"}">
				<img
					class="activity-image${!art ? " no-asset" : ""}"
					src="${art ?? ""}"
					data-name="${activity.name}"
					${activity.assets?.large_text ? `title="${activity.assets.large_text}"` : ""}
				/>
				${`<img class="activity-image-small ${smallArt ?? "no-asset"}" src="${smallArt ?? ""}" ${activity.assets?.small_text ? `title="${activity.assets.small_text}"` : ""}>`}
			</div>`;

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

async function loadBadges(userId, options = {}) {
	const {
		services = [],
		seperated = false,
		cache = true,
		targetId = "badges",
		serviceOrder = [],
	} = options;

	const params = new URLSearchParams();
	if (services.length) params.set("services", services.join(","));
	if (seperated) params.set("seperated", "true");
	if (!cache) params.set("cache", "false");

	const url = `${badgeURL}${userId}?${params.toString()}`;
	const target = document.getElementById(targetId);
	if (!target) return;

	target.classList.add("hidden");

	try {
		const res = await fetch(url);
		const json = await res.json();

		if (!res.ok || !json.badges) {
			target.textContent = "Failed to load badges.";
			return;
		}

		target.innerHTML = "";

		const badgesByService = json.badges;
		const renderedServices = new Set();

		const renderBadges = (badges) => {
			for (const badge of badges) {
				const img = document.createElement("img");
				img.src = badge.badge;
				img.alt = badge.tooltip;
				img.title = badge.tooltip;
				img.className = "badge";
				target.appendChild(img);
			}
		};

		for (const serviceName of serviceOrder) {
			const badges = badgesByService[serviceName];
			if (Array.isArray(badges) && badges.length) {
				renderBadges(badges);
				renderedServices.add(serviceName);
			}
		}

		for (const [serviceName, badges] of Object.entries(badgesByService)) {
			if (renderedServices.has(serviceName)) continue;
			if (Array.isArray(badges) && badges.length) {
				renderBadges(badges);
			}
		}

		target.classList.remove("hidden");
	} catch (err) {
		console.error(err);
		target.innerHTML = "";
		target.classList.add("hidden");
	}
}

async function updatePresence(data) {
	const cssLink = data.kv?.css;
	if (cssLink) {
		try {
			const res = await fetch(`/api/css?url=${encodeURIComponent(cssLink)}`);
			if (!res.ok) throw new Error("Failed to fetch CSS");

			const cssText = await res.text();
			const style = document.createElement("style");
			style.textContent = cssText;
			document.head.appendChild(style);
		} catch (err) {
			console.error("Failed to load CSS", err);
		}
	}

	const avatarWrapper = document.querySelector(".avatar-wrapper");
	const avatarImg = avatarWrapper?.querySelector(".avatar");
	const usernameEl = document.querySelector(".username");

	if (!data.discord_user) {
		const loadingOverlay = document.getElementById("loading-overlay");
		if (loadingOverlay) {
			loadingOverlay.innerHTML = `
					<div class="error-message">
						<p>Failed to load user data.</p>
					</div>
				`;
			loadingOverlay.style.opacity = "1";
			avatarWrapper.classList.add("hidden");
			avatarImg.classList.add("hidden");
			usernameEl.classList.add("hidden");
			document.title = "Error";
		}
		return;
	}

	if (avatarImg && data.discord_user?.avatar) {
		const newAvatarUrl = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}`;
		avatarImg.src = newAvatarUrl;
		avatarImg.classList.remove("hidden");

		const siteIcon = document.getElementById("site-icon");

		if (siteIcon) {
			siteIcon.href = newAvatarUrl;
		}
	}

	if (usernameEl) {
		const username =
			data.discord_user.global_name || data.discord_user.username;
		usernameEl.innerHTML = `<a href="https://discord.com/users/${data.discord_user.id}" target="_blank" rel="noopener noreferrer">${username}</a>`;
		document.title = username;
	}

	const platform = {
		mobile: data.active_on_discord_mobile,
		web: data.active_on_discord_web,
		desktop: data.active_on_discord_desktop,
	};

	let status = "offline";
	if (data.activities.some((activity) => activity.type === 1)) {
		status = "streaming";
	} else {
		status = data.discord_status;
	}

	for (const el of avatarWrapper.querySelectorAll(".platform-icon")) {
		const platformType = ["mobile-only", "desktop-only", "web-only"].find(
			(type) => el.classList.contains(type),
		);

		if (!platformType) continue;

		const active =
			(platformType === "mobile-only" && platform.mobile) ||
			(platformType === "desktop-only" && platform.desktop) ||
			(platformType === "web-only" && platform.web);

		if (!active) {
			el.remove();
		} else {
			el.setAttribute("class", `platform-icon ${platformType} ${status}`);
		}
	}

	if (
		platform.mobile &&
		!avatarWrapper.querySelector(".platform-icon.mobile-only")
	) {
		const mobileIcon = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg",
		);
		mobileIcon.setAttribute("class", `platform-icon mobile-only ${status}`);
		mobileIcon.setAttribute("viewBox", "0 0 1000 1500");
		mobileIcon.setAttribute("fill", "#43a25a");
		mobileIcon.setAttribute("aria-label", "Mobile");
		mobileIcon.setAttribute("width", "17");
		mobileIcon.setAttribute("height", "17");
		mobileIcon.innerHTML = `
			<path d="M 187 0 L 813 0 C 916.277 0 1000 83.723 1000 187 L 1000 1313 C 1000 1416.277 916.277 1500 813 1500 L 187 1500 C 83.723 1500 0 1416.277 0 1313 L 0 187 C 0 83.723 83.723 0 187 0 Z M 125 1000 L 875 1000 L 875 250 L 125 250 Z M 500 1125 C 430.964 1125 375 1180.964 375 1250 C 375 1319.036 430.964 1375 500 1375 C 569.036 1375 625 1319.036 625 1250 C 625 1180.964 569.036 1125 500 1125 Z"/>
		`;
		avatarWrapper.appendChild(mobileIcon);
	}

	const updatedStatusIndicator =
		avatarWrapper.querySelector(".status-indicator");
	if (!updatedStatusIndicator) {
		const statusDiv = document.createElement("div");
		statusDiv.className = `status-indicator ${status}`;
		avatarWrapper.appendChild(statusDiv);
	} else {
		updatedStatusIndicator.className = `status-indicator ${status}`;
	}

	if (!badgesLoaded) {
		await loadBadges(userId, {
			services: [],
			seperated: true,
			cache: true,
			targetId: "badges",
			serviceOrder: ["discord", "equicord", "reviewdb", "vencord"],
		});
		badgesLoaded = true;
	}

	const custom = data.activities?.find((a) => a.type === 4);
	updateCustomStatus(custom);

	const readmeSection = document.querySelector(".readme");

	if (readmeSection && data.kv?.readme) {
		const url = data.kv.readme;
		try {
			const res = await fetch(`/api/readme?url=${encodeURIComponent(url)}`);
			if (!res.ok) throw new Error("Failed to fetch readme");

			const text = await res.text();

			readmeSection.innerHTML = `<div class="markdown-body">${text}</div>`;
			readmeSection.classList.remove("hidden");
		} catch (err) {
			console.error("Failed to load README", err);
			readmeSection.classList.add("hidden");
		}
	} else if (readmeSection) {
		readmeSection.classList.add("hidden");
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
	const activitiesTitle = document.querySelector(".activity-header");

	if (activityList && activitiesTitle) {
		if (filtered?.length) {
			activityList.innerHTML = filtered.map(buildActivityHTML).join("");
			activitiesTitle.classList.remove("hidden");
		} else {
			activityList.innerHTML = "";
			activitiesTitle.classList.add("hidden");
		}
		updateElapsedAndProgress();
		getAllNoAsset();
	}

	if (data.kv?.snow === "true") loadEffectScript("snow");
	if (data.kv?.rain === "true") loadEffectScript("rain");
	if (data.kv?.stars === "true") loadEffectScript("stars");

	const loadingOverlay = document.getElementById("loading-overlay");
	if (loadingOverlay) {
		loadingOverlay.style.opacity = "0";
		setTimeout(() => loadingOverlay.remove(), 500);
	}
}

function updateCustomStatus(custom) {
	const userInfoInner = document.querySelector(".user-info");
	const customStatus = userInfoInner?.querySelector(".custom-status");

	if (!userInfoInner) return;

	if (custom) {
		let emojiHTML = "";
		if (custom.emoji?.id) {
			const emojiUrl = `https://cdn.discordapp.com/emojis/${custom.emoji.id}.${custom.emoji.animated ? "gif" : "png"}`;
			emojiHTML = `<img src="${emojiUrl}" alt="${custom.emoji.name}" class="custom-emoji">`;
		} else if (custom.emoji?.name) {
			emojiHTML = `${custom.emoji.name} `;
		}

		const html = `
			<p class="custom-status">
				${emojiHTML}${custom.state ? `<span class="custom-status-text">${custom.state}</span>` : ""}
			</p>
		`;

		if (customStatus) {
			customStatus.outerHTML = html;
		} else {
			userInfoInner.insertAdjacentHTML("beforeend", html);
		}
	} else if (customStatus) {
		customStatus.remove();
	}
}

async function getAllNoAsset() {
	const noAssetImages = document.querySelectorAll(
		"img.activity-image.no-asset",
	);

	for (const img of noAssetImages) {
		const name = img.dataset.name;
		if (!name) continue;

		try {
			const res = await fetch(`/api/art/${encodeURIComponent(name)}`);
			if (!res.ok) continue;

			const { icon } = await res.json();
			if (icon) {
				img.src = icon;
				img.classList.remove("no-asset");
				img.parentElement.classList.remove("no-asset");
			}
		} catch (err) {
			console.warn(`Failed to fetch fallback icon for "${name}"`, err);
		}
	}
}

if (instanceUri) {
	if (!instanceUri.startsWith("http")) {
		instanceUri = `https://${instanceUri}`;
	}

	const wsUri = instanceUri
		.replace(/^http:/, "ws:")
		.replace(/^https:/, "wss:")
		.replace(/\/$/, "");

	socket = new WebSocket(`${wsUri}/socket`);
}

if (badgeURL && badgeURL !== "null" && userId) {
	if (!badgeURL.startsWith("http")) {
		badgeURL = `https://${badgeURL}`;
	}

	if (!badgeURL.endsWith("/")) {
		badgeURL += "/";
	}
}

if (userId && instanceUri) {
	let heartbeatInterval = null;

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

updateElapsedAndProgress();
setInterval(updateElapsedAndProgress, 1000);
