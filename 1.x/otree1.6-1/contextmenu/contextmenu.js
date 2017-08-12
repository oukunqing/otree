var mycmenu = mycmenu || {};

mycmenu.$ = function(id){return document.getElementById(id);};
mycmenu.$T = function(tag){return document.getElementsByTagName(tag);};
mycmenu.isMSIE = (navigator.userAgent.indexOf('MSIE') >= 0 && navigator.userAgent.indexOf('Opera') < 0);
mycmenu.isIE6 = navigator.userAgent.indexOf('MSIE 6.0') >= 0;
mycmenu.dce = function(element){return document.createElement(element);};
mycmenu.DocumentElement = function(){return document.documentElement.clientHeight == 0 ? document.body : document.documentElement;};
mycmenu.getTimeTick = function(){return (new Date().getTime() + '').substr(4,6);};
mycmenu.shortcutkey = [];
mycmenu.getMyName = function(){ var es = mycmenu.$T('script'); var scriptSrc = es[es.length -1].src; return scriptSrc.split('/')[scriptSrc.split('/').length-1];};
mycmenu.jsName = mycmenu.getMyName();

function ContextMenu(ev, config, obj){
	this._cg = {
		id: 'cm001',
		level: 0,					//菜单层级
		width: 100,					//菜单默认宽度(最小宽度)
		separator: 'separator',		//分隔符保留关键字
		lineHeight: 18,				//行高度
		borderHeight: 9,			//边框高度2+1，padding 3*2
		borderWidth: 16,			//边框宽度，padding 3*2 + padding 5*2
		subIconWidth: 16,			//子项图标宽度，6 + 10(留白)
		separatorHeight: 7,			//分隔符高度
		background: '#fff',			//背景色
		border: 'solid 1px #aca899',//边框样式
		pos: this.MouseClick(ev),	//鼠标单击位置
		zindex: mycmenu.getTimeTick(),
		coverOcx: false				//是否覆盖在OCX之上
	};
	this.Setting(config);
	this.Show();
	this.StopBubble(ev);
}

ContextMenu.prototype.isNull = function(par){
	return par == undefined || par == null;
};

ContextMenu.prototype.Setting = function(cg){
	var _ = this;
	var _cg = _._cg;
	if(!_.isNull(cg.id)){_cg.id = cg.id;}
	if(!_.isNull(cg.separator)){_cg.separator = cg.separator;}
	if(!_.isNull(cg.zindex)){_cg.zindex = cg.zindex;}
	if(!_.isNull(cg.item)){_cg.item = cg.item;}
	if(!_.isNull(cg.width)){_cg.width = cg.width;}
	if(!_.isNull(cg.opacity)){_cg.opacity = cg.opacity;}
	if(!_.isNull(cg.background)){_cg.background = cg.background;}
	if(!_.isNull(cg.border)){_cg.border = cg.border;}
	if(!_.isNull(cg.coverOcx)){_cg.coverOcx = cg.coverOcx;}

	this.config = this._cg;
	this.id = this._cg.id;
};

//阻止事件冒泡，阻止浏览器右键菜弹出
ContextMenu.prototype.StopBubble = function(ev){
    if(ev.stopPropagation){ev.stopPropagation();} else{ev.cancelBubble = true;}
    if(ev.preventDefault){ev.preventDefault();} else{ev.returnValue = false;}
};

ContextMenu.prototype.MouseClick = function(ev){
    ev = ev || window.event;
	return this.MouseCoords(ev);
};

ContextMenu.prototype.MouseCoords = function(ev){
    if (ev.pageX || ev.pageY) {
        return { x: ev.pageX, y: ev.pageY };
    }
    return {
        x: ev.clientX + document.body.scrollLeft - document.body.clientLeft,
        y: ev.clientY + document.body.scrollTop - document.body.clientTop
    };
};

ContextMenu.prototype.BuildItemContent = function(item){
	var strHtml = (item.sub != null && item.sub.item != null ? '<span class="cm-sub-icon"></span>' : '') + item.text;
	if(mycmenu.CheckShortcutKey(item.shortcutkey)){
		strHtml += '<font style="font-size:12px;font-family:宋体;">(<u>' + item.shortcutkey.toUpperCase() + '</u>)</font>';
		return {hasKey:true, html:strHtml};
	}
	return {hasKey:false, html:strHtml};
};

