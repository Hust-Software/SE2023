import md5 from './md5.min.js'
var fileManger = wx.getFileSystemManager()

function translate3(imagePath){
  return new Promise((resolve, reject) => {
  fileManger.readFile({
    filePath: imagePath,
    encoding: 'base64',
    success: res => {
      let image = res.data
      console.log('encoding success')
      console.log(md5('5ce78a3732e1e093'+ image+ '5D6607C4A0AC11EA9476D29F9B831900'+ 'MT1qllCJnAMQk4vUtWFOSl30qkVuzqEH').toUpperCase())
      wx.uploadFile({
        url: 'https://openapi.youdao.com/ocrtransapi',
        filePath: imagePath,
        name: 'image', 
        formData: {
          type: '1',
          from: 'auto',
          to: 'auto',
          appKey: '5ce78a3732e1e093',
          salt: '5D6607C4A0AC11EA9476D29F9B831900',
          sign: md5('5ce78a3732e1e093'+ image+ '5D6607C4A0AC11EA9476D29F9B831900'+ 'MT1qllCJnAMQk4vUtWFOSl30qkVuzqEH').toUpperCase(),
          q: image
        },
        success(res) {
          wx.hideLoading()
            console.log('recognize success',res)
            if (res.data){
              resolve(res.data)
              wx.showToast({
                title: '翻译成功',
                icon: 'none',
                duration: 3000
              })
            } else {
              reject({ status: 'error', msg: '翻译失败' })
              wx.showToast({
                title: '翻译失败',
                icon: 'none',
                duration: 3000
              })
            }
        },
        fail(res) {
          console.log(res)
        },
      })
    },
    fail(res) {
      console.error(res)
    }
  })
})
}
module.exports.translate3 = translate3