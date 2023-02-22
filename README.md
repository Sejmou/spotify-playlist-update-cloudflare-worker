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

## Store Spotify secret
Note: if you clone this project from me, you would also need to update the SPOTIFY_CLIENT_ID inside `wrangler.toml` accordingly
```
wrangler secret put SPOTIFY_CLIENT_SECRET
```

## Deploy new version
Run `yarn deploy`
