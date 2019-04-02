using System;
using System.Linq;
using FizzWare.NBuilder;
using Testing.Common.Helpers;
using VideoWeb.Services.Bookings;

namespace Testing.Common.Builders
{
    public class CreateHearingRequest
    {
        private static string _caseName;
        private readonly Random _fromRandomNumber;

        public CreateHearingRequest()
        {
            _fromRandomNumber = new Random();
        }

        public BookNewHearingRequest BuildRequest()
        {
            var cases = Builder<CaseRequest>.CreateListOfSize(1).Build().ToList();
            cases.First().Name = $"Manual Test Hearing {GenerateRandom.Letters(_fromRandomNumber)}";

            return Builder<BookNewHearingRequest>.CreateNew()
                .With(x => x.Case_type_name = "Civil Money Claims")
                .With(x => x.Hearing_type_name = "Application to Set Judgment Aside")
                .With(x => x.Hearing_venue_name = "Birmingham Civil and Family Justice Centre")
                .With(x => x.Cases = cases)
                .With(x => x.Hearing_room_name = "Room 1")
                .With(x => x.Other_information = "Other information")
                .Build();
        }

        public CreateHearingRequest WithRandomCaseName()
        {
            _caseName = $"Manual Test Hearing {GenerateRandom.Letters(_fromRandomNumber)}";
            return this;
        }
    }
}
