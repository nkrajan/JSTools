if (!window.selectorTool.hasJQuery) {
    jQuery.noConflict();
}
(function(window, document, $, undefined) {
    //为jQuery对象扩展equals方法
    //功能：遍历判断两个jQuery的对象是否一致
    //.equals(selector) Type: Selector
    //.equals(element) Type: Elements or jQuery
    $.fn.equals = function(elem) {
        if (!elem) {
            return false;
        }
        if (typeof elem === 'string') {
            elem = $(elem);
        }
        var len = this.length;
        if (this.length !== elem.length) {
            return false;
        }
        for (var i = 0; i < len; i++) {
            if (this[i] !== elem[i]) {
                return false;
            }
        }
        return true;
    };
    //配置
    var config = {
        //筛选id、className
            filter: {
                id: function(id) {
                        return id.replace(/(^yui_.*$)/, '');
                    },
                className: function(className) {
                        return className.replace(/(selector_tool_\S+|yom-\S+|yui3-\S+|current|selected)(\s+|$)/g, '$2');
                    }
            }
        },
        //得到当前node的id，经过过滤，如果非空字符串，则返回 ‘#’ + id；否则返回空字符串
        getNodeId = function(node) {
            var nodeId = config.filter.id(node.prop('id'));
            return nodeId ? '#' + nodeId : '';
        },
        //得到当前node的className，经过过滤，拼接所有className，返回 ‘.’ + className1 + ‘.’ + className2 + ... + ‘.’ + classNameN
        getNodeClassName = function(node) {
            return config.filter.className(node.prop('class')).trim().replace(/\s*(\S+)/g, '.$1');
        },
        //返回完整的当前节点的class：tagName + ‘#’ + id + ‘.’ + className1 + ‘.’ + className2 + ... + ‘.’ + classNameN
        getSingleNodeClass = function(node) {
            var tagName = node.prop('tagName').toLowerCase();
            return tagName === 'html' ? '' : tagName + getNodeId(node) + getNodeClassName(node);
        },
        //返回最终的selector数组
        //在这里各种计算，最终留下最合适的selector，看不明白找我吧
        getArrSelector = function(node, arrSelector) {
            var fullSelector,
                fullSelectorTemp,
                dTemp,
                arrTemp,
                singleNodeClass,
                parentNode,
                siblingNodes,
                arrLength;
            //初始化 arrSelector
            if (arrSelector === undefined) {
                arrSelector = [];
            } else if (arrSelector.length > 0) {
                fullSelector = arrSelector.join('');
                //1. 试试用 ‘>’ 和 ‘ ’ 的效果是不是一样的：相同则用 ‘ ’ 取代 ‘>’
                fullSelectorTemp = fullSelector.replace(/>/, ' ');
                dTemp = $(fullSelector);
                if (arrSelector.length > 1 && dTemp.equals(fullSelectorTemp)) {
                    arrSelector[1] = arrSelector[1].replace(/>/, ' ');
                    if (arrSelector.length > 2) {
                        fullSelector = fullSelectorTemp;
                //2. 试试干掉第二个，有没有区别：相同则干掉
                        fullSelectorTemp = fullSelectorTemp.replace(/^([^>\s]+\s)([^>\s]+\s)/, '$1');
                        if (fullSelector !== fullSelectorTemp && dTemp.equals(fullSelectorTemp)) {
                            arrSelector.splice(1, 1);
                        }
                    }
                }
                //3. 试试看排在最前面的选择器，能不能再优化，比如去掉tagName，去掉其中一部分className，甚至去掉id
                fullSelectorTemp = fullSelector.replace(/^([^>\s]*)([>\s])/, '$2');
                arrTemp = arrSelector[0].replace(/([#\.])/g, ' $1').trim().split(' ');
                if (arrTemp.length > 1) {
                    arrSelector[0] = (function(arr) {
                        if (arr.length === 1) {
                            return arr;
                        }
                        for (var i = 0; i < arr.length; i++) {
                            var _arrTemp = arr.slice();
                            _arrTemp.splice(i, 1);
                            if (dTemp.equals(_arrTemp.join('') + fullSelectorTemp)) {
                                return arguments.callee(_arrTemp);
                            }
                        }
                        return arr;
                    })(arrTemp).join('');
                }
                //大功告成
                if (dTemp.equals(dCurrent)) {
                    return arrSelector;
                }
            }
            singleNodeClass = getSingleNodeClass(node);
            //如果是空字符串，那说明已经追溯到 html了，那没必要再找下去了
            if (!singleNodeClass) {
                return arrSelector;
            }
            parentNode = node.parent();
            siblingNodes = parentNode.children(singleNodeClass);
            //4. 有时候，通过tagName、id和class根本没办法准确定位到这个node，只好动用杀手锏 ‘:nth-of-type(n)’，n >= 1
            if (siblingNodes.length > 1) {
                singleNodeClass = singleNodeClass.replace(/^([^\.#]*)([\.#].*)?$/, '$1:nth-of-type(' + (node.index() + 1) + ')');
            }
            arrLength = arrSelector.unshift(singleNodeClass);
            //5. 默认是用 '>' 连接的
            if (arrLength > 1) {
                arrSelector[1] = '>' + arrSelector[1];
            }
            return arguments.callee(parentNode, arrSelector);
        },
        getSeletor = function(dCurrent) {
            return getArrSelector(dCurrent).join('');
        },
        getToolItem = function(selector) {
            var item = [];
            $('#selector_tool_overlay .selector_tool_item_val').each(function() {
                if ($(this).text() === selector) {
                    item.push($(this).closest('li'));
                }
            });
            return item;
        },
        dCurrent;
    $('a, span').each(function() {
        if ($(this).find('a, span').text()) {
            return true;
        }
        $(this).addClass('selector_tool_mark');
    });
    $('body').keydown(function(e) {
        if (!dCurrent || (e.which !== 65 && e.which !== 68)) {
            return;
        }
        var strSelector = getSeletor(dCurrent);
        if (e.which === 65) {
            if (dCurrent.hasClass('selector_tool_mark')) {
                dCurrent.removeClass('selector_tool_mark').addClass('selector_tool_selected');
                if (getToolItem(strSelector).length === 0) {
                    $('#selector_tool_overlay ul').append($('<li>\
                            <span class="selector_tool_item_val">' + strSelector + '</span>\
                            <span class="selector_tool_item_btns">\
                                <a class="btn_item_del" href="#">x</a>\
                            </span>\
                        </li>\
                    ')).scrollTop($('#selector_tool_overlay ul').height());
                    var clip = new ZeroClipboard($('#selector_tool_overlay .selector_tool_item_val:eq(-1)'));
                    clip.on('mouseover', function (client, args) {
                        client.setText($(this).text());
                    });
                    clip.on('complete', function (client, args) {
                        $('#selector_tool_msg span').text('Clip succeed:' + $(this).text()).show().fadeOut(3000);
                    });
                }
            }
        } else {
            if (!dCurrent.hasClass('selector_tool_mark')) {
                dCurrent.removeClass('selector_tool_selected').addClass('selector_tool_mark');
                $(getToolItem(strSelector)).each(function() {
                    $(this).remove();
                });
            }
        }
    }).delegate('#selector_tool_overlay .selector_tool_btns a', 'click', function(e) {
        e.preventDefault();
        switch (this.className) {
            case 'btn_show':
                $('#selector_tool_overlay .btn_show').hide();
                $('#selector_tool_overlay .btn_hide').show();
                $('#selector_tool_overlay ul').show();
                break;
            case 'btn_hide':
                $('#selector_tool_overlay .btn_show').show();
                $('#selector_tool_overlay .btn_hide').hide();
                $('#selector_tool_overlay ul').hide();
                break;
            case 'btn_clear':
                $('#selector_tool_overlay ul').html('');
                $('.selector_tool_selected').removeClass('selector_tool_selected').addClass('selector_tool_mark');
                break;
        }
    }).delegate('.selector_tool_mark, .selector_tool_selected', 'mouseenter', function(e) {
        dCurrent = $(this);
    }).delegate('.selector_tool_mark, .selector_tool_selected', 'mouseleave', function(e) {
        dCurrent = undefined;
    }).delegate('#selector_tool_overlay .selector_tool_item_btns .btn_item_del', 'click', function(e) {
        e.preventDefault();
        $($(this).closest('li').find('.selector_tool_item_val').text()).removeClass('selector_tool_selected').addClass('selector_tool_mark');
        $(this).closest('li').remove();
    }).append($('<div id="selector_tool_overlay">\
                <h4>selector tool</h4>\
                <ul style="max-height:' + ($(window).height() - 80) + 'px"></ul>\
                <p class="ft">\
                    <span class="selector_tool_btns">\
                        <a class="btn_hide" href="#">hide</a>\
                        <a class="btn_show" href="#">show</a>\
                        <a class="btn_clear" href="#">clear</a>\
                    </span>\
                </p>\
            </div>\
            <div id="selector_tool_msg"><span>succeed</span></div>'));
    ZeroClipboard.setDefaults({
      moviePath: window.selectorTool.srcClipboardSwf,
      trustedDomains: '*',
      hoverClass: 'hover',
      activeClass: 'active',
      allowScriptAccess: 'always'
    });
})(window, document, jQuery);