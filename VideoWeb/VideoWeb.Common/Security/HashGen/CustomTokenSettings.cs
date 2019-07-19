namespace VideoWeb.Common.Security.HashGen
{
    public class CustomTokenSettings
    {
        public string Secret { get; set; }
        public string Audience { get; set; }
        public string Issuer { get; set; }
        public string ThirdPartySecret { get; set; }
    }
}