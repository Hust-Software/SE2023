import CryptoJS from './crypto-js.min.js'
const X_Appid = '20230414001641939'
const secret_key = 'GLXAN22y4UPqUJE4Vlrj'
var fileManger = wx.getFileSystemManager()
var voice_base64 = ''

function voice_translate(tmpfilePath, { from = 'auto', to = 'auto' } = { from: 'auto', to: 'auto' }) {
  return new Promise((resolve, reject) => {
    fileManger.readFile({
      filePath: tmpfilePath,
      encoding: 'base64',
      success: res => {
        voice_base64 = res.data
        var timestamp = Date.now()
        timestamp = (timestamp - timestamp %1000) / 1000
        var msg = X_Appid + timestamp.toString() + voice_base64
        var sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(msg,secret_key))
        wx.showLoading({title: '正在翻译语音...',})
        wx.request({
          url: 'https://fanyi-api.baidu.com/api/trans/v2/voicetrans',
          method: 'POST',
          header: {
            Content_Type: 'application/json',
            X_Appid,
            X_Timestamp: timestamp,
            X_Sign: sign,
          },
          data: {
            from,
            to,
            voice: voice_base64,
            format: 'pcm',
          },
          success(res){
            wx.hideLoading()
            if (res.data && res.data.data){
              resolve(res.data)
            } else {
              reject({ status: 'error', msg: '翻译失败' })
              wx.showToast({
                title: '翻译失败',
                icon: 'error',
                duration: 1500
              })
            }
          },
          fail(err){
            wx.hideLoading()
            wx.showToast({
              title: '网络异常',
              icon: 'error',
              duration: 1500
            })
          }
        })
      },
      fail(res) {
        wx.showToast({
          title: '翻译失败',
          icon: 'error',
          duration: 1500
        })
      }
    })
  })
}
module.exports.voice_translate = voice_translate