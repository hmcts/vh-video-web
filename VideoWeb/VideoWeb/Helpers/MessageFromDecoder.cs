using System;
using System.Linq;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using System.Threading.Tasks;

namespace VideoWeb.Helpers
{
    public interface IMessageDecoder
    {
        /// <summary>
        /// Get the message from value. If from a participant in the conference, use the display name.
        /// If not in the conference, safe to assume the message is from a VH officer and so get the first
        /// name stored in AD
        /// </summary>
        /// <param name="conference">Conference with participants</param>
        /// <param name="message">Message to decode</param>
        /// <returns>name to display</returns>
        Task<string> GetMessageOriginatorAsync(Conference conference, InstantMessageResponse message);

        bool IsMessageFromUser(InstantMessageResponse message, string loggedInUsername);
    }

    public class MessageFromDecoder : IMessageDecoder
    {
        private readonly IUserProfileService _userProfileService;

        public MessageFromDecoder(IUserProfileService userProfileService)
        {
            _userProfileService = userProfileService;
        }

        public async Task<string> GetMessageOriginatorAsync(Conference conference, InstantMessageResponse message)
        {
            var participant = conference.Participants.SingleOrDefault(x =>
                x.Username.Equals(message.From, StringComparison.InvariantCultureIgnoreCase));
            if (participant != null)
            {
                return participant.DisplayName;
            }
            var userProfile = await _userProfileService.GetUserAsync(message.From);
            if(userProfile == null)
            {
                var name = message.From.Split('@')[0];
                return name.ToString().Split('.')[0];
            }
            return userProfile.FirstName;
        }

        public bool IsMessageFromUser(InstantMessageResponse message, string loggedInUsername)
        {
            return message.From.Equals(loggedInUsername, StringComparison.InvariantCultureIgnoreCase);
        }
    }
}
