# otree

otree.js

原生JS树形菜单

原生JS写的无限级树形菜单，兼容IE6/7/8/9+、Chrome、Firefox、Opera、Safari等主流浏览器，以及360/搜狗等其他各浏览器。 <br />
可动态添加/删除节点，启用/不启用复选框，启用连线或不连线，支持自定义ICON图标，

可获取当前选中节点参数及父级目录树，

可用作级联下拉树菜单等。 

可获取HTML中li列表自动生成树菜单（可用作网站多级分类目录） 

更多功能参见demo.html和demo1.html

更新记录

1.4 修正部分自定义ICON无法显示的问题

1.5 增加了动态添加节点时父级节点的开关图标，可以实现展开父节点时动态添加子节点

1.6 修改了节点添加方式，由原来的appendChild 改为 批量 innerHTML

1.7 修正了展开/收缩节点的方式，由原来的递归 改为 按需展开或收缩

1.8 增加键盘事件（上、下键切换选择节点），默认不启用键盘事件

1.9 增加了复选框选择时的回调函数（原来必须在复选框参数中传递，现在可以在创建树对象时的总的参数中传递）；<br />
    当节点内容href不为空即为链接式节点中，也增加了回调函数;<br />
    在HTML自动转换树节点的函数中，增加了复选框和回调函数这两个参数<br />

2.0 增加了节点移动（将某个节点移动到指定的节点之前或之后，用于节点的排序功能）<br />
    注：节点移动功能仅限于不显示线条的情况下，显示线条的情况下可能会出现线条错位的情况<br />
    修改了设置右键菜单的返回参数(一共4个参数)

2.1 增加了插入节点功能（在指定的节点前插入节点）

2.2 增加清除DIV初始化信息的功能，修正了collapseAll函数的逻辑错误

2.3 增加了“取消复选框选择联动功能”的参数，修正了引用JS加?参数 导致获取JS名称无效的bug

2.4 修正了复选框 点击选择无效的问题(不启用级联时)，<br />
    修正了动态加载节点时，选中节点状态切换无效的问题<br />
    增加了点击选择Toggle功能（clickCheckedToggle: true[切换选])|false:[始终选中])，<br />
    增加了3个全局参数：clickChecked、clickCheckedToggle、clickToggle，为了简化节点数据参数<br />
    增加了节点名称后缀的参数：postfix，将节点名称相关的子内容数量与后缀 单独用I标签表示

2.5 修正了 当节点父容器隐藏（display:none）时，在IE浏览器无法获取焦点的兼容性问题

2.6 增加了页面级Cookie缓存功能（以防止刷新），默认不启用缓存功能，如需启用，设置第三个参数{isCache:true|false, expireMinutes: 缓存Cookie过期时间,单位：分钟}

2.7 增加 isCacheCallback - 是否启用缓存节点回调<br />
    增加objTree.hasCache，当树加载完成后，可以调用objTree.hasCache 查看当前是否有被缓存的节点（以便实际应用中处理节点是否需要展开）<br />
    修正了“隐藏连线”之后再“显示连线”时，切换图标路径错误的问题<br />
    增加postfix内容样式<br />
    增加了openTo(id)方法：打开节点的所有上级节点<br />
    修改select方法（selected节点的同时调用openTo方法）<br />
    修正getIconRealPath方法中（关于去除目录重复结尾）的Bug<br />
    修改update方法（增加一个参数append:boolean，默认为false，增加此参数的目的是 当更新的节点不存在时，默认不创建新节点）<br />
    增加updateIcon(param, action:空|child)，可以更新指定节点或更新指定的下一级节点的图标<br />
    增加了.focused参数，当展开节点动态加载子节点时，在 expandCallback回调函数中设置 objTree.focused = false; 禁止设置焦点以防止节点显示跳转<br />
    修正了 当节点不存在时，操作节点JS报错的问题<br />
    修正了 节点title的bug，之前的title是加在节点div中（这样显示会有问题），现在修改之后是加在节点文本上

2.8 增加 findNode(field, value, isCallback) 方法，主要用于查找指定的节点，field:查找的字段，code 或 name，查找到相关的节点时，选中(select方法)相关的首个节点, isCallback:true|false，若为true表示选中之后触发回调。
<br />示例：objTree.findNode('name', '节点12', false); objTree.findNode('code', 'node12', false);



