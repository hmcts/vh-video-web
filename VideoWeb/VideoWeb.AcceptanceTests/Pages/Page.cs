using System;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class Page
    {
        private Page(string name, string url, Journey journey, Journey subsequentPage)
        {
            Name = name;
            Url = url;
            Journey = journey;
            SubsequentPage = subsequentPage;
        }

        public string Name { get; set; }
        public string Url { get; set; }
        public Journey Journey { get; set; }
        public Journey SubsequentPage { get; set; }

        public static Page Login => new Page("Login", "login.microsoftonline.com", Journey.Login, NextPageAsJourney(Journey.Login));
        public static Page HearingList => new Page("Hearing List", "hearing-list", Journey.HearingList, NextPageAsJourney(Journey.HearingList));
        public static Page EquipmentCheck => new Page("Equipment Check", "equipment-check", Journey.EquipmentCheck, NextPageAsJourney(Journey.EquipmentCheck));
        public static Page CameraAndMicrophone => new Page("Camera and Microphone", "camera-and-microphone", Journey.CameraAndMicrophone, NextPageAsJourney(Journey.CameraAndMicrophone));
        public static Page Rules => new Page("Rules", "hearing-rules", Journey.Rules, NextPageAsJourney(Journey.Rules));
        public static Page Declaration => new Page("Declaration", "declaration", Journey.Declaration, NextPageAsJourney(Journey.Declaration));
        public static Page WaitingRoom => new Page("Waiting Room", "waiting-room", Journey.WaitingRoom, NextPageAsJourney(Journey.WaitingRoom));

        public static Journey NextPageAsJourney(Journey currentPage)
        {
            return (Journey) ((int) currentPage + 1);
        }

        public Page NextPage(Page currentPage)
        {
            switch (currentPage.SubsequentPage)
            {
                case Journey.Login:
                    return Login;
                case Journey.HearingList:
                    return HearingList;
                case Journey.EquipmentCheck:
                    return EquipmentCheck;
                case Journey.CameraAndMicrophone:
                    return CameraAndMicrophone;
                case Journey.Rules:
                    return Rules;
                case Journey.Declaration:
                    return Declaration;
                case Journey.WaitingRoom:
                    return WaitingRoom;
                default: throw new ArgumentOutOfRangeException($"{currentPage.SubsequentPage} not found");
            }
        }
    }
}
