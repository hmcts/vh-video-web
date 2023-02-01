using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Services;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public class SetVideoControlStatusesForConferenceTests
    {
        private class FakeMapper : IMapTo<SetConferenceVideoControlStatusesRequest, ConferenceVideoControlStatuses>
        {
            public ConferenceVideoControlStatuses ReturnValue { get; set; } = null;
            public ConferenceVideoControlStatuses Map(SetConferenceVideoControlStatusesRequest input)
            {
                return ReturnValue;
            }
        }
        
        private AutoMock _mocker;
        private ConferenceStatusController _sut;
        private FakeMapper _fakeMapper;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _sut = _mocker.Create<ConferenceStatusController>();
            _fakeMapper = new FakeMapper();
        }

        [Test]
        public async Task should_update_the_statuses_for_the_conference_and_return_accepted()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var conferenceVideoControlStatusesRequest = new SetConferenceVideoControlStatusesRequest()
            {
                ParticipantIdToVideoControlStatusMap = new Dictionary<string, SetConferenceVideoControlStatusesRequest.VideoControlStatusRequest>()
            };
            
            var conferenceVideoControlStatuses = new ConferenceVideoControlStatuses()
            {
                ParticipantIdToVideoControlStatusMap = new Dictionary<string, VideoControlStatus>()
            };

            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<SetConferenceVideoControlStatusesRequest, ConferenceVideoControlStatuses>())
                .Returns(_fakeMapper);

            _fakeMapper.ReturnValue = conferenceVideoControlStatuses;
            
            // Act
            var response = await _sut.SetVideoControlStatusesForConference(conferenceId, conferenceVideoControlStatusesRequest);

            // Assert
            _mocker.Mock<IConferenceVideoControlStatusService>().Verify(x => x.SetVideoControlStateForConference(conferenceId, It.Is<ConferenceVideoControlStatuses>(y => y.ParticipantIdToVideoControlStatusMap == conferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap)), Times.Once);
            response.Should().BeAssignableTo<AcceptedResult>();
        }

        [Test]
        public async Task should_update_the_statuses_for_the_conference_and_return_accepted_when_parameter_is_null()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var map = new Dictionary<Guid, VideoControlStatus>();

            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<SetConferenceVideoControlStatusesRequest, ConferenceVideoControlStatuses>())
                .Returns(_fakeMapper);

            _fakeMapper.ReturnValue = null;
            
            // Act
            var response = await _sut.SetVideoControlStatusesForConference(conferenceId, null);

            // Assert
            _mocker.Mock<IConferenceVideoControlStatusService>().Verify(x => x.SetVideoControlStateForConference(conferenceId, null), Times.Once);
            response.Should().BeAssignableTo<AcceptedResult>();
        }

        [Test]
        public async Task SetVideoControlStatusesForConference_When_Exception_is_thrown_by_SetVideoControlStateForConference()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var map = new Dictionary<Guid, VideoControlStatus>();

            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<SetConferenceVideoControlStatusesRequest, ConferenceVideoControlStatuses>())
                .Returns(_fakeMapper);

            _fakeMapper.ReturnValue = null;
            _mocker.Mock<IConferenceVideoControlStatusService>().Setup(x => x.SetVideoControlStateForConference(It.IsAny<Guid>(), It.IsAny<ConferenceVideoControlStatuses>())).Throws<Exception>();

            // Act
            Assert.ThrowsAsync<Exception>(async () => await _sut.SetVideoControlStatusesForConference(conferenceId, null));
        }
    }
}
