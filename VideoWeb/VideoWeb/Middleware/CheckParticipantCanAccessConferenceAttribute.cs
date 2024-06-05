using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoApi.Client;
using VideoWeb.Common;

namespace VideoWeb.Middleware
{
    public class CheckParticipantCanAccessConferenceAttribute : ActionFilterAttribute
    {
        private readonly ILogger<CheckParticipantCanAccessConferenceAttribute> _logger;
        private readonly IConferenceService _conferenceService;

        public CheckParticipantCanAccessConferenceAttribute(
            ILogger<CheckParticipantCanAccessConferenceAttribute> logger,
            IConferenceService conferenceService)
        {
            _logger = logger;
            _conferenceService = conferenceService;
        }

        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (context.HttpContext.User.IsInRole(AppRoles.VhOfficerRole))
            {
                await next();
                return;
            }
            if (context.HttpContext.User.IsInRole(AppRoles.StaffMember))
            {
                await next();
                return;
            }

            var conferenceId = GetActionArgument(context, "conferenceId");
            if (conferenceId == Guid.Empty)
            {
                await next();
                return;
            }

            var conference = await _conferenceService.GetConference(conferenceId);
            
            if (conference == null)
            {
                var message404 = $"Conference with id:'{conferenceId}' not found.";
                _logger.LogWarning($"{GetType().Name} - {message404}");
                context.ModelState.AddModelError("CheckParticipantCanAccessConference", message404);
                context.Result = new NotFoundObjectResult(context.ModelState);
                return;
            }

            var participantId = GetActionArgument(context, "participantId");
            var loggedInParticipantId = GetLoggedInParticipantId(context, conference);

            var isAllowed = IsUserAllowed(participantId, loggedInParticipantId);
            if (!isAllowed)
            {
                var message401 = "User does not belong to this conference.";
                _logger.LogWarning($"{GetType().Name} - {message401}");
                context.ModelState.AddModelError("CheckParticipantCanAccessConference", message401);
                context.Result = new UnauthorizedObjectResult(context.ModelState);
                return;
            }

            await next();
        }

        private bool IsUserAllowed(Guid participantId, Guid loggedInParticipantId)
        {
            if (loggedInParticipantId == Guid.Empty)
            {
                return false;
            }

            if (participantId != Guid.Empty)
            {
                return participantId == loggedInParticipantId;
            }

            return true;
        }
        
        private Guid GetActionArgument(ActionExecutingContext context, string actionArgumentKey)
        {
            if (context.ActionArguments.ContainsKey(actionArgumentKey))
            {
                return (Guid)context.ActionArguments[actionArgumentKey];
            }

            return Guid.Empty;
        }

        private Guid GetLoggedInParticipantId(ActionExecutingContext context, ConferenceDto conferenceDto)
        {
            var username = context.HttpContext.User.Identity.Name;
            var participant = conferenceDto.Participants
                .FirstOrDefault(x => x.Username?.Equals(username, StringComparison.CurrentCultureIgnoreCase) ?? false);

            return participant?.Id ?? Guid.Empty;
        }
    }
}
