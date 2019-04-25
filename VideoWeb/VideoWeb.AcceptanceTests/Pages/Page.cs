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
        public static Page EquipmentCheck => new Page("Equipment Check", "equipment-check", Journey.EquipmentCheck, NextPageAsJourney(Journey.EquipmentCheck), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney));
        public static Page SwitchOnCamAndMicPage => new Page("Switch on your camera and microphone", "switch-on-camera-microphone", Journey.SwitchOnYourCameraAndMicrophone, NextPageAsJourney(Journey.SwitchOnYourCameraAndMicrophone), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney));
        public static Page CameraWorking => new Page("Camera Working", "camera-working", Journey.CameraWorking, NextPageAsJourney(Journey.CameraWorking), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney));
        public static Page MicrophoneWorking => new Page("Microphone Working", "microphone-working", Journey.MicrophoneWorking, NextPageAsJourney(Journey.MicrophoneWorking), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney));
        public static Page SeeAndHearVideo => new Page("See and Hear Video", "see-and-hear-video", Journey.SeeAndHearVideo, NextPageAsJourney(Journey.SeeAndHearVideo), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney));        
        public static Page Rules => new Page("Rules", "hearing-rules", Journey.Rules, NextPageAsJourney(Journey.Rules), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney));
        public static Page Declaration => new Page("Declaration", "declaration", Journey.Declaration, NextPageAsJourney(Journey.Declaration), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney));
        public static Page WaitingRoom => new Page("Waiting Room", "waiting-room", Journey.WaitingRoom, NextPageAsJourney(Journey.WaitingRoom), JudgeJourney.WaitingRoom, NextPageAsJudgeJourney(JudgeJourney.WaitingRoom));
        public static Page Countdown => new Page("Countdown", "countdown", Journey.Countdown, NextPageAsJourney(Journey.Countdown), JudgeJourney.Countdown, NextPageAsJudgeJourney(JudgeJourney.Countdown));
        public static Page NotFound => new Page("Not Found", "not-found", Journey.NotFound, NextPageAsJourney(Journey.NotFound), JudgeJourney.NotFound, NextPageAsJudgeJourney(JudgeJourney.NotFound));
        public static Page Unauthorised => new Page("Unauthorised", "unauthorised", Journey.Unauthorised, NextPageAsJourney(Journey.Unauthorised), JudgeJourney.Unauthorised, NextPageAsJudgeJourney(JudgeJourney.Unauthorised));
        
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
                case Journey.SwitchOnYourCameraAndMicrophone:
                    return SwitchOnCamAndMicPage;
                case Journey.CameraWorking:
                    return CameraWorking;
                case Journey.MicrophoneWorking:
                    return MicrophoneWorking;
                case Journey.SeeAndHearVideo:
                    return SeeAndHearVideo;
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
