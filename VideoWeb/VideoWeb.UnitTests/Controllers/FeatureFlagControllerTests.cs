using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Configuration;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using System.Threading.Tasks;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers
{
    public class FeatureFlagControllerTests
    {
        private AutoMock _mocker;
        private FeatureFlagController _controller;

        [SetUp]
        public void Setup()
        {

            _mocker = AutoMock.GetLoose();
            _controller = _mocker.Create<FeatureFlagController>();
        }

        [Test]
        public async Task GetFeatureFlag_Should_Return_True_For_StaffMemberFeature()
        {
            _mocker.Mock<IBookingsApiClient>()
                .Setup(p => p.GetFeatureFlagAsync(It.Is<string>(p => p == nameof(FeatureFlags.StaffMemberFeature))))
                .ReturnsAsync(true);

            var result = await _controller.GetFeatureFlag(nameof(FeatureFlags.StaffMemberFeature));

            result.Value.Should().BeTrue();
        }

        [Test]
        public async Task GetFeatureFlag_Should_Return_False_For_EjudFeature()
        {
            _mocker.Mock<IBookingsApiClient>()
                .Setup(p => p.GetFeatureFlagAsync(It.Is<string>(p => p == nameof(FeatureFlags.EJudFeature))))
                .ReturnsAsync(false);

            var result = await _controller.GetFeatureFlag(nameof(FeatureFlags.EJudFeature));

            result.Value.Should().BeFalse();
        }
    }
}
