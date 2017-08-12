/*
	oTree 1.5
	Author: 青梅煮酒 85079542 oukunqing@126.com
	Update: 2015-01-10
*/
var _otree = _otree || {};
_otree.getMyName = function(){ 
	var es = document.getElementsByTagName('script'); 
	var scriptSrc = es[es.length -1].src; 
	return scriptSrc.split('/')[scriptSrc.split('/').length-1];
};
_otree.getJsPath = function(js, path){
	var es = document.getElementsByTagName('script'); 
	for (var i = 0,c = es.length; i < c; i++) {
		var si = es[i].src.lastIndexOf('/');
		if(es[i].src != '' && es[i].src.substr(si + 1).split('?')[0] == js){
			return es[i].src.substring(0, si + 1).replace(path, '');
		}
	}
};
_otree.loadCss = function(cssDir, cssName){
	var cssTag = document.createElement('link');
	cssTag.setAttribute('rel','stylesheet');
	cssTag.setAttribute('type','text/css');
	cssTag.setAttribute('href', cssDir + cssName);
	document.getElementsByTagName('head')[0].appendChild(cssTag);
};
_otree.jsName = _otree.getMyName();
_otree.pagePath = location.href.substring(0, location.href.lastIndexOf('/')+1);
_otree.jsPath = _otree.getJsPath(_otree.jsName, _otree.pagePath);
_otree.loadCss(_otree.jsPath, 'otree.css');
_otree.getImagePath = function(replacePath){
	var path = _otree.jsPath.replace(replacePath, '');
	if(path.indexOf('http://') == 0){
		path = path.replace('http://', '');
		path = path.substring(path.indexOf('/'));
	}
	return path;
};
var otree_st = window.setTimeout;
window.setTimeout = function(fRef, mDelay) {
    if (typeof fRef == 'function') {
        var argu = Array.prototype.slice.call(arguments, 2);
        var f = (function() {
            fRef.apply(null, argu);
        });
        return otree_st(f, mDelay);
    }
    return otree_st(fRef, mDelay);
};
_otree.isSafari = navigator.userAgent.indexOf('Version/') > 0 && navigator.userAgent.indexOf('Safari/') > 0;
//解决Safari下A标签TAB切换无法获得焦点的问题
_otree._keyEvent = function(e, obj){
	if(13 == e.keyCode){
		var evt = document.createEvent("MouseEvents");
		evt.initEvent("click", true, true);
		obj.dispatchEvent(evt);
	}
};

function oTree(id, box, _config){
	this.id = id || 'o';
	this.box = box || null;
	if(typeof this.box != 'object'){
		this.box = this.$(this.box);
	}
	if(_config == undefined){
		_config = {};
	}
	this.nodeTag = 'DIV';
	this.selectedId = -1;
	this.selectedNode = null;
	this.selectedText = null;
	this.config = {
		showCheckBox: _config.showCheckBox || false, //是否显示复选框
		selectDisabledCheckBox: _config.selectDisabledCheckBox || false, //是否允许选中被禁用的复选框
		showContextMenu: _config.showContextMenu != undefined ? _config.showContextMenu : true,	//是否允许显示自定义的右键菜单
		showIcon: _config.showIcon != undefined ? _config.showIcon : true,	//是否显示ICON图标
		showLine: _config.showLine != undefined ? _config.showLine : false,	//是否显示连线
		showSubNode: _config.showSubNode != undefined ? _config.showSubNode : true,	//是否显示子节点(添加节点时)
		skin: _config.skin || 'default',
		spaceWidth: _config.spaceWidth || 15,
		showFocus: _config.showFocus != undefined ? _config.showFocus : true, //是否允许获得焦点(显示虚线框)
		callback: _config.callback || _config.callBack || null,	//点击文字时回调函数
		callbackObj: _config.callbackObj || {objValue:null, objText:null},
		dblclick: _config.dblclick || _config.dblClick || false,	//是否启用双击
		expandCallback: _config.expandCallback || null,	//展开节点时回调函数
		checkboxName: this.id + 'chbNode',
	}	
	this.config.iconPath = _config.iconPath || _config.imgPath || (_otree.getImagePath(_otree.pagePath) + 'imgs/' + this.config.skin + '/'),
	this.config.imgPath = this.config.iconPath;
	this.config.showLineConfig = this.config.showLine;
	if(this.config.spaceWidth < 5 || this.config.spaceWidth > 25){
		this.config.spaceWidth = 15;
	}
	
	//回调时，返回之前调用树菜单的HTML表单控件，一般用于下拉式树菜单或弹出式树菜单
	this.callbackObj = {objValue:this.config.callbackObj.objValue || null, objText:this.config.callbackObj.objText || null};

	this.strFocusHtml = this.config.showFocus ? '' : ' onfocus="this.blur();"';

	this.strLinkLabel = !_otree.isSafari ? 'a' : 'span';
	//解决Safari兼容问题
	this.strKeyEvent = !_otree.isSafari ? '' : ' onkeypress="_otree._keyEvent(event, this);"';

	this.objIdPrefix = {
		node: 'n',
		action: 'a',
		actionlink: 'al',
		icon: 'i',
		text: 't',
		checkbox: 'c'
	};

	this.icon = {
		root: 'base.gif',
		folder: 'folder.gif',
		folderOpen: 'folderopen.gif',
		node: 'page.gif',
		line: 'line.gif',
		join: 'join.gif',
		joinBottom: 'joinbottom.gif',
		minus: 'minus.gif',
		plus: 'plus.gif',
		lineMinus: 'line_minus.gif',
		linePlus: 'line_plus.gif',
		empty: 'empty.gif'		
	};
	
	var obj = document.createElement('div');
	obj.className = 'otree';
	obj.id = this.id + this.objIdPrefix.node + 'otree';
	obj.level = -1;
	obj.rel = 'block';
	if(this.box != null && this.box.tagName == this.nodeTag && this.box.innerHTML != undefined){
		this.obj = obj;
		this._clear();
		this.box.appendChild(obj);
	} else {
		this.obj = null;
		alert('树菜单容器必须是DIV');
	}	
	this.rootNode = null;
	
	this.timer = null;
	this.arrIdAdd = [];
	this.isAppend = false;
}

