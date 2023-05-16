import CryptoJS from './crypto-js.min.js'
var fileManger = wx.getFileSystemManager()
var voice_base64 = "a "
function translate2(tmpfilePath, { from = 'auto', to = 'auto' } = { from: 'auto', to: 'auto' }) {
  return new Promise((resolve, reject) => {
    //10位Unix时间戳
    var timestamp = Date.now();
    timestamp = (timestamp - timestamp %1000) / 1000;
    var msg = '20230414001641939' + timestamp.toString() + voice_base64;
    var sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(msg,'GLXAN22y4UPqUJE4Vlrj'));
    fileManger.readFile({
      //路径
      filePath:tmpfilePath,
      encoding:'base64',
      //转换的编码格式
      success: res => {
        voice_base64 = res.data 
        timestamp = Date.now();
        timestamp = (timestamp - timestamp %1000) / 1000;
        msg = '20230414001641939' + timestamp.toString() + voice_base64;
        sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(msg,'GLXAN22y4UPqUJE4Vlrj'));
        console.log('encoding success');
        wx.showLoading({title: '正在翻译语音...',}),
        // 调用百度语音翻译API进行语音翻译
        wx.request({ 
          url: 'https://fanyi-api.baidu.com/api/trans/v2/voicetrans',
          method: 'POST',
          header: {
            Content_Type: 'application/json',		
            X_Appid: '20230414001641939',
            X_Timestamp:timestamp,
            X_Sign:sign,
          },
          data: {
            from,
            to,
            voice:voice_base64,
            format:'pcm',
          },
          success(res){
            wx.hideLoading()
            console.log('recognize success',res)
            if (res.data && res.data.data){
              resolve(res.data)
            } else {
              reject({ status: 'error', msg: '翻译失败' })
              wx.showToast({
                title: '翻译失败',
                icon: 'none',
                duration: 3000
              })
            }
          },
          fail(err){
            console.log('语音翻译失败')
            console.log(err.errMsg)
            console.log(err.code)
            wx.hideLoading()
            wx.showToast({title: '语音翻译失败，请重试',})
          }
        })
      },
      fail(res) {
        console.error(res)
      }
    })
  })
}
module.exports.translate2 = translate2