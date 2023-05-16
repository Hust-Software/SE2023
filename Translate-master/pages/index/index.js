//index.js
//获取应用实例
import {translate} from '../../utils/api.js'
import {translate2} from '../../utils/api2.js'
import md5 from '../../utils/md5.min.js'
const app = getApp()
var recorderManager = wx.getRecorderManager()
var fileManger = wx.getFileSystemManager()
const appid = '20230414001641939'  
const key = 'GLXAN22y4UPqUJE4Vlrj'    
var tmpfilePath = " "
var recognitionResult = ""
var translationResult = ""
var lang
recorderManager.onError((res) => {
  console.log('录音失败了！')
  console.log(res)
})
recorderManager.onStart((res) => {
  console.log('录音开始')
})

Page({
  data: {
    query: '',
    hideClearIcon: true,
    result: [],
    curLang: {},
  },
  onLoad: function(options) {
    console.log(options)
    if (options.query) {
      this.setData({
        query: options.query
      })
    }

  },
  onShow: function() {
    if (this.data.curLang.lang !== app.globalData.curLang.lang) {
      this.setData({
        curLang: app.globalData.curLang
      })
      lang = this.data.curLang.lang
      this.onConfirm()
    }

  },
  onInput: function(e) {
    this.setData({
      'query': e.detail.value
    })
    if (this.data.query.length > 0) {
      this.setData({
        'hideClearIcon': false
      })
    } else {
      this.setData({
        'hideClearIcon': true
      })
    }
  },
  onTapClose: function() {
    this.setData({
      query: '',
      hideClearIcon: true
    })
  },
  onConfirm: function() {
    if (!this.data.query) return
    translate(this.data.query, {
      from: 'auto',
      to: this.data.curLang.lang
    }).then(res => {
      this.setData({
        'result': res.trans_result
      })
      let history = wx.getStorageSync('history') || []
      history.unshift({
        query: this.data.query,
        result: res.trans_result[0].dst
      })
      history.length = history.length > 10 ? 10 : history.length
      wx.setStorageSync('history', history)
    })
  },

  startRecord: function () {
    recorderManager.start({
      duration: 10000,
      sampleRate: 16000, //采样率，有效值 8000/16000/44100
      numberOfChannels: 1, //录音通道数，有效值 1/2
      encodeBitRate: 50000, //编码码率
      format: 'PCM', //音频格式，有效值 aac/mp3
      frameSize: 50, //指定帧大小
      audioSource: 'voice_recognition' //指定录音的音频输入源，可通过 wx.getAvailableAudioSources() 获取
    })
  },

  // 点击“停止录音”按钮时调用该方法
  stopRecord: function () {
      recorderManager.onStop((res) => {
        tmpfilePath = res.tempFilePath // 文件临时路径
        console.log('获取到文件：' + tmpfilePath)
        translate2(tmpfilePath, {
          from: "zh",
          to: lang
        }).then(res => {
        recognitionResult= res.data.source 
        translationResult= res.data.target
        this.setData({
          query : recognitionResult,
          result: [{
            src: recognitionResult,
            dst: translationResult
          }]
        })
      })
      })
      recorderManager.stop()
  },

  playRecord: function (){
    wx.showLoading({
      title: '正在播放语音...',
    })
    // 获取innerAudioContext实例
    const innerAudioContext = wx.createInnerAudioContext()
    // 是否自动播放
    innerAudioContext.autoplay = true
    // 设置音频文件的路径
    innerAudioContext.src = tmpfilePath;
    // 播放音频文件
    innerAudioContext.onPlay(() => {
      console.log('开始播放')
    });
    wx.hideLoading()
  },

  onImageInput() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success:(res) => {
          //const tmpfilePath = res.tempFiles.tempFilePath
          console.log(res.tempFiles[0].tempFilePath)
          // 获取用户文件路径
        wx.showLoading({
          title: '正在识别',
        })

        var that = this
        let imagePath = res.tempFiles[0].tempFilePath
        var image
        fileManger.readFile({
          //路径
          filePath:imagePath,
          //encoding :,
          //转换的编码格式
          success: res => {
           image = res.data
           console.log('encoding success'+image)
          },
          fail(res) {
            console.error(res)
          }
        })
        let salt = Date.now()
        let cuid ='APICUID'
        let mac = 'mac'
        let imagedata = md5(image)
        let sign = md5(`${appid}${imagedata}${salt}${cuid}${mac}${key}`)
        console.log(appid+imagedata+salt+cuid+mac+key)
        console.log(imagedata)
        wx.uploadFile({
          url: 'https://fanyi-api.baidu.com/api/trans/sdk/picture',
          filePath: res.tempFiles[0].tempFilePath,
          name: '1.jpg',
          formData: {
            image,
            from:'zh',
            to:'en',
            appid,
            salt,
            cuid,
            mac,
            version:3,
            sign
          },
          success(res) {
            console.log('上传成功',res.data)
          },
          fail(res) {
            console.log(res)
          },
          complete() {
            wx.hideLoading()
          }
        })
      }
    })
  },
})