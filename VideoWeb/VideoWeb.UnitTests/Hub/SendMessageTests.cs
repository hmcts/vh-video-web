using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using Moq;
using Microsoft.Extensions.Logging;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Hub;
using UserApi.Contract.Responses;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Requests;
using VideoWeb.UnitTests.Builders;
using VideoWeb.Common.Caching;

namespace VideoWeb.UnitTests.Hub
{
    public class SendMessageTests : EventHubBaseTests
    {
        private static string JudgeUsername => "judge@hmcts.net";
        private static string IndividualUsername => "individual@hmcts.net";
        private static string RepresentativeUsername => "representative@hmcts.net";
        private static string AdminUsername => "admin@hearings.reform.hmcts.net";
        private UserProfile JudgeUserProfile { get; set; }
        private UserProfile IndividualUserProfile { get; set; }
        private UserProfile RepresentativeUserProfile { get; set; }
        private UserProfile AdminUserProfile { get; set; }

        private Mock<IEventHubClient> ConferenceGroupChannel { get; set; }
        private Mock<IEventHubClient> AdminGroupChannel { get; set; }
        private Mock<IEventHubClient> JudgeGroupChannel { get; set; }
        private Mock<IEventHubClient> IndividualGroupChannel { get; set; }
        private Mock<IEventHubClient> RepresentativeGroupChannel { get; set; }

        private List<Mock<IEventHubClient>> ParticipantChannels => new List<Mock<IEventHubClient>>()
            {JudgeGroupChannel, IndividualGroupChannel, RepresentativeGroupChannel};

        private Conference Conference { get; set; }

        private Mock<IConferenceCache> ConferenceCache { get; set; }

        private Guid IndividualParticipantId { get; set; }
        private Guid JudgeParticipantId { get; set; }
        private Guid RepresentativeParticipantId { get; set; }

