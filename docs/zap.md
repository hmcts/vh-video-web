# Run Zap scan locally

To run Zap scan locally update the following settings and run acceptance tests

User Secrets:

- "VhServices:VideoWebUrl": "https://videoweb_ac/"
- "VhServices:VideoWebApiUrl": "https://videoweb_ac/"

Update following configuration under VideoWeb/VideoWeb/appsettings.json

- "AzureAd:RedirectUri": "https://videoweb_ac/home"
- "AzureAd:PostLogoutRedirectUri": "https://videoweb_ac/logout"
- "ZapScan": true

Update following configuration under VideoWeb/VideoWeb.AcceptanceTests/appsettings.json

- "AzureAd:RedirectUri": "https://videoweb_ac/home"
- "AzureAd:PostLogoutRedirectUri": "https://videoweb_ac/logout"
- "ZapConfiguration:ZapScan": true