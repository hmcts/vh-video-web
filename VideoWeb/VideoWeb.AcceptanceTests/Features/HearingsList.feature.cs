// ------------------------------------------------------------------------------
//  <auto-generated>
//      This code was generated by SpecFlow (http://www.specflow.org/).
//      SpecFlow Version:3.0.0.0
//      SpecFlow Generator Version:3.0.0.0
// 
//      Changes to this file may cause incorrect behavior and will be lost if
//      the code is regenerated.
//  </auto-generated>
// ------------------------------------------------------------------------------
#region Designer generated code
#pragma warning disable
namespace VideoWeb.AcceptanceTests.Features
{
    using TechTalk.SpecFlow;
    
    
    [System.CodeDom.Compiler.GeneratedCodeAttribute("TechTalk.SpecFlow", "3.0.0.0")]
    [System.Runtime.CompilerServices.CompilerGeneratedAttribute()]
    [NUnit.Framework.TestFixtureAttribute()]
    [NUnit.Framework.DescriptionAttribute("Hearings List")]
    [NUnit.Framework.CategoryAttribute("VIH-4035")]
    public partial class HearingsListFeature
    {
        
        private TechTalk.SpecFlow.ITestRunner testRunner;
        
#line 1 "HearingsList.feature"
#line hidden
        
        [NUnit.Framework.OneTimeSetUpAttribute()]
        public virtual void FeatureSetup()
        {
            testRunner = TechTalk.SpecFlow.TestRunnerManager.GetTestRunner();
            TechTalk.SpecFlow.FeatureInfo featureInfo = new TechTalk.SpecFlow.FeatureInfo(new System.Globalization.CultureInfo("en-US"), "Hearings List", "\tAs a registered video hearings user\r\n\tI would like to login and access the heari" +
                    "ng details\r\n\tSo that I can have an overview of all the scheduled hearings I am i" +
                    "nvolved in", ProgrammingLanguage.CSharp, new string[] {
                        "VIH-4035"});
            testRunner.OnFeatureStart(featureInfo);
        }
        
        [NUnit.Framework.OneTimeTearDownAttribute()]
        public virtual void FeatureTearDown()
        {
            testRunner.OnFeatureEnd();
            testRunner = null;
        }
        
        [NUnit.Framework.SetUpAttribute()]
        public virtual void TestInitialize()
        {
        }
        
        [NUnit.Framework.TearDownAttribute()]
        public virtual void ScenarioTearDown()
        {
            testRunner.OnScenarioEnd();
        }
        
        public virtual void ScenarioInitialize(TechTalk.SpecFlow.ScenarioInfo scenarioInfo)
        {
            testRunner.OnScenarioInitialize(scenarioInfo);
            testRunner.ScenarioContext.ScenarioContainer.RegisterInstanceAs<NUnit.Framework.TestContext>(NUnit.Framework.TestContext.CurrentContext);
        }
        
        public virtual void ScenarioStart()
        {
            testRunner.OnScenarioStart();
        }
        
        public virtual void ScenarioCleanup()
        {
            testRunner.CollectScenarioErrors();
        }
        
