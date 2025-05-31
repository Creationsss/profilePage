const head = document.querySelector("head");
const userId = head?.dataset.userId;
const activityProgressMap = new Map();

const reviewURL = head?.dataset.reviewDb;
const timezoneApiUrl = head?.dataset.timezoneApi;
let instanceUri = head?.dataset.instanceUri;
let badgeURL = head?.dataset.badgeUrl;
let socket;

let badgesLoaded = false;
let readmeLoaded = false;
let cssLoaded = false;
let timezoneLoaded = false;

const reviewsPerPage = 50;
let currentReviewOffset = 0;
let hasMoreReviews = true;
let isLoadingReviews = false;

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

	if (img.startsWith("twitch:")) {
		const username = img.split(":")[1];
		return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${username}-440x248.jpg`;
	}

	return `https://cdn.discordapp.com/app-assets/${applicationId}/${img}.png`;
}

async function populateReviews(userId) {
	if (!reviewURL || !userId || isLoadingReviews || !hasMoreReviews) return;
	const reviewSection = document.getElementById("reviews-section");
	const reviewList = reviewSection?.querySelector(".reviews-list");
	if (!reviewList) return;

	isLoadingReviews = true;

	try {
		const url = `${reviewURL}/users/${userId}/reviews?flags=2&offset=${currentReviewOffset}`;
		const res = await fetch(url);
		const data = await res.json();

		if (!data.success || !Array.isArray(data.reviews)) {
			if (currentReviewOffset === 0) reviewSection.classList.add("hidden");
			isLoadingReviews = false;
			return;
		}

		const reviewsHTML = data.reviews
			.map((review) => {
				const sender = review.sender;
				const username = sender.username;
				const avatar = sender.profilePhoto;
				let comment = review.comment;

				comment = comment.replace(
					/<(a?):\w+:(\d+)>/g,
					(_, animated, id) =>
						`<img src="https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "webp"}" class="emoji" alt="emoji" />`,
				);

				const timestamp = review.timestamp
					? new Date(review.timestamp * 1000).toLocaleString(undefined, {
							hour12: false,
							year: "numeric",
							month: "2-digit",
							day: "2-digit",
							hour: "2-digit",
							minute: "2-digit",
						})
					: "N/A";

				const badges = (sender.badges || [])
					.map(
						(b) =>
							`<img src="${b.icon}" class="badge" title="${b.description}" alt="${b.name}" />`,
					)
					.join("");

				return `
					<li class="review">
						<img class="review-avatar" src="${avatar}" alt="${username}'s avatar"/>
						<div class="review-body">
							<div class="review-header">
								<div class="review-header-inner">
									<span class="review-username">${username}</span>
									<span class="review-badges">${badges}</span>
								</div>
								<span class="review-timestamp">${timestamp}</span>
							</div>
							<div class="review-content">${comment}</div>
						</div>
					</li>
				`;
			})
			.join("");

		if (currentReviewOffset === 0) reviewList.innerHTML = reviewsHTML;
		else reviewList.insertAdjacentHTML("beforeend", reviewsHTML);

		if (data.reviews.length > 0 && reviewsHTML) {
			reviewSection.classList.remove("hidden");
		}

		hasMoreReviews = data.hasNextPage;
		isLoadingReviews = false;
	} catch (err) {
		console.error("Failed to fetch reviews", err);
		isLoadingReviews = false;
	}
}

function populateTimezone(userId, format = "24h") {
	if (!userId || !timezoneApiUrl || timezoneLoaded) return;

	let currentTimezone = null;

	async function fetchTimezone() {
		try {
			const res = await fetch(
				`${timezoneApiUrl}/get?id=${encodeURIComponent(userId)}`,
			);
			if (!res.ok) throw new Error("Failed to fetch timezone");

			const json = await res.json();
			if (!json || typeof json.timezone !== "string") return;

			currentTimezone = json.timezone;
			updateTime();
			timezoneLoaded = true;
		} catch (err) {
			console.error("Failed to populate timezone", err);
		}
	}

	function updateTime() {
		if (!currentTimezone) return;

		const timezoneEl = document.querySelector(".timezone-value");
		const timezoneWrapper = document.getElementById("timezone-wrapper");
		if (!timezoneEl || !timezoneWrapper) return;

		const now = new Date();

		const time24 = now.toLocaleTimeString("en-GB", {
			timeZone: currentTimezone,
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});

		const time12 = now.toLocaleTimeString("en-US", {
			timeZone: currentTimezone,
			hour12: true,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});

		timezoneEl.textContent = format === "24h" ? time24 : time12;
		timezoneEl.title = `${format === "12h" ? time24 : time12} (${currentTimezone})`;

		timezoneWrapper.classList.remove("hidden");
	}

	fetchTimezone();
	setInterval(updateTime, 1000);
}

