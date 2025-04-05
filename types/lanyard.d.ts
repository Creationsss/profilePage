interface DiscordUser {
	id: string;
	username: string;
	avatar: string;
	discriminator: string;
	clan?: string | null;
	avatar_decoration_data?: {
		sku_id: string;
		asset: string;
		expires_at: string | null;
	};
	bot: boolean;
	global_name: string;
	primary_guild?: string | null;
	collectibles?: {
		enabled: boolean;
		disabled: boolean;
	};
	display_name: string;
	public_flags: number;
}

interface Activity {
	id: string;
	name: string;
	type: number;
	state: string;
	created_at: number;
}

interface SpotifyData {
	track_id: string;
	album_id: string;
	album_name: string;
	artist_name: string;
	track_name: string;
}

interface Kv {
	[key: string]: string;
}

interface LanyardData {
	kv: Kv;
	discord_user: DiscordUser;
	activities: Activity[];
	discord_status: string;
	active_on_discord_web: boolean;
	active_on_discord_desktop: boolean;
	active_on_discord_mobile: boolean;
	listening_to_spotify?: boolean;
	spotify?: SpotifyData;
	spotify_status: string;
	active_on_spotify: boolean;
	active_on_xbox: boolean;
	active_on_playstation: boolean;
}

type LanyardSuccess = {
	success: true;
	data: LanyardData;
};

type LanyardError = {
	success: false;
	error: {
		code: string;
		message: string;
	};
};

type LanyardResponse = LanyardSuccess | LanyardError;
