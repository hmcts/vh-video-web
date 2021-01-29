using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.Middleware
{
    public class CheckParticipantCanAccessConferenceAttribute : ActionFilterAttribute
    {
        private readonly ILogger<CheckParticipantCanAccessConferenceAttribute> _logger;
        private readonly IConferenceCache _conferenceCache;
        private readonly IVideoApiClient _videoApiClient;

        public CheckParticipantCanAccessConferenceAttribute(
            ILogger<CheckParticipantCanAccessConferenceAttribute> logger,
            IConferenceCache conferenceCache,
            IVideoApiClient videoApiClient)
        {
            _logger = logger;
            _conferenceCache = conferenceCache;
            _videoApiClient = videoApiClient;
        }

        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (context.HttpContext.User.IsInRole(AppRoles.VhOfficerRole))
            {
                await next();
                return;
            }

            var conferenceId = GetActionArgument(context, "conferenceId");
            var participantId = GetActionArgument(context, "participantId");

            if (conferenceId == Guid.Empty || participantId == Guid.Empty)
            {
                await next();
                return;
            }

            var result = await IsParticipantAllowedToCallThisActionAsync(context, conferenceId, participantId);
            switch (result)
            {
                case HttpStatusCode.NotFound:
                    var message404 = $"Conference with id:'{conferenceId}' not found.";
                    _logger.LogWarning($"{GetType().Name} - {message404}");
                    context.ModelState.AddModelError("CheckParticipantCanAccessConference", message404);
                    context.Result = new NotFoundObjectResult(context.ModelState);
                    return;

                case HttpStatusCode.Unauthorized:
                    var message401 = $"Participant '{participantId}' is not allowed to call this action.";
                    _logger.LogWarning($"{GetType().Name} - {message401}");
                    context.ModelState.AddModelError("CheckParticipantCanAccessConference", message401);
                    context.Result = new UnauthorizedObjectResult(context.ModelState);
                    break;

                default:
                    await next();
                    return;
            }
        }

        private Guid GetActionArgument(ActionExecutingContext context, string actionArgumentKey)
        {
            if (context.ActionArguments.ContainsKey(actionArgumentKey))
            {
                return (Guid)context.ActionArguments[actionArgumentKey];
            }

            return Guid.Empty;
        }

        private async Task<HttpStatusCode> IsParticipantAllowedToCallThisActionAsync(ActionExecutingContext context, Guid conferenceId, Guid participantId)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );

            if (conference == null)
            {
                return HttpStatusCode.NotFound;
            }
            var loggedInParticipantId = GetIdForParticipantByUsernameInConference(context, conference);
            if (loggedInParticipantId == Guid.Empty)
            {
                return HttpStatusCode.Unauthorized;
            }

            return participantId == loggedInParticipantId ? HttpStatusCode.OK : HttpStatusCode.Unauthorized;
        }

        private Guid GetIdForParticipantByUsernameInConference(ActionExecutingContext context, Conference conference)
        {
            var username = context.HttpContext.User.Identity.Name;
            var participant = conference.Participants
                .FirstOrDefault(x => x.Username.Equals(username, StringComparison.CurrentCultureIgnoreCase));

            return participant?.Id ?? Guid.Empty;
        }
    }
}
