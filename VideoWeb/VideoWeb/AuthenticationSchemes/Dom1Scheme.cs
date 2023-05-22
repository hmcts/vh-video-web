using VideoWeb.Common.Configuration;

namespace VideoWeb.AuthenticationSchemes
{
    public class Dom1Scheme : AadSchemeBase
    {
        public Dom1Scheme(string eventhubPath, IdpConfiguration idpConfiguration) : base(eventhubPath, idpConfiguration)
        {
        }

        public override AuthProvider Provider => AuthProvider.Dom1;
    }
}