oTree.prototype.$ = function(i){
	return document.getElementById(i);
};

oTree.prototype._clear = function(){
	if(this.box != null && this.obj != null){
		var oldObj = document.getElementById(this.obj.id);
		if(oldObj != null){
			this.box.removeChild(oldObj);
		}
	}
};

oTree.prototype.root = function(param){
	if(this.obj == null){
		return false;
	}
	param = param || {};
	var id = param.id || 'root';
	var strId = this.buildId(this.objIdPrefix.icon, id);
	var icon = param.icon || this.icon.root;
	var node = document.createElement('div');
	node.id = this.id + this.objIdPrefix.node + id;
	node.lang = 'root';
	node.level = -1;
	node.className = 'node root';
	node.innerHTML = '<img src="' + this.config.iconPath + icon + '" id="' + strId + '" lang="' + icon + ',' + icon + '" rel="' + icon + '" />'
		+ '<span id="' + this.buildId(this.objIdPrefix.text, id) + '">' + (param.name || 'OTREE根节点') + '</span>';
	node.style.display = param.show == undefined || param.show ? '' : 'none';
	this.obj.appendChild(node);

	this.rootNode = node;
};

oTree.prototype.add = function(param){
	//不能重复添加相同ID的节点
	if(this.getNode(param.id) != null){
		return false;
	}
	var objParent = this.getNode(param.pid);
	if(objParent != null){
		//不能在根节点上添加子节点
		if(this.rootNode != null && objParent.id == this.rootNode.id){
			return false;
		}
	} else {
		objParent = this.obj;
	}
	var config = {
		id: param.id,
		idIsNum: typeof param.id == 'number',
		pid: param.pid,
		pidIsNum: typeof param.pid == 'number',
		code: param.code || '',
		name: param.name || '',
		count: param.count || -1,
		type: param.type || 'node',
		icon: param.icon || this.icon.folder,
		iconOpen: param.iconOpen || param.icon || this.icon.folderOpen,
		checkbox: param.checkbox || param.checkBox || null,
		callback: param.callback || param.callBack || null,
		param: param.param || null,
		clickToggle: param.clickToggle || null, //点击文字是否可以切换子节点打开/关闭
		clickChecked: param.clickChecked != undefined ? param.clickChecked : null, //点击文字是否选中复选框
		contextmenu: param.contextmenu || param.contextMenu || null,
		dblclick: param.dblclick != undefined ? param.dblclick : this.config.dblclick,
		show: param.show != undefined ? param.show : true,
		href: param.href || null,
		target: param.target || null,
		append: param.append || this.isAppend,
		showSwitch: param.showSwitch || false
	};
	if(config.type != 'node' && param.iconOpen == undefined && param.icon != undefined){
		config.iconOpen = config.icon;
	}
	this.create(config, objParent);
};

oTree.prototype.create = function(param, objParent){
	if(objParent != null){
		var node = document.createElement('div');
		var level = objParent.level + 1;
		node.id = this.buildId(this.objIdPrefix.node, param.id);
		node.className = 'node';
		node.lang = param.id;

		node.rel = 'block';
		node.type = param.type;
		node.code = param.code;
		node.level = level;
		node.name = this.id + 'node' + param.id;
		//父级ID树，连线显示/隐藏切换时用
		node.tree = (objParent != this.obj ? objParent.tree + '|' : '') + param.id;
		node.showSwitch = param.showSwitch;
		
		objParent.appendChild(node);

		var isLast = true;
		if(this.config.showLine || this.config.showLineConfig){
			var lastNode = objParent.lastChild;
			isLast = lastNode.id == node.id;
		}
		node.innerHTML = this.buildSpace(level, param.id) 
			+ this.buildSwitch(param.id, isLast) 
			+ this.buildIcon(param.id, param.icon, param.iconOpen)
			+ (this.config.showCheckBox ? this.buildCheckBox(param.checkbox, param.id) : '')
			+ this.buildText(param);

		//判断是否显示当前添加的节点
		var isShow = (param.show && this.config.showSubNode) || level <= 0;
		if(!isShow){
			node.style.display = 'none';
		}
		this.setSwitch(param.pid, isShow, true);
		this.setIcon(param.pid, isShow, true);	
		this.setText(param, level);
		if(this.config.showCheckBox){
			this.setCheckBoxEvent(param.checkbox);
		}

		if(this.config.showLine || this.config.showLineConfig){
			if(this.timer != null){
				window.clearTimeout(this.timer);
			}
			//将新添加的节点ID加入数组备用
			this.arrIdAdd.push(param.id);
			//节点添加完成后，设置连线和切换图标
			this.timer = window.setTimeout(this._setLineAndSwitch, 10, this, !this.config.showLine, param.append);
		}
	}
};


oTree.prototype.getNode = function(id){
	return this.$(this.id + this.objIdPrefix.node + id);
};

oTree.prototype.getObj = function(type, id){
	return this.$(this.id + (type || this.objIdPrefix.node) + id);
};

