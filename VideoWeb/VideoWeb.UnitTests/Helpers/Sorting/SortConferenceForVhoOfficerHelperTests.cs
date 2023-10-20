using System;
using System.Collections.Generic;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers.Sorting;

namespace VideoWeb.UnitTests.Helpers.Sorting;

public class SortConferenceForVhoOfficerHelperTests
{
    [Test]
    public void sort_by_scheduled_datetime_then_case_name_then_closed_date_time_and_then_case_name()
    {
        var today = DateTime.UtcNow;
        
        var conferenceEarlyMorningDupe1 = new ConferenceForVhOfficerResponse
        {
            ScheduledDateTime = today.AddHours(8),
            CaseName = "Case early morning A",
            Status = ConferenceStatus.InSession
        };
        
        var conferenceEarlyMorningDupe2 = new ConferenceForVhOfficerResponse
        {
            ScheduledDateTime = today.AddHours(8),
            CaseName = "Case early morning B",
            Status = ConferenceStatus.NotStarted
        };
        
        var conferenceMidMorning = new ConferenceForVhOfficerResponse
        {
            ScheduledDateTime = today.AddHours(10),
            CaseName = "Case mid morning",
            Status = ConferenceStatus.InSession
        };
        
        var conferenceEarlyAfternoon = new ConferenceForVhOfficerResponse
        {
            ScheduledDateTime = today.AddHours(14),
            CaseName = "Case early afternoon",
            Status = ConferenceStatus.InSession
        };
        
        var conferenceMidAfternoon = new ConferenceForVhOfficerResponse
        {
            ScheduledDateTime = today.AddHours(15).AddMinutes(10),
            CaseName = "Case mid afternoon",
            Status = ConferenceStatus.InSession
        };
        
        var conferenceLateAfternoon = new ConferenceForVhOfficerResponse
        {
            ScheduledDateTime = today.AddHours(16).AddMinutes(40),
            CaseName = "Case late afternoon",
            Status = ConferenceStatus.NotStarted
        };
        
        var conferenceLateMorningClosed = new ConferenceForVhOfficerResponse
        {
            ScheduledDateTime = today.AddHours(10),
            CaseName = "Case late morning closed",
            Status = ConferenceStatus.Closed,
            ClosedDateTime = today.AddHours(10)
        };
        
        var conferenceEarlyAfternoonClosedDupe1 = new ConferenceForVhOfficerResponse
        {
            ScheduledDateTime = today.AddHours(14),
            CaseName = "Case early Afternoon closed A",
            Status = ConferenceStatus.Closed,
            ClosedDateTime = today.AddHours(15)
        };
        
        var conferenceEarlyAfternoonClosedDupe2 = new ConferenceForVhOfficerResponse
        {
            ScheduledDateTime = today.AddHours(14).AddMinutes(40),
            CaseName = "Case early Afternoon closed B",
            Status = ConferenceStatus.Closed,
            ClosedDateTime = today.AddHours(15)
        };
        
        var conferenceLateAfternoonClosed = new ConferenceForVhOfficerResponse
        {
            ScheduledDateTime = today.AddHours(16).AddMinutes(40),
            CaseName = "Case late afternoon Closed",
            Status = ConferenceStatus.Closed,
            ClosedDateTime = today.AddHours(18)
        };

        var conferences = new List<ConferenceForVhOfficerResponse>
        {
            conferenceEarlyAfternoonClosedDupe1,
            conferenceEarlyMorningDupe1,
            null,
            conferenceEarlyAfternoonClosedDupe2,
            conferenceMidAfternoon,
            conferenceMidMorning,
            conferenceLateAfternoonClosed,
            conferenceLateMorningClosed,
            conferenceEarlyAfternoon,
            conferenceLateAfternoon,
            conferenceEarlyMorningDupe2,
            null,
        };
        
        conferences.Sort(new SortConferenceForVhoOfficerHelper());
        var expected = new List<ConferenceForVhOfficerResponse>
        {
            null,
            null,
            conferenceEarlyMorningDupe1,
            conferenceEarlyMorningDupe2,
            conferenceMidMorning,
            conferenceEarlyAfternoon,
            conferenceMidAfternoon,
            conferenceLateAfternoon,
            conferenceLateMorningClosed,
            conferenceEarlyAfternoonClosedDupe1,
            conferenceEarlyAfternoonClosedDupe2,
            conferenceLateAfternoonClosed
        };
        
        conferences.Should().ContainInOrder(expected);
    }
}
