import md5 from './md5.min.js'
const appKey = '5ce78a3732e1e093'
const Key = 'MT1qllCJnAMQk4vUtWFOSl30qkVuzqEH'
const salt = '5D6607C4A0AC11EA9476D29F9B831900'
var fileManger = wx.getFileSystemManager()

function picture_translate(imagePath){
  return new Promise((resolve, reject) => {
    fileManger.readFile({
      filePath: imagePath,
      encoding: 'base64',
      success: res => {
        let image = res.data
        let sign = md5(appKey+ image+ salt+ Key).toUpperCase()
        wx.showLoading({title: '正在识别',})
        wx.uploadFile({
          url: 'https://openapi.youdao.com/ocrtransapi',
          filePath: imagePath,
          name: 'image', 
          formData: {
            type: '1',
            from: 'auto',
            to: 'auto',
            appKey,
            salt,
            sign,
            q: image
          },
          success(res) {
            if (res.data){
              resolve(res.data)
              wx.hideLoading()
              wx.showToast({
                title: '翻译成功',
                icon: 'success',
                duration: 2000
              })
            } else {
              reject({ status: 'error', msg: '翻译失败' })
              wx.showToast({
                title: '翻译失败',
                icon: 'error',
                duration: 2000
              })
            }
          },
          fail(res) {
            wx.showToast({
              title: '网络异常',
              icon: 'error',
              duration: 2000
            })
          },
        })
      },
      fail(res) {
      }
    })
  })
}
module.exports.picture_translate = picture_translate