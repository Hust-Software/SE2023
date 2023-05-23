//app.js
App({
  onLaunch: function() {
    // 展示本地存储能力
    this.globalData.curLang = wx.getStorageSync('curLang') || this.globalData.langList[0]
  },
  globalData: {
    curLang: {},
    langList: [{
      'chs': 'English',
      "lang": 'en',
      "index": 0
    },
    {
      'chs': '中文',
      'lang': 'zh',
      "index": 1
    },
    {
      'chs': '日本語',
      'lang': 'jp',
      "index": 2
    },
    {
      'chs': '한국어',
      'lang': 'kor',
      "index": 3
    },
    {
      'chs': 'Français',
      'lang': 'fra',
      "index": 4
    },
    {
      'chs': 'Español',
      'lang': 'spa',
      "index": 5
    },
    {
      'chs': ' بالعربية ',
      'lang': 'ara',
      "index": 6
      }
    ]
  }
})