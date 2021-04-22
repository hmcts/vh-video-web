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

            var servicesConfiguration = Builder<HearingServicesConfiguration>.CreateNew().Build();
            var kinlyConfiguration = Builder<KinlyConfiguration>.CreateNew().Build();

            var response = _sut.Map(azureAdConfiguration, ejudAdConfiguration, servicesConfiguration, kinlyConfiguration);

            response.AppInsightsInstrumentationKey.Should().Be(azureAdConfiguration.ApplicationInsights.InstrumentationKey);
            response.EventHubPath.Should().Be(servicesConfiguration.EventHubPath);
            response.KinlyTurnServer.Should().Be(kinlyConfiguration.TurnServer);
            response.KinlyTurnServerUser.Should().Be(kinlyConfiguration.TurnServerUser);
            response.KinlyTurnServerCredential.Should().Be(kinlyConfiguration.TurnServerCredential);
            response.JoinByPhoneFromDate.Should().Be(kinlyConfiguration.JoinByPhoneFromDate);
        }
    }
}
