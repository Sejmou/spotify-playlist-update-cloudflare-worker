import { Receiver } from '@upstash/qstash/cloudflare';
import SpotifyWebApi from 'spotify-web-api-node';
// @ts-ignore
import SpotifyWebApiServer from 'spotify-web-api-node/src/server-methods';
(SpotifyWebApi as unknown as { _addMethods: (fncs: unknown) => void })._addMethods(
	SpotifyWebApiServer
);

// weird issue with spotify-web-api-node: https://github.com/thelinmichael/spotify-web-api-node/issues/342#issuecomment-1342137209

const scopes = ['user-top-read'];

export default {
	async fetch(request: Request, env: Env) {
		const { pathname, searchParams } = new URL(request.url);

		const spotifyApi = new SpotifyWebApi({
			clientId: env.SPOTIFY_CLIENT_ID,
			clientSecret: env.SPOTIFY_CLIENT_SECRET,
			redirectUri: env.SPOTIFY_REDIRECT_URI,
		});

		if (pathname.startsWith('/connect-spotify')) {
			const state = Math.random().toString(36); // TODO: use properly secure random state if necessary
			await env.spotifyState.put('state', state);
			const redirectURL = spotifyApi.createAuthorizeURL(scopes, state);
			console.log('redirect URL', redirectURL);
			return Response.redirect(redirectURL, 301);
		} else if (pathname.startsWith('/callback')) {
			console.log('pathname', pathname);
			const code = searchParams.get('code');
			const state = searchParams.get('state');
			if (!code) {
				return new Response('No authorization code received', { status: 400 });
			}
			if (!state) {
				return new Response('No state received', { status: 400 });
			}
			const storedState = await env.spotifyState.get('state');
			console.log('state', state);
			console.log('storedState', storedState);
			if (storedState !== state) {
				return new Response('Invalid state', { status: 400 });
			}
			console.log('starting authorizationCodeGrant');
			const data = await spotifyApi.authorizationCodeGrant(code);
			console.log('finished authorizationCodeGrant');
			const body = data.body;
			const accessToken = data.body.access_token;
			const refreshToken = data.body.refresh_token;
			await env.spotifyState.put('accessToken', accessToken, {
				expirationTtl: body.expires_in,
			});
			await env.spotifyState.put('refreshToken', refreshToken);

			return new Response('Login successful, stored tokens');
		} else if (pathname.startsWith('/generate-playlists')) {
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
				return new Response(
					'Invalid signature: This endpoint can only be called from QStash serverless function with matching keys',
					{ status: 401 }
				);
			}
			console.log('The signature was valid');

			const accessToken = await env.spotifyState.get('accessToken');
			const refreshToken = await env.spotifyState.get('refreshToken');
			if (!accessToken) {
				if (!refreshToken) {
					return new Response('No access token or refresh token', { status: 401 });
				}
				spotifyApi.setRefreshToken(refreshToken);
				const data = await spotifyApi.refreshAccessToken();

				const newAccessToken = data.body.access_token;
				await env.spotifyState.put('accessToken', newAccessToken, {
					expirationTtl: data.body.expires_in,
				});
				spotifyApi.setAccessToken(newAccessToken);

				const newRefreshToken = data.body.refresh_token;
				if (newRefreshToken) {
					await env.spotifyState.put('refreshToken', newRefreshToken);
					spotifyApi.setRefreshToken(newRefreshToken);
				}
			} else {
				spotifyApi.setAccessToken(accessToken);
			}

			const topTracks = await spotifyApi.getMyTopTracks({ limit: 50, time_range: 'long_term' });
			console.log(
				'topTracks',
				topTracks.body.items.map(i => i.name)
			);

			return new Response('Playlists generated!');
		}

		return new Response('Nothing to do');
	},
};
