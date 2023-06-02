//index.js
import {translate} from '../../utils/translate_api.js'
import {voice_translate} from '../../utils/voice_translate_api.js'
import {picture_translate} from '../../utils/picture_translate_api.js'

const tok = '24.4f6634208f8ff6105a302d5a81170380.2592000.1688024623.282335-34176742'
const cuid = '5D6607C4A0AC11EA9476D29F9B831900'
const app = getApp()
const recorderManager = wx.getRecorderManager()
const InnerAudioContext = wx.createInnerAudioContext()
var tmpfilePath = ''
var recognitionResult = ''
var translationResult = ''
var imagePath = ''
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
    q: '',
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
      translationResult = res.trans_result[0].dst
      let history = wx.getStorageSync('history') || []
      history.unshift({
        query: this.data.query,
        result: res.trans_result[0].dst
      })
      history.length = history.length > 10 ? 10 : history.length
      wx.setStorageSync('history', history)
    })
  },

  // 点击“开始录音”按钮时调用该方法
  startRecord: function () {
    recorderManager.start({
      duration: 10000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 50000,
      format: 'PCM',
      frameSize: 50,
      audioSource: 'voice_recognition'
    })
  },

  // 点击“停止录音”按钮时调用该方法
  stopRecord: function () {
    recorderManager.onStop((res) => {
      tmpfilePath = res.tempFilePath
      voice_translate(tmpfilePath, {
        from: "zh",
        to: this.data.curLang.lang
      }).then(res => {
        recognitionResult = res.data.source
        translationResult = res.data.target
        this.setData({
          query : recognitionResult,
          result: [{
            src: recognitionResult,
            dst: translationResult
          }]
        })
        let history = wx.getStorageSync('history') || []
        history.unshift({
          query: recognitionResult,
          result: translationResult
        })
        history.length = history.length > 10 ? 10 : history.length
        wx.setStorageSync('history', history)
      })  
    })
    recorderManager.stop()
  },

  // 点击“播放语音”按钮时调用该方法
  startTTS : function () {
    this.setData({
      q: this.data.result[0].dst
    })
    let Q = this.data.q
    if(translationResult){
      if(this.data.curLang.lang != 'zh' && this.data.curLang.lang != 'en'){
        wx.showToast({
          title: '仅支持中英文',
          icon: 'error',
          duration: 1500
        })
      } else {
        InnerAudioContext.src = 'https://tsn.baidu.com/text2audio?'+ 'tex='+ Q+ '&tok='+ tok+ '&cuid='+ cuid+ '&ctp=1&lan=zh&aue=3'
        InnerAudioContext.onPlay(() =>{
          wx.showToast({
            title: '播放成功',
            icon: 'success',
            duration: 1500
          })
        })
        InnerAudioContext.play()
      }
    }
    else{
      wx.showToast({
        title: '译文为空',
        icon: 'error',
        duration: 1500
      })
    }
  },

  // 点击“图片识别”按钮时调用该方法
  onImageInput : function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success:(res) => {
        imagePath = res.tempFiles[0].tempFilePath
        picture_translate(imagePath).then(res => {
          let responseObject = JSON.parse(res);
          let responseObjectLength = responseObject.resRegions.length
          recognitionResult = ''
          translationResult = ''
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
          let history = wx.getStorageSync('history') || []
          history.unshift({
            query: recognitionResult,
            result: translationResult
          })
          history.length = history.length > 10 ? 10 : history.length
          wx.setStorageSync('history', history)
        })
      }
    })
  },
})