oTree.prototype.buildId = function(type, id){
	return this.id + type + id;
};

oTree.prototype.buildSpace = function(level, id){
	if(!this.config.showLine && !this.config.showLineConfig){
		var w = 0;
		for(var i=0; i<level; i++){
			w += this.config.spaceWidth;
		}
		return '<span style="width:' + w + 'px;">&nbsp;</span>';
	} else {
		var space = '';		
		for(var i=0; i<level; i++){
			space += '<img id="' + (this.id + 'line' + id + i) + '" name="' + (this.id + 'line') + '" lang="' + i + '"'
				+ 'src="' + this.config.iconPath + (this.config.showLine ? this.icon.line : this.icon.empty) + '" rel="' + this.icon.line + '" />';
		}
		return space;
	}
};

oTree.prototype.buildSwitch = function(id, isLast){
	var strImgName = this.config.showLine || this.config.showLineConfig ? this.icon.join : this.icon.empty;
	var strSwitch = '<img src="' + this.config.iconPath + strImgName + '"' 
		+ ' id="' + this.buildId(this.objIdPrefix.action, id) + '"'
		+ ' name="' + this.id + 'switch"'
		+ (this.config.showLine || this.config.showLineConfig ? ' rel="' + strImgName + '"' : '')
		+ ' class="expand-none" tabIndex="-2"' + this.showFocusHtml + ' />' ;
	strSwitch = '<' + this.strLinkLabel + ' href="javascript:void(0);"' + this.showFocusHtml + ' tabIndex="-2"'
		+ ' id="' + this.buildId(this.objIdPrefix.actionlink, id) + '"'
		+ this.strKeyEvent + '>' + strSwitch + '</' + this.strLinkLabel + '>';
	return strSwitch;
};

oTree.prototype.buildIcon = function(id, icon, iconOpen){
	//return !this.config.showIcon ? '' : '<img src="' + this.config.iconPath + icon + '" lang="' + icon + ',' + iconOpen + '" id="' + this.buildId(this.objIdPrefix.icon, id) + '" tabIndex="-2"' + ' onfocus="this.blur();" />';
	var path = this.getIconRealPath(icon);
	return !this.config.showIcon ? '' : '<img src="' + path + icon + '" lang="' + icon + ',' + iconOpen + '" id="' + this.buildId(this.objIdPrefix.icon, id) + '" tabIndex="-2"' + ' onfocus="this.blur();" />';
};

oTree.prototype.buildText = function(param){
	var str = '<' + this.strLinkLabel + ' id="' + this.buildId(this.objIdPrefix.text, param.id) + '" tabIndex="0"' + this.strKeyEvent;
	if(param.href != null){
		str += ' class="link" href="' + param.href + '"' + (param.target != null ? ' target="' + param.target + '" ' : '');
	} else if(this.config.showFocus) {
		str += ' class="link" href="javascript:void(0);"';
	}
	str	+= this.strFocusHtml + ' >' + param.name + (param.count >= 0 ? '(' + param.count + ')' : '') + '</' + this.strLinkLabel + '>';
	return str;
};

oTree.prototype.buildCheckBox = function(param, nid){
	if(param != null){
		if(param.id != nid){
			param.id = nid;
		}
		if(param.name == undefined || param.name == null){
			param.name = this.config.checkboxName;
		}
		var str = '<input type="checkbox" id="' + this.buildId(this.objIdPrefix.checkbox, param.id) + '"'
			+ ' name="' + param.name + '"'
			+ ' value="' + (param.value || param.id) + '"' 
			+ ' lang="' + nid + '"' 
			+ (param.checked ? ' checked="checked" ' : '')
			+ (param.disabled ? ' disabled="disabled" ' : '')
			+ this.strFocusHtml + ' />';
		return str;
	}
	return '';
};

oTree.prototype.setText = function(param, level){
	var _ = this;
	var obj = this.getObj(this.objIdPrefix.text, param.id);
	if(obj != null){
		if(param.href == null){
			var callback = this.checkFunc(param.callback) ? param.callback : this.checkFunc(this.config.callback) ? this.config.callback : null;
			obj.className = callback != null ? 'link' : 'text';
			if(param.dblclick){
				obj.ondblclick = function(){
					_.setTextEvent(param, this, callback);
				};
			} else {
				obj.onclick = function(){
					_.setTextEvent(param, this, callback);
				};
			}
		} else {
			obj.onclick = function(){
				_.select(param.id);
				if(param.clickToggle != null){
					_.toggle(param.id, param.clickToggle == 'toggle' ? undefined : param.clickToggle == 'close' ? false : true);
				}
			};
		}
		if(param.contextmenu != null){
			obj.oncontextmenu = function(){
				param.contextmenu();
			};
		}
		param.level = level;
		this.setTextParam(obj, param);
	}
};

oTree.prototype.setTextEvent = function(param, obj, callback){
	if(callback != null){
		this.select(param.id);
		if(param.clickToggle != null){
			this.toggle(param.id, param.clickToggle == 'toggle' ? undefined : param.clickToggle == 'close' ? false : true);
		}
		if(typeof param.clickChecked == 'boolean' && param.checkbox != null){
			this.selectCheckBox(param.id, param.clickChecked ? true : false, null);
		}
		//{id:param.id, pid:param.pid, type:param.type, code:param.code, name:param.name}
		callback(param.param != null ? param.param : this.getTextParam(obj), this.callbackObj, this);
	} else {
		this.toggle(param.id);
		if(typeof param.clickChecked == 'boolean' && param.checkbox != null){
			this.selectCheckBox(param.id, param.clickChecked ? true : false, null);
		}
	}
};

