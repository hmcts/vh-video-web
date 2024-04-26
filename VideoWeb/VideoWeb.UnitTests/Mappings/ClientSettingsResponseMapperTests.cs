using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class ClientSettingsResponseMapperTests : BaseMockerSutTestSetup<ClientSettingsResponseMapper>
    {
        [TestCase("kinly")]
        [TestCase("vodafone")]
        public void Should_map_all_properties(string supplier)
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

            if (supplier == "vodafone")
                _mocker.Mock<IFeatureToggles>().Setup(x => x.Vodafone()).Returns(true);
            else
                _mocker.Mock<IFeatureToggles>().Setup(x => x.Vodafone()).Returns(false);

            var servicesConfiguration = Builder<HearingServicesConfiguration>.CreateNew().Build();
            var kinlyConfiguration = Builder<KinlyConfiguration>.CreateNew().Build();

            var response = _sut.Map(azureAdConfiguration, ejudAdConfiguration, dom1Configuration, servicesConfiguration, kinlyConfiguration);

            response.AppInsightsConnectionString.Should().Be(azureAdConfiguration.ApplicationInsights.ConnectionString);
            response.EventHubPath.Should().Be(servicesConfiguration.EventHubPath);
            response.SupplierTurnServer.Should().Be(kinlyConfiguration.TurnServer);
            response.SupplierTurnServerUser.Should().Be(kinlyConfiguration.TurnServerUser);
            response.SupplierTurnServerCredential.Should().Be(kinlyConfiguration.TurnServerCredential);
            response.JoinByPhoneFromDate.Should().Be(kinlyConfiguration.JoinByPhoneFromDate);
            response.Supplier.Should().Be(supplier);
        }
    }
}
