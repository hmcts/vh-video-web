using System;
using System.Collections.Generic;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceForVhOfficerResponseMapperTests
    {
        private ConferenceForVhOfficerResponseMapper _sut;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var parameters = new ParameterBuilder(_mocker).AddTypedParameters<ParticipantForUserResponseMapper>().Build();
            _sut = _mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters);
        }

        [Test]
        public void Should_map_all_properties()
        {
            var conference = Builder<ConferenceForAdminResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.HearingRefId = Guid.NewGuid())
                .Build();

            var participants = new List<ParticipantSummaryResponse>
            {
                new ParticipantSummaryResponseBuilder(UserRole.Individual)
                    .WithStatus(ParticipantState.Available).Build(),
                new ParticipantSummaryResponseBuilder(UserRole.Representative)
                    .WithStatus(ParticipantState.Disconnected).Build(),
                new ParticipantSummaryResponseBuilder(UserRole.Judge)
                    .WithStatus(ParticipantState.NotSignedIn).Build()
            };

            conference.Participants = participants;

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.CaseName);
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.CaseType.Should().Be(conference.CaseType);
            response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
            response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
            response.Status.ToString().Should().Be(conference.Status.ToString());
            response.HearingVenueName.Should().Be(conference.HearingVenueName);
            response.Participants.Count.Should().Be(participants.Count);
            response.StartedDateTime.Should().Be(conference.StartedDateTime);
            response.ClosedDateTime.Should().Be(conference.ClosedDateTime);
            response.TelephoneConferenceId.Should().Be(conference.TelephoneConferenceId);
            response.TelephoneConferenceNumber.Should().Be(conference.TelephoneConferenceNumber);
        }
    }
}