ContextMenu.prototype.BuildMenuItem = function(item, cg){
	var _this = this;
	var cmList = null;
	if(item.text == _this._cg.separator){
		cmList = mycmenu.dce('div');
		cmList.className = 'cm-item-separator';
	}
	else{
		cmList = mycmenu.dce('li');
		var cmItem = mycmenu.dce('div');
		if(item.id != null){ cmList.id = 'cmItem' + item.id; }
		var itemContent = _this.BuildItemContent(item);
		//快捷键
		if(itemContent.hasKey){
			var shk = item.shortcutkey.toUpperCase();
			if(mycmenu.isMSIE){
				mycmenu.shortcutkey.push({key:shk, obj:cmItem});
			}else{
				mycmenu.shortcutkey.push({key:shk, func:item.func});
			}
		}
		cmItem.innerHTML = itemContent.html;
		cmItem.onmouseover = function(){ this.className = 'cur'; }
		cmItem.onmouseout = function(){ this.className = ''; }
		if(item.disabled == undefined){item.disabled = false;}
		if(!item.disabled){
			if(item.func != null && typeof item.func == 'function'){
				cmItem.onclick = item.func;
			}
		}
		else{
			cmItem.disabled = true;
			cmItem.style.color = '#a1a192';
		}
		if(mycmenu.isIE6 && cg.sub){
			mycmenu.IE6hover(cmList);
		}
		cmItem.style.zindex = cg.zindex;
		cmList.appendChild(cmItem);
	}
	cmList.style.zindex = cg.zindex;
	return cmList;
};

ContextMenu.prototype.BuildMenuList = function(objParent, cg){
	var _this = this;
	var _cg = _this._cg;
	var doce = mycmenu.DocumentElement();
	var docsize = {w:doce.clientWidth, h:doce.clientHeight};
	var c = cg.item.length;
	//子项菜单顶部高度
	var subtop = 3;
	var subtopstatus = true;
	//菜单框宽度
	var width = _cg.width;
	//参数存储，供计算
	var pos = []; //w,h,x,y,px,py
	//根据内容计算菜单框宽度、高度
	var height = c*_cg.lineHeight + _cg.borderHeight;
	for(var i=0; i<c; i++){
		if(cg.item[i].text == _cg.separator){
			height -= (_cg.lineHeight - _cg.separatorHeight);
		}
		//将内容赋值给A对象，以获取内容宽度
		_this.cmBoxHidden.innerHTML = _this.BuildItemContent(cg.item[i]).html;
		width = _this.CompareWidth(width, _this.cmBoxHidden.offsetWidth + _cg.borderWidth + _cg.subIconWidth);
	}
	cg.width = width;
	var cmBox = mycmenu.dce('div');
	cmBox.className = 'cmBox';
	cmBox.style.cssText = 'width:' + cg.width + 'px;height:' + (height-1) + 'px;'
		+ 'background:' + _cg.background + ';opacity:' + _cg.opacity + ';alpha(opacity=' + (_cg.opacity*100) + ');';
	cmBox.style.zindex = (cg.zindex + _cg.level);
	
	if(_cg.level == 0){
		pos = [cg.width, height, _cg.pos.x, _cg.pos.y, 0];
		pos[2] = (pos[2] + pos[0]) > docsize.w ? (pos[2]-pos[0] < 0 ? 0 : pos[2]-pos[0]) : pos[2];
		pos[3] = (pos[3] + pos[1]) > docsize.h ? (pos[3]-pos[1] < 0 ? 0 : pos[3]-pos[1]) : pos[3];
		objParent.style.left = pos[2] + 'px';
		objParent.style.top = pos[3] + 'px';
	}
	else{
		pos = [cg.width, height, cg.parent.width-8, cg.parent.top, cg.parent.left];
		//子项相对位置
		pos[2] = pos[4] + pos[2] + pos[0] + 5 > docsize.w ? (pos[4]-pos[0]-1 < 0 ? -(pos[4]+2) : -pos[0]-1) : pos[2];
		var top = pos[3] + height > docsize.h ? (docsize.h - height < 0 ? 2-pos[3] : docsize.h - pos[3] - height) : 0;
		cmBox.style.left = pos[2] + 'px';
		cmBox.style.top = (top - 2) + 'px';
		
		//计算绝对位置x值
		pos[2] = pos[4] + pos[2];
		pos[3] = pos[3] + top;

		cmBox.onmouseover = function(){
			objParent.className = 'cur';
		};
		cmBox.onmouseout = function(){
			objParent.className = '';
		};
	}

	var cmListBox = mycmenu.dce('ul');
	for(var i=0; i<c; i++){
		var item = cg.item[i];
		var cmList = null;
		var menuitem = null;
		if(item.sub != null && item.sub.item != null){
			cmList = _this.BuildMenuItem(item, {sub:true, width:cg.width-8, zindex:(cg.zindex + _cg.level)});
			var _config = {
				parent:{
					width: cg.width,
					height: height,
					left: pos[2],
					top: pos[3] + subtop
				},
				width: item.sub.width == undefined ? 0 : item.sub.width,
				zindex: cg.zindex + _cg.level,
				item: item.sub.item
			};
			_cg.level++;
			//递归创建菜单列表
			_this.BuildMenuList(cmList, _config);
		}
		else{
			cmList = _this.BuildMenuItem(item, {sub:false, width:cg.width-8, zindex:(cg.zindex + _cg.level)});
		}
		subtop += cg.item[i].text == _cg.separator ? _cg.separatorHeight : _cg.lineHeight;
		cmListBox.appendChild(cmList);
		cmListBox.style.zindex = (cg.zindex + _cg.level);
		cmListBox.style.border = _cg.border;
	}
	
	cmBox.appendChild(cmListBox);
	objParent.appendChild(cmBox);
	pos = null;
	_cg.level--;
};

