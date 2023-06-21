namespace VideoWeb.Contract.Responses
{
    public class IdpSettingsResponse
    {
        /// <summary>
        /// The IDP Config ID (used to identify the IDP by the UI)
        /// </summary>
        public string ConfigId { get; set; }
        
        /// <summary>
        /// The Azure Tenant Id
        /// </summary>
        public string TenantId { get; set; }
        
        /// <summary>
        /// The UI Client Id
        /// </summary>
        public string ClientId { get; set; }
        
        /// <summary>
        /// The UI Resource Id, can be used as an alternative id to ClientId for authentication
        /// </summary>
        public string ResourceId { get; set; }
        
        /// <summary>
        /// The Uri to redirect back to after a successful login
        /// </summary>
        public string RedirectUri { get; set; }
        
        /// <summary>
        /// The Uri to redirect back to after a successful logout
        /// </summary>
        public string PostLogoutRedirectUri { get; set; }
    }
}
