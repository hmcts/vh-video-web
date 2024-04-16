namespace VideoWeb.Contract.Responses
{
    /// <summary>
    /// Configuration to initialise the UI application
    /// </summary>
    public class ClientSettingsResponse
    {
        /// <summary>
        /// The Application Insights Connection String
        /// </summary>
        public string AppInsightsConnectionString { get; set; }

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
        public string SupplierTurnServer { get; set; }

        /// <summary>
        /// The turn server username
        /// </summary>
        public string SupplierTurnServerUser { get; set; }

        /// <summary>
        /// The turn server password
        /// </summary>
        public string SupplierTurnServerCredential { get; set; }

        /// <summary>
        /// The EJudiciary IDP Settings
        /// </summary>
        public IdpSettingsResponse EJudIdpSettings { get; set; }
        
        /// <summary>
        /// The DOM1 IDP Settings
        /// </summary>
        public IdpSettingsResponse Dom1IdpSettings { get; set; }

        /// <summary>
        /// The VH IDP Settings
        /// </summary>
        public IdpSettingsResponse VHIdpSettings { get; set; }

        /// <summary>
        /// Enable video filters
        /// </summary>
        public bool EnableVideoFilters { get; set; }

        /// <summary>
        /// Enable Android support
        /// </summary>
        public bool EnableAndroidSupport { get; set; }

        /// <summary>
        /// Enable iOS mobile support
        /// </summary>
        public bool EnableIOSMobileSupport { get; set; }
        
        /// <summary>
        /// Enable iOS tablet support
        /// </summary>
        public bool EnableIOSTabletSupport { get; set; }
        
        /// <summary>
        /// Enable dynamic evidence sharing button
        /// </summary>
        public bool EnableDynamicEvidenceSharing { get; set; }

        /// <summary>
        /// Blur radius in pixels
        /// </summary>
        public int BlurRadius { get; set; }

        /// <summary>
        /// Launch Darkly Client for feature toggling
        /// </summary>
        public string LaunchDarklyClientId { get; set; }
        
        /// <summary>
        /// Supplier
        /// </summary>
        public string Supplier { get; set; }
    }
}
