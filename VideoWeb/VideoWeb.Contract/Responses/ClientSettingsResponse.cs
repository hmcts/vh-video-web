namespace VideoWeb.Contract.Responses
{
    /// <summary>
    /// Configuration to initialise the UI application
    /// </summary>
    public class ClientSettingsResponse
    {
        /// <summary>
        /// The Azure Tenant Id
        /// </summary>
        public string TenantId { get; set; }
        
        /// <summary>
        /// The UI Client Id
        /// </summary>
        public string ClientId { get; set; }
        
        /// <summary>
        /// The Uri to redirect back to after a successful login
        /// </summary>
        public string RedirectUri { get; set; }
        
        /// <summary>
        /// The Uri to redirect back to after a successful logout
        /// </summary>
        public string PostLogoutRedirectUri { get; set; }

        /// <summary>
        /// The application insight instrumentation key
        /// </summary>
        public string AppInsightsInstrumentationKey { get; set; }
        
        /// <summary>
        /// The eventhub path
        /// </summary>
        public string EventHubPath { get; set; }
        /// <summary>
        /// The date to set option ON to display functionality to join hearing by phone
        /// </summary>
        public string JoinByPhoneFromDate { get; set; }
        
        /// <summary>
        /// The turn server
        /// </summary>
        public string KinlyTurnServer { get; set; }
        
        /// <summary>
        /// The turn server username
        /// </summary>
        public string KinlyTurnServerUser { get; set; }
        
        /// <summary>
        /// The turn server password
        /// </summary>
        public string KinlyTurnServerCredential { get; set; }

        public IdpSettingsResponse EJudIdpSettings { get; set; }
        public IdpSettingsResponse VHIdpSettings { get; set; }
    }
}
