using System;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
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
        private readonly IUserApiClient _userApiClient;
        private readonly IUserCache _userCache;

        public MessageFromDecoder(IUserApiClient userApiClient, IUserCache userCache)
        {
            _userApiClient = userApiClient;
            _userCache = userCache;
        }

        public async Task<string> GetMessageOriginatorAsync(Conference conference, InstantMessageResponse message)
        {
            var participant = conference.Participants.SingleOrDefault(x =>
                x.Username.Equals(message.From, StringComparison.InvariantCultureIgnoreCase));
            if (participant != null)
            {
                return participant.DisplayName;
            }

            var username = message.From.ToLower();
            var userProfile = await _userCache.GetOrAddAsync
            (
                username, async key => await _userApiClient.GetUserByAdUserNameAsync(key)
            );

            return userProfile.First_name;
        }

        public bool IsMessageFromUser(InstantMessageResponse message, string loggedInUsername)
        {
            return message.From.Equals(loggedInUsername, StringComparison.InvariantCultureIgnoreCase);
        }
    }
}
