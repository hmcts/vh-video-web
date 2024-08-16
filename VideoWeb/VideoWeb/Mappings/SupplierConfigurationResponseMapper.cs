using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings
{
    public static class SupplierConfigurationResponseMapper
    {
        public static SupplierConfigurationResponse Map(this SupplierConfiguration configuration) =>
            new()
            {
                JoinByPhoneFromDate = configuration.JoinByPhoneFromDate,
                TurnServer = configuration.TurnServer,
                TurnServerUser = configuration.TurnServerUser,
                TurnServerCredential = configuration.TurnServerCredential,
                Supplier = configuration.Supplier
            };
    }
}
