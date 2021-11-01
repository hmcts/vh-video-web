using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public static class Users
    {
        public static UserDto GetDefaultParticipantUser(List<UserDto> users)
        {
            return users.First(x => x.UserType == UserType.Individual);
        }

        public static UserDto GetJudgeUser(List<UserDto> users)
        {
            return users.First(x => x.UserType == UserType.Judge);
        }

        public static UserDto GetUserFromDisplayName(List<UserDto> users, string displayName)
        {
            if (users.Any(x => x.DisplayName.ToLower().Contains(displayName.ToLower().Replace(" ", ""))))
            {
                return users.First(x => x.DisplayName.ToLower().Contains(displayName.ToLower().Replace(" ", "")));
            }

            var usersList = users.Select(x => x.DisplayName).Aggregate("", (current, name) => current + name + ",");
            throw new InvalidOperationException($"No user with display name '{displayName}' found in the list: '{usersList}'");
        }
        public static UserDto GetUserFromUserType(List<UserDto> users, string userType)
        {
            if (users.Any(x => x.UserType.ToString().ToLower().Equals(userType.ToLower())))
            {
                return users.First(x => x.UserType.ToString().ToLower().Equals(userType.ToLower()));
            }

            var usersList = users.Select(x => x.UserType).Aggregate("", (current, UserType) => current + userType + ",");
            throw new InvalidOperationException($"No user with the user type'{userType}' found in the list: '{usersList}'");
        }

        public static UserDto GetUser(List<UserDto> users, string number, string user)
        {
            var index = ParticipantHelper.GetIndexFromNumber(number);
            user = user.ToLowerInvariant();

            if (user.Contains("judge"))
            {
                return users.First(x => x.UserType == UserType.Judge);
            }

            if (user.Contains("individual"))
            {
                return GetAllUsersOfType(users, UserType.Individual)[index];
            }

            if (user.Contains("representative"))
            {
                return GetAllUsersOfType(users, UserType.Representative)[index];
            }

            if (user.Contains("interpreter"))
            {
                return GetAllUsersOfType(users, UserType.Interpreter)[index];
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
                return users.First(x => x.UserType == UserType.VideoHearingsOfficer);
            }

            if (user.Contains("winger"))
            {
                return GetAllUsersOfType(users, UserType.Winger)[index];
            }

            throw new DataException($"No matching user could be found from '{user}'");
        }

        private static List<UserDto> GetAllUsersOfType(List<UserDto> users, UserType userType)
        {
            return users.FindAll(x => x.UserType == userType);
        }

        public static UserDto GetUserFromText(string text, List<UserDto> users)
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