oTree.prototype.setCheckBoxEvent = function(param){
	if(param != null){
		var _ = this;
		var obj = this.getObj(this.objIdPrefix.checkbox, param.id);
		if(obj != null && !obj.disabled){
			obj.onclick = function(){
				_.selectCheckBox(param.id, null, this);
				if(param.callback != null){
					param.callback(param.param != null ? param.param : {chbName:param.name, id:param.id, value:this.value}, _.callbackObj, _);
				}
			};
		}
	}
};

oTree.prototype.checkFunc = function(func){
	return typeof func == 'function';
};

oTree.prototype.getTagName = function(obj){
	return typeof obj == 'object' ? obj.tagName : '';
};

oTree.prototype.toggle = function(id, isOpen){
	var node = this.getNode(id);
	if(node != null){
		var arr = node.childNodes;
		var display = isOpen != undefined ? (isOpen ? 'block' : 'none') : (node.rel == 'none' ? 'block' : 'none');
		var count = 0;
		for(var i=0,c=arr.length; i<c; i++){
			if(arr[i].tagName == this.nodeTag){
				arr[i].style.display = display;
				count++;
			}
		}
		if(count > 0){
			node.rel = display;
			this.setSwitch(id, display == 'block');
			this.setIcon(id, display == 'block');
		}
	}
};

oTree.prototype.setSwitch = function(id, isOpen, isAppend){
	var _ = this;	
	var a = this.getObj(this.objIdPrefix.action, id);
	if(a != null && (-1 == a.tabIndex || isAppend)){
		var parent = a.parentNode;
		if(!this.config.showLine && !this.config.showLineConfig){
			a.src = this.config.iconPath + (isOpen ? this.icon.minus : this.icon.plus);
		} else {
			var pathName = this.getIconPathName(a.src);
			var newName = '';
			if(!this.config.showLine && this.config.showLineConfig){
				pathName.name = a.rel;
			}
			if(pathName.name.indexOf('join') >= 0){
				newName = isOpen ? this.icon.lineMinus : this.icon.linePlus;
			} else {
				newName = isOpen ? pathName.name.replace('plus','minus') : pathName.name.replace('minus','plus');
			}
			if(this.config.showLine){
				a.src = pathName.path + newName;
			}
			a.rel = newName;
		}
		if(parent != null){
			if(_.config.showFocus){
				a.onfocus = function(){this.focus();};
				parent.tabIndex = 0;
			} else {
				a.onfocus = function(){this.blur();};
				parent.onfocus = function(){this.blur();};
			}
		}
		a.style.display = '';
		if(isAppend){
			var node = this.getNode(id);
			//添加子节点时，如果子节点默认不显示，将父节点的状态改为不显示
			if(!isOpen && node != null){
				node.rel = 'none';
			}
			a.tabIndex = -1;
			a.className = 'expand';
			var obj = null;
			if(parent != null){
				obj = parent != null ? parent : a;
			}
			obj.onclick = function(){
				if(!_.config.showFocus){
					this.blur();
				}
				_.toggle(id);
				//展开节点时回调，用于动态加载子节点的触发事件，收缩节点不回调
				if(_.config.expandCallback != null && typeof _.config.expandCallback == 'function'){
					var node = _.getNode(id);
					if(node.rel == 'block'){
						_.config.expandCallback({id:id, type:node.type, code:node.code});
					}
				}
			};
		}
	}
};

oTree.prototype.setLineSwitchIcon = function(id, isLast, isRemove){
	var a = this.getObj(this.objIdPrefix.action, id);
	if(a != null){
		var pathName = this.getIconPathName(a.src);
		var newName = '';
		if(this.config.showLine){
			newName = isLast ? pathName.name.replace(/(bottom.gif|one.gif|top.gif|.gif)/,'') + 'bottom.gif' : pathName.name.replace('bottom', '');
			a.src = pathName.path + newName;
		} else {
			newName = isLast ? a.rel.replace(/(bottom.gif|one.gif|top.gif|.gif)/,'') + 'bottom.gif' : a.rel.replace('bottom', '');
		}
		a.rel = newName;
		//if(a.rel.indexOf('join') >= 0){
		if(/(join)/.test(a.rel)){
			a.onfocus = function(){this.blur();};
		}
	}
};

oTree.prototype._setLineAndSwitch = function(otree, isHide, isAppend){
	otree.setLineAndSwitch(isHide, isAppend);
};

oTree.prototype.setLineAndSwitch = function(isHide, isAppend){
	var arr = document.getElementsByName(this.id + 'line');
	for(var i=0; i<arr.length; i++){
		//获取直线所垂直对应的那个节点
		var node = this.getNode(arr[i].parentNode.tree.split('|')[arr[i].lang]);
		//判断找到的节点是否是同级的最后节点，设置空或直线
		var isLast = node.nextSibling == null;
		if(this.config.showLine){
			arr[i].src = this.config.iconPath + (isLast ? this.icon.empty : this.icon.line);
		}
		arr[i].rel = isLast ? this.icon.empty : this.icon.line;
		//递归
		this.setLineSwitchIcon(node.lang, isLast);
	}
	
	for(var i=0,c=this.arrIdAdd.length; i<c; i++){
		var node = this.getNode(this.arrIdAdd[i]);
		//检测当前节点是否是最后一个节点，若为最后，修改ICON
		this.setLineSwitchIcon(this.arrIdAdd[i], node.nextSibling == null);
		if(isAppend){
			//追加节点，需设置上一个节点
			var preNode = node.previousSibling;
			if(preNode != null){
				//递归
				this.setLineSwitchIcon(preNode.lang, false);
			}
		}
	}	
	if(this.rootNode == null){
		var firstNode = this.obj.firstChild;
		var a = this.getObj(this.objIdPrefix.action, firstNode.lang);
		if(a != null){
			var pathName = this.getIconPathName(a.src);
			var newName = pathName.name.replace(/(top.gif|one.gif|bottom.gif|.gif)/, firstNode.nextSibling == null ? 'one.gif' : 'top.gif');
			if(this.config.showLine){
				a.src = pathName.path + newName;
			}
			a.rel = newName;
		}
	}
	if(isHide){
		this.hideNodeLine();
	}
	
	//清除添加的ID数组
	delete this.arrIdAdd;
	this.arrIdAdd = [];
	//第一轮结束，后面添加的节点都属于追加
	this.isAppend = true;
};

