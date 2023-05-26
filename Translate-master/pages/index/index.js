//index.js
//获取应用实例
import {translate} from '../../utils/api.js'
import {translate2} from '../../utils/api2.js'
import {translate3} from '../../utils/api3.js'
import md5 from '../../utils/md5.min.js'

const app = getApp()
var recorderManager = wx.getRecorderManager()
var fileManager = wx.getFileSystemManager()  
var tmpfilePath = " "
var recognitionResult = ""
var translationResult = ""
var imagePath = " "
var resaultTTS 
var innerAudioContext2
var fd 
var src
var dst

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
    result: [{
      src,
      dst
    }],
    curLang: {},
  },
  onLoad: function(options) {
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
    fileManager.unlink({
      filePath: `${wx.env.USER_DATA_PATH}/tts_audio.mp3`,
      success(res) {
        console.log('删除成功')
      },
      fail(res) {
        console.error(res)
      }
    })
    fileManager.open({
      filePath: `${wx.env.USER_DATA_PATH}/tts_audio.mp3`,
      flag: 'a',
      success(res){
        fd = res.fd
        console.log('创建 成功')
      }
    })

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
          to: this.data.curLang.lang
        }).then(res => {
          recognitionResult= res.data.source 
          translationResult= res.data.target
          resaultTTS = res.data.target_tts
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

    startTTS : function(){
        let q = this.data.result[0].dst
        if (q == null){
          q = this.data.result
        }
          console.log(q)
        let salt = '5D6607C4A0AC11EA9476D29F9B831900'
        let appKey = '3c73630856c36c49'
        let sign = md5(appKey+ q+ salt+ 't3zj2oAkB5nqnOewPIpR2Fioz8JaTqsI').toUpperCase()
    console.log(sign)
        wx.request({
          url: 'https://openapi.youdao.com/ttsapi',
          method: 'POST',
          header: {
            Content_Type: 'application/json',   
          },
          data: {
            q:q,
            appKey,
            salt,
            sign,
            format:'mp3',
            voiceName:'youxiaoqin',
          },
        success(res){
          wx.hideLoading()
          console.log('recognize success',res)
          console.log(q)
          if (res.data){
            wx.showToast({
              title: '播放成功',
              icon: 'none',
              duration: 3000
            })
          }
        },
        fail(err){
          console.log('语音播放失败')
          console.log(err.errMsg)
          console.log(err.code)
          wx.hideLoading()
          wx.showToast({title: '语音播放失败，请重试',})
        }
    })
    },

  onImageInput() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success:(res) => {
          console.log(res.tempFiles[0].tempFilePath)
          // 获取用户文件路径
        wx.showLoading({
          title: '正在识别',
        })
         imagePath = res.tempFiles[0].tempFilePath
        translate3(imagePath).then(res => {
          console.log(res)
          let responseObject = JSON.parse(res);
          console.log(responseObject.resRegions)
          let responseObjectLength = responseObject.resRegions.length
          recognitionResult = ""
          translationResult = ""
          for (let i = 0; i< responseObjectLength; i++){
            recognitionResult = recognitionResult + responseObject.resRegions[i].context + '\n'
          }
          for (let i = 0; i< responseObjectLength; i++){
            translationResult = translationResult + responseObject.resRegions[i].tranContent + '\n'
          }
          this.setData({
            query : recognitionResult,
            result: [{
              src: recognitionResult,
              dst: translationResult
            }]
          })
        })
      }
    })
  },
})