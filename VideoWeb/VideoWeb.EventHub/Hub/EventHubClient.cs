using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.Common.SignalR;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Mappers;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.EventHub.Hub
{
    [Authorize(Policy = "EventHubUser")]
    public class EventHub : Hub<IEventHubClient>
    {
        public static string VhOfficersGroupName => "VhOfficers";

        private readonly IUserProfileService _userProfileService;
        private readonly ILogger<EventHub> _logger;
        private readonly IVideoApiClient _videoApiClient;
        private readonly IMemoryCache _memoryCache;
        private readonly IHeartbeatMapper _heartbeatMapper;

        public EventHub(IUserProfileService userProfileService, IVideoApiClient videoApiClient, 
            ILogger<EventHub> logger, IMemoryCache memoryCache, IHeartbeatMapper heartbeatMapper)
        {
            _userProfileService = userProfileService;
            _logger = logger;
            _memoryCache = memoryCache;
            _heartbeatMapper = heartbeatMapper;
            _videoApiClient = videoApiClient;
        }

        public override async Task OnConnectedAsync()
        {
            var userName = await GetObfuscatedUsernameAsync(Context.User.Identity.Name);
            _logger.LogTrace($"Connected to event hub server-side: {userName} ");
            var isAdmin = await IsVhOfficerAsync(Context.User.Identity.Name);

            await AddUserToUserGroup(isAdmin);
            await AddUserToConferenceGroups(isAdmin);

            await base.OnConnectedAsync();
        }

        private async Task AddUserToConferenceGroups(bool isAdmin)
        {
            var conferences = await GetConferencesForUser(isAdmin);
            var tasks = conferences.Select(c => Groups.AddToGroupAsync(Context.ConnectionId, c.Id.ToString()))
                .ToArray();
            Task.WaitAll(tasks);
        }

        private async Task AddUserToUserGroup(bool isAdmin)
        {
            if (isAdmin)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, VhOfficersGroupName);
            }
            else
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, Context.UserIdentifier);
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userName = await GetObfuscatedUsernameAsync(Context.User.Identity.Name);
            if (exception == null)
            {
                _logger.LogInformation($"Disconnected from chat hub server-side: {userName} ");
            }
            else
            {
                _logger.LogCritical(exception, $"Disconnected from chat hub server-side: {userName} ");
            }

            var isAdmin = await IsVhOfficerAsync(Context.User.Identity.Name);
            await RemoveUserFromUserGroup(isAdmin);
            await RemoveUserFromConferenceGroups(isAdmin);

            await base.OnDisconnectedAsync(exception);
        }

        private async Task RemoveUserFromUserGroup(bool isAdmin)
        {
            if (isAdmin)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, VhOfficersGroupName);
            }
            else
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, Context.UserIdentifier);
            }
        }

        private async Task RemoveUserFromConferenceGroups(bool isAdmin)
        {
            var conferences = await GetConferencesForUser(isAdmin);
            var tasks = conferences.Select(c => Groups.RemoveFromGroupAsync(Context.ConnectionId, c.Id.ToString()))
                .ToArray();
            Task.WaitAll(tasks);
        }

        private async Task<IEnumerable<ConferenceSummaryResponse>> GetConferencesForUser(bool isAdmin)
        {
            var conferences = await _videoApiClient.GetConferencesTodayAsync();
            if (isAdmin)
            {
                return conferences;
            }

            return conferences.Where(c =>
                c.Participants.Any(
                    p => p.User_role == UserRole.Judge
                         && p.Username.Equals(Context.UserIdentifier, StringComparison.InvariantCultureIgnoreCase)));
        }

        private async Task<bool> IsVhOfficerAsync(string username)
        {
            return await _userProfileService.IsVhOfficerAsync(username);
        }

        private async Task<string> GetObfuscatedUsernameAsync(string username)
        {
            return await _userProfileService.GetObfuscatedUsernameAsync(username);
        }

        public async Task SendMessage(Guid conferenceId, string message)
        {
            var isAdmin = await IsVhOfficerAsync(Context.User.Identity.Name);
            var isAllowed = IsAllowedToSendMessage(conferenceId, isAdmin);
            if (!isAllowed) return;
            var from = Context.User.Identity.Name;
            var timestamp = DateTime.UtcNow;

            await Clients.Group(conferenceId.ToString())
                .ReceiveMessage(conferenceId, from, message, timestamp, Guid.NewGuid());
            await _videoApiClient.AddInstantMessageToConferenceAsync(conferenceId, new AddInstantMessageRequest
            {
                From = from,
                Message_text = message
            });
            
            if (isAdmin)
            {
                await Clients.Group(VhOfficersGroupName).AdminAnsweredChat(conferenceId);
            }
        }

        private bool IsAllowedToSendMessage(Guid conferenceId, bool isAdmin)
        {
            if (isAdmin) return true;
            var conference = _memoryCache.Get<Conference>(conferenceId);
            if (conference == null) throw new ConferenceNotFoundException(conferenceId);

            return conference.GetJudge().Username
                .Equals(Context.UserIdentifier, StringComparison.InvariantCultureIgnoreCase);
        }

        public async Task SendHeartbeat(Guid conferenceId, Guid participantId, Heartbeat heartbeat, 
            string browserName, string browserVersion)
        {
            try
            {
                // var model = JsonSerializer.Deserialize<Heartbeat>(heartbeat);
                var model = heartbeat;

                //Send to clients
                await Clients.Group(VhOfficersGroupName).ReceiveHeartbeat
                (
                    conferenceId, participantId, _heartbeatMapper.MapToHealth(model), browserName, browserVersion
                );

                //Save to DB
                var addHeartbeatRequest = _heartbeatMapper.MapToRequest(model);

                await _videoApiClient
                    .SaveHeartbeatDataForParticipantAsync(conferenceId, participantId, addHeartbeatRequest);
            }
            catch (HeartbeatException ex)
            {
                _logger.LogError("Error occured when mapping heartbeat", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError("Error occured when sending heartbeat", ex);
            }
        }
    }
}
