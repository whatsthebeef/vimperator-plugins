/**
 * ==VimperatorPlugin==
 * @name           autoproxychanger.js
 * @description    proxy setting plugin
 * @description-ja プロクシ設定
 * @minVersion     2.0pre
 * @author         pekepeke
 * @version        0.1.1
 * ==/VimperatorPlugin==
 *
 * Usage:
 * :proxy [setting_name]      -> set proxy setting to setting_name
 * :proxy!                    -> set proxy setting to default setting
 * :toggleautoproxy           -> proxy autochanger on/off toggle
 *
 * The proxy_settings is a string variable which can set on
 * vimperatorrc as following.
 *
 * let autochanger_proxy_settings = "[{ name:'disable', usage: 'direct connection', proxy:{type:0} }]"
 * let autochanger_proxy_enabled = "true"
 *
 * or your can set it using inline JavaScript.
 *
 * liberator.globalVariables.autochanger_proxy_enabled = true;
 * liberator.globalVariables.autochanger_proxy_settings = [{
 *      name  : 'disable',
 *      usage : 'direct connection',
 *      proxy :{
 *        type      :0,
 *      },
 *    },{
 *      name  : 'http',
 *      usage : 'localhost proxy',
 *      proxy :{
 *        type      : 1,
 *        http      : 'localhost',
 *        http_port : 8080,
 *      },
 *      url   : /http:\/\/www.nicovideo.jp/,
 *      run   : 'java.exe',
 *      args  : ['C:\Personal\Apps\Internet\NicoCacheNl\NicoCache_nl.jar'],
 *    }];
 * EOM
 *
 */

