using VideoWeb.Common.Configuration;

namespace VideoWeb.AuthenticationSchemes
{
    public class VhAadScheme : AadSchemeBase
    {
        public VhAadScheme(AzureAdConfiguration azureAdConfiguration, string eventhubPath): base(eventhubPath, azureAdConfiguration)
        {
        }

        public override AuthProvider Provider => AuthProvider.VHAAD;
    }
}
