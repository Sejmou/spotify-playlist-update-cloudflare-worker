# My first Cloudflare Worker
This Cloudflare worker should one day be able to create most recent versions of my Spotify "Top Tracks" playlists (for last month, last 6 months, and last year) whenever a new request from QStash comes in. QStash is a service that allows one to deploy serverless functions that trigger API calls in a certain time interval - my goal would be to trigger one for this worker at the beginning of every month to not have to do this manually every month.

[This](https://docs.upstash.com/qstash/quickstarts/cloudflare-workers) is the tutorial I followed to get QStash working with Cloudflare workers.

Sidenote: the commands below implicity use required params (such as name, compatibility_date, and main) from `wrangler.toml` so that you don't have to supply them as command line arguments.

If you use a different name for your worker in your workers subdomain, change the name in `wrangler.toml`.
You might need to prefix the commands below with `npx` if `wrangler` is not installed globally on your machine.

## Store signing keys from QStash console
```
wrangler secret put QSTASH_CURRENT_SIGNING_KEY
```

```
wrangler secret put QSTASH_NEXT_SIGNING_KEY
```

## Spotify Setup
Create a new project in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). 
### Store client ID
You should see the client ID immediately when viewing your new project. Add it in the wrangler.toml file (just update the existing ID).

### Store secret
Note: if you clone this project from me, you would also need to update the SPOTIFY_CLIENT_ID inside `wrangler.toml` accordingly
```
wrangler secret put SPOTIFY_CLIENT_SECRET
```

### Add callback URLs
You also need to set callback URLs in the settings for your project from the dashboard.

 - local development (with `wrangler dev`): `http://localhost:8787/callback`
 - production deployment on Cloudflare: `<your-worker-URL>/callback` 

## local testing
Run `wrangler dev`

## Deploy new version
Run `yarn deploy`
