using System.Threading;
using WindowsInput;
using WindowsInput.Native;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public static class TabSelectPermissions
    {
        private const int DelayInMilliseconds = 2000;
        private const int AllowTabs = 1;
        private const int BlockTabs = 2;

        internal static void AllowPermissions(bool allow, TargetBrowser browser)
        {
            var input = new InputSimulator();
            var tabs = allow ? AllowTabs : BlockTabs;

            Thread.Sleep(DelayInMilliseconds);

            for (var i = 1; i <= tabs; i++)
            {
                input.Keyboard.KeyPress(VirtualKeyCode.TAB);
                Thread.Sleep(DelayInMilliseconds);
            }

            input.Keyboard.KeyPress(VirtualKeyCode.RETURN);
        }
    }
}