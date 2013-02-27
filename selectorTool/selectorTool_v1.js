if (!window.selectorTool.hasJQuery) {
    jQuery.noConflict();
}
(function(window, document, $, undefined) {
    var getSeletor = function(dCurrent) {
            //First, get full selector whole tagname and classname and id, then use '>' contact each other order by parent to child.
            //Of course, it's not correct.
            var strSelector = (function(node) {
                    var sParentSelector = (node.prop('id') && node.prop('id').indexOf('yui_') !== 0) || node.parent()[0] === document ? '' : arguments.callee(node.parent()),
                        sNodeTagName = node.prop('tagName').toLowerCase(),
                        sNodeId = node.prop('id') && node.prop('id').indexOf('yui_') !== 0 ? '#' + node.prop('id') : '',
                        sNodeClass = node.prop('class') ? (function(s) {
                                var i = 0,
                                    arr = s.split(' ');
                                for (s = '', len = arr.length; i < len; i++) {
                                    arr[i] = arr[i].trim();
                                    if (arr[i] && arr[i].indexOf('selector_tool_') !== 0 && arr[i] !== 'current') {
                                        s += '.' + arr[i];
                                    }
                                }
                                return s;
                            })(node.prop('class')) : '';
                    return sParentSelector + '>'  + sNodeTagName + sNodeId + sNodeClass;
                })(dCurrent).slice(1),
                arrSelector;
            //Second, some node selectors map more than one element, it must be add ':nth-of-type(n)'. 
            if ($(strSelector).length > 1) {
                var arrTemp = strSelector.split('>');
                $(arrTemp).each(function(k, v) {
                    var strTemp = arrTemp.slice(0, k).join('>');
                    strTemp = strTemp ? strTemp += '>' : '';
                    if ($(strTemp + v).length === 1) {
                        return true;
                    }
                    v = v.replace(/[\.:#].*$/, '');
                    arrTemp[k] = v + ':nth-of-type(' + ($(strTemp + v).index(dCurrent.closest(strTemp + v)) + 1) + ')';
                });
                strSelector = arrTemp.join('>');
            }
            //Third, some '>' are not necessary, we can remove them.
            strSelector = (function(str, from) {
                var index = str.indexOf('>', from),
                    strTemp;
                if (index === -1) {
                    return str;
                }
                strTemp = str.slice(0, index) + ' ' + str.slice(index + 1);
                if ($(strTemp).length === 1 && dCurrent.index(strTemp) === 0) {
                    str = strTemp;
                }
                return arguments.callee(str, index + 1);
            })(strSelector, 0);
            //At last, compress selectors.
            arrSelector = strSelector.replace(/(>)/g, ' $1').split(' ');
            $(arrSelector).each(function(k, v) {
                var arrTemp = arrSelector.slice(),
                    suffixB = '',
                    suffixE = '';
                //if this node selector is not necessary, we can remove it.
                if (k > 0) {
                    arrTemp[k] = '';
                    if ($(arrTemp.join(' ')).length === 1 && dCurrent.index(arrTemp.join(' ')) === 0) {
                        arrSelector[k] = arrTemp[k];
                        return true;
                    } else {
                        arrTemp[k] = v;
                    }
                }
                //one node selector maybe has tagname and id and more than one classname,
                //so, we will make it more concise.
                if (v.indexOf('>') === 0) {
                    suffixB = '>';
                    arrTemp[k] = arrTemp[k].slice(1);
                }
                if (v.indexOf(':') > -1) {
                    arrTemp[k] = arrTemp[k].slice(0, arrTemp[k].indexOf(':'));
                    suffixE = v.slice(v.indexOf(':'));
                }
                arrSelector[k] = (function(arr) {
                    if (arr.length > 1) {
                        for (var i = 0; i < arr.length; i++) {
                            var _arrTemp = arr.slice();
                            _arrTemp.splice(i, 1);
                            arrTemp[k] = suffixB + _arrTemp.join('') + suffixE;
                            if ($(arrTemp.join(' ')).length === 1 && dCurrent.index(arrTemp.join(' ')) === 0) {
                                return arguments.callee(_arrTemp);
                            }
                        }
                    }
                    return suffixB + arr.join('') + suffixE;
                })(arrTemp[k].replace(/([#\.])/g, ' $1').trim().split(' '));
            });
            return arrSelector.join(' ').replace(/\s+([\s>])/g, '$1');
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
                <h4>selector tools</h4>\
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
