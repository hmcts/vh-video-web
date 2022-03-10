using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
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