liberator.plugins.AutoProxyChanger = (function() {
var proxy_settings = liberator.globalVariables.autochanger_proxy_settings;
if (!proxy_settings) {
  proxy_settings = [{
    name  : 'disable',
    usage : 'direct connection',
    proxy :{
      type      : 0,
    },
  },{
    name  : 'http',
    usage : 'localhost:8080',
    proxy :{
      type      : 1,
      http      : 'localhost',
      http_port : 8080,
    },
  }];
}

const ENABLE_ICON = 'data:image/png;base64,'
  + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAABnRSTlMA/wAAAIBJekM9AAAB'
  + 'mElEQVR4nIWS3StDYRzHv895njOvaWy4WWPJcquE8nIrbSW54mrGjWsppbQtCuXajZd/QDKs'
  + 'UNxoLpYbKc1b2zm4mJ2NsGPNOC6OnHXGfO+eb8/neX6fp4e43aNWax3+iCgKK6uW3IZZrXXT'
  + '01OEkPzdiqL4fLPja04Al6H97aU3AAwAIcTmmMsHIoFJAIvDfgDja31Y8n8Dapw97cUGSilH'
  + 'CUlnshuB41+H1IDMJ5QsMb2cc3LMALha4fXOAPB6KIAKYcfroaIoaMBTKltaSqvlWGElDQgd'
  + 'nwBwtf6jxFRUXQDfYxRQYqIo+Hyz+eepSm/y+3MqI6czmvTVdbh/wGFvbBJuI2ZT9dbmbq4S'
  + '4w3l5ZTjOA1wOHuNxkrhNsIYLyXiOqX8MADBYFD3Gj9Kuh4AUeDJbUfcd4W/FhtbbEmfrT9+'
  + 'lJ0eBSJRl05JSsTNphop8WCrbwiHzw8O92j34EQtiZU1D7XZSpYtF51dHXa7XUrGGeNfUy8c'
  + 'x6XkV57xiaRUZawyFPFMTt4no9HHm2X1hvkFvZIuXyp4v/YfvuEoAAAAAElFTkSuQmCC';

const DISABLE_ICON = 'data:image/png;base64,'
  + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAABnRSTlMA/wAAAIBJekM9AAAB'
  + 'i0lEQVR4nH2SwUoCURSG/7lzZwJxYWqtRItQwm3LbCkStol8gLAW9QzB4AgW9QIJWc8QgVBI'
  + '7RQ3bsOmQGdsY466aCZ1RGwxksNo/rt7uN+55ztcJpk89vsD+CeKIt/e+awV6vcHBOGMYZjZ'
  + '2+PxOJ3OZK+9ACqVyk3OB4ACYBgmGo3OAoVCAcDJaRNA9noLueYEMBOLxXieZ1mWEDIYDPL5'
  + '/Nwhp8BoNBoOh71er9/vA4hEIqIoAqyYYgGgqYopVlHkKaBpmsPhMAxDEIQFSlOgXC6bjRcr'
  + 'URM1DwBEUVysRBVFTqczlkasVUnXdU3TTKsJ8P5R3T+Ih4KbcqPm9aw83D9alSilTqeTEDIF'
  + '4nu7Ltey3KhRyqntlk1p/lqLxaJtG39KtjoAZoyUtXqU/Fz8tejFOS9JkmEYpVKpVj+0Kant'
  + 'ltezqra/1tc2qtXX55cnNpFIcBwXDoeDwWDO9xbZ2Q6FQmqnRSmn6d+EEP1H4yjX7qhul5tf'
  + '4mi3263X65IkmS9cXtmVbPkFaGbHAxyF/18AAAAASUVORK5CYII=';

var acmanager = [];

const prefkeys = ['ftp','gopher','http','ssl'];
var prevSetting = null;
var _isEnable = false;
var ProxyChanger = function() this.initialize.apply(this, arguments);
ProxyChanger.prototype = {
  initialize: function(){
    this.panel = this.createPanel();
  },
  createPanel: function(){
    var self = this;
    var panel = document.getElementById('proxychanger-status');
    if (panel) {
      var parent = panel.parentNode;
      parent.removeChild(panel);
    }
    panel = document.createElement('statusbarpanel');
    panel.setAttribute('id', 'proxychanger-status');
    panel.setAttribute('class', 'statusbarpanel-iconic');
    panel.setAttribute('src', self.isEnable ? ENABLE_ICON : DISABLE_ICON);
    panel.addEventListener('click', function(e) { self.isEnable = !self.isEnable; }, false);
    document.getElementById('status-bar').insertBefore(
      panel, document.getElementById('security-button').nextSibling);
    return panel;
  },
  get isEnable(){
    return _isEnable
  },
  set isEnable(val) {
    this.panel.setAttribute('src', val ? ENABLE_ICON : DISABLE_ICON);
    _isEnable = val;
  },
  autoApplyProxy : checkApplyProxy
};
var manager = new ProxyChanger();

function init(){
  // initialize manager
  proxy_settings.forEach(function(s){
    if (s.url instanceof RegExp && s.name)
      acmanager.push( {url: s.url, name: s.name, run: s.run || '', args: s.args || [] } );
  });

  proxy_settings.splice(0,0, {name:'default', usage:'default setting', proxy: restore() });

  if (acmanager.length > 0) {
    autocommands.add("LocationChange", '.*', 'js liberator.plugins.AutoProxyChanger.autoApplyProxy()');
    //window.addEventListener("unload", function() applyProxyByName('default'), false);
  }

  manager.isEnable = eval(liberator.globalVariables.autochanger_proxy_enabled) || false;
}
function restore(){
  let opt = new Object();
  opt['type'] = options.getPref("network.proxy.type",0);
  prefkeys.forEach(function(key){
    opt[key] = options.getPref("network.proxy." + key, '');
    opt[key+"_port"] = options.getPref("network.proxy." + key + "_port", 0);
  });
  return opt;
}
function dump(obj) {
  var m='';
  for (var key in obj) m+=key+":"+obj[key]+"\n";
  return m
}
function checkApplyProxy(){
  if (prevSetting != null) {
    applyProxy(prevSetting);
    prevSetting = null;
  }
  if (!_isEnable) return;
  acmanager.some( function( manager ){
    if (manager.url.test(content.location.href)) {
      prevSetting = restore();
      applyProxyByName(manager.name);
      if (manager.run) {
        io.run(manager.run, manager.args, false);
        manager.run = null; manager.args = null;
      }
      return true;
    }
    return false;
  });
}

function applyProxyByName( name ){
  if (!name) {
      liberator.echo( dump(restore())+'usage:proxy [setting name]' );
    return;
  }
  proxy_settings.some( function(setting){
    if (setting.name.toLowerCase() != name.toLowerCase()) return false;
    // delete setting
    prefkeys.forEach( function(key){
      options.setPref("network.proxy."+key, '');
      options.setPref("network.proxy."+key+"_port", 0);
    });

    // apply proxy
    applyProxy(setting.proxy)
    return true;
  });
}

function applyProxy(proxy){
  for (var key in proxy){
    if (typeof proxy[key] != 'undefined')
      options.setPref("network.proxy."+key, proxy[key]);
  }
}

commands.addUserCommand(["proxy"], 'Proxy settings',
  function(args, bang) {
    if (bang) applyProxyByName('default');
    else applyProxyByName(args.string);
  }, {
    bang: true,
    completer: function(context, arg, special){
      context.title = ['Name','Usage'];
      var list = context.filter ?
        proxy_settings.filter( function(el) this.test(el.name), new RegExp("^"+context.filter))
        : proxy_settings;
      context.completions = list.map( function(v) [v.name, v.usage] );
    }
});

commands.addUserCommand(["toggleautoproxy","aprxy"], "Toggle auto proxy changer on/off",
  function(){manager.isEnable = !manager.isEnable}, {}
);

init();
return manager;
})();