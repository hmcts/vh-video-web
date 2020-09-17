using System.Collections.Generic;
using System.Data;
using System.Linq;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public static class Users
    {
        public static User GetDefaultParticipantUser(List<User> users)
        {
            return users.First(x => x.User_type == UserType.Individual);
        }

        public static User GetJudgeUser(List<User> users)
        {
            return users.First(x => x.User_type == UserType.Judge);
        }

        public static User GetUserFromDisplayName(List<User> users, string displayName)
        {
            return users.First(x => x.Display_name.ToLower().Contains(displayName.ToLower().Replace(" ", "")));
        }

        public static User GetUser(List<User> users, string number, string user)
        {
            var index = ParticipantHelper.GetIndexFromNumber(number);
            user = user.ToLowerInvariant();

            if (user.Contains("judge"))
            {
                return users.First(x => x.User_type == UserType.Judge);
            }

            if (user.Contains("individual"))
            {
                return GetAllUsersOfType(users, UserType.Individual)[index];
            }

            if (user.Contains("representative"))
            {
                return GetAllUsersOfType(users, UserType.Representative)[index];
            }

            if (user.Contains("panel member") ||
                user.Contains("panelmember"))
            {
                return GetAllUsersOfType(users, UserType.PanelMember)[index];
            }

            if (user.ToLowerInvariant().Contains("observer"))
            {
                return GetAllUsersOfType(users, UserType.Observer)[index];
            }

            if (user.Contains("video hearings officer") ||
                user.Contains("videohearingsofficer"))
            {
                return users.First(x => x.User_type == UserType.VideoHearingsOfficer);
            }

            throw new DataException($"No matching user could be found from '{user}'");
        }

        private static List<User> GetAllUsersOfType(List<User> users, UserType userType)
        {
            return users.FindAll(x => x.User_type == userType);
        }

        public static User GetUserFromTextWithIndex(string text, List<User> users)
        {
            text = text.ToLower().Replace("'s", string.Empty).Replace("the", string.Empty).Trim();

            if (text.StartsWith("first") || text.StartsWith("second") || text.StartsWith("third") || text.StartsWith("fourth") || text.StartsWith("fifth"))
            {
                var number = text.Split(" ")[0].Trim();
                return GetUser(users, number, text);
            }

            return GetUser(users, "first", text);
        }
    }
}
