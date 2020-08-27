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

        public static User GetUser(List<User> users, string numberString, string user)
        {
            var number = GetNumberFromWords(numberString);

            if (user.ToLowerInvariant().Contains("judge"))
            {
                return users.First(x => x.User_type == UserType.Judge);
            }

            if (user.ToLowerInvariant().Contains("individual"))
            {
                return GetAllUsersOfType(users, UserType.Individual)[number];
            }

            if (user.ToLowerInvariant().Contains("representative"))
            {
                return GetAllUsersOfType(users, UserType.Representative)[number];
            }

            if (user.ToLowerInvariant().Contains("panel member") ||
                user.ToLowerInvariant().Contains("panelmember"))
            {
                return GetAllUsersOfType(users, UserType.PanelMember)[number];
            }

            if (user.ToLowerInvariant().Contains("observer"))
            {
                return GetAllUsersOfType(users, UserType.Observer)[number];
            }

            if (user.ToLowerInvariant().Contains("video hearings officer") ||
                user.ToLowerInvariant().Contains("videohearingsofficer"))
            {
                return users.First(x => x.User_type == UserType.VideoHearingsOfficer);
            }

            throw new DataException($"No matching user could be found from '{user}'");
        }

        private static int GetNumberFromWords(string text)
        {
            var numberTable = new Dictionary<string, int>
            {
                {"one",1},
                {"two",2},
                {"three",3},
                {"four",4},
                {"five",5}
            };
            return numberTable[text];
        }

        private static List<User> GetAllUsersOfType(List<User> users, UserType userType)
        {
            return users.FindAll(x => x.User_type == userType);
        }
    }
}
