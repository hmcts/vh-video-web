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
                .With(x => x.Hearing_ref_id = Guid.NewGuid())
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
            response.CaseName.Should().Be(conference.Case_name);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.CaseType.Should().Be(conference.Case_type);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time);
            response.ScheduledDuration.Should().Be(conference.Scheduled_duration);
            response.Status.ToString().Should().Be(conference.Status.ToString());
            response.HearingVenueName.Should().Be(conference.Hearing_venue_name);
            response.Participants.Count.Should().Be(participants.Count);
            response.StartedDateTime.Should().Be(conference.Started_date_time);
            response.ClosedDateTime.Should().Be(conference.Closed_date_time);
            response.TelephoneConferenceId.Should().Be(conference.Telephone_conference_id);
            response.TelephoneConferenceNumber.Should().Be(conference.Telephone_conference_number);
            response.CreatedDateTime.Should().Be(conference.Created_date_time);
        }
    }
}
