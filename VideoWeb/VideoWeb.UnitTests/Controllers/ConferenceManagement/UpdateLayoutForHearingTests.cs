using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using FluentAssertions;
using VideoApi.Client;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using VideoWeb.UnitTests.Builders;
using System.Net;
using VideoWeb.Helpers;
using VideoWeb.EventHub.Services;
using FizzWare.NBuilder;
using System.Linq;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    [TestFixture]
    class UpdateLayoutForHearingTests
    {
        private Conference _conference;
        private Participant _judgeParticipant; 
        private AutoMock _mocker;
        private ConferenceManagementController _sut;

        [SetUp]
        public void SetUp()
        {
            var participants = Builder<Participant>.CreateListOfSize(5).TheFirst(1).With(x => x.Role = Role.Judge).TheNext(1).With(x => x.Role = Role.StaffMember).TheRest().With(x => x.Role = Role.Individual).Build().ToList();
            _judgeParticipant = participants.Single(x => x.Role == Role.Judge);
            _conference = Builder<Conference>.CreateNew().With(x => x.Participants = participants).Build();

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

            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(y => y == _conference.Id), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ReturnsAsync(_conference);
        }

        [Test]
        public async Task should_return_ok_when_the_hearing_layout_was_updated()
        {
            // Arrange
            var expectedLayout = HearingLayout.TwoPlus21;

            // Act
            var layoutResponse = await _sut.UpdateLayoutForHearing(_conference.Id, expectedLayout);

            // Assert
            layoutResponse.Should().BeAssignableTo<OkResult>();
            _mocker.Mock<IHearingLayoutService>().Verify(x => x.UpdateLayout(It.Is<Guid>(x => x == _conference.Id), It.Is<Guid>(x => x == _judgeParticipant.Id), expectedLayout), Times.Once);
        }

        [Test]
        public async Task should_return_a_404_if_the_participant_cannot_be_found_in_the_conference()
        {
            // Arrange
            var expectedLayout = HearingLayout.TwoPlus21;
            var conference = new Conference
            {
                Id = Guid.NewGuid(),
                Participants = new List<Participant>()
            };

            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(y => y == conference.Id), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ReturnsAsync(conference);

            // Act
            var layoutResponse = await _sut.UpdateLayoutForHearing(conference.Id, expectedLayout);

            // Assert
            layoutResponse.Should().BeAssignableTo<NotFoundObjectResult>();
        }

        [Test]
        public async Task should_return_an_status_code_if_a_video_api_exception_is_thrown_in_hearing_service()
        {
            // Arrange
            var expectedLayout = HearingLayout.TwoPlus21;
            var statusCode = 123;


            _mocker.Mock<IHearingLayoutService>().Setup(x => x.UpdateLayout(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<HearingLayout>())).ThrowsAsync(new VideoApiException("message", statusCode, "response", null, null));

            // Act
            var layoutResponse = await _sut.UpdateLayoutForHearing(_conference.Id, expectedLayout);

            // Assert
            layoutResponse.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(statusCode);
            _mocker.Mock<IHearingLayoutService>().Verify(x => x.UpdateLayout(It.Is<Guid>(x => x == _conference.Id), It.Is<Guid>(x => x == _judgeParticipant.Id), expectedLayout));
        }

        [Test]
        public async Task should_return_an_internal_server_error_if_an_exception_is_thrown_in_hearing_service()
        {
            // Arrange
            var expectedLayout = HearingLayout.TwoPlus21;
            var statusCode = (int)HttpStatusCode.InternalServerError;

            _mocker.Mock<IHearingLayoutService>().Setup(x => x.UpdateLayout(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<HearingLayout>())).ThrowsAsync(new Exception());

            // Act
            Assert.ThrowsAsync<Exception>(async () => await _sut.UpdateLayoutForHearing(_conference.Id, expectedLayout));
            
            // Assert
            _mocker.Mock<IHearingLayoutService>().Verify(x => x.UpdateLayout(It.Is<Guid>(x => x == _conference.Id), It.Is<Guid>(x => x == _judgeParticipant.Id), expectedLayout));
        }
    }
}