oTree.prototype.getIconPathName = function(strSrc){
	var pos = strSrc.lastIndexOf('/') + 1;
	var strPath = strSrc.substring(0, pos);
	var strName = strSrc.substring(pos);
	return {path:strPath, name:strName};
};

oTree.prototype.getIconRealPath = function(strSrc){
	if(strSrc.indexOf('/') < 0){
		return this.config.iconPath;
	} else if(0 == strSrc.indexOf('http://') || 0 == strSrc.indexOf('/')) {
		return '';
	} else {
		var pathName = this.getIconPathName(strSrc);
		if(this.config.iconPath.indexOf(pathName.path) >= 0){
			return this.config.iconPath.replace(pathName.path, '');
		}
		return '';
	}
};

oTree.prototype.showNodeLine = function(){
	this.config.showLine = true;
	var arrLine = document.getElementsByName(this.id + 'line');
	for(var i=0,c=arrLine.length; i<c; i++){
		arrLine[i].src = this.config.iconPath + arrLine[i].rel;
	}
	var arrSwitch = document.getElementsByName(this.id + 'switch');
	for(var i=0,c=arrSwitch.length; i<c; i++){
		arrSwitch[i].src = this.config.iconPath + arrSwitch[i].rel;
	}
};

oTree.prototype.hideNodeLine = function(arrId){
	this.config.showLine = false;
	var arrLine = document.getElementsByName(this.id + 'line');
	for(var i=0,c=arrLine.length; i<c; i++){
		var pathName = this.getIconPathName(arrLine[i].src);
		if(this.config.showLine){
			arrLine[i].rel = pathName.name;
		}
		arrLine[i].src = pathName.path + this.icon.empty;
	}
	var arrSwitch = [];
	if(this.arrIdAdd.length > 0){
		for(var i=0,c=this.arrIdAdd.length; i<c; i++){
			arrSwitch.push(this.getObj(this.objIdPrefix.action, this.arrIdAdd[i]));
		}
	} else {
		arrSwitch = document.getElementsByName(this.id + 'switch');
	}
	for(var i=0,c=arrSwitch.length; i<c; i++){		
		var pathName = this.getIconPathName(arrSwitch[i].src);
		if(this.config.showLine){
			arrSwitch[i].rel = pathName.name;
		}
		arrSwitch[i].src = pathName.path + pathName.name.replace(/(joinbottom|join)/g,'empty').replace(/(line_|bottom|one|top)/g,'');
	}
};

oTree.prototype.removeSwitchIcon = function(id){
	var a = this.getObj(this.objIdPrefix.action, id);
	if(a != null){
		var pathName = this.getIconPathName(a.src);
		var node = this.getNode(id);
		var newName = node.nextSibling != null ? this.icon.join : this.icon.joinBottom;
		a.src = pathName.path + (this.config.showLine ? newName : this.icon.empty);
		a.rel = newName;
	}
};

oTree.prototype.removeSwitch = function(id){
	var a = this.getObj(this.objIdPrefix.action, id);
	if(a != null){
		if(this.config.showLine || this.config.showLineConfig){			
			this.removeSwitchIcon(id);
		} else {
			a.src = this.config.iconPath + this.icon.empty;
		}
		a.tabIndex = -2;
		a.className = 'expand-none';
		a.onclick = function(){};
		//a.onfocus = function(){this.blur();};
		var parent = a.parentNode;
		if(parent != null){
			parent.onclick = function(){};
			parent.tabIndex = -2;
			//parent.onfocus = function(){this.blur();};
		}
	}
};

oTree.prototype.setIcon = function(id, isOpen, isAppend){	
	if(!this.config.showIcon){
		return false;
	}
	var icon = this.getObj(this.objIdPrefix.icon, id);
	if(icon != null && (-1 == icon.tabIndex || isAppend)){
		var arrIcon = icon.lang.split(',');
		var strIcon = isOpen ? arrIcon[1] : arrIcon[0];
		icon.src = this.getIconRealPath(strIcon) + strIcon;
		if(isAppend){
			icon.tabIndex = -1;
		}
	}
};

oTree.prototype.select = function(id){
	if(this.selectedText != null){
		this.selectedText.className = this.selectedText.className.replace(' selected', '');
	}
	if(this.selectedNode != null){
		this.selectedNode.className = 'node';
	}
	this.selectedId = -1;

	var txt = this.getObj(this.objIdPrefix.text, id);
	if(txt != null){
		txt.className += ' selected';
		txt.focus();
		this.selectedText = txt;
	}

	var node = this.getNode(id);
	if(node != null){
		//node.className = 'node node-selected';
		this.selectedNode = node;
		this.selectedId = id;
	}
};

