using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Hub
{
    public class SendMessageTests : EventHubBaseTests
    {
        private static string JudgeUsername => "judge@test.com";
        private static string IndividualUsername => "individual@test.com";
        private static string AdminUsername => "admin@test.com";
        private UserProfile AdminUserProfile { get; set; }

        private Mock<IEventHubClient> ConferenceGroupChannel { get; set; }
        private Mock<IEventHubClient> AdminGroupChannel { get; set; }
        private Mock<IEventHubClient> JudgeGroupChannel { get; set; }
        private Mock<IEventHubClient> IndividualGroupChannel { get; set; }
        private Conference Conference { get; set; }

        [Test]
        public async Task
            should_send_message_to_admin_group_and_participant_group_when_judge_sends_message_to_default_admin()
        {
            SetupSendMessageTests();
            // setup claims to return judge username
            var claims = new ClaimsPrincipalBuilder().WithUsername(JudgeUsername).WithRole(Role.Judge).Build();
            UpdateUserIdentity(claims);

            var fromUsername = Conference.GetJudge().Username;
            var toUsername = EventHub.Hub.EventHub.DefaultAdminName;
            const string message = "test message";

            await Hub.SendMessage(Conference.Id, message, toUsername);
            
            AssertMessageSentToHubAndApi(fromUsername, toUsername, message);
            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id), Times.Never);
        }

        [Test]
        public async Task
            should_not_send_message_to_admin_group_and_participant_group_when_individual_sends_message_to_default_admin()
        {
            SetupSendMessageTests();
            // setup claims to return judge username
            var claims = new ClaimsPrincipalBuilder().WithUsername(IndividualUsername).WithRole(Role.Judge).Build();
            UpdateUserIdentity(claims);
            
            var fromUsername = IndividualUsername;
            var toUsername = AdminUserProfile.User_name;
            const string message = "test message";

            await Hub.SendMessage(Conference.Id, message, toUsername);
            
            AssertMessageNotSentToHubOrApi(fromUsername, toUsername, message);
            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id), Times.Never);
        }
        
        [Test]
        public async Task should_send_message_to_admin_group_and_participant_group_when_judge_sends_message_to_admin()
        {
            SetupSendMessageTests();
            // setup claims to return judge username
            var claims = new ClaimsPrincipalBuilder().WithUsername(JudgeUsername).WithRole(Role.Judge).Build();
            UpdateUserIdentity(claims);
            
            var fromUsername = Conference.GetJudge().Username;
            var toUsername = AdminUserProfile.User_name;
            const string message = "test message";

            await Hub.SendMessage(Conference.Id, message, toUsername);
            
            AssertMessageSentToHubAndApi(fromUsername, toUsername, message);
            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id), Times.Never);
        }
        
        [Test]
        public async Task should_not_send_message_to_admin_group_and_participant_group_when_individual_sends_message_to_admin()
        {
            SetupSendMessageTests();
            // setup claims to return judge username
            var claims = new ClaimsPrincipalBuilder().WithUsername(IndividualUsername).WithRole(Role.Individual).Build();
            UpdateUserIdentity(claims);
            
            var fromUsername = IndividualUsername;
            var toUsername = AdminUserProfile.User_name;
            const string message = "test message";

            await Hub.SendMessage(Conference.Id, message, toUsername);
            
            AssertMessageNotSentToHubOrApi(fromUsername, toUsername, message);
            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id), Times.Never);
        }

        [Test]
        public async Task Should_send_message_to_conference_group_if_user_is_vho()
        {
            SetupSendMessageTests();
            // setup claims to return admin username
            var claims = new ClaimsPrincipalBuilder().WithUsername(AdminUsername).WithRole(Role.VideoHearingsOfficer).Build();
            UpdateUserIdentity(claims);
            
            var fromUsername = AdminUsername;
            var toUsername = JudgeUsername;
            const string message = "test message";

            await Hub.SendMessage(Conference.Id, message, toUsername);

            AssertMessageSentToHubAndApi(fromUsername, toUsername, message);
            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id), Times.Once);
        }
        
        [Test]
        public async Task
            should_not_send_message_to_admin_group_and_participant_group_when_sender_not_in_conference()
        {
            SetupSendMessageTests();
            // setup claims to return judge username
            var claims = new ClaimsPrincipalBuilder().WithUsername(JudgeUsername).WithRole(Role.Judge).Build();
            UpdateUserIdentity(claims);

            var fromUsername = "does@notexist.com";
            var toUsername = EventHub.Hub.EventHub.DefaultAdminName;
            const string message = "test message";

            await Hub.SendMessage(Conference.Id, message, toUsername);
            
            AssertMessageNotSentToHubOrApi(fromUsername, toUsername, message);
            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id), Times.Never);
        }
        
        [Test]
        public async Task
            should_not_send_message_to_admin_group_and_participant_group_when_recipent_not_in_conference()
        {
            SetupSendMessageTests();
            // setup claims to return admin username
            var claims = new ClaimsPrincipalBuilder().WithUsername(AdminUsername).WithRole(Role.VideoHearingsOfficer).Build();
            UpdateUserIdentity(claims);
            
            var fromUsername = AdminUsername;
            var toUsername = "does@notexist.com";
            const string message = "test message";

            await Hub.SendMessage(Conference.Id, message, toUsername);

            AssertMessageNotSentToHubOrApi(fromUsername, toUsername, message);
            AdminGroupChannel.Verify(x => x.AdminAnsweredChat(Conference.Id), Times.Never);
        }

        private void AssertMessageSentToHubAndApi(string fromUsername, string toUsername, string message)
        {
            AssertMessageSentStatusToHubAndApi(fromUsername, toUsername,message, Times.Once());
        }
        
        private void AssertMessageNotSentToHubOrApi(string fromUsername, string toUsername, string message)
        {
            AssertMessageSentStatusToHubAndApi(fromUsername, toUsername,message, Times.Never());
        }

        private void AssertMessageSentStatusToHubAndApi(string fromUsername, string toUsername, string message, Times times)
        {
            ConferenceGroupChannel.Verify(
                x =>
                    x.ReceiveMessage(Conference.Id, fromUsername, toUsername, message, It.IsAny<DateTime>(),
                        It.IsAny<Guid>()),
                times);

            JudgeGroupChannel.Verify(
                x =>
                    x.ReceiveMessage(Conference.Id, fromUsername, toUsername, message, It.IsAny<DateTime>(),
                        It.IsAny<Guid>()),
                times);

            VideoApiClientMock.Verify(x => x.AddInstantMessageToConferenceAsync(
                    It.Is<Guid>(c => c == Conference.Id),
                    It.Is<AddInstantMessageRequest>(
                        r => r.From == fromUsername && r.To == toUsername && r.Message_text == message
                    ))
                , times);
        }
        
        private void SetupSendMessageTests()
        {
            Conference = InitConference();
            AdminUserProfile = InitAdminProfile();

            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(Conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(Conference);

            ConferenceGroupChannel = new Mock<IEventHubClient>(); // only admins register to this
            JudgeGroupChannel = new Mock<IEventHubClient>();
            IndividualGroupChannel = new Mock<IEventHubClient>();
            AdminGroupChannel = new Mock<IEventHubClient>();
            
            UserProfileServiceMock.Setup(x => x.GetUserAsync(AdminUsername)).ReturnsAsync(AdminUserProfile);

            var judge = Conference.GetJudge();
            var individual = Conference.Participants.First(p => p.Role == Role.Individual);

            EventHubClientMock.Setup(x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
                .Returns(AdminGroupChannel.Object);
            EventHubClientMock.Setup(x => x.Group(Conference.Id.ToString())).Returns(ConferenceGroupChannel.Object);
            EventHubClientMock.Setup(x => x.Group(judge.Username.ToLowerInvariant())).Returns(JudgeGroupChannel.Object);
            EventHubClientMock.Setup(x => x.Group(individual.Username.ToLowerInvariant())).Returns(IndividualGroupChannel.Object);
        }

        private Conference InitConference()
        {
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Role = Role.Judge).With(x => x.Username = JudgeUsername)
                .TheRest().With(x => x.Role = Role.Individual).With(x => x.Username = IndividualUsername)
                .Build().ToList();

            return Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
        }
        
        private UserProfile InitAdminProfile()
        {
            return Builder<UserProfile>.CreateNew()
                .With(x => x.User_name = AdminUsername)
                .With(x => x.User_role = "VhOfficer")
                .Build();
        }
    }
}
