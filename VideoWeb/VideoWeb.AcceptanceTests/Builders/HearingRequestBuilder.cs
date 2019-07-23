using System;
using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using Testing.Common.Configuration;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Bookings;

namespace VideoWeb.AcceptanceTests.Builders
{
    internal class HearingRequestBuilder
    {
        private TestContext _context;
        private BookNewHearingRequest _request;
        private DateTime _scheduledTime = DateTime.Today.ToUniversalTime().AddDays(1).AddMinutes(-1);
        private int _scheduledDuration = 5;
        private readonly Random _fromRandomNumber;
        private readonly List<UserAccount> _individuals;
        private readonly List<UserAccount> _representatives;
        private readonly List<ParticipantRequest> _participants;

        public HearingRequestBuilder()
        {
            _fromRandomNumber = new Random();
            _individuals = new List<UserAccount>();
            _representatives = new List<UserAccount>();
            _participants = new List<ParticipantRequest>();           
        }

        public HearingRequestBuilder WithContext(TestContext context)
        {
            _context = context;
            return this;
        }

        public HearingRequestBuilder WithScheduledTime(DateTime time)
        {
            _scheduledTime = time;
            return this;
        }

        public HearingRequestBuilder WithScheduledDuration(int duration)
        {
            _scheduledDuration = duration;
            return this;
        }

        public BookNewHearingRequest Build()
        {
            _individuals.AddRange(_context.GetIndividualUsers());
            _representatives.AddRange(_context.GetRepresentativeUsers());

            _participants.Add(new ParticipantsRequestBuilder()
                .AddIndividual().WithUser(_individuals[0])
                .Build());

            _participants.Add(new ParticipantsRequestBuilder()
                .AddRepresentative().WithUser(_representatives[0])
                .Build());

            _participants.Add(new ParticipantsRequestBuilder()
                .AddIndividual().WithUser(_individuals[1])
                .Build());

            _participants.Add(new ParticipantsRequestBuilder()
                .AddRepresentative().WithUser(_representatives[1])
                .Build());

            _participants.Add(new ParticipantsRequestBuilder()
                .AddClerkOrJudge().WithUser(_context.GetClerkUser())
                .Build());           

            var cases = Builder<CaseRequest>.CreateListOfSize(1).Build().ToList();
            cases[0].Is_lead_case = false;
            cases[0].Name = $"Automated Test Hearing {GenerateRandom.Letters(_fromRandomNumber)}";
            cases[0].Number = $"{GenerateRandom.CaseNumber(_fromRandomNumber)}";

            _request = Builder<BookNewHearingRequest>.CreateNew()
                .With(x => x.Case_type_name = "Civil Money Claims")
                .With(x => x.Hearing_type_name = "Application to Set Judgment Aside")
                .With(x => x.Hearing_venue_name = "Birmingham Civil and Family Justice Centre")
                .With(x => x.Hearing_room_name = "Room 1")
                .With(x => x.Other_information = "Other information")
                .With(x => x.Scheduled_date_time = _scheduledTime)
                .With(x => x.Scheduled_duration = _scheduledDuration)
                .With(x => x.Participants = _participants)
                .With(x => x.Cases = cases)
                .With(x => x.Created_by = _context.GetCaseAdminUser().Username)
                .Build();

            _context.HearingRequest = _request;

            return _request;
        }
    }
}
