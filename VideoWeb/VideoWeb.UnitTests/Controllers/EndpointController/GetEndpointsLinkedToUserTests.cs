using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using VideoWeb.UnitTests.Controllers.ConsultationController;
using Endpoint = VideoWeb.Common.Models.Endpoint;

namespace VideoWeb.UnitTests.Controllers.EndpointController
{
    public class GetEndpointsLinkedToUserTests
    {
        private AutoMock _mocker;
        private EndpointsController _controller;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Endpoint, AllowedEndpointResponse>()).Returns(_mocker.Create<AllowedEndpointResponseMapper>());
            _testConference = ConsultationHelper.BuildConferenceForTest();

            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(_testConference.Id,
                        It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);

            _controller = _mocker.Create<EndpointsController>();
        }

        private void SetupLoginAs(string username)
        {
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.RepresentativeRole)
                .WithUsername(username).Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = cp
                }
            };

            _controller.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_ok()
        {
            // Arrange
            var conferenceId = _testConference.Id;
            SetupLoginAs("NoEndpointUser@hmcts.net");

            // Act
            var result = await _controller.GetEndpointsLinkedToUser(conferenceId);

            // Assert
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var allowedEndpoints = typedResult.Value as List<AllowedEndpointResponse>;
            allowedEndpoints.Should().BeEmpty();
        }

        [TestCase("rep1@hmcts.net", 1)]
        [TestCase("john@hmcts.net", 2)]
        [TestCase("NoEndpointUser@hmcts.net", 0)]
        public async Task Should_return_ok_with_linked_endpoints(string username, int expectedCount)
        {
            // Arrange
            var conferenceId = _testConference.Id;
            SetupLoginAs(username);

            // Act
            var result = await _controller.GetEndpointsLinkedToUser(conferenceId);

            // Assert
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var allowedEndpoints = typedResult.Value as List<AllowedEndpointResponse>;
            allowedEndpoints.Count.Should().Be(expectedCount);
        }
    }
}