ContextMenu.prototype.CompareWidth = function(oldW, newW){
	return newW > oldW ? newW : oldW;
};

ContextMenu.prototype.Create = function(){
	var _this = this;
	var _cg = _this._cg;
	var cmBox = mycmenu.dce('div');
	cmBox.id = 'cmBox' + _this.id;
	cmBox.style.cssText = 'position:absolute;display:block;zindex:' + _cg.zindex + ';background:' + _cg.background + ';opacity:' + _cg.opacity + ';';

	//创建一个A用于获取文字宽度
	_this.cmBoxHidden = mycmenu.dce('a');
	_this.cmBoxHidden.id = 'cmBoxHidden' + _this.id;
	_this.cmBoxHidden.style.cssText = 'visibility:hidden;position:absolute;left:-9999px;top:-9999px;font-size:12px;font-family:Arial,宋体;';
	document.body.appendChild(_this.cmBoxHidden);

	var _config = {
		width: _cg.width,
		zindex: _cg.zindex,
		item: _cg.item
	};
	_this.BuildMenuList(cmBox, _config);
	document.body.appendChild(cmBox);
};

ContextMenu.prototype.Show = function(){
	var _this = this;
	//先关闭相同ID的右键菜单
	_this.Close(_this.id);

	_this.Create();
	
	document.onclick = function(e){
		_this.Close(_this.id);
	};
	document.oncontextmenu = function(e){
		_this.Close(_this.id);
	};
	document.onkeypress = function(e){
		var e = e||event;
		var keyCode = e.keyCode || e.which || e.charCode;
		if(27 == keyCode){
			_this.Close(_this.id);
		}
		else if(keyCode != 13 && keyCode != 32){ //除了回车和空格，判断是否有快捷键操作
			for(var i=0,c=mycmenu.shortcutkey.length; i<c; i++){
				if(mycmenu.shortcutkey[i].key != null && String.fromCharCode(keyCode).toUpperCase() == mycmenu.shortcutkey[i].key){
					if(mycmenu.isMSIE){
						mycmenu.shortcutkey[i].obj.click();
					}else{
						mycmenu.shortcutkey[i].func.call();
					}
					mycmenu.shortcutkey = [];
					_this.Close(_this.id);
					break;
				}
			}
		}
	};
};

ContextMenu.prototype.Close = function(id){
	var cmBox = mycmenu.$('cmBox' + id);
	if(cmBox != null){
		document.body.removeChild(cmBox);
	}
	var cmBoxHidden = mycmenu.$('cmBoxHidden' + id);
	if(cmBoxHidden != null){
		document.body.removeChild(cmBoxHidden);
	}	
	if(typeof(CollectGarbage) == 'function'){
		CollectGarbage(); //释放内存，适用于IE
	}
};

//兼容IE6 Li Hover
mycmenu.IE6hover = function(el, haverClass) {
    haverClass = haverClass || 'hover';
    el.onmouseout = function() {
        this.className = this.className.replace(new RegExp('(^|\\s)' + haverClass + '(?=\\s|$)', 'g'), '').replace(/^\s+|\s+$/, '').replace(/\s+/, ' ');
    };
    el.onmouseover = function() {
        el.onmouseout();
        this.className += ' ' + haverClass;
    };
};

mycmenu.getJsPath = function(js){
	var es = mycmenu.$T('script');
	for (var i = 0; i < es.length; i++)
	{
		var si = es[i].src.lastIndexOf('/');
		if(es[i].src != '' && es[i].src.substr(si + 1).split('?')[0] == js){
			return es[i].src.substring(0,si + 1);
		}
	}
};

mycmenu.loadCss = function(cssDir, cssName){
	var cssTag = mycmenu.dce('link');
	cssTag.setAttribute('rel','stylesheet');
	cssTag.setAttribute('type','text/css');
	cssTag.setAttribute('href', cssDir + cssName);
	mycmenu.$T('head')[0].appendChild(cssTag);
};
mycmenu.CheckShortcutKey = function(skey){
	return skey != undefined ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(skey.toUpperCase()) >= 0 : false; //快捷键只支持26个英文字母之一
};
//加载样式
mycmenu.loadCss(mycmenu.getJsPath(mycmenu.jsName) + 'skin/', 'contextmenu.css');
window.onunload = function(){mycmenu = null;};