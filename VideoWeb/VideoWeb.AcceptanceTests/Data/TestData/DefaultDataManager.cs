using System.IO;
using AcceptanceTests.Common.Data.Helpers;

namespace VideoWeb.AcceptanceTests.Data.TestData
{
    public class DefaultDataManager
    {
        public DefaultData SerialiseTestData(string path = "Data/TestData/DefaultData.xml")
        {
            var xmlInputData = File.ReadAllText(path);
            return XmlSerialiser.Deserialize<DefaultData>(xmlInputData);
        }
    }
}