        [NUnit.Framework.TestAttribute()]
        [NUnit.Framework.DescriptionAttribute("Individual has 1 or more hearings")]
        [NUnit.Framework.CategoryAttribute("smoketest")]
        public virtual void IndividualHas1OrMoreHearings()
        {
            TechTalk.SpecFlow.ScenarioInfo scenarioInfo = new TechTalk.SpecFlow.ScenarioInfo("Individual has 1 or more hearings", null, new string[] {
                        "smoketest"});
#line 8
this.ScenarioInitialize(scenarioInfo);
            this.ScenarioStart();
#line 9
 testRunner.Given("I have a hearing and a conference", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Given ");
#line 10
 testRunner.And("the login page is open", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 11
 testRunner.When("the Individual attempts to login with valid credentials", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 12
 testRunner.Then("the user is on the Hearings List page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line 13
 testRunner.And("the participant can see a list of hearings including the new hearing", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 14
 testRunner.And("contact us details are available", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 15
 testRunner.When("the user clicks on the Start Hearing button", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 16
 testRunner.Then("the user is on the Equipment Check page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line hidden
            this.ScenarioCleanup();
        }
        
        [NUnit.Framework.TestAttribute()]
        [NUnit.Framework.DescriptionAttribute("Representative has 1 or more hearings")]
        [NUnit.Framework.CategoryAttribute("smoketest")]
        public virtual void RepresentativeHas1OrMoreHearings()
        {
            TechTalk.SpecFlow.ScenarioInfo scenarioInfo = new TechTalk.SpecFlow.ScenarioInfo("Representative has 1 or more hearings", null, new string[] {
                        "smoketest"});
#line 19
this.ScenarioInitialize(scenarioInfo);
            this.ScenarioStart();
#line 20
 testRunner.Given("I have a hearing and a conference", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Given ");
#line 21
 testRunner.And("the login page is open", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 22
 testRunner.When("the Representative attempts to login with valid credentials", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 23
 testRunner.Then("the user is on the Hearings List page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line 24
 testRunner.And("the participant can see a list of hearings including the new hearing", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 25
 testRunner.And("contact us details are available", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 26
 testRunner.When("the user clicks on the Start Hearing button", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 27
 testRunner.Then("the user is on the Equipment Check page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line hidden
            this.ScenarioCleanup();
        }
        
        [NUnit.Framework.TestAttribute()]
        [NUnit.Framework.DescriptionAttribute("Individual has a hearing more than 30 minutes in the future")]
        public virtual void IndividualHasAHearingMoreThan30MinutesInTheFuture()
        {
            TechTalk.SpecFlow.ScenarioInfo scenarioInfo = new TechTalk.SpecFlow.ScenarioInfo("Individual has a hearing more than 30 minutes in the future", null, ((string[])(null)));
#line 29
this.ScenarioInitialize(scenarioInfo);
            this.ScenarioStart();
#line 30
 testRunner.Given("I have a hearing and a conference in 31 minutes time", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Given ");
#line 31
 testRunner.And("the login page is open", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 32
 testRunner.When("the Individual attempts to login with valid credentials", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 33
 testRunner.Then("the user is on the Hearings List page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line 34
 testRunner.And("the new hearing isn\'t available to join yet", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 35
 testRunner.And("when the hearing is ready to start the hearing button appears", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 36
 testRunner.When("the user clicks on the Start Hearing button", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 37
 testRunner.Then("the user is on the Equipment Check page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line hidden
            this.ScenarioCleanup();
        }
        
        [NUnit.Framework.TestAttribute()]
        [NUnit.Framework.DescriptionAttribute("Representative has a hearing more than 30 minutes in the future")]
        public virtual void RepresentativeHasAHearingMoreThan30MinutesInTheFuture()
        {
            TechTalk.SpecFlow.ScenarioInfo scenarioInfo = new TechTalk.SpecFlow.ScenarioInfo("Representative has a hearing more than 30 minutes in the future", null, ((string[])(null)));
#line 39
this.ScenarioInitialize(scenarioInfo);
            this.ScenarioStart();
#line 40
 testRunner.Given("I have a hearing and a conference in 31 minutes time", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Given ");
#line 41
 testRunner.And("the login page is open", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 42
 testRunner.When("the Representative attempts to login with valid credentials", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 43
 testRunner.Then("the user is on the Hearings List page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line 44
 testRunner.And("the new hearing isn\'t available to join yet", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 45
 testRunner.And("when the hearing is ready to start the hearing button appears", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 46
 testRunner.When("the user clicks on the Start Hearing button", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 47
 testRunner.Then("the user is on the Equipment Check page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line hidden
            this.ScenarioCleanup();
        }
        
        [NUnit.Framework.TestAttribute()]
        [NUnit.Framework.DescriptionAttribute("Individual has no hearings")]
        [NUnit.Framework.CategoryAttribute("smoketest")]
        public virtual void IndividualHasNoHearings()
        {
            TechTalk.SpecFlow.ScenarioInfo scenarioInfo = new TechTalk.SpecFlow.ScenarioInfo("Individual has no hearings", null, new string[] {
                        "smoketest"});
#line 50
this.ScenarioInitialize(scenarioInfo);
            this.ScenarioStart();
#line 51
 testRunner.Given("the login page is open", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Given ");
#line 52
 testRunner.When("the Individual with no hearings attempts to login with valid credentials", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 53
 testRunner.Then("the user is on the Hearings List page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line 54
 testRunner.And("a warning message appears indicating the user has no hearings scheduled", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 55
 testRunner.And("contact us details are available", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line hidden
            this.ScenarioCleanup();
        }
        
        [NUnit.Framework.TestAttribute()]
        [NUnit.Framework.DescriptionAttribute("Representative has no hearings")]
        [NUnit.Framework.CategoryAttribute("smoketest")]
        public virtual void RepresentativeHasNoHearings()
        {
            TechTalk.SpecFlow.ScenarioInfo scenarioInfo = new TechTalk.SpecFlow.ScenarioInfo("Representative has no hearings", null, new string[] {
                        "smoketest"});
#line 58
this.ScenarioInitialize(scenarioInfo);
            this.ScenarioStart();
#line 59
 testRunner.Given("the login page is open", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Given ");
#line 60
 testRunner.When("the Representative with no hearings attempts to login with valid credentials", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 61
 testRunner.Then("the user is on the Hearings List page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line 62
 testRunner.And("a warning message appears indicating the user has no hearings scheduled", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 63
 testRunner.And("contact us details are available", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line hidden
            this.ScenarioCleanup();
        }
        
        [NUnit.Framework.TestAttribute()]
        [NUnit.Framework.DescriptionAttribute("Judge has no hearings")]
        public virtual void JudgeHasNoHearings()
        {
            TechTalk.SpecFlow.ScenarioInfo scenarioInfo = new TechTalk.SpecFlow.ScenarioInfo("Judge has no hearings", null, ((string[])(null)));
#line 65
this.ScenarioInitialize(scenarioInfo);
            this.ScenarioStart();
#line 66
 testRunner.Given("the login page is open", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Given ");
#line 67
 testRunner.When("the Judge with no hearings attempts to login with valid credentials", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 68
 testRunner.Then("the user is on the Hearings List page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line 69
 testRunner.And("a warning message appears indicating the user has no hearings scheduled", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 70
 testRunner.And("contact us details are available", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line hidden
            this.ScenarioCleanup();
        }
        
        [NUnit.Framework.TestAttribute()]
        [NUnit.Framework.DescriptionAttribute("Judge has 1 or more hearings")]
        public virtual void JudgeHas1OrMoreHearings()
        {
            TechTalk.SpecFlow.ScenarioInfo scenarioInfo = new TechTalk.SpecFlow.ScenarioInfo("Judge has 1 or more hearings", null, ((string[])(null)));
#line 72
this.ScenarioInitialize(scenarioInfo);
            this.ScenarioStart();
#line 73
 testRunner.Given("I have a hearing and a conference", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Given ");
#line 74
 testRunner.And("the login page is open", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 75
 testRunner.When("the Judge attempts to login with valid credentials", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 76
 testRunner.Then("the user is on the Hearings List page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line 77
 testRunner.And("the Judge can see a list of hearings including the new hearing", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 78
 testRunner.And("contact us details are available", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 79
 testRunner.When("the user clicks on the Start Hearing button", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 80
 testRunner.Then("the user is on the Waiting Room page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line hidden
            this.ScenarioCleanup();
        }
        
        [NUnit.Framework.TestAttribute()]
        [NUnit.Framework.DescriptionAttribute("Video Hearings Officer has no hearings")]
        public virtual void VideoHearingsOfficerHasNoHearings()
        {
            TechTalk.SpecFlow.ScenarioInfo scenarioInfo = new TechTalk.SpecFlow.ScenarioInfo("Video Hearings Officer has no hearings", null, ((string[])(null)));
#line 82
this.ScenarioInitialize(scenarioInfo);
            this.ScenarioStart();
#line 83
 testRunner.Given("the login page is open", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Given ");
#line 84
 testRunner.When("the Video Hearings Officer attempts to login with valid credentials", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 85
 testRunner.Then("the user is on the Hearings List page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line 86
 testRunner.And("a warning message appears indicating the user has no hearings scheduled", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line hidden
            this.ScenarioCleanup();
        }
        
        [NUnit.Framework.TestAttribute()]
        [NUnit.Framework.DescriptionAttribute("Video Hearings Officer has 1 or more hearings")]
        public virtual void VideoHearingsOfficerHas1OrMoreHearings()
        {
            TechTalk.SpecFlow.ScenarioInfo scenarioInfo = new TechTalk.SpecFlow.ScenarioInfo("Video Hearings Officer has 1 or more hearings", null, ((string[])(null)));
#line 88
this.ScenarioInitialize(scenarioInfo);
            this.ScenarioStart();
#line 89
 testRunner.Given("I have a hearing and a conference", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Given ");
#line 90
 testRunner.And("the login page is open", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 91
 testRunner.When("the Video Hearings Officer attempts to login with valid credentials", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 92
 testRunner.Then("the user is on the Hearings List page", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line 93
 testRunner.And("the VHO can see a list of hearings including the new hearing", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 94
 testRunner.When("the VHO selects the hearing", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "When ");
#line 95
 testRunner.And("the VHO logs into the admin panel", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "And ");
#line 96
 testRunner.Then("the VHO can see the hearing view", ((string)(null)), ((TechTalk.SpecFlow.Table)(null)), "Then ");
#line hidden
            this.ScenarioCleanup();
        }
    }
}
#pragma warning restore
#endregion
