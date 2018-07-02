using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Runtime.InteropServices;

public class Startup
{
    public async Task<object> Invoke(object input)
    {
//        sunlogin.slapi.MessageBoxW(0, "sdsd", "sdsd", 1);
        Console.WriteLine(sunlogin.slapi.createAgoraRtcEngine());
//        sunlogin.slapi.joinChannel("", "", "", 1);

        return 1;
    }
}

namespace sunlogin
{
    /**
     * @brief SLAPI错误表
     */
    public enum SLERRCODE
    {
        //成功
        SLERRCODE_SUCCESSED = 0,

        //内部错误
        SLERRCODE_INNER = 1,

        //未初始化
        SLERRCODE_UNINITIALIZED = 2,

        //参数错误
        SLERRCODE_ARGS = 3,

        //不支持
        SLERRCODE_NOTSUPPORT = 4,

        //网络连接失败
        SLERRCODE_CONNECT_FAILED = 5,

        //网络连接超时
        SLERRCODE_CONNECT_TIMEOUT = 6,

        //会话不存在
        SLERRCODE_SESSION_NOTEXIST = 7,

        //会话溢出
        SLERRCODE_SESSION_OVERFLOW = 8,

        //会话类型错误
        SLERRCODE_SESSION_WRONGTYPE = 9,

		//OPENID过期
		SLERRCODE_EXPIRED = 10,
    };

    /**
     * @brief 会话选项
     */
    public enum ESLSessionOpt
    {
        eSLSessionOpt_window = 1,   //窗口
        eSLSessionOpt_callback = 2, //回调
        eSLSessionOpt_deviceSource = 3, //设备源
        eSLSessionOpt_connected = 4, //连接状态

    };

    /**
     * @brief 会话事件
     */
    public enum ESLSessionEvent
    {
        eSLSessionEvent_OnConnected = 1, //连接成功
        eSLSessionEvent_OnDisconnected = 2, //断开连接
    };

    /**
    * @brief 被控制端事件
    */
    public enum SLCLIENT_EVENT
    {
        SLCLIENT_EVENT_ONCONNECT = 0, //连接成功
        SLCLIENT_EVENT_ONDISCONNECT, //断开连接
        SLCLIENT_EVENT_ONLOGIN, //登录成功
        SLCLIENT_EVENT_ONLOGINFAIL, //登录失败
    };

    /*
    * @brief 会话类型
    */
    public enum ESLSessionType
    {
        eSLSessionType_Desktop,//远程桌面会话
        eSLSessionType_File,//远程文件会话
        eSLSessionType_Cmd,//远程CMD会话
        eSLSessionType_Sound,//远程声音会话
        eSLSessionType_DataTrans,//数据传输会话
    };

    /**
    * @brief 主控制端事件
    */
    public enum SLREMOTE_EVENT
    {
        SLREMOTE_EVENT_ONCONNECT = 0, //连接成功
        SLREMOTE_EVENT_ONDISCONNECT, //断开连接
        SLREMOTE_EVENT_ONDISCONNECT_FOR_FULL, //断开连接(因为连接数满了)
    };

    public enum SLProxyType
    {
        SLProxy_None,
        SLProxy_HTTP,
        SLProxy_Socks5,
        SLProxy_Socks4,
        SLProxy_IE,
    };

