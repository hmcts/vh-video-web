namespace VideoWeb.Common.Configuration
{
    public abstract class IdpConfiguration
    {
        public string ClientId { get; set; }
        public string Authority { get; set; }
        public string TenantId { get; set; }
        public string RedirectUri { get; set; }
        public string PostLogoutRedirectUri { get; set; }
    }
}
