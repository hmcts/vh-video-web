using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using Moq;
using NUnit.Framework;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Hub
{
    public class ChatHubTests : ChatHubBaseTests
    {
        [Test]
        public async Task should_subscribe_admin_to_all_conferences()
        {
            var numOfConferences = 10;
            var conferences = SetupAdminConferences(numOfConferences);
            var conferenceIds = conferences.Select(c => c.Id.ToString()).ToArray();

            await Hub.OnConnectedAsync();
            
            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Exactly(numOfConferences));
        }
        
        [Test]
        public async Task should_unsubscribe_admin_from_all_conferences()
        {
            var numOfConferences = 10;
            var conferences = SetupAdminConferences(numOfConferences);
            var conferenceIds = conferences.Select(c => c.Id.ToString()).ToArray();

            await Hub.OnDisconnectedAsync(null);
            
            GroupManagerMock.Verify(
                x => x.RemoveFromGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Exactly(numOfConferences));
        }

        private List<ConferenceSummaryResponse> SetupAdminConferences(int numOfConferences)
        {
            var conferences = Builder<ConferenceSummaryResponse>.CreateListOfSize(numOfConferences).All()
                .With(x => x.Id = Guid.NewGuid())
                .Build().ToList();
            
            UserProfileServiceMock.Setup(x => x.IsVhOfficerAsync(It.IsAny<string>()))
                .ReturnsAsync(true);
            
            VideoApiClientMock.Setup(x => x.GetConferencesTodayAsync()).ReturnsAsync(conferences);

            return conferences;
        }
        
        [Test]
        public async Task should_subscribe_judge_to_conferences_they_are_assigned_to()
        {
            const int numOfConferences = 10;
            const int numOfConferencesWithUser = 2;
            var conferenceIds = SetupJudgeConferences(numOfConferences, numOfConferencesWithUser);
            
            await Hub.OnConnectedAsync();
            
            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Exactly(numOfConferencesWithUser));
        }
        
        [Test]
        public async Task should_unsubscribe_judge_from_conferences_they_are_assigned_to()
        {
            const int numOfConferences = 10;
            const int numOfConferencesWithUser = 2;
            var conferenceIds = SetupJudgeConferences(numOfConferences, numOfConferencesWithUser);
            
            await Hub.OnDisconnectedAsync(null);
            
            GroupManagerMock.Verify(
                x => x.RemoveFromGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Exactly(numOfConferencesWithUser));
        }
        
        [Test]
        public async Task should_log_critical_when_exception_on_disconnect()
        {
            const int numOfConferences = 10;
            const int numOfConferencesWithUser = 2;
            var conferenceIds = SetupJudgeConferences(numOfConferences, numOfConferencesWithUser);
   
            var exception = new InconclusiveException("Some test");
            await Hub.OnDisconnectedAsync(exception);
            
            GroupManagerMock.Verify(
                x => x.RemoveFromGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Exactly(numOfConferencesWithUser));
        }
        
        private string[] SetupJudgeConferences(int numOfConferences, int numOfConferencesWithUser)
        {
            var participantsWithUser = Builder<ParticipantSummaryResponse>.CreateListOfSize(3)
                .TheFirst(1).With(x => x.Username = Claims.Identity.Name).With(x=> x.User_role = UserRole.Judge)
                .Build().ToList();
            var participantsWithoutUser = Builder<ParticipantSummaryResponse>.CreateListOfSize(3)
                .TheFirst(1).With(x=> x.User_role = UserRole.Judge)
                .Build().ToList();
            
            var conferences = Builder<ConferenceSummaryResponse>.CreateListOfSize(numOfConferences).All()
                .With(x => x.Id = Guid.NewGuid())
                .TheFirst(numOfConferencesWithUser).With(x => x.Participants = participantsWithUser)
                .TheRest().With(x => x.Participants = participantsWithoutUser)
                .Build().ToList();
            
            UserProfileServiceMock.Setup(x => x.IsVhOfficerAsync(It.IsAny<string>()))
                .ReturnsAsync(false);

            VideoApiClientMock.Setup(x => x.GetConferencesTodayAsync()).ReturnsAsync(conferences);

            return conferences
                .Where(x => x.Participants.Any(p => p.Username == Claims.Identity.Name))
                .Select(c => c.Id.ToString()).ToArray();
        }
    }
}