        [Test]
        public async Task
           should_send_message_to_admin_group_and_participant_group_when_judge_sends_message_to_default_admin()
        {
            SetupSendMessageTests();
            // setup claims to return judge username
            var claims = new ClaimsPrincipalBuilder().WithUsername(JudgeUsername).WithRole(AppRoles.JudgeRole).Build();
            UpdateUserIdentity(claims);

            var fromJudgeId = JudgeParticipantId.ToString();
            var fromUsername = JudgeUsername;
            var toUsername = EventHub.Hub.EventHub.DefaultAdminName;
            const string message = "test message";
            var messageUuid = Guid.NewGuid();

            await Hub.SendMessage(Conference.Id, message, toUsername, messageUuid);

            AssertMessageSentToHub(fromJudgeId, toUsername, message, messageUuid, JudgeGroupChannel);
            AssertMessageSentStatusToApi(fromUsername, toUsername, message, Times.Once());

            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id, toUsername), Times.Never);
        }

        [Test]
        public async Task
            should_send_message_to_admin_group_and_participant_group_when_individual_sends_message_to_default_admin()
        {
            SetupSendMessageTests();
            // setup claims to return individual username
            var claims = new ClaimsPrincipalBuilder().WithUsername(IndividualUsername).WithRole(AppRoles.CitizenRole)
                .Build();
            UpdateUserIdentity(claims);

            var fromIndividualId = IndividualParticipantId.ToString();
            var fromUsername = IndividualUsername;
            var toUsername = EventHub.Hub.EventHub.DefaultAdminName;
            const string message = "test message";
            var messageUuid = Guid.NewGuid();

            await Hub.SendMessage(Conference.Id, message, toUsername, messageUuid);

            AssertMessageSentToHub(fromIndividualId, toUsername, message, messageUuid, IndividualGroupChannel);
            AssertMessageSentStatusToApi(fromUsername, toUsername, message, Times.Once());

            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id, toUsername), Times.Never);
        }

        [Test]
        public async Task should_send_message_to_admin_group_and_participant_group_when_judge_sends_message_to_admin()
        {
            SetupSendMessageTests();
            // setup claims to return judge username
            var claims = new ClaimsPrincipalBuilder().WithUsername(JudgeUsername).WithRole(AppRoles.JudgeRole).Build();
            UpdateUserIdentity(claims);
            var fromJudgeId = JudgeParticipantId.ToString();
            var fromUsername = JudgeUsername;
            var toUsername = AdminUserProfile.UserName;
            const string message = "test message";
            var messageUuid = Guid.NewGuid();

            await Hub.SendMessage(Conference.Id, message, toUsername, messageUuid);

            AssertMessageSentToHub(fromJudgeId, toUsername, message, messageUuid, JudgeGroupChannel);
            AssertMessageSentStatusToApi(fromUsername, toUsername, message, Times.Once());

            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id, toUsername), Times.Never);
        }

        [Test]
        public async Task
            should_send_message_to_admin_group_and_participant_group_when_individual_sends_message_to_admin()
        {
            SetupSendMessageTests();
            // setup claims to return individual username
            var claims = new ClaimsPrincipalBuilder().WithUsername(IndividualUsername).WithRole(AppRoles.CitizenRole)
                .Build();
            UpdateUserIdentity(claims);

            var fromIndividualId = IndividualParticipantId.ToString();
            var fromUsername = IndividualUsername;
            var toUsername = AdminUserProfile.UserName;
            const string message = "test message";
            var messageUuid = Guid.NewGuid();

            await Hub.SendMessage(Conference.Id, message, toUsername, messageUuid);

            AssertMessageSentToHub(fromIndividualId, toUsername, message, messageUuid, IndividualGroupChannel);
            AssertMessageSentStatusToApi(fromUsername, toUsername, message, Times.Once());

            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id, toUsername), Times.Never);
        }

        [Test]
        public async Task Should_send_message_to_conference_group_if_user_is_vho()
        {
            SetupSendMessageTests();
            // setup claims to return admin username
            var claims = new ClaimsPrincipalBuilder().WithUsername(AdminUsername).WithRole(AppRoles.VhOfficerRole)
                .Build();
            UpdateUserIdentity(claims);

            var fromUsername = AdminUsername;
            var toJudgeId = JudgeParticipantId;
            var toUsername = JudgeUsername;
            const string message = "test message";
            var messageUuid = Guid.NewGuid();

            await Hub.SendMessage(Conference.Id, message, toJudgeId.ToString(), messageUuid);

            AssertMessageSentToHub(fromUsername, toJudgeId.ToString(), message, messageUuid, JudgeGroupChannel);
            AssertMessageSentStatusToApi(fromUsername, toUsername, message, Times.Once());

            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id, toJudgeId.ToString()), Times.Once);
        }

        [Test]
        public async Task
            should_not_send_message_to_admin_group_and_participant_group_when_sender_not_in_conference()
        {
            SetupSendMessageTests();
            // setup claims to return judge username
            var claims = new ClaimsPrincipalBuilder().WithUsername(JudgeUsername).WithRole(AppRoles.JudgeRole).Build();
            UpdateUserIdentity(claims);

            var fromParticipantId = Guid.NewGuid().ToString();
            var fromUsername = "does@notexist.com";
            var toUsername = EventHub.Hub.EventHub.DefaultAdminName;
            const string message = "test message";
            var messageUuid = Guid.NewGuid();

            await Hub.SendMessage(Conference.Id, message, toUsername, messageUuid);

            AssertMessageNotSentToHub(fromParticipantId, toUsername, message, messageUuid, JudgeGroupChannel);
            AssertMessageNotSentToApi(fromUsername, toUsername, message);
            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id, toUsername), Times.Never);
        }

        [Test]
        public async Task
            should_not_send_message_to_admin_group_and_participant_group_when_recipient_not_in_conference()
        {
            SetupSendMessageTests();
            // setup claims to return admin username
            var claims = new ClaimsPrincipalBuilder().WithUsername(AdminUsername).WithRole(AppRoles.VhOfficerRole)
                .Build();
            UpdateUserIdentity(claims);

            var fromUsername = AdminUsername;
            var toUsername = "does@notexist.com";
            var toParticipantId = Guid.NewGuid().ToString();
            const string message = "test message";
            var messageUuid = Guid.NewGuid();

            await Hub.SendMessage(Conference.Id, message, toUsername, messageUuid);

            AssertMessageNotSentToHub(fromUsername, toParticipantId, message, messageUuid, JudgeGroupChannel);
            AssertMessageNotSentToApi(fromUsername, toUsername, message);
            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id, toUsername), Times.Never);
        }

        [Test]
        public async Task should_not_send_messages_between_participants()
        {
            SetupSendMessageTests();
            // setup claims to return admin username
            var claims = new ClaimsPrincipalBuilder().WithUsername(RepresentativeUsername)
                .WithRole(AppRoles.RepresentativeRole)
                .Build();
            UpdateUserIdentity(claims);

            var fromParticipantId = RepresentativeParticipantId.ToString();
            var fromUsername = RepresentativeUsername;
            var toParticipantId = IndividualParticipantId.ToString();
            var toUsername = IndividualUsername;
            const string message = "test message";
            var messageUuid = Guid.NewGuid();

            await Hub.SendMessage(Conference.Id, message, toUsername, messageUuid);

            AssertMessageNotSentToHub(fromParticipantId, toParticipantId, message, messageUuid, IndividualGroupChannel);
            AssertMessageNotSentToApi(fromUsername, toUsername, message);
            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id, toUsername), Times.Never);

            LoggerMock.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<InvalidInstantMessageException>(),
                    (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()),
                Times.Once);
        }

        private void AssertMessageSentToHub(string fromUsername, string toUsername, string message,
            Guid messageUuid, Mock<IEventHubClient> userChannel)
        {
            AssertMessageSentStatusToHub(fromUsername, toUsername, message, messageUuid, userChannel,
                Times.Once());

            // ensure other participants didn't receive the message
            var otherParticipantChannels = ParticipantChannels.Where(x => x != userChannel);
            foreach (var channel in otherParticipantChannels)
            {
                channel.Verify(
                    x =>
                        x.ReceiveMessage(Conference.Id, fromUsername, toUsername, message, It.IsAny<DateTime>(),
                            messageUuid),
                    Times.Never);
            }
        }

        private void AssertMessageNotSentToHub(string fromUsername, string toUsername, string message,
            Guid messageUuid, Mock<IEventHubClient> userChannel)
        {
            AssertMessageSentStatusToHub(fromUsername, toUsername, message, messageUuid, userChannel,
                Times.Never());
        }

        private void AssertMessageNotSentToApi(string fromUsername, string toUsername, string message)
        {
            AssertMessageSentStatusToApi(fromUsername, toUsername, message, Times.Never());
        }


        private void AssertMessageSentStatusToHub(string fromUsername, string toUsername, string message,
            Guid messageUuid,
            Mock<IEventHubClient> userChannel, Times times)
        {
            ConferenceGroupChannel.Verify(
                x =>
                    x.ReceiveMessage(Conference.Id, fromUsername, toUsername, message, It.IsAny<DateTime>(),
                        messageUuid),
                times);

            userChannel.Verify(
                x =>
                    x.ReceiveMessage(Conference.Id, fromUsername, toUsername, message, It.IsAny<DateTime>(),
                        messageUuid),
                times);

        }

        private void AssertMessageSentStatusToApi(string fromUsername, string toUsername, string message, Times times)
        {
            VideoApiClientMock.Verify(x => x.AddInstantMessageToConferenceAsync(
                    It.Is<Guid>(c => c == Conference.Id),
                    It.Is<AddInstantMessageRequest>(
                        r => r.From == fromUsername && r.To == toUsername && r.MessageText == message
                    ))
                , times);
        }


        private void SetupSendMessageTests()
        {
            Conference = InitConference();
            AdminUserProfile = InitProfile(AdminUsername, "VhOfficer");
            JudgeUserProfile = InitProfile(JudgeUsername, Role.Judge.ToString());
            IndividualUserProfile = InitProfile(IndividualUsername, Role.Individual.ToString());
            RepresentativeUserProfile = InitProfile(RepresentativeUsername, Role.Representative.ToString());

            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(Conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(Conference);

            ConferenceGroupChannel = new Mock<IEventHubClient>(); // only admins register to this
            JudgeGroupChannel = new Mock<IEventHubClient>();
            IndividualGroupChannel = new Mock<IEventHubClient>();
            RepresentativeGroupChannel = new Mock<IEventHubClient>();
            AdminGroupChannel = new Mock<IEventHubClient>();
            ConferenceCache = new Mock<IConferenceCache>();

            UserProfileServiceMock.Setup(x => x.GetUserAsync(JudgeUsername)).ReturnsAsync(JudgeUserProfile);
            UserProfileServiceMock.Setup(x => x.GetUserAsync(IndividualUsername)).ReturnsAsync(IndividualUserProfile);
            UserProfileServiceMock.Setup(x => x.GetUserAsync(RepresentativeUsername))
                .ReturnsAsync(RepresentativeUserProfile);
            UserProfileServiceMock.Setup(x => x.GetUserAsync(AdminUsername)).ReturnsAsync(AdminUserProfile);

            var judge = Conference.GetJudge();
            var individual = Conference.Participants.First(p => p.Role == Role.Individual);
            var representative = Conference.Participants.First(p => p.Role == Role.Representative);           

            IndividualParticipantId = individual.Id;
            JudgeParticipantId = judge.Id;
            RepresentativeParticipantId = representative.Id;

            EventHubClientMock.Setup(x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
                .Returns(AdminGroupChannel.Object);
            EventHubClientMock.Setup(x => x.Group(Conference.Id.ToString())).Returns(ConferenceGroupChannel.Object);
            EventHubClientMock.Setup(x => x.Group(judge.Username.ToLowerInvariant())).Returns(JudgeGroupChannel.Object);
            EventHubClientMock.Setup(x => x.Group(individual.Username.ToLowerInvariant()))
                .Returns(IndividualGroupChannel.Object);
            EventHubClientMock.Setup(x => x.Group(representative.Username.ToLowerInvariant()))
                .Returns(RepresentativeGroupChannel.Object);

            ConferenceCache
           .Setup(x => x.GetOrAddConferenceAsync(Conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
           .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
           .ReturnsAsync(Conference);
        }

        private Conference InitConference()
        {
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(3)
                .TheFirst(1).With(x => x.Role = Role.Judge).With(x => x.Username = JudgeUsername)
                .TheNext(1).With(x => x.Role = Role.Individual).With(x => x.Username = IndividualUsername)
                .TheNext(1).With(x => x.Role = Role.Representative).With(x => x.Username = RepresentativeUsername)
                .Build().ToList();

            return Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
        }

        private UserProfile InitProfile(string username, string role)
        {
            return Builder<UserProfile>.CreateNew()
                .With(x => x.UserName = username)
                .With(x => x.UserRole = role)
                .Build();
        }
    }
}
