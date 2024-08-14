namespace VideoWeb.Contract.Responses
{
    public class SupplierClientSettingsResponse
    {
        /// <summary>
        /// Supplier
        /// </summary>
        public string Supplier { get; set; }
        
        /// <summary>
        /// The date to set option ON to display functionality to join hearing by phone
        /// </summary>
        public string JoinByPhoneFromDate { get; set; }

        /// <summary>
        /// The turn server
        /// </summary>
        public string TurnServer { get; set; }

        /// <summary>
        /// The turn server username
        /// </summary>
        public string TurnServerUser { get; set; }

        /// <summary>
        /// The turn server password
        /// </summary>
        public string TurnServerCredential { get; set; }
    }
}
