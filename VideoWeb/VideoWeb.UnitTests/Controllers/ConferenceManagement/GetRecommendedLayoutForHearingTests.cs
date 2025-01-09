using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using FluentAssertions;
using VideoApi.Client;
using Microsoft.AspNetCore.Http;
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    [TestFixture]
    class GetRecommendedLayoutForHearingTests
    {
        private Conference _conference;
        private Participant _judgeParticipant; 
        private AutoMock _mocker;
        private ConferenceManagementController _sut;

        [SetUp]
        public void SetUp()
        {
            _judgeParticipant = new Participant
            {
                Id = Guid.NewGuid(),
                Username = "first last"
            };

            _conference = new Conference()
            {
                Id = Guid.NewGuid(),
                Participants = new List<Participant>
                {
                    _judgeParticipant
                }
            };

            _mocker = AutoMock.GetLoose();
            _sut = _mocker.Create<ConferenceManagementController>();
            
            _sut.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipalBuilder()
                        .WithUsername(_judgeParticipant.Username)
                        .WithRole(AppRoles.JudgeRole).Build()
                }
            };
        }

        [Test]
        public async Task should_return_ok_with_the_recommended_layout()
        {
            // Arrange
            var expectedLayout = _conference.GetRecommendedLayout();
            
            _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.Is<Guid>(y => y == _conference.Id), It.IsAny<CancellationToken>())).ReturnsAsync(_conference);

            // Act
            var layoutResponse = await _sut.GetRecommendedLayoutForHearing(_conference.Id, CancellationToken.None);

            // Assert
            layoutResponse.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().Be(expectedLayout);
        }
    }
}