oTree.prototype.focus = function(id){
	if(id != undefined){
		var obj = this.getObj(this.objIdPrefix.text, id);
		if(obj != null){
			obj.focus();
			return false;
		}
	}
	if(this.selectedText != null){
		this.selectedText.focus();
	} else {
		var arr = this.obj.getElementsByTagName('A');
		if(arr.length > 0){
			arr[0].focus();
		}
	}
};

oTree.prototype.getSelected = function(){
	return this.getTextParam(this.selectedText);
};

oTree.prototype.getTextParam = function(obj){
	if(obj != undefined && obj != null){
		var arr = obj.lang.split(',');
		var node = this.getNode(arr[0]);
		var param = {
			id: arr[0],
			pid: arr[1],
			type: arr[2],
			code: arr[3],
			name: arr[4],
			level: arr[5],
			tree: node != null ? node.tree.split('|') : []
		};
		return param;
	}
	return null;
};

oTree.prototype.setTextParam = function(obj, param, isUpdate){
	if(isUpdate){
		var oldParam = this.getTextParam(obj);
		param.id = param.id || oldParam.id;
		param.pid = param.pid || oldParam.pid;
		param.type = param.type || oldParam.type;
		param.code = param.code || oldParam.code;
		param.name = param.name || oldParam.name;
		param.level = param.level || oldParam.level;
		param.tree = oldParam.tree;
	}
	obj.lang = param.id + ',' + param.pid + ',' + param.type + ',' + param.code + ',' + param.name + ',' + param.level + ',' + param.tree;
};

oTree.prototype.getTextValue = function(arrId){
	var arrResult = [];
	if(typeof arrId == 'undefined'){
		return arrResult;
	}
	if(typeof arrId == 'string' || typeof arrId == 'number'){
		var obj = this.getObj(this.objIdPrefix.text, arrId);
		if(obj != null){
			var arr = obj.lang.split(',');
			arrResult.push([arr[0], arr[4]]);
		}
	} else {		
		for(var i in arrId){
			var obj = this.getObj(this.objIdPrefix.text, arrId[i]);
			if(obj != null){
				var arr = obj.lang.split(',');
				arrResult.push([arr[0], arr[4]]);
			}
		}
	}
	return arrResult;
};

oTree.prototype.getChild = function(pid){
	var node = this.getNode(pid);
	if(node != null){
		var arr = [];
		for(var i=0,c=node.childNodes.length; i<c; i++){
			if(this.getTagName(node.childNodes[i]) == this.nodeTag){
				arr.push(node.childNodes[i]);
			}
		}
		return arr;
	}
	return null;
};

oTree.prototype.appendChild = function(arrParam){
	for(var i in arrParam){
		this.add(arrParam[i]);
	}
};

oTree.prototype.removeChild = function(id){
	var node = this.getNode(id);
	if(node != null){
		//不能删除根节点的子节点，因为根节点没有子节点 
		if(this.rootNode != null && node.id == this.rootNode.id){
			return false;
		}
		var arr = node.childNodes;
		var isDelSelected = false;
		for(var i=arr.length-1; i>=0; i--){
			if(this.getTagName(arr[i]) == this.nodeTag){
				if(arr[i].lang == this.selectedId){
					isDelSelected = true;
				}
				node.removeChild(arr[i]);
			}
		}
		//移除图标
		this.removeSwitch(id);
		//设置Icon
		this.setIcon(id, false);
		if(isDelSelected){
			this.select(id);
		}
		return true;
	}
	return false;
};

oTree.prototype.open = function(id, isOpen){
	if(typeof id == 'number' || typeof id == 'string'){
		this.toggle(id, typeof isOpen == 'boolean' ? isOpen : true);
	}
};

oTree.prototype.close = function(id, isClose){
	if(typeof id == 'number' || typeof id == 'string'){
		this.toggle(id, typeof isClose == 'boolean' ? isClose : false);
	}
};

oTree.prototype.show = function(id, isShow){
	var obj = this.getNode(id);
	if(obj == null){
		obj = this.obj;
	}
	obj.style.display = typeof isShow == 'boolean' && !isShow ? 'none' : '';
};

oTree.prototype.hide = function(id, isHide){
	var obj = this.getNode(id);
	if(obj == null){
		obj = this.obj;
	}
	obj.style.display = typeof isHide == 'boolean' && !isHide ? '' : 'none';
};

oTree.prototype.openAll = function(isOpen){
	var arr = this.obj.childNodes;
	this.toggleAll(arr, typeof isOpen == 'boolean' ? isOpen : true);
};

oTree.prototype.closeAll = function(isClose){
	var arr = this.obj.childNodes;
	this.toggleAll(arr, typeof isClose == 'boolean' ? isClose : false);
};

oTree.prototype.toggleAll = function(arr, oper){
	for(var i=0,c=arr.length; i<c; i++){
		var obj = arr[i];
		if(this.getTagName(obj) == this.nodeTag){
			//显示或隐藏节点，顶点节点不隐藏
			obj.style.display = oper || obj.level <= 0 ? 'block' : 'none';
			obj.rel = oper ? 'block' : 'none';
			this.setSwitch(obj.lang, oper);
			this.setIcon(obj.lang, oper);

			var sub = obj.childNodes;
			if(sub.length > 0){
				//递归
				this.toggleAll(sub, oper);
			}
		}
	}
};

oTree.prototype.openLevel = function(level){
	if(level >= -1){
		var arr = this.obj.childNodes;
		this.toggleLevel(arr, level, true);
	}
};

oTree.prototype.closeLevel = function(level){
	if(level >= -1){
		var arr = this.obj.childNodes;
		this.toggleLevel(arr, level, false);
	}
};

