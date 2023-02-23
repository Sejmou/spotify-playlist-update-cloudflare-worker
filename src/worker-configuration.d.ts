interface Env {
	QSTASH_CURRENT_SIGNING_KEY: string;
	QSTASH_NEXT_SIGNING_KEY: string;
	SPOTIFY_CLIENT_ID: string;
	SPOTIFY_CLIENT_SECRET: string;
	SPOTIFY_REDIRECT_URI: string;
	spotifyState: KVNamespace;
}
