using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using VideoWeb.Common;
using VideoWeb.Common.Logging;

namespace VideoWeb.Middleware;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Interface)]
public class CheckParticipantCanAccessConferenceAttribute(
    ILogger<CheckParticipantCanAccessConferenceAttribute> logger,
    IConferenceService conferenceService)
    : ActionFilterAttribute
{
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
        
        var conference = await conferenceService.GetConference(conferenceId);
        
        if (conference == null)
        {
            var message404 = $"Conference with id:'{conferenceId}' not found.";
            logger.LogConferenceNotFound(GetType().Name, conferenceId);
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
            logger.LogUnauthorizedAccess(GetType().Name);
            context.ModelState.AddModelError("CheckParticipantCanAccessConference", message401);
            context.Result = new UnauthorizedObjectResult(context.ModelState);
            return;
        }
        
        await next();
    }
    
    private static bool IsUserAllowed(Guid participantId, Guid loggedInParticipantId)
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
    
    private static Guid GetActionArgument(ActionExecutingContext context, string actionArgumentKey)
    {
        if (context.ActionArguments.TryGetValue(actionArgumentKey, out var value) && value != null)
        {
            return (Guid)value;
        }
        
        return Guid.Empty;
    }
    
    private static Guid GetLoggedInParticipantId(ActionExecutingContext context, Conference conference)
    {
        var username = context.HttpContext.User.Identity?.Name;
        var participant = conference.Participants
            .Find(x => x.Username?.Equals(username, StringComparison.CurrentCultureIgnoreCase) ?? false);
        
        return participant?.Id ?? Guid.Empty;
    }
}
