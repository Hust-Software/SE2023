//index.js
//获取应用实例
import {
  translate
} from '../../utils/api.js'
import secret from "../../utils/sha256.js"
import CryptoJS from '../../utils/crypto-js.min.js'
const EncryptUtils = require('../../utils/encrypt/encryptUtils')
const app = getApp()
const recorderManager = wx.getRecorderManager()
const fileManger = wx.getFileSystemManager()
const appid = '20230414001641939'  //注册百度翻译api
const key = 'GLXAN22y4UPqUJE4Vlrj'    //注册百度翻译api

Page({
  data: {
    query: '',
    hideClearIcon: true,
    result: [],
    curLang: {},

    voice_base64 : " ",
    // 录音文件的临时路径
    tmpfilePath : " ",
    savedfilePath : "",
    // 语音识别结果
    recognitionResult : '',
    // 翻译结果
    translationResult : ''
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
    var that = this
    recorderManager.onStart((res) => {
      console.log('录音开始')
    })
    recorderManager.onStop((res) => {
        that.setData({ tmpfilePath : res.tempFilePath}) // 文件临时路径
        console.log('获取到文件：' + that.data.tmpfilePath)
    
         //调用文件管理器的一个读取文件内容方法
         fileManger.readFile({
          //路径
          filePath:that.data.tmpfilePath,
          encoding:'base64',
          //转换的编码格式
          success: res => {
           that.setData({ voice_base64 : res.data })
           console.log('encoding success');
          },
          fail(res) {
            console.error(res)
          }
        })

        //10位Unix时间戳
        var timestamp = Date.now();
        timestamp = (timestamp - timestamp %1000) / 1000;
        // step1: base64编码音频文件
        //step2: 得到待加密的字符串
        var msg = '20230414001641939' + timestamp.toString() + that.data.voice_base64;
        //step3: 加密得到签名，作为`X-Sign`。若hmac得到的是二进制字节，需要进行base64编码
        var hash = CryptoJS.HmacSHA256(msg, 'GLXAN22y4UPqUJE4Vlrj');
        var sign = CryptoJS.enc.Base64.stringify(hash);
        // 将录音文件发送到百度语音识别API进行语音识别
        wx.showLoading({
          title: '正在翻译语音...',
        }),
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
            from:'zh',
            to:'en',
            voice:that.data.voice_base64,
            format:'pcm',
          },
          success(res){
            console.log('recognize success',res),
            that.setData({recognitionResult: res.data.source}) ,
            that.setData({translationResult: res.data.target}) ,
            that.setData({result: that.data.translationResult}) ,
    
            wx.hideLoading(),
            wx.showToast({
              title: '语音翻译成功',
              //icon: 'success',
            })
          },
          fail(err){
            console.log('语音翻译失败')
            console.log(err.errMsg)
            console.log(err.code)
            wx.hideLoading()
            wx.showToast({
              title: '语音翻译失败，请重试',
              //icon: 'none',
            })
          }
        })

    })
    recorderManager.onError((res) => {
      console.log('录音失败了！')
      console.log(res)
    })

    recorderManager.start({
      duration: 60000,
      sampleRate: 16000, //采样率，有效值 8000/16000/44100
      numberOfChannels: 1, //录音通道数，有效值 1/2
      encodeBitRate: 96000, //编码码率
      format: 'pcm', //音频格式，有效值 aac/mp3
      frameSize: 50, //指定帧大小
      audioSource: 'auto' //指定录音的音频输入源，可通过 wx.getAvailableAudioSources() 获取
    })
    
  },

  // 点击“停止录音”按钮时调用该方法
  stopRecord: function () {
    var that = this
    recorderManager.stop()
  },

  playRecord: function (){
    var that = this 
    wx.showLoading({
      title: '正在播放语音...',
    })
    // 获取innerAudioContext实例
    const innerAudioContext = wx.createInnerAudioContext()
    // 是否自动播放
    innerAudioContext.autoplay = true
    // 设置音频文件的路径
    innerAudioContext.src = that.data.tmpfilePath;
    // 播放音频文件
    innerAudioContext.onPlay(() => {
      console.log('开始播放')
    });
    wx.hideLoading()
  },


})