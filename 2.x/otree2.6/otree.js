/*
	oTree 2.6
	Author: 青梅煮酒 85079542 oukunqing@126.com
	Update: 2016-05-08
*/
var _otree = _otree || {};
_otree.getMyName = function(){ 
	var es = document.getElementsByTagName('script'); 
	var src = es[es.length -1].src; 
	return src.split('/')[src.split('/').length-1].split('?')[0];
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
	var tag = document.createElement('link');
	tag.setAttribute('rel','stylesheet');
	tag.setAttribute('type','text/css');
	tag.setAttribute('href', cssDir + cssName);
	document.getElementsByTagName('head')[0].appendChild(tag);
};
_otree.jsName = _otree.getMyName();
_otree.pagePath = location.href.substring(0, location.href.lastIndexOf('/')+1);
_otree.jsPath = _otree.getJsPath(_otree.jsName, _otree.pagePath);
_otree.loadCss(_otree.jsPath, 'otree.css');
_otree.getImagePath = function(replacePath){
	var p = _otree.jsPath.replace(replacePath, '');
	if(p.indexOf('http://') == 0){
		p = p.replace('http://', '');
		p = p.substring(p.indexOf('/'));
	}
	return p;
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

function oTree(id, box, _cfg){
	var _ = this;
	_.id = id || 'o';
	_.box = box || null;
	if(typeof this.box != 'object'){
		_.box = _.$(_.box);
	}
	if(_cfg == undefined){
		_cfg = {};
	}
	_.nodeTag = 'DIV';
	_.selectedId = -1;
	_.selectedNode = null;
	_.selectedText = null;
	_.config = {
		showCheckBox: _cfg.showCheckBox || false, //是否显示复选框
		selectDisabledCheckBox: _cfg.selectDisabledCheckBox || false, //是否允许选中被禁用的复选框
		selectLinkage: _cfg.selectLinkage != undefined ? _cfg.selectLinkage : true, //是否联动选择复选框，默认为联动
		clickChecked: _cfg.clickChecked != undefined ? _cfg.clickChecked : false, //点击文字时是否选中复选框，默认不选中
		clickCheckedToggle: _cfg.clickCheckedToggle != undefined ? _cfg.clickCheckedToggle : true, //点击文字时选中复选框是否采用切换方式，默认为切换，若不切换，则始终选中
		showContextMenu: _cfg.showContextMenu != undefined ? _cfg.showContextMenu : false,	//是否允许显示自定义的右键菜单
		showIcon: _cfg.showIcon != undefined ? _cfg.showIcon : true,	//是否显示ICON图标
		showLine: _cfg.showLine != undefined ? _cfg.showLine : false,	//是否显示连线
		//showSubNode: _cfg.showSubNode != undefined ? _cfg.showSubNode : true,	//是否显示子节点(添加节点时)
		showSubNode: _cfg.showSubNode || false,	//是否显示子节点(添加节点时)
		skin: _cfg.skin || 'default',
		spaceWidth: _cfg.spaceWidth || 15,
		showFocus: _cfg.showFocus != undefined ? _cfg.showFocus : true, //是否允许获得焦点(显示虚线框)
		clickToggle: _cfg.clickToggle || false,	//点击（有回调动作的）文字时是否切换打开子节点
		callback: _cfg.callback || _cfg.callBack || null,	//点击文字时回调函数
		completeCallback: _cfg.completeCallback || _cfg.complete || _cfg.loadedCallback || null, //加载完成后回调函数
		expandCallback: _cfg.expandCallback || null,	//展开节点时回调函数
		checkboxCallback: _cfg.checkboxCallback || null, //选择复选框时回调函数
		callbackObj: _cfg.callbackObj || null,
		dblclick: _cfg.dblclick || _cfg.dblClick || false,	//是否启用双击
		keyEvent: _cfg.keyEvent || false,		//是否启用键盘事件（上、下键切换选择）
		keyEventLoop: _cfg.isRealLast || false, //键盘事件是否循环切换（到底后切换到头）
		checkboxName: _.id + 'chbNode',
		showStatusText: _cfg.showStatusText || false,
		showTitle: _cfg.showTitle || false,
		idIsNumber: _cfg.idIsNumber || false,
		isClearHtml: _cfg.isClearHtml || false,
		//是否缓存展开的节点，默认不缓存
		isCache: _._checkBoolean([_cfg.isCache, _cfg.isCookie, _cfg.isRefresh], false),
		//缓存Cookie过期时长，单位：分钟
		expireMinutes: _cfg.expireMinutes || 0
	}

	_.config.iconPath = _cfg.iconPath || _cfg.imgPath || (_otree.getImagePath(_otree.pagePath) + 'imgs/' + _.config.skin + '/');
	_.config.imgPath = _.config.iconPath;
	_.config.showLineConfig = _.config.showLine;
	if(_.config.spaceWidth < 5 || _.config.spaceWidth > 25){
		_.config.spaceWidth = 15;
	}
	
	//回调时，返回之前调用树菜单的HTML表单控件，一般用于下拉式树菜单或弹出式树菜单
	_.callbackObj = _.config.callbackObj;

	_.strFocusHtml = _.config.showFocus ? '' : ' onfocus="this.blur();"';

	_.strLinkLabel = !_otree.isSafari ? 'a' : 'span';
	//解决Safari兼容问题
	_.strKeyEvent = !_otree.isSafari ? '' : ' onkeypress="_otree._keyEvent(event, this);"';

	_.objIdPrefix = {
		node: 'n_',
		action: 'a_',
		actionlink: 'al_',
		icon: 'i_',
		text: 't_',
		checkbox: 'c_',
		postfix: 'f_',
		count: 'cc_'
	};

	_.icon = {
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
	
	//是否是追加节点
	_.isAppend = false;
	//是否已加载完成
	_.isLoaded = true;
	//节点加载次数(批量加载)
	_.loadTimes = 0;

	var obj = document.createElement('div');
	obj.className = 'otree';
	obj.id = _.id + _.objIdPrefix.node + 'otree';
	obj.level = -1;
	obj.rel = 'block';
	if(_.box != null && _.box.tagName == _.nodeTag && _.box.innerHTML != undefined){
		if(!_.isAppend && _.config.isClearHtml){
			_.box.innerHTML = '';
		}
		_.obj = obj;
		_._clear();
		_.box.appendChild(obj);
	} else {
		_.obj = null;
		alert('树菜单容器必须是DIV');
	}

	_.rootNode = null;
	_.arrRootNode = [];
	
	_.timer = null;
	_.arrIdAdd = [];
	_.arrParentChildAdd = [];

	_.arrNodeData = [];
	_.arrParentChild = [];
}

oTree.prototype._checkBoolean = function(arr, val){
	for(var i in arr){
		if(typeof arr[i] == 'boolean'){
			return arr[i];
		}
	}
	return val;
};

oTree.prototype.$ = function(i){
	return document.getElementById(i);
};

oTree.prototype._clear = function(){
	var _ = this;
	if(_.box != null && _.obj != null){
		var oldObj = document.getElementById(_.obj.id);
		if(oldObj != null){
			_.box.removeChild(oldObj);
		}
	}
	_.loadTimes = 0;
	_.isAppend = false;

	delete _.arrNodeData;
	_.arrNodeData = [];
	delete _.arrParentChild;
	_.arrParentChild = [];
};

oTree.prototype.root = function(param){
	var _ = this;
	if(_.obj == null){
		return false;
	}
	param = param || {};
	var id = 'root_' + (param.id || 'root');
	if(_.getNode(id) != null){
		return false;
	}
	var icon = param.icon || _.icon.root;
	var node = document.createElement('div');
	node.id = _.buildId(_.objIdPrefix.node, id);
	node.lang = id;
	node.level = -1;
	node.className = 'node otree-node root';
	var html = ['<img src="', _.config.iconPath, icon, '" id="', _.buildId(_.objIdPrefix.icon, id), '" lang="', icon, ',', icon, 
		'" rel="', icon + '" />', '<span id="', _.buildId(_.objIdPrefix.text, id), '">', (param.name || 'OTREE根节点'), '</span>'];
	node.innerHTML = html.join('');
	node.style.display = param.show == undefined || param.show ? '' : 'none';

	_.obj.appendChild(node);

	_.rootNode = node;
	_.arrRootNode.push(node);
};

oTree.prototype.initial = function(arr, action){
	var c = 0;	
	this.isLoaded = false;
	for(var i in arr){
		this._initialNodeData(arr[i]);
		c++;
	}
	if(c > 0){
		if(this.timer != null){
			window.clearTimeout(this.timer);
		}
		//延时5毫秒创建节点,防止页面卡死
		this.timer = window.setTimeout(this._create, 5, this, action, false);
	} else {
		this.isLoaded = true;
	}
	delete arr;
};

oTree.prototype.add = function(p){
	//正在加载节点
	this.isLoaded = false;
	this._initialNodeData(p);

	if(this.timer != null){
		window.clearTimeout(this.timer);
	}
	//延时创建节点
	this.timer = window.setTimeout(this._create, 5, this, null, false);
};

oTree.prototype.append = function(p){
	this.add(p);
};

oTree.prototype.insert = function(p, tid){
	if(tid != undefined){
		p.tid = tid;		
	}
	//正在加载节点
	this.isLoaded = false;
	this._initialNodeData(p);

	if(this.timer != null){
		window.clearTimeout(this.timer);
	}
	//延时创建节点
	this.timer = window.setTimeout(this._create, 5, this, null, true);
};

oTree.prototype._initialNodeData = function(p){
	//不能重复添加相同ID的节点
	if(this._checkNodeIsExist(p.id)){
		return false;
	}
	var cfg = {
		id: p.id,
		pid: p.pid,
		tid: p.tid || -1,
		code: p.code || '',
		name: p.name || '',
		postfix: p.postfix || null,
		title: p.title || '',
		count: p.count || -1,
		type: p.type || 'node',
		icon: p.icon || this.icon.folder,
		iconOpen: p.iconOpen || (p.icon != undefined ? p.icon : this.icon.folderOpen),
		checkbox: p.checkbox || null,
		callback: p.callback || null,
		param: p.param || null,
		href: p.href || null,
		target: p.target || null,
		clickToggle: p.clickToggle || this.config.clickToggle, //点击文字是否可以切换子节点打开/关闭
		clickChecked: p.clickChecked != undefined ? p.clickChecked : this.config.clickChecked, //点击文字是否选中复选框
		clickCheckedToggle: p.clickCheckedToggle != undefined ? p.clickCheckedToggle : this.config.clickCheckedToggle, //点击文字选择复选框方式
		contextmenu: p.contextmenu || null,
		dblclick: p.dblclick != undefined ? p.dblclick : this.config.dblclick,
		show: p.show != undefined ? p.show : true,
		append: p.append || this.isAppend,
		showSwitch: p.showSwitch || false,	//动态添加子节点时，显示父节点的展开/关闭图标
		loaded: p.loaded || false			//表示是否已经动态加载了子节点，若已加载，则不用重新加载
	};
	var pnData = this._getNodeData(p.pid);
	cfg.isDisplay = true;
	cfg.isNode = true;
	cfg.hasChild = false;

	cfg.isRoot = p.isRoot || (p.type == 'root');
	if(cfg.isRoot){
		cfg.icon = p.icon || this.icon.root;
		cfg.iconOpen = cfg.icon;
		cfg.isExpand = true;
		cfg.level = -1;
		cfg.pid = p.pid || 0;
		cfg.tree = '';
		//cfg.tree = cfg.id;
		cfg.tree1 = cfg.id;
	} else {
		cfg.isExpand = false;
		cfg.level = pnData.level + 1;
		cfg.tree = (pnData.tree != '' ? pnData.tree + '|' : '') + cfg.id;
		cfg.tree1 = pnData.tree1;
	}
	//将节点数据存储备用
	this.setNodeData(cfg.id, cfg);
	//将父节点ID和当前ID添加到数组中备用
	this.fillParentChild(cfg.pid, cfg.id);
	//将新添加的节点ID加入数组备用
	this.arrIdAdd.push(cfg.id);
};

oTree.prototype._create = function(_, action, isInsert){
	for(var i in _.arrParentChildAdd){
		var arrId = _.arrParentChildAdd[i];
		//判断父节点是否存在
		var pid = arrId[0];
		var len = arrId.length;
		var parent = _.getNode(pid);
		var pnIsExpand = true;
		var isTopLevel = false;
		if(parent == null){
			parent = _.obj;
			isTopLevel = true;
		} else {
			var pnData = _._getNodeData(pid);
			//设置父节点是否展开
			pnIsExpand = (!pnData.hasChild && _.config.showSubNode) || pnData.isExpand || pnData.isRoot;
		}
		if(!isInsert){
			//顶级节点默认显示，非顶级节点，根据父节点是否展开设置是否显示
			var isShow = isTopLevel || pnIsExpand;
			var arrNode = [];
			for(var j=1; j<len; j++){
				var nData = _._getNodeData(arrId[j]);
				arrNode.push(_._build(nData, isShow, true));
			}
			parent.innerHTML += arrNode.join('');
		} else {
			var fragment = document.createDocumentFragment();
			//顶级节点默认显示，非顶级节点，根据父节点是否展开设置是否显示
			var isShow = isTopLevel || pnIsExpand;
			for(var j=1; j<len; j++){
				var nData = _._getNodeData(arrId[j]);
				fragment.appendChild(_._build(nData, isShow, false));
			}
			var nextNode = _.getNode(nData.tid);
			nextNode != null ? parent.insertBefore(fragment, nextNode) : parent.appendChild(fragment);
		}
		
		if(parent != _.obj){
			_._setNodeExpandStatus(pid, pnIsExpand, _.isAppend);

			_.setNodeChild(pid, true);
		}
	}
	/*
	if(_.isAppend){
		var firstId = len > 1 ? arrId[1] : null;
		var firstNode = _.getNode(firstId);
		var preNode = firstNode.previousSibling;
		if(preNode != null){
			if(_.isNode(preNode)){
				_.setSwitch(preNode.lang, true, false);
			}
		}
	}
	*/
	if(_.config.showLine || _.config.showLineConfig){
		_._setLineAndSwitch(_);
	}
	//节点显示完毕，清除之前的临时节点数据
	_.deleteNodeDataAdd();

	//第一次(批量)添加节点之后，后面的节点都属于追加节点
	_.isAppend = true;
	//节点加载完毕
	_.isLoaded = true;
	//批量加载节点次数
	_.loadTimes++;

	if(typeof _.config.completeCallback == 'function'){
		//_.config.completeCallback(_);
		//延时回调，防止卡死
		window.setTimeout(function(){
			_.config.completeCallback(_);
			
			if(_.loadTimes > 1){
				//重新选中当前选中的节点，解决了当有动态按需加载节点的时候，设置选中状态无效的问题
				_.select();
			}
		}, 5);
	}

	if(typeof action == 'function'){
		window.setTimeout(action, 5);
	}
	//展开缓存的节点
	_.expandCache();
};

oTree.prototype._build = function(p, isShow, isHtml){
	var hasChild = this.checkHasChild(p.id);
	if(isHtml){
		if(p.id == undefined || p.name == undefined){
			return '';
		}
		var arr = [];
		var strDisplay = isShow ? '' : ' style="display:none;"';
		var strTitle = this.config.showTitle ? ' title="' + (p.title.length > 0 ? p.title : p.name).replace(/(\")/,'&quot;') + '"' : '';
		//arr.push('<div' + strTitle + strDisplay + ' id="' + this.buildId(this.objIdPrefix.node, p.id) + '" class="node" lang="' + p.id + '">');
		arr.push('<div id="');
		arr.push(this.buildId(this.objIdPrefix.node, p.id));
		arr.push('" class="node otree-node" lang="');
		arr.push(p.id);
		arr.push('"');
		arr.push(strTitle);
		arr.push(strDisplay);
		arr.push('>');
		arr.push(this.buildSpace(p.level, p.id));
		if(!p.isRoot){
			arr.push(this.buildSwitch(p.id, true, hasChild || p.showSwitch));
		}
		arr.push(this.buildIcon(p.id, p.icon, p.iconOpen));
		arr.push(this.config.showCheckBox ? this.buildCheckBox(p.checkbox, p.id) : '');
		arr.push(this.buildText(p));
		arr.push('</div>');
		this.setNodeDisplay(p.id, isShow);
		return arr.join('');
	} else {
		if(p.name == undefined || p.id == undefined){
			return null;
		}
		var node = document.createElement('div');
		node.id = this.buildId(this.objIdPrefix.node, p.id);
		node.className = 'node';
		node.lang = p.id;
		if(!isShow){
			node.style.display = 'none';
		}
		if(this.config.showTitle){
			node.title = p.title.length > 0 ? p.title : p.name;
		}

		node.innerHTML = this.buildSpace(p.level, p.id) 
			+ this.buildSwitch(p.id, true, p.showSwitch || hasChild) 
			+ this.buildIcon(p.id, p.icon, p.iconOpen)
			+ (this.config.showCheckBox ? this.buildCheckBox(p.checkbox, p.id) : '')
			+ this.buildText(p);

		this.setNodeDisplay(p.id, isShow);

		return node;
	}
};

oTree.prototype._buildPid = function(pid){
	return 'pid_' + pid;
};

oTree.prototype._buildId = function(id){
	return 'id_' + id;
};

oTree.prototype.checkHasChild = function(pid){
	var strPid = this._buildPid(pid);
	return this.arrParentChild[strPid] != undefined && this.arrParentChild[strPid].length > 1;
};

oTree.prototype.fillParentChild = function(pid, id){
	if(id != undefined && id != ''){
		var strPid = this._buildPid(pid);
		if(this.arrParentChild[strPid] == undefined){
			this.arrParentChild[strPid] = [];
			this.arrParentChild[strPid].push(pid);
		}
		this.arrParentChild[strPid].push(id);
		
		if(this.arrParentChildAdd[strPid] == undefined){
			this.arrParentChildAdd[strPid] = [];
			this.arrParentChildAdd[strPid].push(pid);
		}
		this.arrParentChildAdd[strPid].push(id);
	}
};

oTree.prototype.deleteParentChild = function(pid, id){
	if(id != undefined){
		var strPid = this._buildPid(pid);
		if(this.arrParentChild[strPid] != undefined){
			var arrId = this.arrParentChild[strPid];
			for(var i=1,c=arrId.length; i<c; i++){
				if(arrId[i] == id){
					this.arrParentChild[strPid].splice(i, 1);
				}
			}
			if(arrId.length <= 1){
				delete this.arrParentChild[strPid];
				this.arrParentChild[strPid] = null;
			}
		}
	} else if(pid != undefined && pid != null){
		var strPid = this._buildPid(pid);
		if(this.arrParentChild[strPid] != undefined){
			delete this.arrParentChild[strPid];
			this.arrParentChild[strPid] = null;
		}
	}
};

oTree.prototype.deleteNodeData = function(pid, id){
	if(id != undefined){
		var strId = this._buildId(id);
		if(this.arrNodeData[strId] != undefined){
			delete this.arrNodeData[strId];
			this.arrNodeData[strId] = null;
		}
	} else if(pid != undefined && pid != null){
		var strPid = this._buildPid(pid);
		if(this.arrParentChild[pid] != undefined){
			var arrId = this.arrParentChild[strPid];
			for(var i=1,c=arrId.length; i<c; i++){
				var strId = this._buildId(arrId[i]);
				if(this.arrNodeData[strId] != undefined){
					delete this.arrNodeData[strId];
					this.arrNodeData[strId] = null;
				}
			}
		}
	}
};

oTree.prototype.getNodeData = function(id){
	if(id != undefined && id != null){
		var d = this._getNodeData(id);
		var p = {
			id: d.id,
			pid: d.pid,
			type: d.type,
			code: d.code,
			name: d.name,
			postfix: d.postfix,
			title: d.title,
			level: d.level,
			display: d.isDisplay,
			expand: d.isExpand,
			isExpand: d.isExpand,
			showSwitch: d.showSwitch,
			loaded: d.loaded,
			tree: ((d.tree1 != undefined ? d.tree1 : '') + (typeof d.tree == 'string' ? '|' + d.tree : '')).split('|'),
			hasChild: d.hasChild || false,
			isNode: d.isNode || false,
			isDisplay: d.isDisplay || false,
			param: d.param || null
		};
		if(p.tree[0] == ''){
			p.tree.splice(0, 1);
		}
		return p;
	}
	return null;
};

oTree.prototype.setNodeData = function(id, p, isUpdate){
	if(isUpdate){
		var op = this._getNodeData(id||p.id);
		var _p = op;
		_p.id = p.id || op.id;
		_p.pid = p.pid || op.pid;
		_p.name = p.name || op.name;
		_p.postfix = p.postfix || op.postfix;
		_p.code = p.code || op.code;
		_p.type = p.type || op.type;
		_p.title = p.title || op.title;
		_p.icon = p.icon || op.icon;
		_p.iconOpen = p.iconOpen || op.iconOpen;
		_p.lang = p.lang || op.lang;
		_p.tree = p.tree || op.tree;
		_p.loaded = p.loaded || op.loaded;
		_p.showSwitch = p.showSwitch || op.showSwitch;
		_p.callback = p.callback || op.callback;
		_p.param = p.param || op.param;
		/*
		//这些参数在展开/关闭时会更新
		_p.level: p.level || op.level;
		_p.isDisplay: p.isDisplay || op.isDisplay;
		_p.isExpand: p.isExpand || op.isExpand;
		_p.isNode: op.isNode;
		_p.isRoot: op.isRoot;
		_p.hasChild: false;
		*/
		this.arrNodeData[this._buildId(p.id)] = _p;
	} else {
		p.isNode = true;
		this.arrNodeData[this._buildId(p.id)] = p;
	}
};

oTree.prototype.setNodeDisplay = function(id, isDisplay){
	var strId = this._buildId(id);
	if(this.arrNodeData[strId] != undefined){
		this.arrNodeData[strId].isDisplay = isDisplay;
	}
};

oTree.prototype.setNodeExpand = function(id, isExpand){
	var strId = this._buildId(id);
	if(this.arrNodeData[strId] != undefined){
		this.arrNodeData[strId].isExpand = isExpand;
	}
};

oTree.prototype.setNodeChild = function(id, hasChild){
	var strId = this._buildId(id);
	if(this.arrNodeData[strId] != undefined){
		this.arrNodeData[strId].hasChild = hasChild;
	}
};

oTree.prototype._setNodeExpandStatus = function(id, isExpand, isAppend){
	this.setNodeExpand(id, isExpand);
	this.setSwitch(id, isExpand, isAppend);
	this.setIcon(id, isExpand, isAppend);
};

oTree.prototype._getNodeData = function(id){
	var strId = this._buildId(id);
	return this.arrNodeData[strId] != undefined ? this.arrNodeData[strId] : {level:-1,tree:'',icon:'',iconOpen:''};
};

oTree.prototype._checkNodeIsExist = function(id){
	var strId = this._buildId(id);
	return this.arrNodeData[strId] != undefined; 
};

oTree.prototype.isNode = function(obj){
	return this._getNodeData(obj.lang).isNode && obj.tagName == this.nodeTag;
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

oTree.prototype.checkFunc = function(func){
	return typeof func == 'function';
};

oTree.prototype.getTagName = function(obj){
	return typeof obj == 'object' ? obj.tagName : '';
};

oTree.prototype.buildSpace = function(level, id){
	if(!this.config.showLine && !this.config.showLineConfig){
		var w = 0;
		for(var i=0; i<level; i++){
			w += this.config.spaceWidth;
		}
		return '<span style="width:' + w + 'px;">&nbsp;</span>';
	} else {
		var space = [];
		for(var i=0; i<level; i++){
			var arr = ['<img id="', this.id, 'line', id, i, '" name="', this.id, 'line', '" lang="', id, ',', i, '" src="', this.config.iconPath, (this.config.showLine ? this.icon.line : this.icon.empty), '" rel="', this.icon.line, '" />'];
			space.push(arr.join(''));
			delete arr;
		}
		return space.join('');
	}
};

oTree.prototype.buildSwitch = function(id, isLast, showSwitch){
	var strImgName = (this.config.showLine || this.config.showLineConfig)
		? showSwitch ? this.icon.linePlus : this.icon.join : showSwitch ? this.icon.plus : this.icon.empty;
	var arr = ['<', this.strLinkLabel, ' href="javascript:;" tabIndex="-2" onmouseover="window.status=\'\';return true;"', this.strFocusHtml,
		' id="', this.buildId(this.objIdPrefix.actionlink, id), '"', ' onclick="' + this.id + '.toggle(\'' + id + '\',this);"', this.strKeyEvent,
		(this.config.keyEvent ? ' onkeydown="' + this.id + '.keydown(event, \'' + id + '\', this);"' : ''),
		'>',
		'<img src="', this.config.iconPath, strImgName, '" id="', this.buildId(this.objIdPrefix.action, id), '" name="', this.id, 'switch"',
		(this.config.showLine || this.config.showLineConfig ? ' rel="' + strImgName + '"' : ''),
		(showSwitch ? ' lang="1" class="expand" tabIndex="-1"' : ' lang="0" class="expand-none" tabIndex="-2"'),
		this.strFocusHtml, ' />', '</', this.strLinkLabel, '>'];
	return arr.join('');
};

oTree.prototype.buildIcon = function(id, icon, iconOpen){
	if(this.config.showIcon){
		var path = this.getIconRealPath(icon);
		var arr = ['<img src="', path, icon, '" lang="' + icon + ',' + iconOpen + '"', ' id="', this.buildId(this.objIdPrefix.icon, id), 
			'" onfocus="this.blur();" />'];
		return arr.join('');
	}
	return '';
};

oTree.prototype.buildText = function(p){
	var _ = this;
	var strText = [];
	var arr = ['<', _.strLinkLabel, ' id="', _.buildId(_.objIdPrefix.text, p.id), '" tabIndex="0"', ' lang="' + p.id + '"', _.strKeyEvent];
	strText.push(arr.join(''));

	if(p.href != null){
		arr = [' class="link" href="', p.href, '"', (!_.config.showStatusText ? ' onmouseover="window.status=\'\';return true;"' : ''),
			(p.target != null ? ' target="' + p.target + '" ' : '')];
		strText.push(arr.join(''));
	} else {
		strText.push(' class="link" href="javascript:;" onmouseover="window.status=\'\';return true;"');
	}
	strText.push((p.dblclick ? ' ondblclick="' : ' onclick="') + _.id + '.clickText(\'' + p.id + '\', this);"');
	if(_.config.showContextMenu){
		strText.push(' oncontextmenu="' + _.id + '.contextmenu(event,\'' + p.id + '\', this);"');
	}
	if(_.config.keyEvent){
		strText.push(' onkeydown="' + _.id + '.keydown(event,\'' + p.id + '\', this);"');
	}

	arr = [_.strFocusHtml, '>', p.name, '</', _.strLinkLabel, '>'];

	strText.push(arr.join(''));
	
	if(p.count >= 0){
		strText.push('<i id="' + _.buildId(_.objIdPrefix.count, p.id) + '" class="count">(' + p.count + ')</i>');
	}
	if(p.postfix != null){
		strText.push('<i id="' + _.buildId(_.objIdPrefix.postfix, p.id) + '" class="postfix">' + p.postfix + '</i>');
	}

	delete arr;
	return strText.join('');
};

oTree.prototype.buildCheckBox = function(p, nid){
	if(p == undefined){
		return '';
	}
	if(p.id != nid){
		p.id = nid;
	}
	if(p.name == undefined || p.name == null){
		p.name = this.config.checkboxName;
	}
	var arr = ['<input type="checkbox" id="', this.buildId(this.objIdPrefix.checkbox, p.id), '" name="', p.name, '" value="', (p.value || p.id),
		'" lang="', p.id, '"', (p.checked ? ' checked="checked" ' : ''), (p.disabled ? ' disabled="disabled" ' : ''), this.strFocusHtml,
		' onclick="' + this.id + '.selectCheckBox(\'' + p.id + '\', ' + p.clickCheckedToggle + ', this, true);"', ' />'];
	return arr.join('');
};

oTree.prototype.clickText = function(id, obj){
	var p = this._getNodeData(id);
	var callback = this.checkFunc(p.callback) ? p.callback : !p.isRoot && this.checkFunc(this.config.callback) ? this.config.callback : null;
	var isFunc = typeof callback == 'function';
	if(isFunc || p.href != null){
		if(p.clickToggle != null){
			this.toggle(p.id, null, p.clickToggle == 'toggle' ? undefined : p.clickToggle == 'close' ? false : true);
		}
		if(typeof p.clickChecked == 'boolean' && p.clickChecked && p.checkbox != null){
			//this.selectCheckBox(p.id, p.clickChecked ? true : false, null, true);
			this.selectCheckBox(p.id, p.clickCheckedToggle, null, true);			
		}
		if(isFunc){
			//{id:p.id, pid:p.pid, type:p.type, code:p.code, name:p.name}
			callback(p.param != null ? p.param : this.getNodeData(id), this, this.callbackObj);
		}
		this.select(p.id);
	} else {
		this.toggle(p.id);
		if(typeof p.clickChecked == 'boolean' && p.clickChecked && p.checkbox != null){
			//this.selectCheckBox(p.id, p.clickChecked ? true : false, null, true);
			this.selectCheckBox(p.id, p.clickCheckedToggle, null, true);
		}
	}
};

oTree.prototype.callback = function(id, p){
	var _ = this;
	if(p == undefined){
		p = _._getNodeData(id);
	}
	var callback = _.checkFunc(p.callback) ? p.callback : _.checkFunc(_.config.callback) ? _.config.callback : null;
	if(typeof callback == 'function'){
		callback(p.param != null ? p.param : _.getNodeData(id), _, _.callbackObj);
	}
};

oTree.prototype.contextmenu = function(e, id, obj, p){
	if(p == undefined){
		p = this._getNodeData(id);
	}
	if(typeof p.contextmenu == 'function'){
		p.contextmenu(e, obj, p, this);
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
			if(!this.config.showLine && this.config.showLineConfig){
				pathName.name = a.rel;
			}
			var newName = pathName.name.indexOf('join') < 0 ? (isOpen ? pathName.name.replace(/(plus)/,'minus') : pathName.name.replace(/(minus)/,'plus')) : (isOpen ? this.icon.lineMinus : this.icon.linePlus);
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
		a.tabIndex = -1;
		a.className = 'expand';
	}
};

oTree.prototype.setLineSwitchIcon = function(id, isLast, isRemove){
	var a = this.getObj(this.objIdPrefix.action, id);
	if(a != null){
		var pathName = this.getIconPathName(a.src);
		var newName = '';
		if(this.config.showLine){
			//动态加载节点时，需要将节点强制加上打开/关闭开关图标
			if(a.lang == 1 && pathName.name.indexOf('join') >= 0){
				pathName.name = this.icon.linePlus;
			}
			newName = isLast ? pathName.name.replace(/(bottom.gif|one.gif|top.gif|.gif)/,'') + 'bottom.gif' : pathName.name.replace('bottom', '');
			a.src = pathName.path + newName;
		} else {
			//动态加载节点时，需要将节点强制加上打开/关闭开关图标
			if(a.lang == 1 && pathName.name.indexOf('join') >= 0){
				a.rel = this.icon.plus;
			}
			newName = isLast ? a.rel.replace(/(bottom.gif|one.gif|top.gif|.gif)/,'') + 'bottom.gif' : a.rel.replace('bottom', '');
		}
		a.rel = newName;
		if(a.rel.indexOf('join') >= 0){
		//if(/(join)/.test(a.rel)){
			a.onfocus = function(){this.blur();};
		}
	}
};

oTree.prototype._setLineAndSwitch = function(otree){
	otree.setLineAndSwitch(!otree.config.showLine, otree.isAppend);
};

oTree.prototype.setLineAndSwitch = function(isHide, isAppend){	
	var node = null;
	for(var i in this.arrParentChildAdd){
		var arrId = this.arrParentChildAdd[i];
		if(isAppend){
			var firstId = arrId[1];
			node = this.getNode(arrId[1]);
			if(node != null){
				var preNode = node.previousSibling;
				if(preNode != null){
					this.setLineSwitchIcon(preNode.lang, false);
				}
			}
		}
		var lastId = arrId[arrId.length - 1];
		this.setLineSwitchIcon(lastId, true);
		
		var pnode = this.getNode(arrId[0]);
		if(pnode != null){
			this.setLineSwitchIcon(arrId[0], pnode.nextSibling == null);
		}
	}
	var arrTmp = [];
	var arrLine = document.getElementsByName(this.id + 'line');

	for(var i=0,c=arrLine.length; i<c; i++){
		var arr = arrLine[i].lang.split(',');
		var nid = this._getNodeData(arr[0]).tree.split('|')[arr[1]];
		var tmp = arrTmp['' + nid];
		var isLast = false;
		if(tmp != undefined){
			isLast = tmp;
		} else {
			//获取直线所垂直对应的那个节点
			var node = this.getNode(nid);
			if(node != null){
				isLast = node.nextSibling == null;
				arrTmp['' + nid] = isLast;
			}
		}
		if(isLast){
			if(this.config.showLine){
				arrLine[i].src = this.config.iconPath + this.icon.empty;
			}
			arrLine[i].icon = this.icon.empty;
		} else {
			arrLine[i].src = this.config.iconPath + this.icon.line;
			arrLine[i].icon = this.icon.line;
		}
	}
	delete arrTmp;
	delete arrLine;

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
	this.deleteNodeDataAdd();
	
	//第一轮结束，后面添加的节点都属于追加
	this.isAppend = true;
};

oTree.prototype.deleteNodeDataAdd = function(){
	delete this.arrParentChildAdd;
	this.arrParentChildAdd = [];
	//清除添加的ID数组
	delete this.arrIdAdd;
	this.arrIdAdd = [];
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
		arrLine[i].src = this.config.iconPath + arrLine[i].icon;
	}
	var arrSwitch = document.getElementsByName(this.id + 'switch');
	for(var i=0,c=arrSwitch.length; i<c; i++){
		arrSwitch[i].src = this.config.iconPath + arrSwitch[i].icon;
	}
};

oTree.prototype.hideNodeLine = function(arrId){
	this.config.showLine = false;
	var arrLine = document.getElementsByName(this.id + 'line');
	for(var i=0,c=arrLine.length; i<c; i++){
		var pathName = this.getIconPathName(arrLine[i].src);
		if(this.config.showLine){
			arrLine[i].icon = pathName.name;
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
		this.setNodeChild(id, false);
		//a.onclick = function(){};
		//a.onfocus = function(){this.blur();};
		var parent = a.parentNode;
		if(parent != null){
			parent.tabIndex = -2;
			//parent.onclick = function(){};
			//parent.onfocus = function(){this.blur();};
		}
	}
};

oTree.prototype.setIcon = function(id, isOpen, isAppend){
	if(!this.config.showIcon){
		return false;
	}
	var icon = this.getObj(this.objIdPrefix.icon, id);
	if(icon != null || isAppend){
		var nData = this._getNodeData(id);
		var strIcon = isOpen ? nData.iconOpen || nData.icon : nData.icon;
		if(strIcon != undefined){
			icon.src = this.getIconRealPath(strIcon) + strIcon;
		}
	}
};

oTree.prototype.checkObjDisplay = function(obj){
	var isShow = obj!= null && obj.style.display != 'none';
	var objParent = obj.parentNode;

	//检测节点的所有父级节点是否显示
	while(objParent != null && typeof objParent.style != 'undefined'){
		if(objParent.style.display == 'none'){
			isShow = false;
			break;
		}
		objParent = objParent.parentNode;
	}
	return isShow;
};

oTree.prototype.select = function(id, isCallback, _){
	_ = _ || this;
	if(typeof id == 'undefined'){
		//重新选中当前选中的节点，解决了当有动态按需加载节点的时候，设置选中状态无效的问题
		if(_.selectedText != null){
			_.select(_.selectedText.lang);
		}
	} else {
		if(_.selectedText != null){
			_.selectedText.className = _.selectedText.className.replace(/(\sselected)/g, '');
		}
		if(_.selectedNode != null){
			_.selectedNode.className = 'node otree-node';
		}
		_.selectedId = -1;
		_.selectedText = null;
		_.selectedNode = null;

		var txt = _.getObj(_.objIdPrefix.text, id);
		if(txt != null){
			_.selectedText = txt;
			_.selectedText.className += ' selected';
			if(_.checkObjDisplay(_.selectedText)){
				_.selectedText.focus();
			}
		} else {
			var nData = _._getNodeData(id);
			if(nData.id != undefined){
				//节点文本对象不存在（可能节点还在创建中），给个机会再设置一次
				window.setTimeout(_.select, 128, id, isCallback, _);
			}
		}

		var node = _.getNode(id);
		if(node != null){
			//node.className = 'node otree-node node-selected';
			_.selectedNode = node;
			_.selectedId = id;
		}

		if(isCallback){
			_.callback(id);
		}

		_.cacheExpand();
	}
};

oTree.prototype.focus = function(id){
	if(id != undefined){
		var obj = this.getObj(this.objIdPrefix.text, id);
		if(this.checkObjDisplay(obj)){
			obj.focus();
		}
	}
	if(this.selectedText != null){
		if(this.checkObjDisplay(this.selectedText)){
			this.selectedText.focus();
		}
	} else {
		var arr = this.obj.getElementsByTagName('A');
		if(arr.length > 0){			
			if(this.checkObjDisplay(arr[0])){
				arr[0].focus();
			}
		}
	}
};

oTree.prototype.move = function(nid, action, tnid, callback){
	var nData = typeof nid == 'object' ? this.getNodeData(nid.lang || nid.id) : this.getNodeData(nid);
	var isUp = (action == 'up' || action) && action != 'down';
	var isMove = false;
	if(nData != null && nData.isNode){
		var arr = [];
		var node = this.getNode(nid);
		var tnode = tnid == undefined ? isUp ? node.previousSibling : node.nextSibling : typeof tnid == 'object' ? this.getNode(tnid.lang || tnid.id) : this.getNode(tnid);
		if(tnode != null){
			var tnData = this.getNodeData(tnode.lang);
			if(tnData.isNode){
				if(isUp){
					if(tnode.className.indexOf('otree-node') > 0){
						tnode.parentNode.insertBefore(node, tnode);
						isMove = true;
					}
				} else {
					node.parentNode.insertBefore(tnode, node);
					isMove = true;
				}
			}
			if(typeof callback == 'function'){
				callback(isMove, [this.getNodeData(node.lang), this.getNodeData(tnode.lang)], action);
			}
		}
	}
};

oTree.prototype.getSelected = function(){
	if(this.selectedText != null){
		return this.getNodeData(this.selectedText.lang);
	}
	return '';
};

oTree.prototype.getTextValue = function(arrId){
	var arrResult = [];
	if(typeof arrId == 'undefined'){
		return arrResult;
	}
	if(typeof arrId == 'string' || typeof arrId == 'number'){
		var data = this.getNodeData(arrId);
		if(data.id != undefined){
			arrResult.push([data.id, data.name]);
		}
	} else {
		for(var i in arrId){
			var data = this.getNodeData(arrId[i]);
			if(data.id != undefined){
				arrResult.push([data.id, data.name]);
			}
		}
	}
	return arrResult;
};

oTree.prototype.getChild = function(pid){
	var node = this.getNode(pid);
	if(node != null){
		var arr = [];
		var subNode = node.firstChild;
		while(subNode != null){
			if(this.isNode(subNode)){
				arr.push(subNode);
			}
			subNode = subNode.nextSibling;
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

oTree.prototype.removeChild = function(pid, isCallback){
	var node = this.getNode(pid);
	if(node != null){
		var isDelSelected = false;
		var lastNode = node.lastChild;
		while(lastNode != null){
			if(this.isNode(lastNode)){
				if(lastNode.lang == this.selectedId){
					isDelSelected = true;
				}
				node.removeChild(lastNode);
				lastNode = node.lastChild;
			} else {
				break;
			}
		}
		//移除图标
		this.removeSwitch(pid);
		//设置Icon
		this.setIcon(pid, false);
		this.setNodeExpand(pid, false);

		//删除节点数据
		this.deleteNodeData(pid);
		//删除父节点ID记录
		this.deleteParentChild(pid);

		if(isDelSelected){
			this.select(pid, isCallback != undefined ? isCallback : true);
		}
		return true;
	}
	return false;
};

oTree.prototype.removeNode = function(id, isCallback){
	var hasChild = this.checkHasChild(id);
	if(hasChild){
		this.removeChild(id);
	}
	var node = this.getNode(id);
	if(node != null){
		if(this.rootNode != null && node.id == this.rootNode.id){
			return false;
		}
		var isDelSelected = false;
		if(node.lang == this.selectedId){
			isDelSelected = true;
		}
		var parent = node.parentNode;
		parent.removeChild(node);
		var pid = parent.lang;

		//删除节点数据
		this.deleteNodeData(null, id);
		//删除父节点ID记录
		this.deleteParentChild(pid, id);

		hasChild = this.checkHasChild(pid);
		if(!hasChild){
			//移除图标
			this.removeSwitch(pid);
			//设置Icon
			this.setIcon(pid, false);
			this.setNodeChild(pid, false);
		}
		if(isDelSelected){
			this.select(pid, isCallback != undefined ? isCallback : false);
		}
	}
};

oTree.prototype.open = function(id, isOpen){
	if(typeof id == 'number' || typeof id == 'string'){
		this.toggle(id, null, typeof isOpen == 'boolean' ? isOpen : true);
	}
};

oTree.prototype.expand = function(id){
	this.open(id, true);
};

oTree.prototype.close = function(id, isClose){
	if(typeof id == 'number' || typeof id == 'string'){
		this.toggle(id, null, typeof isClose == 'boolean' ? isClose : false);
	}
};

oTree.prototype.collapse = function(id){
	this.close(id, true);
};

oTree.prototype.show = function(id, isShow){	
	var obj = id != undefined ? this.getNode(id) : this.obj;
	if(obj != null){
		obj.style.display = typeof isShow == 'boolean' && !isShow ? 'none' : '';
	}
};

oTree.prototype.hide = function(id, isHide){
	var obj = id != undefined ? this.getNode(id) : this.obj;
	if(obj != null){
		obj.style.display = typeof isHide == 'boolean' && !isHide ? '' : 'none';
	}
};

oTree.prototype.openAll = function(isOpen){
	this.toggleAll(typeof isOpen == 'boolean' ? isOpen : true);
};

oTree.prototype.expandAll = function(){
	this.openAll(true);
};

oTree.prototype.closeAll = function(isClose){
	this.toggleAll(typeof isClose == 'boolean' ? isClose : false);
};

oTree.prototype.collapseAll = function(){
	this.closeAll(false);
};

oTree.prototype.toggle = function(id, obj, isOpen, _){
	_ = _ || this;
	if(!_.isLoaded){
		window.setTimeout(function(){_.toggle(id, obj, isOpen, _);}, 100);
		return false;
	}
	var node = _.getNode(id);
	if(node != null){
		var nData = _._getNodeData(id);
		if(!nData.hasChild && !nData.showSwitch){
			if(obj != null && obj != undefined){
				obj.blur();
			}
			return false;
		}
		var isExpand = isOpen != undefined ? isOpen : !nData.isExpand;
		var strDisplay = isExpand ? 'block' : 'none';
		var count = 0;
		var sub = node.firstChild;
		while(sub != null){
			if(_.isNode(sub)){
				sub.style.display = strDisplay;
				_.setNodeDisplay(sub.lang, isExpand);
				count++;
			}
			sub = sub.nextSibling;
		}
		if(count > 0 || nData.showSwitch){
			_._setNodeExpandStatus(id, isExpand);
		}
		if(isExpand){
			if(_.config.expandCallback != null && typeof _.config.expandCallback == 'function'){
				_.config.expandCallback(_.getNodeData(id), _);
			}
		}
		_.cacheExpand();
	}
};

oTree.prototype.toggleAll = function(isOpen, _){
	_ = _ || this;
	if(!_.isLoaded){
		window.setTimeout(function(){_.toggleAll(isOpen, _);}, 100);
		return false;
	}
	for(var i in _.arrNodeData){
		var nData = _.arrNodeData[i];
		if(!nData.isRoot){
			var id = nData.id;
			var node = null;
			if(isOpen && !nData.isDisplay){
				node = _.getNode(id);
				node.style.display = 'block';
				_.setNodeDisplay(id, true);
			} else if(!isOpen && nData.isDisplay){
				node = _.getNode(id);
				var isDisplay = nData.level <= 0;
				node.style.display = isDisplay ? 'block' : 'none';
				_.setNodeDisplay(id, isDisplay);
			}
			
			var hasChild = _.checkHasChild(id);
			if(hasChild){
				_._setNodeExpandStatus(id, isOpen);
			}
		}
	}
	_.cacheExpand();
};

oTree.prototype.openLevel = function(level){
	if(level >= -1){
		this.toggleLevel(level, true);
	}
};

oTree.prototype.closeLevel = function(level){
	if(level >= -1){
		this.toggleLevel(level, false);
	}
};

oTree.prototype.toggleLevel = function(level, isOpen, _){
	_ = _ || this;
	if(!_.isLoaded){
		window.setTimeout(function(){_.toggleLevel(level, isOpen, _);}, 100);
		return false;
	}
	for(var i in _.arrNodeData){
		var nData = _.arrNodeData[i];
		if(!nData.isRoot){
			var id = nData.id;
			var hasChild = _.checkHasChild(id);
			var node = null;
			if(nData.level <= level + 1){
				if(isOpen && !nData.isDisplay){
					node = _.getNode(id);
					if(node != null){
						node.style.display = 'block';
						_.setNodeDisplay(id, true);
					}
				}
				if(hasChild){
					_._setNodeExpandStatus(id, nData.level <= level);
				}
			} else {
				if(nData.isDisplay){
					node = _.getNode(id);
					if(node != null){
						var isDisplay = nData.level <= 0;
						node.style.display = isDisplay ? 'block' : 'none';
					}
					_.setNodeDisplay(id, isDisplay);
					if(hasChild){
						_._setNodeExpandStatus(id, false);
					}
				}
			}
		}
	}
	_.cacheExpand();
};

//更新节点内容、图标
oTree.prototype.update = function(param){
	var _ = this;
	var node = _.getNode(param.id);
	if(node != null){
		var icon = _.getObj(_.objIdPrefix.icon, param.id);
		if(icon != null && param.icon != undefined){
			icon.src = _.getIconRealPath(param.icon) + param.icon;
		}
		var txt = _.getObj(_.objIdPrefix.text, param.id);
		if(param.name != undefined){
			txt.innerHTML = param.name;
		}
		
		if(typeof param.count == 'number' && param.count >= 0){
			var count = _.getObj(_.objIdPrefix.count, param.id);
			if(count == null){
				var oc = document.createElement('i');
				oc.id = _.buildId(_.objIdPrefix.count, param.id);
				oc.className = 'count';
				oc.innerHTML = '(' + param.count + ')';
				node.appendChild(oc);

			} else {
				postfix.innerHTML = param.postfix;
			}
		}

		if(typeof param.postfix == 'string'){
			var postfix = _.getObj(_.objIdPrefix.postfix, param.id);
			if(postfix == null){
				var op = document.createElement('i');
				op.id = _.buildId(_.objIdPrefix.postfix, param.id);
				op.className = 'postfix';
				op.innerHTML = param.postfix;
				node.appendChild(op);
			} else {
				postfix.innerHTML = param.postfix;
			}
		}

		if(_.config.showTitle){
			node.title = (param.title || param.name).replace(/(\")/,'&quot;') || '';
		}
		param.iconOpen = param.iconOpen || param.icon;
		_.setNodeData(param.id, param, true);
	} else {
		_.add(param);
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

oTree.prototype.selectCheckBox = function(id, isToggle, obj, isUserClick, isDisabled){
	if(obj != null && obj.disabled){
		return false;
	}
	id = id || obj.value;
	var chb = obj || this.getObj(this.objIdPrefix.checkbox, id);

	if(chb != null && chb.type == 'checkbox' && (!chb.disabled || this.config.selectDisabledCheckBox || isDisabled)){
		//obj!=null表示点击的是复选；框当点击文字时，若不采用切换选中方式，则点击文字后始终为选中状态
		var isChecked = obj != null ? chb.checked : isToggle ? !chb.checked : true;
		//点击文字时，需要设置复选框状态
		if(obj == null){
			chb.checked = isChecked;
		}

		if(this.config.selectLinkage){
			var node = this.getNode(id);
			if(node != null){
				//设置子节点的checkbox
				this.selectCheckBoxRecursion(node, false, isChecked);
				//设置父节点的checkbox
				this.selectCheckBoxRecursion(node, true, isChecked);
			}
		}
	}

	if(obj != null || isUserClick){
		//无效的复选框点击无效
		if(isUserClick && chb.disabled){
			return false;
		}
		var param = this._getNodeData(id);
		var checkbox = param.checkbox;
		if(checkbox != undefined){
			var callback = this.checkFunc(checkbox.callback) ? checkbox.callback : !param.isRoot && this.checkFunc(this.config.checkboxCallback) ? this.config.checkboxCallback : null;
			if(typeof callback == 'function'){
				var val = obj != null ? obj.value : (chb != null ? chb.value : null);
				callback(checkbox.param != undefined ? checkbox.param : {chbName:checkbox.name, id:checkbox.id, value:val}, this, this.callbackObj);
			}
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
				var checkCount = 0;
				var subNode = parent.firstChild;
				while(subNode != null){
					if(this.isNode(subNode)){
						var obj = this.getObj(this.objIdPrefix.checkbox, subNode.lang);
						if(obj != null){
							checkCount += obj.checked ? 1 : 0;
						}
					}
					subNode = subNode.nextSibling;
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
		var subNode = node.firstChild;
		while(subNode != null){
			if(this.isNode(subNode)){
				var obj = this.getObj(this.objIdPrefix.checkbox, subNode.lang);
				if(obj != null && (!obj.disabled || this.config.selectDisabledCheckBox)){
					obj.checked = isChecked;
				}
				//递归
				this.selectCheckBoxRecursion(subNode, isParent, isChecked);
			}
			subNode = subNode.nextSibling;
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
oTree.prototype.setCallbackObject = function(callbackObj){
	this.callbackObj = callbackObj;
};

//根据节点类型展开/收缩节点
oTree.prototype.openType = function(type){
	this.toggleType(type, true);
};

oTree.prototype.closeType = function(type){
	this.toggleType(type, false);
};

oTree.prototype.toggleType = function(type, isOpen, _){
	_ = _ || this;
	if(!_.isLoaded){
		window.setTimeout(function(){_.toggleType(type, isOpen, _);}, 100);
		return false;
	}
	for(var i in this.arrNodeData){
		var nData = this.arrNodeData[i];
		if(!nData.isRoot){
			var pnData = this._getNodeData(nData.pid);
			var id = nData.id;
			var hasChild = this.checkHasChild(id);
			var isType = nData.type == type;
			var isParentType = pnData.type == type;
			if(isType || isParentType){
				if(isOpen && !nData.isDisplay){
					var node = this.getNode(id);
					var isDisplay = isOpen || !isParentType;
					node.style.display = isDisplay ? 'block' : 'none';
					this.setNodeDisplay(id, isDisplay);
				}
				if(hasChild){
					this._setNodeExpandStatus(id, isType);
				}
			} else {
				if(nData.isDisplay){
					var node = this.getNode(id);
					node.style.display = nData.level <= 0 ? 'block' : 'none';
					this.setNodeDisplay(id, false);
					if(hasChild){
						this._setNodeExpandStatus(id, false);
					}
				}
			}
		}
	}
};

oTree.prototype.keyDownNode = null;
oTree.prototype.keyDownRecursion = false;
oTree.prototype.keydown = function(e, id, obj){
	if(obj == undefined || !this.config.keyEvent){
		return false;
	}
	this.keyDownNode = null;
	this.keyDownRecursion = false;
	this.keyDownTimes = 0;
	var node = obj.parentNode;
	var e = window.event || arguments.callee.caller.arguments[0];
	var keyCode = e.keyCode || e.which || e.charCode;
	var isKeyEvent = true;
	//var strKeyCode = String.fromCharCode(keyCode).toUpperCase();
	switch(keyCode){
		case 38:	//向上键
			var preNode = node.previousSibling;
			this.keyDownNode = preNode != null ? (this.isNode(preNode) ? this.findTargetNode(preNode, keyCode) : node.parentNode) : node;
			break;
		case 40:	//向下键
			this.keyDownNode = this.findTargetNode(obj.parentNode, keyCode);
			break;
		default:
			isKeyEvent = false;
			break;
	}
	if(isKeyEvent && this.keyDownNode != null){
		var targetId = this.keyDownNode.lang;
		var targetObj = this.getObj(this.objIdPrefix.text, targetId);
		if(targetObj != null){
			this.clickText(targetId, targetObj);
		}
		this.stopBubble(e);
	}
};

oTree.prototype.stopBubble = function(ev){
	var ev = ev||event;
    if(ev.stopPropagation){ev.stopPropagation();} else{ev.cancelBubble = true;}
    if(ev.preventDefault){ev.preventDefault();} else{ev.returnValue = false;}
};

oTree.prototype.findTargetNode = function(node, key, oldNode){
	if(38 == key){
		if(node.id == undefined){
			return false;
		} else if(node.className.indexOf('node otree-node') < 0){
			this.keyDownNode = node;
		}
		var nData = this._getNodeData(node.lang);
		if(nData.hasChild && nData.isExpand){
			this.keyDownRecursion = true;
			this.findTargetNode(node.lastChild, key);
		} else if(this.keyDownNode == null){
			this.keyDownNode = node;
		}
	} else if(40 == key){
		var nData = this._getNodeData(node.lang);
		if(this.keyDownRecursion){
			if(node.nextSibling == null){
				var arrId = nData.tree.split('|');
				if(!this.config.keyEventLoop){
					var isRealLast = true;
					//检测当前节点是否是最后一个节点
					for(var i in arrId){
						var tmpNode = this.getNode(arrId[i]);
						if(tmpNode != null && tmpNode.nextSibling != null){
							isRealLast = false;
							break;
						}
					}
					if(!isRealLast){
						this.findTargetNode(node.parentNode, key, oldNode);
					} else {
						this.keyDownNode = oldNode;
					}
				} else {
					this.findTargetNode(node.parentNode, key, oldNode);
				}
			} else {
				node = node.nextSibling;
			}
		} else if(nData.hasChild && nData.isExpand){
			var newNode = node.firstChild;
			while(newNode != null){
				if(this.isNode(newNode)){
					node = newNode;
					break;
				}
				newNode = newNode.nextSibling;
			}
		} else if(node.nextSibling != null) {
			node = node.nextSibling;
		} else {
			this.keyDownRecursion = true;
			this.findTargetNode(node.parentNode, key, node);
		}

		if(node != null){
			nData = this._getNodeData(node.lang);
			if(nData.isNode && this.keyDownNode == null){
				this.keyDownNode = node;
			}
		}
	}
	return this.keyDownNode;
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
	var subObj = obj.firstChild;
	while(subObj != null){
		if(this.checkHtmlObjectTag(subObj.tagName, tagName)){
			var data = eval('(' + subObj.lang + ')');
			if(/(current|selected|cur)/.test(subObj.className)){
				selectedId = data.id;
			}
			arr.push({id:data.id, pid:data.pid, level:data.level, name:(data.name || nd.innerHTML), href:(data.href || subObj.href), target:(data.target || subObj.target), callback:data.callback, checkbox:data.checkbox});
		}
		var child = subObj.firstChild;
		while(child != null){
			if(this.checkHtmlObjectTag(child.tagName,  tagName)){
				var data = eval('(' + child.lang + ')');
				if(/(current|selected|cur)/.test(child.className)){
					selectedId = data.id;
				}
				arr.push({id:data.id, pid:data.pid, level:data.level, name:(data.name || child.innerHTML), href:(data.href || child.href), target:(data.target || child.target), callback:data.callback, checkbox:data.checkbox});
			}
			child = child.nextSibling;
		}
		subObj = subObj.nextSibling;
	}
	if(param.isSort){
		arr = this.quickSort(arr);
	}
	for(var i in arr){
		this.add({id:arr[i].id, pid:arr[i].pid, name:arr[i].name, href:arr[i].href,target:arr[i].target, checkbox:arr[i].checkbox, callback:arr[i].callback});
	}
	
	if(arr.length > 0){
		this.select(selectedId);
	}
};

oTree.prototype.quickSort = function(arr){
	if (0 == arr.length){
		return [];
	}
	var left = [];
	var right = [];
	var pivot = arr[0];
	for (var i = 1, c=arr.length; i < c; i++) {
		arr[i].level < pivot.level ? left.push(arr[i]) : right.push(arr[i]);
	}
	return this.quickSort(left).concat(pivot, this.quickSort(right));
};

//以下功能用于缓存展开的节点，以防止刷新
oTree.prototype.setCookie = function(name, value, expireMinutes){
	var _ = this;
	if (typeof expireMinutes == 'undefined' || expireMinutes <= 0) {
        document.cookie = name + "=" + escape(value) + ";";
    } else {
        var expDate = new Date();
        expDate.setTime(expDate.getTime() + (8*60*60*1000) + expireMinutes * 60 * 1000);
        document.cookie = name + "=" + escape(value) + ";expires=" + expDate.toGMTString();
    }
};

oTree.prototype.getCookie = function(name){
    var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$$)"));
	return arr != null ? unescape(arr[2]) : '';
};

oTree.prototype.delCookie = function(name) {
    var expDate = new Date();
    expDate.setTime(expDate.getTime() - 1);
    var val = this.getCookie(name);
    if (val != null){
		document.cookie = name + "=" + val + ";expires=" + expDate.toGMTString();
	}
};

oTree.prototype._buildCookieName = function(){
	var _ = this;
	var page = location.href.split('?')[0];
	var pos = page.lastIndexOf('/');
	page = page.substr(pos + 1).split('.')[0];
	return _.id + 'TreeCache_' + page;
};

oTree.prototype.expandCache = function(){
	var _ = this;
	var name = _._buildCookieName();
	if(_.config.isCache){
		var value = _.getCookie(name).split(';');
		var arr = value[0].split('|');
		for(var i=0,c=arr.length; i<c; i++){
			_.expand(arr[i]);
		}
		if(value.length >1 && value[1] != -1){
			_.select(value[1], true);
		}
	}
};

oTree.prototype.cacheExpand = function(){
	var _ = this;
	if(_.config.isCache){
		var arr = [];
		for(var i in _.arrNodeData){
			if(_.arrNodeData[i].isExpand){
				arr.push(_.arrNodeData[i].id);
			}
		}
		_.setCookie(_._buildCookieName(), arr.join('|') + ';' + _.selectedId, _.config.expireMinutes);
	}
};