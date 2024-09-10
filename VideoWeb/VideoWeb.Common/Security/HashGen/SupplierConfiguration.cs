using VideoWeb.Common.Enums;

namespace VideoWeb.Common.Security.HashGen
{
    public abstract class SupplierConfiguration
    {
        public Supplier Supplier { get; private set; }
        public string CallbackSecret { get; set; }
        public string Audience { get; set; }
        public string Issuer { get; set; }
        public string ApiSecret { get; set; }
        public string SelfTestApiSecret { get; set; }
        public int ExpiresInMinutes { get; set; }
        public int HashExpiresInMinutes { get; set; }
        public string JoinByPhoneFromDate { get; set; }
        public string TurnServer { get; set; }
        public string TurnServerUser { get; set; }
        public string TurnServerCredential { get; set; }
        public string HeartbeatUrlBase { get; set; }
        
        protected SupplierConfiguration(Supplier supplier)
        {
            Supplier = supplier;
        }
    }
}
