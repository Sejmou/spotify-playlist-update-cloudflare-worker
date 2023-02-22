# My first Cloudflare Worker
This Cloudflare worker should one day be able to create most recent versions of my Spotify "Top Tracks" playlists (for last month, last 6 months, and last year) whenever a new request from QStash comes in. QStash is a service that allows one to deploy serverless functions that trigger API calls in a certain time interval - my goal would be to trigger one for this worker at the beginning of every month to not have to do this manually every month. 

## Deploy new version (assuming "spotify-tracks-update" is the desired name of the worker in my workers subdomain)
Run `yarn deploy --name spotify-top-tracks-update`
