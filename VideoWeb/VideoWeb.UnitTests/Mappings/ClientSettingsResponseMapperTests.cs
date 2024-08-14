using System.Collections.Generic;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class ClientSettingsResponseMapperTests : BaseMockerSutTestSetup<ClientSettingsResponseMapper>
    {
        [Test]
        public void Should_map_all_properties()
        {
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<IdpConfiguration, IdpSettingsResponse>())
                .Returns(_mocker.Create<IdpSettingsResponseMapper>());
            var azureAdConfiguration = Builder<AzureAdConfiguration>.CreateNew()
                .With(x => x.ApplicationInsights = Builder<ApplicationInsightsConfiguration>.CreateNew().Build())
                .Build();

            var ejudAdConfiguration = Builder<EJudAdConfiguration>.CreateNew()
                .Build();
            
            var dom1Configuration = Builder<Dom1AdConfiguration>.CreateNew()
                .Build();

            var servicesConfiguration = Builder<HearingServicesConfiguration>.CreateNew().Build();
            var kinlyConfiguration = Builder<KinlyConfiguration>.CreateNew().Build();
            var vodafoneConfiguration = Builder<VodafoneConfiguration>.CreateNew().Build();
            var supplierConfigs = new List<SupplierConfiguration>
            {
                kinlyConfiguration,
                vodafoneConfiguration
            };

            var response = _sut.Map(azureAdConfiguration, ejudAdConfiguration, dom1Configuration, servicesConfiguration, supplierConfigs);

            response.AppInsightsConnectionString.Should().Be(azureAdConfiguration.ApplicationInsights.ConnectionString);
            response.EventHubPath.Should().Be(servicesConfiguration.EventHubPath);
            response.SupplierSettings.Should().NotBeNull();
            response.SupplierSettings.Count.Should().Be(supplierConfigs.Count);
            foreach (var supplierConfigResponse in response.SupplierSettings)
            {
                var supplierConfig = supplierConfigs.Find(x => x.Supplier.ToString().ToLower() == supplierConfigResponse.Supplier);
                supplierConfig.Should().NotBeNull();
                supplierConfigResponse.Should().BeEquivalentTo(supplierConfig.Map());
            }
        }
    }
}
