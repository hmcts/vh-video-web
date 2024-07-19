using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public class CallParticipantTests : ConferenceManagementControllerTestBase
    {
        [SetUp]
        public void Setup()
        {
            TestConference = BuildConferenceForTest(true);
        }

        [Test]
        public async Task should_return_unauthorised_if_participant_is_not_a_witness_or_quick_link_user()
        {
            var judge = TestConference.GetJudge();
            var invalidParticipants = TestConference.Participants.Where(x => !x.IsJudge() && !x.IsWitness() && !x.IsQuickLinkUser() && x.LinkedParticipants.Count == 0);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var controller = SetupControllerWithClaims(user);

            foreach(var participant in invalidParticipants)
            {
                var result = await controller.CallParticipantAsync(TestConference.Id, participant.Id, CancellationToken.None);
                result.Should().BeOfType<UnauthorizedObjectResult>();
                var typedResult = (UnauthorizedObjectResult)result;
                typedResult.Should().NotBeNull();
                typedResult.Value.Should().Be("Participant is not callable");

                _mocker.Mock<IVideoApiClient>().Verify(
                    x => x.TransferParticipantAsync(TestConference.Id,
                        It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);
            }
            
        }

        [Test]
        public async Task
            should_return_accepted_if_participant_is_not_a_witness_or_quick_link_user_when_vodafone_toggle_is_on()
        {
            // arrange
            var judge = TestConference.GetJudge();
            var nonWitnessOrQlParticipants = TestConference.Participants.Where(x =>
                !x.IsJudge() && !x.IsWitness() && !x.IsQuickLinkUser() && x.LinkedParticipants.Count == 0);

            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var controller = SetupControllerWithClaims(user);
            _mocker.Mock<IFeatureToggles>().Setup(x => x.Vodafone()).Returns(true);
            
            // act & assert
            foreach (var participant in nonWitnessOrQlParticipants)
            {
                var result = await controller.CallParticipantAsync(TestConference.Id, participant.Id, CancellationToken.None);
                result.Should().BeOfType<AcceptedResult>();

                _mocker.Mock<IVideoApiClient>().Verify(
                    x => x.TransferParticipantAsync(TestConference.Id,
                        It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Once);
            }
        }

        [Test]
        public async Task should_return_unauthorised_if_participant_does_not_exists()
        {
            var judge = TestConference.GetJudge();
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var controller = SetupControllerWithClaims(user);

            var result = await controller.CallParticipantAsync(TestConference.Id, Guid.NewGuid(), CancellationToken.None);
            result.Should().BeOfType<UnauthorizedObjectResult>();
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("Participant is not callable");

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.IsAny<TransferParticipantRequest>()), Times.Never);
        }

        [Test]
        public async Task should_return_unauthorised_if_not_judge_conference()
        {
            var participant = TestConference.Participants.First(x => !x.IsJudge());
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.CitizenRole).Build();

            var controller = SetupControllerWithClaims(user);

            var result = await controller.CallParticipantAsync(TestConference.Id, participant.Id, CancellationToken.None);
            result.Should().BeOfType<UnauthorizedObjectResult>();
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be either Judge or StaffMember.");

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);
        }

        [Test]
        public async Task should_return_accepted_when_participant_is_witness_and_judge_is_in_conference()
        {
            var judge = TestConference.GetJudge();
            var witness = TestConference.Participants.First(x => x.IsWitness() && !x.LinkedParticipants.Any());
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var controller = SetupControllerWithClaims(user);

            var result = await controller.CallParticipantAsync(TestConference.Id, witness.Id, CancellationToken.None);
            result.Should().BeOfType<AcceptedResult>();
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == witness.Id && r.TransferType == TransferType.Call), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Test]
        public async Task should_return_accepted_when_participant_is_witness_and_has_an_interpreter_and_judge_is_in_conference()
        {
            var judge = TestConference.GetJudge();
            var witness = TestConference.Participants.First(x => x.IsWitness() && x.LinkedParticipants.Any());
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var controller  = SetupControllerWithClaims(user);

            var result = await controller.CallParticipantAsync(TestConference.Id, witness.Id, CancellationToken.None);
            result.Should().BeOfType<AcceptedResult>();
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == witness.Id && r.TransferType == TransferType.Call), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Test]
        public async Task should_return_accepted_when_participant_is_witness_and_has_an_interpreter_and_witness_is_not_in_the_cache_but_returned_from_api()
        {
            var judge = TestConference.GetJudge();
            var witness = TestConference.Participants.First(x => x.IsWitness() && x.LinkedParticipants.Any());
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            
            

            var controller  = SetupControllerWithClaims(user);
            
            var requriedConferenceCache = new Conference
            {
                Id = TestConference.Id,
                Participants = TestConference.Participants,
                CivilianRooms = [new CivilianRoom { Participants = TestConference.CivilianRooms[0].Participants.Select(p => p).ToList() }]
            };
            
            // Remove witness from the cache
            TestConference.CivilianRooms[0].Participants.Remove(witness.Id);
            
            _mocker.Mock<IConferenceService>().Setup(x => x.ForceGetConference(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(requriedConferenceCache);
            
            var result = await controller.CallParticipantAsync(TestConference.Id, witness.Id, CancellationToken.None);
            result.Should().BeOfType<AcceptedResult>();
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == witness.Id && r.TransferType == TransferType.Call), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Test]
        public async Task Should_return_unauthorized_when_participant_is_witness_and_has_an_interpreter_and_witness_is_not_in_the_room()
        {
            var judge = TestConference.GetJudge();
            var witness = TestConference.Participants.First(x => x.IsWitness() && x.LinkedParticipants.Any());
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var controller  = SetupControllerWithClaims(user);

            // Remove witness from the cache
            TestConference.CivilianRooms[0].Participants.Remove(witness.Id);
            
            _mocker.Mock<IConferenceService>().Setup(x => x.ForceGetConference(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(TestConference);
            
            var result = await controller.CallParticipantAsync(TestConference.Id, witness.Id, CancellationToken.None);
            result.Should().BeOfType<UnauthorizedObjectResult>();
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("Participant is not callable");
        }

        [Test]
        public async Task should_return_unauthorised_when_witness_is_called_before_interpreter_joins()
        {
            var judge = TestConference.GetJudge();
            var interpreterRoom = TestConference.CivilianRooms[0];
            var witnessIds = TestConference.Participants
                .Where(p => p.IsWitness() && p.LinkedParticipants.Any())
                .Select(p => p.Id).ToList();
            // update room to not include interpreter
            interpreterRoom.Participants = interpreterRoom.Participants.Where(p => witnessIds.Contains(p)).ToList();
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.CallParticipantAsync(TestConference.Id, witnessIds[0], CancellationToken.None);

            result.Should().BeOfType<UnauthorizedObjectResult>();
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("Participant is not callable");
        }
        
        [TestCase(Role.QuickLinkObserver)]
        [TestCase(Role.QuickLinkParticipant)]
        public async Task should_return_accepted_when_participant_is_quick_link_user_and_judge_is_in_conference(Role role)
        {
            var judge = TestConference.GetJudge();
            var quickLinkUser = TestConference.Participants.First(x => x.Role == role);

            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.CallParticipantAsync(TestConference.Id, quickLinkUser.Id, CancellationToken.None);
            result.Should().BeOfType<AcceptedResult>();
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == quickLinkUser.Id && r.TransferType == TransferType.Call), It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
