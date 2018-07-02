using System.Threading.Tasks;
using sunlogin;

public class Startup
{
    public async Task<object> Invoke(object input)
    {

        sunlogin.slapi.MessageBoxW(0, "sdsd", "sdsd", 1);

        int v = (int)input;
        return Helper.AddSeven(v);
    }
}

static class Helper
{
    public static int AddSeven(int v)
    {
        return v + 7;
    }
}