oTree.prototype.toggleLevel = function(arr, level, isOpen){
	for(var i=0,c=arr.length; i<c; i++){
		var obj = arr[i];
		if(this.getTagName(obj) == this.nodeTag){
			//level + 1，表示要打开到指定的层级的子级，如果level不加1，表示只打开到指定层级的节点
			var isLevel = obj.level < level + 1;
			obj.style.display = (isLevel || obj.level == level + 1) ? 'block' : 'none';
			obj.rel = isLevel || obj.level < level ? 'block' : 'none';

			this.setSwitch(obj.lang, isLevel);
			this.setIcon(obj.lang, isLevel);

			var sub = obj.childNodes;
			if(sub.length > 0){
				//递归
				this.toggleLevel(sub, level, isOpen);
			}
		}
	}
};

//更新节点内容、图标
oTree.prototype.update = function(param){
	var node = this.getNode(param.id);
	if(node != null){
		var icon = this.getObj(this.objIdPrefix.icon, param.id);
		if(icon != null && param.icon != undefined){
			icon.src = this.getIconRealPath(param.icon) + param.icon;
			icon.lang = param.icon + ',' + (param.iconOpen || param.icon);
			icon.rel = param.icon;
		}
		var txt = this.getObj(this.objIdPrefix.text, param.id);
		if(param.name != undefined){
			txt.innerHTML = param.name;
		}
		this.setTextParam(txt, param, true);
	} else {
		this.add(param);
	}
};

//以下代码为操作复选框用
oTree.prototype.selectAllCheckBox = function(isChecked, chbName){
	var arr = this.obj.getElementsByTagName('input');
	if(chbName != undefined && chbName != null){
		for(var i=0,c=arr.length; i<c; i++){
			if(arr[i].type == 'checkbox' && arr[i].name == chbName && (!arr[i].disabled || this.config.selectDisabledCheckBox)){
				arr[i].checked = isChecked;
			}
		}
	} else {
		for(var i=0,c=arr.length; i<c; i++){
			if(arr[i].type == 'checkbox' && (!arr[i].disabled || this.config.selectDisabledCheckBox)){
				arr[i].checked = isChecked;
			}
		}
	}
};

oTree.prototype.selectCheckBox = function(id, isChecked, obj, isDisabled){
	id = id || obj.value;
	var chb = obj || this.getObj(this.objIdPrefix.checkbox, id);
	if(chb != null && chb.type == 'checkbox' && (!chb.disabled || this.config.selectDisabledCheckBox || isDisabled)){
		if(typeof isChecked == 'boolean'){
			chb.checked = isChecked;
		} else {
			isChecked = chb.checked;
		}
		var node = this.getNode(id);
		if(node != null){
			//设置子节点的checkbox
			this.selectCheckBoxRecursion(node, false, isChecked);
			//设置父节点的checkbox
			this.selectCheckBoxRecursion(node, true, isChecked);
		}
	}
};

oTree.prototype.selectCheckBoxRecursion = function(node, isParent, isChecked){
	if(isParent){
		var parent = node.parentNode;
		var chbParent = this.getObj(this.objIdPrefix.checkbox, parent.lang);
		if(chbParent != null){
			if(isChecked){
				if(!chbParent.disabled || this.config.selectDisabledCheckBox){
					chbParent.checked = true;
				}
			} else {
				//检测兄弟节点的选中数量
				var brothers = parent.childNodes;
				var checkCount = 0;
				for(var i=0,c=brothers.length; i<c; i++){
					if(this.getTagName(brothers[i]) == this.nodeTag){
						var obj = this.getObj(this.objIdPrefix.checkbox, brothers[i].lang);
						if(obj != null){
							checkCount += obj.checked ? 1 : 0;
						}
					}
				}
				//兄弟节点选中数量为0，将父节点取消选中
				if(0 == checkCount){
					chbParent.checked = false;
				}
			}
			//递归
			this.selectCheckBoxRecursion(parent, isParent, isChecked);
		}
	} else {
		var childs = node.childNodes;
		for(var i=0,c=childs.length; i<c; i++){
			if(this.getTagName(childs[i]) == this.nodeTag){
				var obj = this.getObj(this.objIdPrefix.checkbox, childs[i].lang);
				if(obj != null && (!obj.disabled || this.config.selectDisabledCheckBox)){
					obj.checked = isChecked;
				}
				//递归
				this.selectCheckBoxRecursion(childs[i], isParent, isChecked);
			}
		}
	}
};

oTree.prototype.checkCheckBox = function(objChb, chbName, isChecked, isDisabled){
	var result = objChb.type == 'checkbox' && (isDisabled == undefined || objChb.disabled == isDisabled);
	return result && (typeof chbName != 'string' || chbName == '' || objChb.name == chbName) && (isChecked == undefined || objChb.checked == isChecked);
};

oTree.prototype.getChecked = function(chbName, isDisabled){
	var arrChb = this.obj.getElementsByTagName('input');
	var arrObj = [];
	for(var i=0,c=arrChb.length; i<c; i++){
		if(this.checkCheckBox(arrChb[i], chbName, true, isDisabled)){
			arrObj.push(arrChb[i]);
		}
	}
	return arrObj;
};

