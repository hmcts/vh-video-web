namespace VideoWeb.Contract.Responses
{
    /// <summary>
    /// Configuration to initialise the UI application
    /// </summary>
    public class ClientSettingsResponse
    {
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

        /// <summary>
        /// The EJudiciary IDP Settings
        /// </summary>
        public IdpSettingsResponse EJudIdpSettings { get; set; }

        /// <summary>
        /// The VH IDP Settings
        /// </summary>
        public IdpSettingsResponse VHIdpSettings { get; set; }

        /// <summary>
        /// Enable video filters
        /// </summary>
        public bool EnableVideoFilters { get; set; }
        /// <summary>
        /// Blur radius in pixels
        /// </summary>
        public int BlurRadius { get; set; }
    }
}
