(function(window, document, undefined) {
    var baseUrl = 'http://1950195.github.com/JSTools/selectorTool/',
        importFile = function(type, url) {
            var dFile;
            switch (type.toLowerCase()) {
                case 'js':
                    dFile = document.createElement('script');
                    dFile.setAttribute('type', 'text/javascript');
                    dFile.setAttribute('src', url);
                    break;
                case 'css':
                    dFile = document.createElement('link');
                    dFile.setAttribute('rel', 'stylesheet');
                    dFile.setAttribute('type', 'text/css');
                    dFile.setAttribute('media', 'screen');
                    dFile.setAttribute('href', url);
                    break;
            }
            if (dFile) {
                document.body.appendChild(dFile);
            }
        };

    if (!window.jQuery) {
        importFile('js', '//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js');
    }
    importFile('js', baseUrl + 'ZeroClipboard.min.js?r=' + Math.random());
    importFile('js', baseUrl + 'selectorTool_v1.js?r=' + Math.random());
    importFile('css', baseUrl + 'selectorTool_v1.css?r=' + Math.random());

    window.selectorTools = {};
    window.selectorTools.srcClipboardSwf = baseUrl + 'ZeroClipboard.swf';
})(window, document);