oTree.prototype.setCheckBoxChecked = function(arrValue, isChecked, chbName, isDisabled){
	var arrChb = this.obj.getElementsByTagName('input');
	if(typeof isChecked != 'boolean'){
		isChecked = true;
	}
	if(typeof arrValue == 'object'){
		for(var i=0,c=arrChb.length; i<c; i++){
			if(this.checkCheckBox(arrChb[i], chbName, null, isDisabled)){
				for(var j=0,cc=arrValue.length; j<cc; j++){
					if(arrChb[i].value == arrValue[j]){
						arrChb[i].checked = isChecked;
						break;
					}
				}
			}
		}
	} else if(typeof arrValue == 'string' || typeof arrValue == 'number'){
		for(var i=0,c=arrChb.length; i<c; i++){
			if(this.checkCheckBox(arrChb[i], chbName, null, isDisabled) && arrChb[i].value == arrValue){
				arrChb[i].checked = isChecked;
			}
		}
	}
};

oTree.prototype.getCheckedValue = function(chbName, isDisabled){
	var arrChb = this.obj.getElementsByTagName('input');
	var arrValue = [];
	for(var i=0,c=arrChb.length; i<c; i++){
		if(this.checkCheckBox(arrChb[i], chbName, true, isDisabled)){
			arrValue.push(arrChb[i].value);
		}
	}
	return arrValue;
};

oTree.prototype.getCheckedContent = function(chbName, isDisabled){
	var arrChb = this.obj.getElementsByTagName('input');
	var arrValue = [];
	var arrText = [];
	var txt = '';
	var objText = null;	
	for(var i=0,c=arrChb.length; i<c; i++){
		if(this.checkCheckBox(arrChb[i], chbName, true, isDisabled)){
			objText = this.getObj(this.objIdPrefix.text, arrChb[i].lang);
			txt = objText != null ? objText.innerHTML : '';
			arrValue.push(arrChb[i].value);
			arrText.push(txt);
		}
	}
	return [arrValue, arrText];
};

//设置接收回调内容的HTML控件对象，一般用于弹出式或下拉式树菜单
oTree.prototype.setCallbackObject = function(objValue, objText){
	var objVal = typeof objValue == 'string' ? this.$(objValue) : objValue;
	var objTxt = objText == undefined ? objVal :  typeof objText == 'string' ? this.$(objText) : objText;
	this.callbackObj.objValue = objVal;
	this.callbackObj.objText = objTxt;
};

//根据节点类型展开/收缩节点
oTree.prototype.openType = function(type){
	this.toggleType(this.obj.childNodes, type, true);
};

oTree.prototype.closeType = function(type){
	this.toggleType(this.obj.childNodes, type, false);
};

oTree.prototype.toggleType = function(arr, type, isOpen){
	for(var i=0,c=arr.length; i<c; i++){
		var obj = arr[i];
		if(this.getTagName(obj) == this.nodeTag){
			var pobj = obj.parentNode;
			var isType = obj.type == type;
			var isParentType = pobj.type == type;
			if(isType){
				obj.rel = isOpen ? 'block' : 'none';
				this.setSwitch(obj.lang, isOpen);
				this.setIcon(obj.lang, isOpen);
			}
			if(isType || isParentType){
				obj.style.display = isOpen ? 'block' : (isParentType ? 'none' : 'block');
			}
			var sub = obj.childNodes;
			if(sub.length > 0){
				//递归
				this.toggleType(sub, type, isOpen);
			}
		}
	}
};

oTree.prototype.getObjectType = function(obj){
	return Object.prototype.toString.call(obj);
};

oTree.prototype.checkHtmlObjectTag = function(objTagName, strTagName){
	if(strTagName == undefined || strTagName == null){
		return /(A|SPAN|DIV|P|LABEL)/.test(objTagName);
	} else {
		return objTagName == strTagName;
	}
	return false;
};

//加载HTML中内容列表自动生成树菜单
oTree.prototype.htmlToTree = function(param){
	var selectedId = -1;
	var obj = param != undefined ? (param.childNodes != undefined ? param : param.obj) : null;
	if(obj != null){
		obj.style.display = 'none';
	} else {
		return false;
	}
	var tagName = param.nodeTagName || param.childTagName;
	var arr = [];
	var arrObj = obj.childNodes;
	for(var i=0,c=arrObj.length; i<c; i++){
		var nd = arrObj[i];
		if(this.checkHtmlObjectTag(nd.tagName, tagName)){
			var data = eval('(' + nd.lang + ')');
			if(/(current|selected|cur)/.test(nd.className)){
				selectedId = data.id;
			}
			arr.push({id:data.id, pid:data.pid, level:data.level, name:(data.name || nd.innerHTML), href:(data.href || nd.href), target:(data.target || nd.target)});
		}
		var childs = nd.childNodes;
		for(var j=0,cc=childs.length; j<cc; j++){
			if(this.checkHtmlObjectTag(childs[j].tagName,  tagName)){
				var data = eval('(' + childs[0].lang + ')');
				if(/(current|selected|cur)/.test(childs[j].className)){
					selectedId = data.id;
				}
				arr.push({id:data.id, pid:data.pid, level:data.level, name:(data.name || childs[j].innerHTML), href:(data.href || childs[j].href), target:(data.target || childs[j].target)});
			}
		}
	}
	if(param.isSort){
		this.sortList(arr);
	}
	for(var i in arr){
		this.add({id:arr[i].id, pid:arr[i].pid, name:arr[i].name, href:arr[i].href,target:arr[i].target});
	}
	if(arr.length > 0){
		this.select(selectedId);
	}
};

oTree.prototype.sortList = function(arr){
	var c = arr.length;
	for(var i = 0; i < c; i++){
		for(var j = i; j < c - 1; j++){
			if(arr[j].level > arr[j+1].level){
				var tmp = arr[j];
				arr[j] = arr[j+1];
				arr[j+1] = tmp;
			}
		}
	}
};