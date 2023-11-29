namespace VideoWeb.UnitTests.Builders
{
    public class EjudClaimsPrincipalBuilder : ClaimsPrincipalBuilder
    {
        public EjudClaimsPrincipalBuilder() : base(includeGivenName: false, includeSurname: false)
        {
        }
    }
}
