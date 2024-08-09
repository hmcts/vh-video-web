using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class ClientSettingsResponseMapperTests 
    {
        [TestCase("kinly")]
        [TestCase("vodafone")]
        public void Should_map_all_properties(string supplier)
        {
            var azureAdConfiguration = Builder<AzureAdConfiguration>.CreateNew()
                .With(x => x.ApplicationInsights = Builder<ApplicationInsightsConfiguration>.CreateNew().Build())
                .Build();

            var ejudAdConfiguration = Builder<EJudAdConfiguration>.CreateNew()
                .Build();
            
            var dom1Configuration = Builder<Dom1AdConfiguration>.CreateNew()
                .Build();

            var servicesConfiguration = Builder<HearingServicesConfiguration>.CreateNew().Build();
            
            SupplierConfiguration supplierConfiguration = supplier == "kinly"
                ? Builder<KinlyConfiguration>.CreateNew().Build()
                : Builder<VodafoneConfiguration>.CreateNew().Build();

            var response = ClientSettingsResponseMapper.Map(azureAdConfiguration, ejudAdConfiguration, dom1Configuration, servicesConfiguration, supplierConfiguration, supplier);

            response.AppInsightsConnectionString.Should().Be(azureAdConfiguration.ApplicationInsights.ConnectionString);
            response.EventHubPath.Should().Be(servicesConfiguration.EventHubPath);
            response.SupplierTurnServer.Should().Be(supplierConfiguration.TurnServer);
            response.SupplierTurnServerUser.Should().Be(supplierConfiguration.TurnServerUser);
            response.SupplierTurnServerCredential.Should().Be(supplierConfiguration.TurnServerCredential);
            response.JoinByPhoneFromDate.Should().Be(supplierConfiguration.JoinByPhoneFromDate);
            response.Supplier.Should().Be(supplier);
        }
    }
}
