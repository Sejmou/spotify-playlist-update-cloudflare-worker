import { Receiver } from '@upstash/qstash/cloudflare';
import SpotifyWebApi from 'spotify-web-api-node';
// @ts-ignore
import SpotifyWebApiServer from 'spotify-web-api-node/src/server-methods';
(SpotifyWebApi as unknown as { _addMethods: (fncs: unknown) => void })._addMethods(
	SpotifyWebApiServer
);
// weird issue with spotify-web-api-node: https://github.com/thelinmichael/spotify-web-api-node/issues/342#issuecomment-1342137209

export interface Env {
	QSTASH_CURRENT_SIGNING_KEY: string;
	QSTASH_NEXT_SIGNING_KEY: string;
	SPOTIFY_CLIENT_ID: string;
	SPOTIFY_CLIENT_SECRET: string;
	SPOTIFY_REDIRECT_URI: string;
}

const scopes = ['user-top-read'];

export default {
	async fetch(request: Request, env: Env) {
		const fakeId = Math.random().toString(36).substring(7);
		console.log({ fakeId });
		const { pathname } = new URL(request.url);

		const spotifyApi = new SpotifyWebApi({
			clientId: env.SPOTIFY_CLIENT_ID,
			clientSecret: env.SPOTIFY_CLIENT_SECRET,
			redirectUri: env.SPOTIFY_REDIRECT_URI,
		});

		if (pathname.startsWith('/login')) {
			console.log('in login');
			const redirectURL = spotifyApi.createAuthorizeURL(scopes, 'some-state');
			console.log('redirect URL', redirectURL);
			return Response.redirect(redirectURL, 301);
		} else if (pathname.startsWith('/callback')) {
			console.log('in callback');
			const searchParams = new URLSearchParams(pathname);
			const code = searchParams.get('code');
			const state = searchParams.get('state');
			if (!code) {
				return new Response('No authorization code received', { status: 400 });
			}
			const data = await spotifyApi.authorizationCodeGrant(code);
			const accessToken = data.body.access_token;
			const refreshToken = data.body.refresh_token;
			console.log({ code });
			return new Response('Hi :)');
		}

		const c = new Receiver({
			currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
			nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
		});

		const body = await request.text();

		const isValid = await c
			.verify({
				signature: request.headers.get('Upstash-Signature')!,
				body,
			})
			.catch(err => {
				console.error(err);
				return false;
			});
		if (!isValid) {
			return new Response('Invalid signature', { status: 401 });
		}
		console.log('The signature was valid');

		// do work here
		console.log('Spotify client ID', env.SPOTIFY_CLIENT_ID);

		return new Response('Hello World!');
	},
};
