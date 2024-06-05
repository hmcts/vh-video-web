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
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;
using VideoWeb.UnitTests.Controllers.ConsultationController;

namespace VideoWeb.UnitTests.Controllers.EndpointController
{
    public class GetEndpointsLinkedToUserTests
    {
        private AutoMock _mocker;
        private EndpointsController _controller;
        private ConferenceDto _testConferenceDto;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<EndpointDto, AllowedEndpointResponse>()).Returns(_mocker.Create<AllowedEndpointResponseMapper>());
            _testConferenceDto = ConsultationHelper.BuildConferenceForTest();
            _mocker.Mock<IConferenceService>()
                .Setup(x => x.GetConference(It.Is<Guid>(id => id == _testConferenceDto.Id)))
                .ReturnsAsync(_testConferenceDto);

            _controller = _mocker.Create<EndpointsController>();
            
            var cache = _mocker.Mock<IConferenceCache>();
            _mocker.Mock<IConferenceService>().Setup(x => x.ConferenceCache).Returns(cache.Object);
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
            var conferenceId = _testConferenceDto.Id;
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
        [TestCase("judge@hmcts.net", 3)]
        [TestCase("staffmember@hmcts.net", 3)]
        public async Task Should_return_ok_with_linked_endpoints(string username, int expectedCount)
        {
            // Arrange
            var conferenceId = _testConferenceDto.Id;
            SetupLoginAs(username);

            // Act
            var result = await _controller.GetEndpointsLinkedToUser(conferenceId);

            // Assert
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var allowedEndpoints = typedResult.Value as List<AllowedEndpointResponse>;
            allowedEndpoints.Count.Should().Be(expectedCount);
        }
        
        [Test]
        public async Task Should_throw_not_authorized_if_user_claims_null()
        {
            var context = new ControllerContext { HttpContext = new DefaultHttpContext() };
            _controller.ControllerContext = context;
            Func<Task> action = async () => await _controller.GetEndpointsLinkedToUser(Guid.NewGuid());
            await action.Should().ThrowAsync<UnauthorizedAccessException>();
        }
    }
}
