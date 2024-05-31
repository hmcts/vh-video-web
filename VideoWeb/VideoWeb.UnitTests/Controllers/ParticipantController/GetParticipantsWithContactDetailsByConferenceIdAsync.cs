using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Requests;
using VideoWeb.UnitTests.Builders;
using VideoApi.Contract.Enums;
using VideoWeb.Services;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;
using ParticipantInHearingResponse = VideoApi.Contract.Responses.ParticipantInHearingResponse;
using ParticipantState = VideoApi.Contract.Enums.ParticipantState;
using ParticipantSummaryResponse = VideoApi.Contract.Responses.ParticipantSummaryResponse;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class GetParticipantsWithContactDetailsByConferenceIdAsyncTests
    {
        private AutoMock _mocker;
        private EventComponentHelper _eventComponentHelper;
        private List<Participant> _participants;
        private ParticipantsController _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _eventComponentHelper = new EventComponentHelper();

            var judge = CreateParticipant("Judge", "Judge");
            var individual = CreateParticipant("Individual", "Claimant");
            var interpreter = CreateParticipant("Interpreter", "Claimant");
            var representative = CreateParticipant("Representative", "Defendant");
            individual.LinkedParticipants.Add(new LinkedParticipant{LinkedId = interpreter.Id, LinkType = LinkType.Interpreter});
            interpreter.LinkedParticipants.Add(new LinkedParticipant{LinkedId = individual.Id, LinkType = LinkType.Interpreter});
            
            _participants = new List<Participant>
            {
                judge, individual, representative, interpreter
            };

            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole).Build();
            _sut = SetupControllerWithClaims(claimsPrincipal);
        }
        
        [Test]
        public async Task Should_return_ok_when_user_is_an_admin()
        {
            var conferenceId = Guid.NewGuid();
            var conference = CreateValidConference(conferenceId);
            
            conference.Participants = _participants;
            
            var participantsResponse = MapParticipantToResponse(conferenceId);
            
            
            _mocker.Mock<IParticipantService>()
                .Setup(x => x.GetParticipantsWithContactDetailsByConferenceIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(participantsResponse);

            var result = await _sut.GetParticipantsWithContactDetailsByConferenceIdAsync(conference.Id);
            var typedResult = result as OkObjectResult;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().NotBeNull();
            typedResult.Value.Should().BeAssignableTo<IEnumerable<ParticipantContactDetailsResponseVho>>();
            var results = ((IEnumerable<ParticipantContactDetailsResponseVho>)typedResult.Value).ToList();
            results.Should().NotBeNullOrEmpty();
            results.Count.Should().Be(_participants.Count);

            // Individual
            AssertResponseItem(results.ElementAt(1), conference.Participants[1], conferenceId, false);
            // Interpreter
            AssertResponseItem(results.ElementAt(3), conference.Participants[3], conferenceId, false);
            // Representative
            AssertResponseItem(results.ElementAt(2), conference.Participants[2], conferenceId, false);
            // Judge
            AssertResponseItem(results.ElementAt(0), conference.Participants[0], conferenceId, true);
        }

        [Test]
        public async Task Should_return_bad_request_when_conferenceId_empty()
        {
            var result = await _sut.GetParticipantsWithContactDetailsByConferenceIdAsync(Guid.Empty);
            
            var typedResult = (BadRequestObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
        
        [Test]
        public async Task Should_throw_error_when_get_video_api_throws_error()
        {
            var conferenceId = Guid.NewGuid();
            
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id and participant Id", null, default, null);
            _mocker.Mock<IParticipantService>().Setup(x => x.GetParticipantsWithContactDetailsByConferenceIdAsync(conferenceId))
                //.Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ThrowsAsync(apiException);
        
            var result = await _sut.GetParticipantsWithContactDetailsByConferenceIdAsync(conferenceId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        private static void AssertResponseItem(ParticipantContactDetailsResponseVho response, Participant participant, 
            Guid conferenceId, bool isInAnotherHearing)
        {
            response.Id.Should().Be(participant.Id);
            response.ConferenceId.Should().Be(conferenceId);
            response.Name.Should().Be(participant.Name);
            response.Role.Should().Be(participant.Role);
            response.HearingRole.Should().Be(participant.HearingRole);
            response.Username.Should().Be(participant.Username);
            response.CaseTypeGroup.Should().Be(participant.CaseTypeGroup);
            response.RefId.Should().Be(participant.RefId);
            response.FirstName.Should().Be(participant.FirstName);
            response.LastName.Should().Be(participant.LastName);
            response.DisplayName.Should().Be(participant.DisplayName);
            response.Status.Should().Be(participant.ParticipantStatus);
            response.ContactEmail.Should().Be(participant.ContactEmail);
            response.ContactTelephone.Should().Be(participant.ContactTelephone);
            response.HearingVenueName.Should().Be("MyVenue");
            response.HostInAnotherHearing.Should().Be(isInAnotherHearing);
            response.Representee.Should().Be(participant.Representee);
        }
        
        private List<ParticipantContactDetailsResponseVho> MapParticipantToResponse(Guid conferenceId)
        {
            var participants = _participants.Select(x =>
            {
                return new ParticipantContactDetailsResponseVho
                {
                    Id = x.Id,
                    ConferenceId = conferenceId,
                    Name = x.Name,
                    Role = x.Role,
                    HearingRole = x.HearingRole,
                    Username = x.Username,
                    CaseTypeGroup = x.CaseTypeGroup,
                    RefId = x.RefId,
                    FirstName = x.FirstName,
                    LastName = x.LastName,
                    DisplayName = x.DisplayName,
                    Status = x.ParticipantStatus,
                    ContactEmail = x.ContactEmail,
                    ContactTelephone = x.ContactTelephone,
                    HearingVenueName = "MyVenue",
                    Representee = x.Representee,
                    HostInAnotherHearing = false,
                    LinkedParticipants = x.LinkedParticipants.Select(y=> new LinkedParticipantResponse
                    {
                        LinkedId = y.LinkedId,
                        LinkType = y.LinkType
                    }).ToList()
                };
            }).ToList();
            
            participants[0].HostInAnotherHearing = true;
            return participants;
        }
        
        private static Participant CreateParticipant(string username, string caseTypeGroup)
        {
            return Builder<Participant>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Name = username)
                .With(x => x.Role = Role.Judge)
                .With(x => x.Username = username)
                .With(x => x.CaseTypeGroup = caseTypeGroup)
                .With(x => x.RefId = Guid.NewGuid())
                .With(x => x.LinkedParticipants = new List<LinkedParticipant>())
                .With(x => x.DisplayName = $"{username} {username}")
                .Build();
        }

        private static Conference CreateValidConference(Guid conferenceId)
        {
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.HearingId = Guid.NewGuid())
                .With(x => x.HearingVenueName = "MyVenue")
                .Build();
            
            return conference;
        }
        
        private ParticipantsController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Conference, IEnumerable<ParticipantInHearingResponse>, IEnumerable<ParticipantContactDetailsResponseVho>>()).Returns(_mocker.Create<ParticipantStatusResponseForVhoMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<EventType, string>()).Returns(_mocker.Create<EventTypeReasonMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceEventRequest, Conference, CallbackEvent>()).Returns(_mocker.Create<CallbackEventMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<IEnumerable<ParticipantSummaryResponse>, List<ParticipantForUserResponse>>()).Returns(_mocker.Create<ParticipantForUserResponseMapper>());

            var eventHandlerFactory = new EventHandlerFactory(_eventComponentHelper.GetHandlers());
            var parameters = new ParameterBuilder(_mocker)
                .AddObject(eventHandlerFactory)
                .Build();
            var controller = _mocker.Create<ParticipantsController>(parameters);
            controller.ControllerContext = context;
            return controller;
        }
    }
}
