using System;
using System.Collections.Generic;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class Page
    {
        public string Name { get; private set; }
        public string Url { get; private set; }

        private Page(string name, string url)
        {
            Name = name;
            Url = url;
        }

        public static readonly Page Login = new Page("Login", "login.microsoftonline.com");
        public static readonly Page HearingList = new Page("Hearing List", "hearing-list");
        public static readonly Page VhoHearingList = new Page("VHO Hearing List", "hearing-list");
        public static readonly Page Introduction = new Page("Introduction", "introduction");
        public static readonly Page EquipmentCheck = new Page("Equipment Check", "equipment-check");
        public static readonly Page SwitchOnCamAndMic = new Page("Switch on your camera and microphone", "switch-on-camera-microphone");
        public static readonly Page PracticeVideoHearing = new Page("Practice video hearing", "practice-video-hearing");        
        public static readonly Page CameraWorking = new Page("Camera Working", "camera-working");
        public static readonly Page MicrophoneWorking = new Page("Microphone Working", "microphone-working");
        public static readonly Page SeeAndHearVideo = new Page("See and Hear Video", "see-and-hear-video");
        public static readonly Page Rules = new Page("Rules", "hearing-rules");
        public static readonly Page Declaration = new Page("Declaration", "declaration");
        public static readonly Page WaitingRoom = new Page("Waiting Room", "waiting-room");
        public static readonly Page Countdown = new Page("Countdown", "hearing-room");
        public static readonly Page HearingRoom = new Page("Hearing Room", "hearing-room");
        public static readonly Page NotFound = new Page("Not Found", "not-found");
        public static readonly Page Unauthorised = new Page("Unauthorised", "unauthorised");
        public static readonly Page Help = new Page("Help", "get-help");
        public static readonly Page AdminPanel = new Page("Admin Panel", "hearing-list");

        public string ToString(Page page)
        {
            return page.Name;
        }

        public static Page FromString(string name)
        {
            foreach (var page in Values)
            {
                if (page.Name.Equals(name))
                {
                    return page;
                }
            }
            throw new ArgumentOutOfRangeException($"No page found with name '{name}'");
        }

        private static IEnumerable<Page> Values
        {
            get
            {
                yield return Login;
                yield return HearingList;
                yield return Introduction;
                yield return EquipmentCheck;
                yield return SwitchOnCamAndMic;
                yield return PracticeVideoHearing;
                yield return CameraWorking;
                yield return MicrophoneWorking;
                yield return SeeAndHearVideo;
                yield return Rules;
                yield return Declaration;
                yield return WaitingRoom;
                yield return Countdown;
                yield return HearingRoom;
                yield return NotFound;
                yield return Unauthorised;
                yield return Help;
                yield return AdminPanel;
            }
        }
    }
}