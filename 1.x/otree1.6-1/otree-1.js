/*
	oTree 1.5
	Author: 青梅煮酒 85079542 oukunqing@126.com
	Update: 2015-01-15
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

function StringBuild(str){
    var arr = [];
    arr.push(str || '');
    this.append = function(str){
        arr.push(str);
        return this;
    };
	this.insert = function(str){
		arr[0] = str + arr[0];
		return this;
	};
    this.toString = function(){
        return arr.join('');
    };
}

function oNode(param){
	if(typeof param == 'object' && param.id != undefined){
		this = {
			id: param.id,
			idIsNum: typeof param.id == 'number',
			pid: param.pid,
			pidIsNum: typeof param.pid == 'number',
			code: param.code,
			name: param.name,
			count: param.count,
			type: param.type || 'node',
			icon: param.icon,
			iconOpen: param.iconOpen || param.icon,
			checkbox: param.checkbox,
			callback: param.callback,
			param: param.param,
			clickToggle: param.clickToggle, //点击文字是否可以切换子节点打开/关闭
			clickChecked: param.clickChecked, //点击文字是否选中复选框
			contextmenu: param.contextmenu,
			dblclick: param.dblclick,
			show: param.show,
			href: param.href || null,
			target: param.target || null,
			append: param.append,
			showSwitch: param.showSwitch || false,	//动态添加子节点时，显示父节点的展开/关闭图标
			loaded: param.loaded || false			//表示是否已经动态加载了子节点，若已加载，则不用重新加载
		};
		if(this.type != 'node' && param.iconOpen == undefined && param.icon != undefined){
			this.iconOpen = this.icon;
		}
	}
}

function oTree(id, box, _config){
	this.id = id || 'o';
	this.box = box || null;
	if(typeof this.box != 'object'){
		this.box = this.$(this.box);
	}
	if(_config == undefined){
		_config = {};
	}
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

	this.nodeTag = 'DIV';

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
	
	this.obj = this._initial();
	this.rootNode = null;
	this.selectedNode = [];
	
	this.timer = null;
	this.arrIdAdd = [];
	this.isAppend = false;

	this.arrParamAdd = [];
	this.arrNodeAdd = [];
	this.arrParentId = [];

	this.arrNodeData = [];
}

oTree.prototype._initial = function(){
	var obj = null;
	if(this.box != null && this.box.tagName == this.nodeTag && this.box.innerHTML != undefined){		
		obj = document.createElement('div');
		obj.className = 'otree';
		obj.id = this.id + this.objIdPrefix.node + 'otree';
		obj.level = -1;
		obj.rel = 'block';
		//清除内容，防止重复添加
		this._clear();
		this.box.appendChild(obj);
	} else {
		alert('树菜单容器必须是DIV');
	}
	return obj;
};

oTree.prototype.add = function(param){
	//不能重复添加相同ID的节点
	if(this.checkNodeIsExist(param.id)){
		return false;
	}
	var config = {
		id: param.id || -1,
		idIsNum: typeof param.id == 'number',
		pid: param.pid || -1,
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
		showSwitch: param.showSwitch || false,	//动态添加子节点时，显示父节点的展开/关闭图标
		loaded: param.loaded || false			//表示是否已经动态加载了子节点，若已加载，则不用重新加载
	};
	if(config.type != 'node' && param.iconOpen == undefined && param.icon != undefined){
		config.iconOpen = config.icon;
	}
	var parentData = this.getNodeData(config.pid);
	config.level = parentData.level + 1;

	//将节点数据保存到数组中
	this.fillNodeData(config.id, config);
	//将父节点ID和当前ID添加到数组中备用
	this.fillParentId(config.pid, config.id);

	if(this.timer != null){
		window.clearTimeout(this.timer);
	}
	this.timer = window.setTimeout(this.appendNode, 50, this);
};

oTree.prototype.appendNode = function(_){
	_.obj.innerHTML = _.addNode({id:-1,level:-1});
};

var ic = 0;
var strDebug = [];

oTree.prototype.addNode = function(pnode){
	var html = '';
	
		strDebug.push('\r\n');
	for(var i in this.arrNodeData){
		var nodeData = this.arrNodeData[i];
		
		ic++;
		
		strDebug.push('id:' + nodeData.id);

		if(nodeData.level > pnode.level){
			if(nodeData.pid == pnode.id){
				html += this.buildNodeHtml(nodeData, i-1);
			}
		}
		
		//this.arrNodeData.splice(idx, 1);
	}/*
	for(var i in this.arrParentId){
		var pid = this.arrParentId[i][0];
		var pdata = this.getNodeData(pid);
		if(this.checkNodeIsExist(pdata.id)){
			ic++;
			html += this.buildNodeHtml(pdata);
		}
		for(var j=1,c=this.arrParentId[i].length; j<c; j++){
			var id = this.arrParentId[i][j];
			var data = this.getNodeData(id);
			if(this.checkNodeIsExist(data.id)){
				ic++;
				html += this.buildNodeHtml(data);
			}
		}
	}
	*/
	
	this.$('txtDebug').value = ic + '\r\n';
	this.$('txtDebug').value += strDebug.join('\r\n');
	return html;
};

oTree.prototype.buildNodeHtml = function(node, idx){
	var html = '';
	html += '<div id="' + this.buildId(this.objIdPrefix.node, node.id) + '" class="node" lang="' + node.id + '">';
	html += '<span>';
	for(var j=0; j<node.level; j++){
		html += '&nbsp;&nbsp;&nbsp;&nbsp;';
	}
	html += '</span>';
	html += '<input type="checkbox" name="chbNode" />';
	html += '<a>' + node.name + '</a>';
	
	if(this.checkParentIdIsExist(node.id)){
		html += this.addNode(node);
	} else {
		//this.arrNodeData.splice(idx, 1);
	}

	return html;
};

oTree.prototype._clear = function(){
	if(this.box != null && this.obj != null){
		var oldObj = document.getElementById(this.obj.id);
		if(oldObj != null){
			this.box.removeChild(oldObj);
		}
	}
};

oTree.prototype.$ = function(i){
	return document.getElementById(i);
};

oTree.prototype.extend = function(target, source){
	for (var p in source){
		if (source.hasOwnProperty(p)){
			target[p] = source[p];
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

oTree.prototype.fillNodeData = function(id, param){
	this.arrNodeData[id] = param;
};

oTree.prototype.updateNodeData = function(id, param){
	this.fillNodeData(id, this.extend(this.getNodeData(id), param));
};

oTree.prototype.getNodeData = function(id){
	return this.arrNodeData[id] != undefined ? this.arrNodeData[id] : {level:-1};
};

oTree.prototype.checkNodeIsExist = function(id){
	var nodeData = this.getNodeData(id);
	return id != undefined && nodeData.id == id;
};

oTree.prototype.checkParentIdIsExist = function(pid){
	return this.arrParentId[pid] != undefined;
};

oTree.prototype.fillParentId = function(pid, id){
	if(!this.checkParentIdIsExist(pid)){
		this.arrParentId[pid] = [];
		this.arrParentId[pid].push(pid);
	}
	this.arrParentId[pid].push(id);
};

oTree.prototype.deleteParentId = function(pid){
	if(this.arrParentId[pid] != undefined){
		this.arrParentId[pid] = undefined;
	}
};