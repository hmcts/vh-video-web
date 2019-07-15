using System;
using System.Collections.Generic;

namespace VideoWeb.AcceptanceTests.Helpers
{
    internal class HearingRow
    {
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        public string Judge { get; set; }
        public string CaseName { get; set; }
        public string CaseType { get; set; }
        public string CaseNumber { get; set; }
        public List<PartiesDetails> Parties { get; set; }
        public string Status { get; set; }
    }
}
