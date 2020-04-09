namespace VideoWeb.Common.Security.HashGen
{
    public class KinlyConfiguration
    {
        public string CallbackSecret { get; set; }
        public string Audience { get; set; }
        public string Issuer { get; set; }
        public string ApiSecret { get; set; }
        public int ExpiresInMinutes { get; set; }
        public int HashExpiresInMinutes { get; set; }
    }
}