function setupReviewScrollObserver(userId) {
	const sentinel = document.createElement("div");
	sentinel.className = "review-scroll-sentinel";
	document.querySelector(".reviews").appendChild(sentinel);

	const observer = new IntersectionObserver(
		(entries) => {
			if (entries[0].isIntersecting && hasMoreReviews && !isLoadingReviews) {
				currentReviewOffset += reviewsPerPage;
				populateReviews(userId);
			}
		},
		{
			rootMargin: "200px",
			threshold: 0,
		},
	);

	observer.observe(sentinel);
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
		2: "Listening to",
		3: "Watching",
		4: "Custom Status",
		5: "Competing",
	};

	const activityType = activityTypeMap[activity.type]
		? `${activityTypeMap[activity.type]}${activity.type === 2 ? ` ${activity.name}` : ""}`
		: "Playing";

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

	const buttons = (activity.buttons || [])
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
		.filter(Boolean);

	if (!buttons.length && activity.name === "Twitch" && activity.url) {
		buttons.push(
			`<a href="${activity.url}" class="activity-button" target="_blank" rel="noopener noreferrer">Watch on Twitch</a>`,
		);
	}

	if (activity.name === "Spotify" && activity.sync_id) {
		buttons.push(
			`<a href="https://open.spotify.com/track/${activity.sync_id}" class="activity-button" target="_blank" rel="noopener noreferrer">Listen on Spotify</a>`,
		);
	}

	const activityButtons = buttons.length
		? `<div class="activity-buttons">${buttons.join("")}</div>`
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

		if (
			!res.ok ||
			!json.badges ||
			Object.values(json.badges).every(
				(arr) => !Array.isArray(arr) || arr.length === 0,
			)
		) {
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
				img.tooltip = badge.tooltip;
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

async function populateReadme(data) {
	if (readmeLoaded) return;

	const readmeSection = document.querySelector(".readme");
	const kv = data.kv || {};

	if (readmeSection && kv.readme) {
		const url = kv.readme;
		try {
			const res = await fetch(`/api/readme?url=${encodeURIComponent(url)}`);
			if (!res.ok) throw new Error("Failed to fetch readme");

			const text = await res.text();

			readmeSection.innerHTML = `<div class="markdown-body">${text}</div>`;
			readmeSection.classList.remove("hidden");
			readmeLoaded = true;
		} catch (err) {
			console.error("Failed to load README", err);
			readmeSection.classList.add("hidden");
		}
	} else if (readmeSection) {
		readmeSection.classList.add("hidden");
	}
}

async function updatePresence(initialData) {
	if (
		!initialData ||
		typeof initialData !== "object" ||
		initialData.success === false ||
		initialData.error
	) {
		const loadingOverlay = document.getElementById("loading-overlay");
		if (loadingOverlay) {
			loadingOverlay.innerHTML = `
				<div class="error-message">
					<p>${initialData?.error?.message || "Failed to load presence data."}</p>
				</div>
			`;
			loadingOverlay.style.opacity = "1";
		}
		return;
	}

	const data =
		initialData?.d && Object.keys(initialData.d).length > 0
			? initialData.d
			: initialData;

	const kv = data.kv || {};

	if (kv.optout === "true") {
		const loadingOverlay = document.getElementById("loading-overlay");
		if (loadingOverlay) {
			loadingOverlay.innerHTML = `
				<div class="error-message">
					<p>This user has opted out of sharing their presence.</p>
				</div>
			`;
			loadingOverlay.style.opacity = "1";
		}
		return;
	}

	const cssLink = kv.css;
	if (cssLink && !cssLoaded) {
		try {
			const res = await fetch(`/api/css?url=${encodeURIComponent(cssLink)}`);
			if (!res.ok) throw new Error("Failed to fetch CSS");

			const cssText = await res.text();
			const style = document.createElement("style");
			style.textContent = cssText;
			document.head.appendChild(style);
			cssLoaded = true;
		} catch (err) {
			console.error("Failed to load CSS", err);
		}
	}

	if (!badgesLoaded && data?.kv && data.kv.badges !== "false") {
		loadBadges(userId, {
			services: [],
			seperated: true,
			cache: true,
			targetId: "badges",
			serviceOrder: ["discord", "equicord", "reviewdb", "vencord"],
		});
		badgesLoaded = true;
	}

	const avatarWrapper = document.querySelector(".avatar-wrapper");
	const avatarImg = avatarWrapper?.querySelector(".avatar");
	const decorationImg = avatarWrapper?.querySelector(".decoration");
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

	if (
		decorationImg &&
		data.discord_user?.avatar_decoration_data &&
		data.discord_user.avatar_decoration_data.asset
	) {
		const newDecorationUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${data.discord_user.avatar_decoration_data.asset}`;
		decorationImg.src = newDecorationUrl;
		decorationImg.classList.remove("hidden");
	} else if (decorationImg) {
		decorationImg.src = "";
		decorationImg.classList.add("hidden");
	}

	if (usernameEl) {
		const username =
			data.discord_user.global_name || data.discord_user.username;
		usernameEl.innerHTML = `<a href="https://discord.com/users/${data.discord_user.id}" target="_blank" rel="noopener noreferrer">${username}</a>`;
		document.title = username;
	}

	updateClanBadge(data);
	if (kv.reviews !== "false") {
		populateReviews(userId);
		setupReviewScrollObserver(userId);
	}

	if (kv.timezone !== "false" && userId && timezoneApiUrl) {
		populateTimezone(userId, kv.timezone_12 === "true" ? "12h" : "24h");
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

	const custom = data.activities?.find((a) => a.type === 4);
	updateCustomStatus(custom);

	populateReadme(data);

	const filtered = data.activities
		?.filter((a) => a.type !== 4)
		?.sort((a, b) => {
			const priority = { 2: 0, 1: 1, 3: 2 }; // Listening, Streaming, Watching ? should i keep this
			const aPriority = priority[a.type] ?? 99;
			const bPriority = priority[b.type] ?? 99;
			return aPriority - bPriority;
		});

	const activityList = document.querySelector(".activities");
	const activitiesTitle = document.querySelector(".activity-block-header");

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

	if (kv.snow === "true") loadEffectScript("snow");
	if (kv.rain === "true") loadEffectScript("rain");
	if (kv.stars === "true") loadEffectScript("stars");

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

function updateClanBadge(data) {
	const userInfoInner = document.querySelector(".user-info-inner");
	if (!userInfoInner) return;

	const clan = data?.discord_user?.primary_guild;
	if (!clan || !clan.tag || !clan.identity_guild_id || !clan.badge) return;

	const existing = userInfoInner.querySelector(".clan-badge");
	if (existing) existing.remove();

	const wrapper = document.createElement("div");
	wrapper.className = "clan-badge";

	const img = document.createElement("img");
	img.src = `https://cdn.discordapp.com/clan-badges/${clan.identity_guild_id}/${clan.badge}`;
	img.alt = "Clan Badge";

	const span = document.createElement("span");
	span.className = "clan-name";
	span.textContent = clan.tag;

	wrapper.appendChild(img);
	wrapper.appendChild(span);

	const usernameEl = userInfoInner.querySelector(".username");
	if (usernameEl) {
		usernameEl.insertAdjacentElement("afterend", wrapper);
	} else {
		userInfoInner.appendChild(wrapper);
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

		if (payload.error || payload.success === false) {
			const loadingOverlay = document.getElementById("loading-overlay");
			if (loadingOverlay) {
				loadingOverlay.innerHTML = `
					<div class="error-message">
						<p>${payload.error?.message || "An unknown error occurred."}</p>
					</div>
				`;
				loadingOverlay.style.opacity = "1";
			}
			return;
		}

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
			updatePresence(payload);
			requestAnimationFrame(updateElapsedAndProgress);
		}
	});

	socket.addEventListener("close", () => {
		if (heartbeatInterval) clearInterval(heartbeatInterval);
	});
}

updateElapsedAndProgress();
setInterval(updateElapsedAndProgress, 1000);
