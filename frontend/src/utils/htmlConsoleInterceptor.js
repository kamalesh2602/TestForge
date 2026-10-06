/**
 * Generates client-side console interception and serialization script
 * to safely capture logs and uncaught runtime errors from the HTML preview iframe.
 */

export function generateInterceptorScript(previewId) {
  return `(function() {
  if (window.__tf_console_installed__) return;
  window.__tf_console_installed__ = true;

  var PREVIEW_ID = ${JSON.stringify(previewId)};
  var MAX_LOGS = 250;
  var logCount = 0;

  function safeSerialize(val, depth, seen) {
    if (depth === undefined) depth = 0;
    if (seen === undefined) seen = [];

    if (val === null) return { type: 'null', text: 'null' };
    if (val === undefined) return { type: 'undefined', text: 'undefined' };
    if (typeof val === 'string') return { type: 'string', text: val };
    if (typeof val === 'number') return { type: 'number', text: String(val) };
    if (typeof val === 'boolean') return { type: 'boolean', text: String(val) };
    if (typeof val === 'bigint') return { type: 'bigint', text: val.toString() + 'n' };
    if (typeof val === 'symbol') return { type: 'symbol', text: val.toString() };
    if (typeof val === 'function') {
      var fnName = val.name ? val.name : '';
      return { type: 'function', text: 'ƒ ' + (fnName ? fnName + '()' : '()') };
    }
    if (val instanceof Error) {
      return {
        type: 'error',
        text: val.stack || ((val.name ? val.name + ': ' : 'Error: ') + val.message)
      };
    }
    if (typeof HTMLElement !== 'undefined' && val instanceof HTMLElement) {
      var id = val.id ? '#' + val.id : '';
      var cls = val.className && typeof val.className === 'string'
        ? '.' + val.className.trim().split(/\\s+/).filter(Boolean).join('.')
        : '';
      return { type: 'element', text: '<' + val.tagName.toLowerCase() + id + cls + '>' };
    }

    if (depth > 2) return { type: 'object', text: '[Object]' };

    for (var i = 0; i < seen.length; i++) {
      if (seen[i] === val) return { type: 'circular', text: '[Circular]' };
    }
    var nextSeen = seen.concat([val]);

    try {
      var seenObjects = [];
      var compact = JSON.stringify(val, function(k, v) {
        if (typeof v === 'object' && v !== null) {
          if (seenObjects.indexOf(v) !== -1) return '[Circular]';
          seenObjects.push(v);
        }
        if (typeof v === 'function') return v.name ? ('ƒ ' + v.name + '()') : 'ƒ ()';
        if (typeof v === 'bigint') return v.toString() + 'n';
        if (typeof v === 'symbol') return v.toString();
        if (v instanceof Error) return (v.name ? v.name + ': ' : '') + v.message;
        if (typeof HTMLElement !== 'undefined' && v instanceof HTMLElement) {
          return '<' + v.tagName.toLowerCase() + '>';
        }
        return v;
      });

      if (compact !== undefined) {
        if (compact.length <= 60) {
          return { type: Array.isArray(val) ? 'array' : 'object', text: compact };
        }
        var formatted = JSON.stringify(JSON.parse(compact), null, 2);
        return { type: Array.isArray(val) ? 'array' : 'object', text: formatted };
      }
    } catch(e) {}

    try {
      return { type: 'object', text: Object.prototype.toString.call(val) };
    } catch(e) {
      return { type: 'unknown', text: String(val) };
    }
  }

  function emit(level, rawArgs) {
    if (logCount >= MAX_LOGS) {
      if (logCount === MAX_LOGS) {
        logCount++;
        try {
          window.parent.postMessage({
            source: 'testforge-html-preview',
            previewId: PREVIEW_ID,
            level: 'warn',
            args: [{ type: 'string', text: 'Console message limit (' + MAX_LOGS + ') reached. Additional logs truncated.' }],
            timestamp: Date.now()
          }, '*');
        } catch(e) {}
      }
      return;
    }
    logCount++;

    var serialized = [];
    for (var i = 0; i < rawArgs.length; i++) {
      serialized.push(safeSerialize(rawArgs[i]));
    }

    try {
      window.parent.postMessage({
        source: 'testforge-html-preview',
        previewId: PREVIEW_ID,
        level: level,
        args: serialized,
        timestamp: Date.now()
      }, '*');
    } catch(e) {}
  }

  var origLog = console.log;
  var origInfo = console.info;
  var origWarn = console.warn;
  var origError = console.error;

  console.log = function() {
    origLog && origLog.apply(console, arguments);
    emit('log', Array.prototype.slice.call(arguments));
  };
  console.info = function() {
    origInfo && origInfo.apply(console, arguments);
    emit('info', Array.prototype.slice.call(arguments));
  };
  console.warn = function() {
    origWarn && origWarn.apply(console, arguments);
    emit('warn', Array.prototype.slice.call(arguments));
  };
  console.error = function() {
    origError && origError.apply(console, arguments);
    emit('error', Array.prototype.slice.call(arguments));
  };

  window.onerror = function(message, source, lineno, colno, error) {
    var errorMsg = message;
    if (!errorMsg && error) {
      errorMsg = (error.name ? error.name + ': ' : '') + (error.message || String(error));
    }
    if (lineno && errorMsg && errorMsg.indexOf('line ') === -1) {
      errorMsg += ' (line ' + lineno + (colno ? ':' + colno : '') + ')';
    }
    emit('error', [errorMsg || 'Unknown error']);
    return false;
  };

  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    var msg = 'Uncaught (in promise) ';
    if (reason instanceof Error) {
      msg += reason.stack || ((reason.name ? reason.name + ': ' : '') + reason.message);
    } else if (typeof reason === 'string') {
      msg += reason;
    } else {
      msg += safeSerialize(reason).text;
    }
    emit('error', [msg]);
  });
})();`;
}

/**
 * Injects the developer console interception script into user-provided HTML code.
 * Injects after <head>, <html>, or <!DOCTYPE>, preserving HTML document validity.
 */
export function buildPreviewHtml(htmlCode, previewId) {
  const code = htmlCode || "";
  const scriptContent = generateInterceptorScript(previewId);
  const scriptTag = `<script id="__testforge_console__">${scriptContent}<\/script>`;

  // 1. Inject immediately after opening <head...>
  const headMatch = /<head\b[^>]*>/i.exec(code);
  if (headMatch) {
    const idx = headMatch.index + headMatch[0].length;
    return code.slice(0, idx) + "\n" + scriptTag + "\n" + code.slice(idx);
  }

  // 2. Inject immediately after opening <html...>
  const htmlMatch = /<html\b[^>]*>/i.exec(code);
  if (htmlMatch) {
    const idx = htmlMatch.index + htmlMatch[0].length;
    return code.slice(0, idx) + "\n" + scriptTag + "\n" + code.slice(idx);
  }

  // 3. Inject immediately after <!DOCTYPE...>
  const doctypeMatch = /<!doctype\b[^>]*>/i.exec(code);
  if (doctypeMatch) {
    const idx = doctypeMatch.index + doctypeMatch[0].length;
    return code.slice(0, idx) + "\n" + scriptTag + "\n" + code.slice(idx);
  }

  // 4. Default: prepend script
  return scriptTag + "\n" + code;
}
