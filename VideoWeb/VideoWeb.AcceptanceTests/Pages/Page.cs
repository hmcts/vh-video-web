using System;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class Page
    {
        private Page(string name, string url, Journey journey, Journey subsequentPage, JudgeJourney judgeJourney, JudgeJourney judgeSubsequentPage)
        {
            Name = name;
            Url = url;
            Journey = journey;
            SubsequentPage = subsequentPage;
            JudgeJourney = judgeJourney;
            JudgeSubsequentPage = judgeSubsequentPage;
        }

        public string Name { get; set; }
        public string Url { get; set; }
        public Journey Journey { get; set; }
        public Journey SubsequentPage { get; set; }
        public JudgeJourney JudgeJourney { get; set; }
        public JudgeJourney JudgeSubsequentPage { get; set; }

        public static Page Login => new Page("Login", "login.microsoftonline.com", Journey.Login, NextPageAsJourney(Journey.Login), JudgeJourney.Login, NextPageAsJudgeJourney(JudgeJourney.Login));
        public static Page HearingList => new Page("Hearing List", "hearing-list", Journey.HearingList, NextPageAsJourney(Journey.HearingList), JudgeJourney.HearingList, NextPageAsJudgeJourney(JudgeJourney.HearingList));
        public static Page EquipmentCheck => new Page("Equipment Check", "equipment-check", Journey.EquipmentCheck, NextPageAsJourney(Journey.EquipmentCheck), JudgeJourney.NotInJudgeJounrey, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJounrey));
        public static Page CameraAndMicrophone => new Page("Camera and Microphone", "camera-and-microphone", Journey.CameraAndMicrophone, NextPageAsJourney(Journey.CameraAndMicrophone), JudgeJourney.NotInJudgeJounrey, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJounrey));
        public static Page Rules => new Page("Rules", "hearing-rules", Journey.Rules, NextPageAsJourney(Journey.Rules), JudgeJourney.NotInJudgeJounrey, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJounrey));
        public static Page Declaration => new Page("Declaration", "declaration", Journey.Declaration, NextPageAsJourney(Journey.Declaration), JudgeJourney.NotInJudgeJounrey, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJounrey));
        public static Page WaitingRoom => new Page("Waiting Room", "waiting-room", Journey.WaitingRoom, NextPageAsJourney(Journey.WaitingRoom), JudgeJourney.WaitingRoom, NextPageAsJudgeJourney(JudgeJourney.WaitingRoom));
        public static Page Countdown => new Page("Countdown", "countdown", Journey.Countdown, NextPageAsJourney(Journey.Countdown), JudgeJourney.Countdown, NextPageAsJudgeJourney(JudgeJourney.Countdown));

        public static Journey NextPageAsJourney(Journey currentPage)
        {
            return (Journey) ((int) currentPage + 1);
        }

        public static JudgeJourney NextPageAsJudgeJourney(JudgeJourney currentPage)
        {
            return (JudgeJourney)((int)currentPage + 1);
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
                case Journey.Countdown:
                    return Countdown;
                default: throw new ArgumentOutOfRangeException($"{currentPage.SubsequentPage} not found");
            }
        }

        public Page JudgeNextPage(Page currentPage)
        {
            switch (currentPage.JudgeSubsequentPage)
            {
                case JudgeJourney.Login:
                    return Login;
                case JudgeJourney.HearingList:
                    return HearingList;    
                case JudgeJourney.WaitingRoom:
                    return WaitingRoom;
                case JudgeJourney.Countdown:
                    return Countdown;
                default: throw new ArgumentOutOfRangeException($"{currentPage.JudgeSubsequentPage} not found");
            }
        }
    }
}