    /**
    * 代理类型
	*/
    public struct SLPROXY_INFO
    {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 20)]
        public string ip;

        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 10)]
        public string port;

        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 20)]
        public string user;

        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 20)]
        public string pwd;

        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 200)]
        public string domain;

        public SLProxyType type;   //ProxyType		
    };

    /*
     * @brief 会话回调事件函数类型
     */
    public delegate void SLSESSION_CALLBACK(UInt32 client, ESLSessionEvent event_, string customdata, UInt32 custom);    

    /**
     * @brief 会话回调属性
     */
    struct SLSESSION_CALLBACK_PROP
    {
        public SLSESSION_CALLBACK pfnCallback;//回调函数
        public UInt32 nCustom;//自定义数据

    };

    static class slapi
    {
#if DEBUG
        const string dllName = "slsdkd.dll";
#else
        const  string dllName = "slsdk.dll";
#endif

        [DllImport("agora_rtc_sdk.dll", EntryPoint = "createAgoraRtcEngine")]
        public static extern int createAgoraRtcEngine();

        [DllImport("agora_rtc_sdk.dll", EntryPoint = "joinChannel")]
        public static extern int joinChannel(string key, string name, string info, int uid);



        [DllImport("user32.dll", EntryPoint = "MessageBoxW")]
        public static extern int MessageBoxW(int int1, string string2, string string3, int int4);
        /*
         * @brief 初始化SLAPI环境
         * @desc 在使用任何SLAPI之前请先调用此API来初始化整个SLAPI环境，整个进程只需要调用一次即可
         * @return 是否初始化成功
         */
        [DllImport(dllName, EntryPoint = "SLInitialize")]
        public static extern bool SLInitialize();

        /*
         * @brief 退出SLAPI环境
         * @desc 建议在整个进程退出前调用，以释放SLAPI环境所使用的资源
         * @return 是否退出成功
         */
        [DllImport(dllName, EntryPoint = "SLUninitialize")]
        public static extern bool SLUninitialize();

        /*
         * @brief 获取最后的错误码
         * @return 返回SLERRCODE错误码
         */
        [DllImport(dllName, EntryPoint = "SLGetLastError")]
        public static extern SLERRCODE SLGetLastError();

        /*
         * @brief 设置最后的错误码
         * @param errCode 错误码
         * @return 是否设置成功
         */
        [DllImport(dllName, EntryPoint = "SLSetLastError", CallingConvention = CallingConvention.StdCall)]
        public static extern bool SLSetLastError(int err);

        /*
         * @brief 获取错误码详细说明
         * @return 详细信息，如果错误码不存在则返回“未知错误”
         */
        //[DllImport(dllName, CharSet = CharSet.Ansi, EntryPoint = "SLGetErrorDesc", CallingConvention = CallingConvention.Cdecl)]
        //public static extern string SLGetErrorDesc(SLERRCODE err);


        [System.Runtime.InteropServices.DllImportAttribute(dllName, EntryPoint = "SLGetErrorDesc", CallingConvention = CallingConvention.StdCall)]
        public static extern System.IntPtr SLGetErrorDesc(SLERRCODE errCode);

        /************************************************************************/
        /* 被控制端相关API                                                      */
        /************************************************************************/

        /*
         * @brief 创建一个被控制端环境
         * @return 返回被控制端环境值，如果创建失败则返回UInt32_INVAILD
         */
        [DllImport(dllName, EntryPoint = "SLCreateClient")]
        public static extern UInt32 SLCreateClient();

        /*
         * @brief 销毁一个被控制端环境
         * @param client 要销毁的被控制端环境
         */
        [DllImport(dllName, EntryPoint = "SLDestroyClient")]
        public static extern bool SLDestroyClient(UInt32 client);

        /*
         * @brief 被控制端回调事件
         * @param client 被控制端环境
         * @param event 事件
         * @param custom 用户自定义参数
         */
        public delegate void SLCLIENT_CALLBACK(UInt32 client, SLCLIENT_EVENT event_, UInt32 custom);

        /*
         * @brief 设置被控制端事件回调函数
         * @param client 被控制端环境
         * @param pfnCallback 回调函数地址
         * @param custom 用户自定义参数，回调时内部程序会将此参数一并回调
         * @return 是否设置成功
         */
        [DllImport(dllName, EntryPoint = "SLSetClientCallback")]
        public static extern bool SLSetClientCallback(UInt32 client, SLCLIENT_CALLBACK pfnCallback, UInt32 custom);

        /*
         * @brief 被控制端登录服务器
         * @param client 被控制端环境
         * @param pstrOpenID 开发者的ID号
         * @param pstrOpenKey 开发者ID对应的验证码
         * @return 是否登录成功
         */
        [DllImport(dllName, EntryPoint = "SLClientLoginWithOpenID")]
        public static extern bool SLClientLoginWithOpenID(UInt32 client, string pstrOpenID, string pstrOpenKey);

        /*
         * @brief 被控制端登录服务器
         * @param client 被控制端环境
         * @param szAddr 服务器地址
         * @param szLic lincense
         * @return 是否登录成功
         */
        [DllImport(dllName, EntryPoint = "SLClientLoginWithLicense")]
        public static extern bool SLClientLoginWithLicense(UInt32 client, string szAddr, string szLic);

        /*
         * @brief 被控制端是否登录中
         * @param client 被控制端环境
         */
        [DllImport(dllName, EntryPoint = "SLClientIsOnLoginned")]
        public static extern bool SLClientIsOnLoginned(UInt32 client);
        /*
         * @brief 在被控制端环境中创建一个会话
         * @param client 被控制端环境
         * @return 会话值，如果创建失败，则返回UInt32_INVAILD
         */
        [DllImport(dllName, EntryPoint = "SLCreateClientSession")]
        public static extern UInt32 SLCreateClientSession(UInt32 client, ESLSessionType eType);

        /*
         * @brief 销毁一个会话
         * @param client 被控制端环境
         * @param session 会话
         * @return 是否销毁成功
         */
        [DllImport(dllName, EntryPoint = "SLDestroyClientSession")]
        public static extern bool SLDestroyClientSession(UInt32 client, UInt32 session);

        /*
         * @brief 枚举被控端当前有多少个会话
         * @param client 被控制端环境
         * @param pSessionArray 会话数组（输出参数）
         * @param nArraySize 数组长度
         * @return 一个有多少个会话
         */
        [DllImport(dllName, EntryPoint = "SLEnumClientSession")]
        public static extern UInt16 SLEnumClientSession(UInt32 client, ref UInt32 pSessionArray, UInt16 nArraySize);

        /*
         * @brief 获取被控制端连接地址
         * @remark 必须在登录成功后再获取才能获取正确的值，即当回调事件UInt32_EVENT_ONLOGIN发生后调用。通过该值主控制端才能使用该会话的服务
         * @return 地址
         */
        [DllImport(dllName, EntryPoint = "SLGetClientAddress")]
        public static extern IntPtr SLGetClientAddress(UInt32 client);

        /*
         * @brief 获取被控制端某个会话的值
         * @remark 通过该值主控制端才能使用该会话的服务
         * @return 会话值，如果会话不存在则返回NULL
         */
        [DllImport(dllName, EntryPoint = "SLGetClientSessionName")]
        public static extern IntPtr SLGetClientSessionName(UInt32 client, UInt32 session);

        /*
         * @brief 被控制端某个会话发送数据
         * @param client 被控制端环境
         * @param session 会话
         * @param lpData 发送的数据
         * @param nLen 发送的数据长度
         * @return 发送的字节数
         * @remark 目前只适用于DataTrans类型的会话
         */
        [DllImport(dllName, EntryPoint = "SLClientSessionSendData")]
        public static extern UInt32 SLClientSessionSendData(UInt32 client, UInt32 session, IntPtr lpData, UInt32 nLen);

        /*
         * @brief 被控制端某个会话接收数据
         * @param client 被控制端环境
         * @param session 会话
         * @param lpData 接收数据的缓冲区
         * @param nLen 准备接收的数据长度
         * @return 实际接收到的字节数
         * @remark 目前只适用于DataTrans类型的会话
         */
        [DllImport(dllName, EntryPoint = "SLClientSessionRecvData")]
        public static extern UInt32 SLClientSessionRecvData(UInt32 client, UInt32 session, IntPtr lpData, UInt32 nLen);

        /*
         * @brief 获取被控制端某个会话某个属性值
         * @return 是否获取成功
         */
        [DllImport(dllName, EntryPoint = "SLGetClientSessionOpt")]
        public static extern bool SLGetClientSessionOpt(UInt32 client, UInt32 session, ESLSessionOpt eOpt, IntPtr pOptVal, UInt16 nOptLen);

        /*
         * @brief 设置被控制端某个会话某个属性值
         * @return 是否设置成功
         */
        [DllImport(dllName, EntryPoint = "SLSetClientSessionOpt")]
        public static extern bool SLSetClientSessionOpt(UInt32 client, UInt32 session, ESLSessionOpt eOpt, IntPtr pOptVal, UInt16 nOptLen);

        /*
         * @brief 开启WEB服务
         * @return 是否成功
         */
        [DllImport(dllName, EntryPoint = "SLStartWebServer")]
        public static extern bool SLStartWebServer(UInt32 client, UInt16 nPort = 0);

        /*
         * @brief 关闭WEB服务
         * @return 是否成功
         */
        [DllImport(dllName, EntryPoint = "SLStopWebServer")]
        public static extern bool SLStopWebServer(UInt32 client);

        /*
         * @brief web服务过滤方法，返回true表示已经处理了当前事件，底层将不会再处理
         * @param client 被控制端环境
         * @param data 指向数据的指针
         * @param size 数据长度
         */
        public delegate bool SLWEB_FILTER(UInt32 client, IntPtr data, UInt32 custom);

        /*
         * @brief 设置web服务过滤方法
         * @param client 被控制端环境
         * @param filter 函数指针
         */
        [DllImport(dllName, EntryPoint = "SlSetWebServerFilter")]
        public static extern bool SlSetWebServerFilter(UInt32 client, SLWEB_FILTER filter);

        /*
         * @brief 向web客户端发送数据
         * @param client 被控制端环境
         * @param data 指向数据的指针
         * @param size 数据长度
         */
        [DllImport(dllName, EntryPoint = "SlWebServerSend")]
        public static extern bool SlWebServerSend(UInt32 client, IntPtr pdata, UInt16 size);

        /************************************************************************/
        /* 控制端相关API                                                        */
        /************************************************************************/
        

        /*
         * @brief 创建一个控制端环境
         * @return 返回被控制端环境值，如果创建失败则返回UInt32_INVAILD
         */
        [DllImport(dllName, EntryPoint = "SLCreateRemote")]
        public static extern UInt32 SLCreateRemote();

        /*
         * @brief 销毁一个控制端环境
         * @param remote 控制端环境
         * @return 是否销毁成功
         */
        [DllImport(dllName, EntryPoint = "SLDestroyRemote")]
        public static extern bool SLDestroyRemote(UInt32 remote);

        /*
         * @brief 主控制端回调事件
         * @param remote 主控制端环境
         * @param event 事件
         * @param custom 用户自定义参数
         */
        public delegate void SLREMOTE_CALLBACK(UInt32 remote, UInt32 session, SLREMOTE_EVENT event_, UInt32 custom);       

        /*
         * @brief 设置主控制端事件回调函数
         * @param remote 主控制端环境
         * @param pfnCallback 回调函数地址
         * @param custom 用户自定义参数，回调时内部程序会将此参数一并回调
         * @return 是否设置成功
         */
        [DllImport(dllName, EntryPoint = "SLSetRemoteCallback", CallingConvention = CallingConvention.StdCall)]
        public static extern bool SLSetRemoteCallback(UInt32 remote, SLREMOTE_CALLBACK pfnCallback, UInt32 custom);

        /*
         * @brief 创建主控制端会话
         * @param remote 控制端环境
         * @param eType 会话类型
         * @param pstrAddress 远程被控制端地址
         * @param pstrSession 远程桌面会话名
         * @return 会话
         */
        [DllImport(dllName, EntryPoint = "SLCreateRemoteSession")]
        public static extern UInt32 SLCreateRemoteSession(UInt32 remote, ESLSessionType eType, string pstrAddress, string pstrSession);

        /*
         * @brief 创建主控制端空会话(无连接)
         * @param remote 控制端环境
         * @param eType 会话类型
         * @remark 和SLCreateRemoteSession不同的是创建一个空会话，不进行连接，后面必须再使用SLConnectRemoteSession来连接会话
         * @return 会话
         */
        [DllImport(dllName, EntryPoint = "SLCreateRemoteEmptySession", CallingConvention = CallingConvention.StdCall)]
        public static extern uint SLCreateRemoteEmptySession(uint remote, ESLSessionType eType);

        /*
         * @brief 连接主控端会话
         * @param remote 控制端环境
         * @param session 会话
         * @param pstrAddress 远程被控制端地址
         * @param pstrSession 远程桌面会话名
         * @return 会话
         */
        [DllImport(dllName, EntryPoint = "SLConnectRemoteSession", CallingConvention = CallingConvention.StdCall)]
        public static extern bool SLConnectRemoteSession(UInt32 remote, UInt32 session, string pstrAddress, string pstrSession);

        /*
         * @brief 销毁一个会话
         * @param remote 控制端环境
         * @param session 会话
         * @return 是否销毁成功
         */
        [DllImport(dllName, EntryPoint = "SLDestroyRemoteSession")]
        public static extern bool SLDestroyRemoteSession(UInt32 remote, UInt32 session);

        /*
         * @brief 主控制端某个会话发送数据
         * @param remote 主控制端环境
         * @param session 会话
         * @param lpData 发送的数据
         * @param nLen 发送的数据长度
         * @return 发送的字节数
         * @remark 目前只适用于DataTrans类型的会话
         */
        [DllImport(dllName, EntryPoint = "SLRemoteSessionSendData")]
        public static extern UInt32 SLRemoteSessionSendData(UInt32 remote, UInt32 session, IntPtr lpData, UInt32 nLen);

        /*
         * @brief 主控制端某个会话接收数据
         * @param remote 主控制端环境
         * @param session 会话
         * @param lpData 接收数据的缓冲区
         * @param nLen 接收数据缓冲区长度
         * @return 实际接收到的字节数
         * @remark 目前只适用于DataTrans类型的会话
         */
        [DllImport(dllName, EntryPoint = "SLRemoteSessionRecvData")]
        public static extern UInt32 SLRemoteSessionRecvData(UInt32 remote, UInt32 session, IntPtr lpData, UInt32 nLen);

        /*
         * @brief 获取主控制端某个会话某个属性值
         * @return 是否设置成功
         */
        [DllImport(dllName, EntryPoint = "SLGetRemoteSessionOpt")]
        public static extern bool SLGetRemoteSessionOpt(UInt32 remote, UInt32 session, ESLSessionOpt eOpt, IntPtr pOptVal, UInt16 nOptLen);

        /*
         * @brief 设置主控制端某个会话某个属性值
         * @return 是否设置成功
         */
        [DllImport(dllName, EntryPoint = "SLSetRemoteSessionOpt", CallingConvention = CallingConvention.StdCall)]
        public static extern bool SLSetRemoteSessionOpt(UInt32 remote, UInt32 session, ESLSessionOpt eOpt, IntPtr pOptVal, UInt16 nOptLen);

        /*
         * @brief 设置远程桌面窗口的大小
         * @return 是否设置成功
         */
        [DllImport(dllName, EntryPoint = "SLSetDesktopSessionPos", CallingConvention = CallingConvention.StdCall)]
        public static extern bool SLSetDesktopSessionPos(UInt32 remote, UInt32 session, int x,int y,int width,int height);

        /*
        * @brief 设置代理
        * @param client 被控制端环境
        * @param proxy 代理设置
        * @return 是否设置成功
        */
        [DllImport(dllName, EntryPoint = "SLSetClientProxy", CallingConvention = CallingConvention.StdCall)]
        public static extern bool SLSetClientProxy(UInt32 client, ref SLPROXY_INFO proxy);


        /*
        * @brief 设置代理
        * @param client 被控制端环境
        * @param remote 控制端环境
        * @return 是否设置成功
        */
        [DllImport(dllName, EntryPoint = "SLSetRemoteProxy", CallingConvention = CallingConvention.StdCall)]
        public static extern bool SLSetRemoteProxy(UInt32 remote, ref SLPROXY_INFO proxy);
    }
}
