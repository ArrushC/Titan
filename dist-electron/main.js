import jr, { app as Me, dialog as Yh, BrowserWindow as Vh, ipcMain as Ve, session as $t, screen as ig, shell as ag } from "electron";
import $s from "events";
import Mt from "crypto";
import qs from "tty";
import ur from "util";
import fr from "os";
import He from "fs";
import Hr from "stream";
import rt, { fileURLToPath as Xh } from "url";
import Kh from "string_decoder";
import og from "constants";
import Jh from "assert";
import Ae from "path";
import Wn, { exec as zn, fork as sg, execSync as ug } from "child_process";
import Ms from "zlib";
import Qh from "http";
import Yn from "buffer";
import lg from "https";
var Xe = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function cg(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
function fg(t) {
  if (t.__esModule) return t;
  var a = t.default;
  if (typeof a == "function") {
    var c = function o() {
      return this instanceof o ? Reflect.construct(a, arguments, this.constructor) : a.apply(this, arguments);
    };
    c.prototype = a.prototype;
  } else c = {};
  return Object.defineProperty(c, "__esModule", { value: !0 }), Object.keys(t).forEach(function(o) {
    var h = Object.getOwnPropertyDescriptor(t, o);
    Object.defineProperty(c, o, h.get ? h : {
      enumerable: !0,
      get: function() {
        return t[o];
      }
    });
  }), c;
}
var ai = {}, oi = {}, $r = {}, bu;
function ks() {
  if (bu) return $r;
  bu = 1, Object.defineProperty($r, "__esModule", { value: !0 }), $r.CancellationError = $r.CancellationToken = void 0;
  const t = $s;
  let a = class extends t.EventEmitter {
    get cancelled() {
      return this._cancelled || this._parent != null && this._parent.cancelled;
    }
    set parent(h) {
      this.removeParentCancelHandler(), this._parent = h, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
    }
    // babel cannot compile ... correctly for super calls
    constructor(h) {
      super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, h != null && (this.parent = h);
    }
    cancel() {
      this._cancelled = !0, this.emit("cancel");
    }
    onCancel(h) {
      this.cancelled ? h() : this.once("cancel", h);
    }
    createPromise(h) {
      if (this.cancelled)
        return Promise.reject(new c());
      const s = () => {
        if (i != null)
          try {
            this.removeListener("cancel", i), i = null;
          } catch {
          }
      };
      let i = null;
      return new Promise((d, e) => {
        let n = null;
        if (i = () => {
          try {
            n != null && (n(), n = null);
          } finally {
            e(new c());
          }
        }, this.cancelled) {
          i();
          return;
        }
        this.onCancel(i), h(d, e, (l) => {
          n = l;
        });
      }).then((d) => (s(), d)).catch((d) => {
        throw s(), d;
      });
    }
    removeParentCancelHandler() {
      const h = this._parent;
      h != null && this.parentCancelHandler != null && (h.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
    }
    dispose() {
      try {
        this.removeParentCancelHandler();
      } finally {
        this.removeAllListeners(), this._parent = null;
      }
    }
  };
  $r.CancellationToken = a;
  class c extends Error {
    constructor() {
      super("cancelled");
    }
  }
  return $r.CancellationError = c, $r;
}
var ze = {}, Qt = { exports: {} }, Zt = { exports: {} }, si, Su;
function Zh() {
  if (Su) return si;
  Su = 1;
  var t = 1e3, a = t * 60, c = a * 60, o = c * 24, h = o * 7, s = o * 365.25;
  si = function(l, u) {
    u = u || {};
    var r = typeof l;
    if (r === "string" && l.length > 0)
      return i(l);
    if (r === "number" && isFinite(l))
      return u.long ? e(l) : d(l);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(l)
    );
  };
  function i(l) {
    if (l = String(l), !(l.length > 100)) {
      var u = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        l
      );
      if (u) {
        var r = parseFloat(u[1]), f = (u[2] || "ms").toLowerCase();
        switch (f) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return r * s;
          case "weeks":
          case "week":
          case "w":
            return r * h;
          case "days":
          case "day":
          case "d":
            return r * o;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return r * c;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return r * a;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return r * t;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return r;
          default:
            return;
        }
      }
    }
  }
  function d(l) {
    var u = Math.abs(l);
    return u >= o ? Math.round(l / o) + "d" : u >= c ? Math.round(l / c) + "h" : u >= a ? Math.round(l / a) + "m" : u >= t ? Math.round(l / t) + "s" : l + "ms";
  }
  function e(l) {
    var u = Math.abs(l);
    return u >= o ? n(l, u, o, "day") : u >= c ? n(l, u, c, "hour") : u >= a ? n(l, u, a, "minute") : u >= t ? n(l, u, t, "second") : l + " ms";
  }
  function n(l, u, r, f) {
    var p = u >= r * 1.5;
    return Math.round(l / r) + " " + f + (p ? "s" : "");
  }
  return si;
}
var ui, Ru;
function ep() {
  if (Ru) return ui;
  Ru = 1;
  function t(a) {
    o.debug = o, o.default = o, o.coerce = n, o.disable = i, o.enable = s, o.enabled = d, o.humanize = Zh(), o.destroy = l, Object.keys(a).forEach((u) => {
      o[u] = a[u];
    }), o.names = [], o.skips = [], o.formatters = {};
    function c(u) {
      let r = 0;
      for (let f = 0; f < u.length; f++)
        r = (r << 5) - r + u.charCodeAt(f), r |= 0;
      return o.colors[Math.abs(r) % o.colors.length];
    }
    o.selectColor = c;
    function o(u) {
      let r, f = null, p, v;
      function m(...g) {
        if (!m.enabled)
          return;
        const w = m, S = Number(/* @__PURE__ */ new Date()), O = S - (r || S);
        w.diff = O, w.prev = r, w.curr = S, r = S, g[0] = o.coerce(g[0]), typeof g[0] != "string" && g.unshift("%O");
        let I = 0;
        g[0] = g[0].replace(/%([a-zA-Z%])/g, (R, A) => {
          if (R === "%%")
            return "%";
          I++;
          const b = o.formatters[A];
          if (typeof b == "function") {
            const G = g[I];
            R = b.call(w, G), g.splice(I, 1), I--;
          }
          return R;
        }), o.formatArgs.call(w, g), (w.log || o.log).apply(w, g);
      }
      return m.namespace = u, m.useColors = o.useColors(), m.color = o.selectColor(u), m.extend = h, m.destroy = o.destroy, Object.defineProperty(m, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (p !== o.namespaces && (p = o.namespaces, v = o.enabled(u)), v),
        set: (g) => {
          f = g;
        }
      }), typeof o.init == "function" && o.init(m), m;
    }
    function h(u, r) {
      const f = o(this.namespace + (typeof r > "u" ? ":" : r) + u);
      return f.log = this.log, f;
    }
    function s(u) {
      o.save(u), o.namespaces = u, o.names = [], o.skips = [];
      let r;
      const f = (typeof u == "string" ? u : "").split(/[\s,]+/), p = f.length;
      for (r = 0; r < p; r++)
        f[r] && (u = f[r].replace(/\*/g, ".*?"), u[0] === "-" ? o.skips.push(new RegExp("^" + u.slice(1) + "$")) : o.names.push(new RegExp("^" + u + "$")));
    }
    function i() {
      const u = [
        ...o.names.map(e),
        ...o.skips.map(e).map((r) => "-" + r)
      ].join(",");
      return o.enable(""), u;
    }
    function d(u) {
      if (u[u.length - 1] === "*")
        return !0;
      let r, f;
      for (r = 0, f = o.skips.length; r < f; r++)
        if (o.skips[r].test(u))
          return !1;
      for (r = 0, f = o.names.length; r < f; r++)
        if (o.names[r].test(u))
          return !0;
      return !1;
    }
    function e(u) {
      return u.toString().substring(2, u.toString().length - 2).replace(/\.\*\?$/, "*");
    }
    function n(u) {
      return u instanceof Error ? u.stack || u.message : u;
    }
    function l() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return o.enable(o.load()), o;
  }
  return ui = t, ui;
}
var Tu;
function dg() {
  return Tu || (Tu = 1, function(t, a) {
    a.formatArgs = o, a.save = h, a.load = s, a.useColors = c, a.storage = i(), a.destroy = /* @__PURE__ */ (() => {
      let e = !1;
      return () => {
        e || (e = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), a.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function c() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let e;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (e = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(e[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function o(e) {
      if (e[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + e[0] + (this.useColors ? "%c " : " ") + "+" + t.exports.humanize(this.diff), !this.useColors)
        return;
      const n = "color: " + this.color;
      e.splice(1, 0, n, "color: inherit");
      let l = 0, u = 0;
      e[0].replace(/%[a-zA-Z%]/g, (r) => {
        r !== "%%" && (l++, r === "%c" && (u = l));
      }), e.splice(u, 0, n);
    }
    a.log = console.debug || console.log || (() => {
    });
    function h(e) {
      try {
        e ? a.storage.setItem("debug", e) : a.storage.removeItem("debug");
      } catch {
      }
    }
    function s() {
      let e;
      try {
        e = a.storage.getItem("debug");
      } catch {
      }
      return !e && typeof process < "u" && "env" in process && (e = process.env.DEBUG), e;
    }
    function i() {
      try {
        return localStorage;
      } catch {
      }
    }
    t.exports = ep()(a);
    const { formatters: d } = t.exports;
    d.j = function(e) {
      try {
        return JSON.stringify(e);
      } catch (n) {
        return "[UnexpectedJSONParseError]: " + n.message;
      }
    };
  }(Zt, Zt.exports)), Zt.exports;
}
var en = { exports: {} }, li, Au;
function hg() {
  return Au || (Au = 1, li = (t, a = process.argv) => {
    const c = t.startsWith("-") ? "" : t.length === 1 ? "-" : "--", o = a.indexOf(c + t), h = a.indexOf("--");
    return o !== -1 && (h === -1 || o < h);
  }), li;
}
var ci, Ou;
function pg() {
  if (Ou) return ci;
  Ou = 1;
  const t = fr, a = qs, c = hg(), { env: o } = process;
  let h;
  c("no-color") || c("no-colors") || c("color=false") || c("color=never") ? h = 0 : (c("color") || c("colors") || c("color=true") || c("color=always")) && (h = 1);
  function s() {
    if ("FORCE_COLOR" in o)
      return o.FORCE_COLOR === "true" ? 1 : o.FORCE_COLOR === "false" ? 0 : o.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(o.FORCE_COLOR, 10), 3);
  }
  function i(n) {
    return n === 0 ? !1 : {
      level: n,
      hasBasic: !0,
      has256: n >= 2,
      has16m: n >= 3
    };
  }
  function d(n, { streamIsTTY: l, sniffFlags: u = !0 } = {}) {
    const r = s();
    r !== void 0 && (h = r);
    const f = u ? h : r;
    if (f === 0)
      return 0;
    if (u) {
      if (c("color=16m") || c("color=full") || c("color=truecolor"))
        return 3;
      if (c("color=256"))
        return 2;
    }
    if (n && !l && f === void 0)
      return 0;
    const p = f || 0;
    if (o.TERM === "dumb")
      return p;
    if (process.platform === "win32") {
      const v = t.release().split(".");
      return Number(v[0]) >= 10 && Number(v[2]) >= 10586 ? Number(v[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in o)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE", "DRONE"].some((v) => v in o) || o.CI_NAME === "codeship" ? 1 : p;
    if ("TEAMCITY_VERSION" in o)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(o.TEAMCITY_VERSION) ? 1 : 0;
    if (o.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in o) {
      const v = Number.parseInt((o.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (o.TERM_PROGRAM) {
        case "iTerm.app":
          return v >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(o.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(o.TERM) || "COLORTERM" in o ? 1 : p;
  }
  function e(n, l = {}) {
    const u = d(n, {
      streamIsTTY: n && n.isTTY,
      ...l
    });
    return i(u);
  }
  return ci = {
    supportsColor: e,
    stdout: e({ isTTY: a.isatty(1) }),
    stderr: e({ isTTY: a.isatty(2) })
  }, ci;
}
var Cu;
function mg() {
  return Cu || (Cu = 1, function(t, a) {
    const c = qs, o = ur;
    a.init = l, a.log = d, a.formatArgs = s, a.save = e, a.load = n, a.useColors = h, a.destroy = o.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), a.colors = [6, 2, 3, 4, 5, 1];
    try {
      const r = pg();
      r && (r.stderr || r).level >= 2 && (a.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    a.inspectOpts = Object.keys(process.env).filter((r) => /^debug_/i.test(r)).reduce((r, f) => {
      const p = f.substring(6).toLowerCase().replace(/_([a-z])/g, (m, g) => g.toUpperCase());
      let v = process.env[f];
      return /^(yes|on|true|enabled)$/i.test(v) ? v = !0 : /^(no|off|false|disabled)$/i.test(v) ? v = !1 : v === "null" ? v = null : v = Number(v), r[p] = v, r;
    }, {});
    function h() {
      return "colors" in a.inspectOpts ? !!a.inspectOpts.colors : c.isatty(process.stderr.fd);
    }
    function s(r) {
      const { namespace: f, useColors: p } = this;
      if (p) {
        const v = this.color, m = "\x1B[3" + (v < 8 ? v : "8;5;" + v), g = `  ${m};1m${f} \x1B[0m`;
        r[0] = g + r[0].split(`
`).join(`
` + g), r.push(m + "m+" + t.exports.humanize(this.diff) + "\x1B[0m");
      } else
        r[0] = i() + f + " " + r[0];
    }
    function i() {
      return a.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function d(...r) {
      return process.stderr.write(o.formatWithOptions(a.inspectOpts, ...r) + `
`);
    }
    function e(r) {
      r ? process.env.DEBUG = r : delete process.env.DEBUG;
    }
    function n() {
      return process.env.DEBUG;
    }
    function l(r) {
      r.inspectOpts = {};
      const f = Object.keys(a.inspectOpts);
      for (let p = 0; p < f.length; p++)
        r.inspectOpts[f[p]] = a.inspectOpts[f[p]];
    }
    t.exports = ep()(a);
    const { formatters: u } = t.exports;
    u.o = function(r) {
      return this.inspectOpts.colors = this.useColors, o.inspect(r, this.inspectOpts).split(`
`).map((f) => f.trim()).join(" ");
    }, u.O = function(r) {
      return this.inspectOpts.colors = this.useColors, o.inspect(r, this.inspectOpts);
    };
  }(en, en.exports)), en.exports;
}
var xu;
function gg() {
  return xu || (xu = 1, typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? Qt.exports = dg() : Qt.exports = mg()), Qt.exports;
}
var rn = {}, Pu;
function Vn() {
  if (Pu) return rn;
  Pu = 1, Object.defineProperty(rn, "__esModule", { value: !0 }), rn.newError = t;
  function t(a, c) {
    const o = new Error(a);
    return o.code = c, o;
  }
  return rn;
}
var ct = {}, Du;
function rp() {
  if (Du) return ct;
  Du = 1, Object.defineProperty(ct, "__esModule", { value: !0 }), ct.ProgressCallbackTransform = void 0;
  const t = Hr;
  let a = class extends t.Transform {
    constructor(o, h, s) {
      super(), this.total = o, this.cancellationToken = h, this.onProgress = s, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
    }
    _transform(o, h, s) {
      if (this.cancellationToken.cancelled) {
        s(new Error("cancelled"), null);
        return;
      }
      this.transferred += o.length, this.delta += o.length;
      const i = Date.now();
      i >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = i + 1e3, this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.total * 100,
        bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
      }), this.delta = 0), s(null, o);
    }
    _flush(o) {
      if (this.cancellationToken.cancelled) {
        o(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.total,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, o(null);
    }
  };
  return ct.ProgressCallbackTransform = a, ct;
}
var Iu;
function vg() {
  if (Iu) return ze;
  Iu = 1, Object.defineProperty(ze, "__esModule", { value: !0 }), ze.DigestTransform = ze.HttpExecutor = ze.HttpError = void 0, ze.createHttpError = n, ze.parseJson = r, ze.configureRequestOptionsFromUrl = p, ze.configureRequestUrl = v, ze.safeGetHeader = w, ze.configureRequestOptions = O, ze.safeStringifyJson = I;
  const t = Mt, a = gg(), c = He, o = Hr, h = rt, s = ks(), i = Vn(), d = rp(), e = (0, a.default)("electron-builder");
  function n(T, R = null) {
    return new u(T.statusCode || -1, `${T.statusCode} ${T.statusMessage}` + (R == null ? "" : `
` + JSON.stringify(R, null, "  ")) + `
Headers: ` + I(T.headers), R);
  }
  const l = /* @__PURE__ */ new Map([
    [429, "Too many requests"],
    [400, "Bad request"],
    [403, "Forbidden"],
    [404, "Not found"],
    [405, "Method not allowed"],
    [406, "Not acceptable"],
    [408, "Request timeout"],
    [413, "Request entity too large"],
    [500, "Internal server error"],
    [502, "Bad gateway"],
    [503, "Service unavailable"],
    [504, "Gateway timeout"],
    [505, "HTTP version not supported"]
  ]);
  class u extends Error {
    constructor(R, A = `HTTP error: ${l.get(R) || R}`, b = null) {
      super(A), this.statusCode = R, this.description = b, this.name = "HttpError", this.code = `HTTP_ERROR_${R}`;
    }
    isServerError() {
      return this.statusCode >= 500 && this.statusCode <= 599;
    }
  }
  ze.HttpError = u;
  function r(T) {
    return T.then((R) => R == null || R.length === 0 ? null : JSON.parse(R));
  }
  class f {
    constructor() {
      this.maxRedirects = 10;
    }
    request(R, A = new s.CancellationToken(), b) {
      O(R);
      const G = b == null ? void 0 : JSON.stringify(b), j = G ? Buffer.from(G) : void 0;
      if (j != null) {
        e(G);
        const { headers: U, ...H } = R;
        R = {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": j.length,
            ...U
          },
          ...H
        };
      }
      return this.doApiRequest(R, A, (U) => U.end(j));
    }
    doApiRequest(R, A, b, G = 0) {
      return e.enabled && e(`Request: ${I(R)}`), A.createPromise((j, U, H) => {
        const M = this.createRequest(R, (F) => {
          try {
            this.handleResponse(F, R, A, j, U, G, b);
          } catch (D) {
            U(D);
          }
        });
        this.addErrorAndTimeoutHandlers(M, U, R.timeout), this.addRedirectHandlers(M, R, U, G, (F) => {
          this.doApiRequest(F, A, b, G).then(j).catch(U);
        }), b(M, U), H(() => M.abort());
      });
    }
    // noinspection JSUnusedLocalSymbols
    // eslint-disable-next-line
    addRedirectHandlers(R, A, b, G, j) {
    }
    addErrorAndTimeoutHandlers(R, A, b = 60 * 1e3) {
      this.addTimeOutHandler(R, A, b), R.on("error", A), R.on("aborted", () => {
        A(new Error("Request has been aborted by the server"));
      });
    }
    handleResponse(R, A, b, G, j, U, H) {
      var M;
      if (e.enabled && e(`Response: ${R.statusCode} ${R.statusMessage}, request options: ${I(A)}`), R.statusCode === 404) {
        j(n(R, `method: ${A.method || "GET"} url: ${A.protocol || "https:"}//${A.hostname}${A.port ? `:${A.port}` : ""}${A.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
        return;
      } else if (R.statusCode === 204) {
        G();
        return;
      }
      const F = (M = R.statusCode) !== null && M !== void 0 ? M : 0, D = F >= 300 && F < 400, $ = w(R, "location");
      if (D && $ != null) {
        if (U > this.maxRedirects) {
          j(this.createMaxRedirectError());
          return;
        }
        this.doApiRequest(f.prepareRedirectUrlOptions($, A), b, H, U).then(G).catch(j);
        return;
      }
      R.setEncoding("utf8");
      let V = "";
      R.on("error", j), R.on("data", (W) => V += W), R.on("end", () => {
        try {
          if (R.statusCode != null && R.statusCode >= 400) {
            const W = w(R, "content-type"), re = W != null && (Array.isArray(W) ? W.find((ee) => ee.includes("json")) != null : W.includes("json"));
            j(n(R, `method: ${A.method || "GET"} url: ${A.protocol || "https:"}//${A.hostname}${A.port ? `:${A.port}` : ""}${A.path}

          Data:
          ${re ? JSON.stringify(JSON.parse(V)) : V}
          `));
          } else
            G(V.length === 0 ? null : V);
        } catch (W) {
          j(W);
        }
      });
    }
    async downloadToBuffer(R, A) {
      return await A.cancellationToken.createPromise((b, G, j) => {
        const U = [], H = {
          headers: A.headers || void 0,
          // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
          redirect: "manual"
        };
        v(R, H), O(H), this.doDownload(H, {
          destination: null,
          options: A,
          onCancel: j,
          callback: (M) => {
            M == null ? b(Buffer.concat(U)) : G(M);
          },
          responseHandler: (M, F) => {
            let D = 0;
            M.on("data", ($) => {
              if (D += $.length, D > 524288e3) {
                F(new Error("Maximum allowed size is 500 MB"));
                return;
              }
              U.push($);
            }), M.on("end", () => {
              F(null);
            });
          }
        }, 0);
      });
    }
    doDownload(R, A, b) {
      const G = this.createRequest(R, (j) => {
        if (j.statusCode >= 400) {
          A.callback(new Error(`Cannot download "${R.protocol || "https:"}//${R.hostname}${R.path}", status ${j.statusCode}: ${j.statusMessage}`));
          return;
        }
        j.on("error", A.callback);
        const U = w(j, "location");
        if (U != null) {
          b < this.maxRedirects ? this.doDownload(f.prepareRedirectUrlOptions(U, R), A, b++) : A.callback(this.createMaxRedirectError());
          return;
        }
        A.responseHandler == null ? S(A, j) : A.responseHandler(j, A.callback);
      });
      this.addErrorAndTimeoutHandlers(G, A.callback, R.timeout), this.addRedirectHandlers(G, R, A.callback, b, (j) => {
        this.doDownload(j, A, b++);
      }), G.end();
    }
    createMaxRedirectError() {
      return new Error(`Too many redirects (> ${this.maxRedirects})`);
    }
    addTimeOutHandler(R, A, b) {
      R.on("socket", (G) => {
        G.setTimeout(b, () => {
          R.abort(), A(new Error("Request timed out"));
        });
      });
    }
    static prepareRedirectUrlOptions(R, A) {
      const b = p(R, { ...A }), G = b.headers;
      if (G != null && G.authorization) {
        const j = new h.URL(R);
        (j.hostname.endsWith(".amazonaws.com") || j.searchParams.has("X-Amz-Credential")) && delete G.authorization;
      }
      return b;
    }
    static retryOnServerError(R, A = 3) {
      for (let b = 0; ; b++)
        try {
          return R();
        } catch (G) {
          if (b < A && (G instanceof u && G.isServerError() || G.code === "EPIPE"))
            continue;
          throw G;
        }
    }
  }
  ze.HttpExecutor = f;
  function p(T, R) {
    const A = O(R);
    return v(new h.URL(T), A), A;
  }
  function v(T, R) {
    R.protocol = T.protocol, R.hostname = T.hostname, T.port ? R.port = T.port : R.port && delete R.port, R.path = T.pathname + T.search;
  }
  class m extends o.Transform {
    // noinspection JSUnusedGlobalSymbols
    get actual() {
      return this._actual;
    }
    constructor(R, A = "sha512", b = "base64") {
      super(), this.expected = R, this.algorithm = A, this.encoding = b, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, t.createHash)(A);
    }
    // noinspection JSUnusedGlobalSymbols
    _transform(R, A, b) {
      this.digester.update(R), b(null, R);
    }
    // noinspection JSUnusedGlobalSymbols
    _flush(R) {
      if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
        try {
          this.validate();
        } catch (A) {
          R(A);
          return;
        }
      R(null);
    }
    validate() {
      if (this._actual == null)
        throw (0, i.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
      if (this._actual !== this.expected)
        throw (0, i.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
      return null;
    }
  }
  ze.DigestTransform = m;
  function g(T, R, A) {
    return T != null && R != null && T !== R ? (A(new Error(`checksum mismatch: expected ${R} but got ${T} (X-Checksum-Sha2 header)`)), !1) : !0;
  }
  function w(T, R) {
    const A = T.headers[R];
    return A == null ? null : Array.isArray(A) ? A.length === 0 ? null : A[A.length - 1] : A;
  }
  function S(T, R) {
    if (!g(w(R, "X-Checksum-Sha2"), T.options.sha2, T.callback))
      return;
    const A = [];
    if (T.options.onProgress != null) {
      const U = w(R, "content-length");
      U != null && A.push(new d.ProgressCallbackTransform(parseInt(U, 10), T.options.cancellationToken, T.options.onProgress));
    }
    const b = T.options.sha512;
    b != null ? A.push(new m(b, "sha512", b.length === 128 && !b.includes("+") && !b.includes("Z") && !b.includes("=") ? "hex" : "base64")) : T.options.sha2 != null && A.push(new m(T.options.sha2, "sha256", "hex"));
    const G = (0, c.createWriteStream)(T.destination);
    A.push(G);
    let j = R;
    for (const U of A)
      U.on("error", (H) => {
        G.close(), T.options.cancellationToken.cancelled || T.callback(H);
      }), j = j.pipe(U);
    G.on("finish", () => {
      G.close(T.callback);
    });
  }
  function O(T, R, A) {
    A != null && (T.method = A), T.headers = { ...T.headers };
    const b = T.headers;
    return R != null && (b.authorization = R.startsWith("Basic") || R.startsWith("Bearer") ? R : `token ${R}`), b["User-Agent"] == null && (b["User-Agent"] = "electron-builder"), (A == null || A === "GET" || b["Cache-Control"] == null) && (b["Cache-Control"] = "no-cache"), T.protocol == null && process.versions.electron != null && (T.protocol = "https:"), T;
  }
  function I(T, R) {
    return JSON.stringify(T, (A, b) => A.endsWith("Authorization") || A.endsWith("authorization") || A.endsWith("Password") || A.endsWith("PASSWORD") || A.endsWith("Token") || A.includes("password") || A.includes("token") || R != null && R.has(A) ? "<stripped sensitive data>" : b, 2);
  }
  return ze;
}
var ft = {}, Nu;
function yg() {
  if (Nu) return ft;
  Nu = 1, Object.defineProperty(ft, "__esModule", { value: !0 }), ft.githubUrl = t, ft.getS3LikeProviderBaseUrl = a;
  function t(s, i = "github.com") {
    return `${s.protocol || "https"}://${s.host || i}`;
  }
  function a(s) {
    const i = s.provider;
    if (i === "s3")
      return c(s);
    if (i === "spaces")
      return h(s);
    throw new Error(`Not supported provider: ${i}`);
  }
  function c(s) {
    let i;
    if (s.accelerate == !0)
      i = `https://${s.bucket}.s3-accelerate.amazonaws.com`;
    else if (s.endpoint != null)
      i = `${s.endpoint}/${s.bucket}`;
    else if (s.bucket.includes(".")) {
      if (s.region == null)
        throw new Error(`Bucket name "${s.bucket}" includes a dot, but S3 region is missing`);
      s.region === "us-east-1" ? i = `https://s3.amazonaws.com/${s.bucket}` : i = `https://s3-${s.region}.amazonaws.com/${s.bucket}`;
    } else s.region === "cn-north-1" ? i = `https://${s.bucket}.s3.${s.region}.amazonaws.com.cn` : i = `https://${s.bucket}.s3.amazonaws.com`;
    return o(i, s.path);
  }
  function o(s, i) {
    return i != null && i.length > 0 && (i.startsWith("/") || (s += "/"), s += i), s;
  }
  function h(s) {
    if (s.name == null)
      throw new Error("name is missing");
    if (s.region == null)
      throw new Error("region is missing");
    return o(`https://${s.name}.${s.region}.digitaloceanspaces.com`, s.path);
  }
  return ft;
}
var tn = {}, Lu;
function wg() {
  if (Lu) return tn;
  Lu = 1, Object.defineProperty(tn, "__esModule", { value: !0 }), tn.parseDn = t;
  function t(a) {
    let c = !1, o = null, h = "", s = 0;
    a = a.trim();
    const i = /* @__PURE__ */ new Map();
    for (let d = 0; d <= a.length; d++) {
      if (d === a.length) {
        o !== null && i.set(o, h);
        break;
      }
      const e = a[d];
      if (c) {
        if (e === '"') {
          c = !1;
          continue;
        }
      } else {
        if (e === '"') {
          c = !0;
          continue;
        }
        if (e === "\\") {
          d++;
          const n = parseInt(a.slice(d, d + 2), 16);
          Number.isNaN(n) ? h += a[d] : (d++, h += String.fromCharCode(n));
          continue;
        }
        if (o === null && e === "=") {
          o = h, h = "";
          continue;
        }
        if (e === "," || e === ";" || e === "+") {
          o !== null && i.set(o, h), o = null, h = "";
          continue;
        }
      }
      if (e === " " && !c) {
        if (h.length === 0)
          continue;
        if (d > s) {
          let n = d;
          for (; a[n] === " "; )
            n++;
          s = n;
        }
        if (s >= a.length || a[s] === "," || a[s] === ";" || o === null && a[s] === "=" || o !== null && a[s] === "+") {
          d = s - 1;
          continue;
        }
      }
      h += e;
    }
    return i;
  }
  return tn;
}
var qr = {}, Fu;
function Eg() {
  if (Fu) return qr;
  Fu = 1, Object.defineProperty(qr, "__esModule", { value: !0 }), qr.nil = qr.UUID = void 0;
  const t = Mt, a = Vn(), c = "options.name must be either a string or a Buffer", o = (0, t.randomBytes)(16);
  o[0] = o[0] | 1;
  const h = {}, s = [];
  for (let u = 0; u < 256; u++) {
    const r = (u + 256).toString(16).substr(1);
    h[r] = u, s[u] = r;
  }
  class i {
    constructor(r) {
      this.ascii = null, this.binary = null;
      const f = i.check(r);
      if (!f)
        throw new Error("not a UUID");
      this.version = f.version, f.format === "ascii" ? this.ascii = r : this.binary = r;
    }
    static v5(r, f) {
      return n(r, "sha1", 80, f);
    }
    toString() {
      return this.ascii == null && (this.ascii = l(this.binary)), this.ascii;
    }
    inspect() {
      return `UUID v${this.version} ${this.toString()}`;
    }
    static check(r, f = 0) {
      if (typeof r == "string")
        return r = r.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(r) ? r === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
          version: (h[r[14] + r[15]] & 240) >> 4,
          variant: d((h[r[19] + r[20]] & 224) >> 5),
          format: "ascii"
        } : !1;
      if (Buffer.isBuffer(r)) {
        if (r.length < f + 16)
          return !1;
        let p = 0;
        for (; p < 16 && r[f + p] === 0; p++)
          ;
        return p === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
          version: (r[f + 6] & 240) >> 4,
          variant: d((r[f + 8] & 224) >> 5),
          format: "binary"
        };
      }
      throw (0, a.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
    }
    // read stringified uuid into a Buffer
    static parse(r) {
      const f = Buffer.allocUnsafe(16);
      let p = 0;
      for (let v = 0; v < 16; v++)
        f[v] = h[r[p++] + r[p++]], (v === 3 || v === 5 || v === 7 || v === 9) && (p += 1);
      return f;
    }
  }
  qr.UUID = i, i.OID = i.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
  function d(u) {
    switch (u) {
      case 0:
      case 1:
      case 3:
        return "ncs";
      case 4:
      case 5:
        return "rfc4122";
      case 6:
        return "microsoft";
      default:
        return "future";
    }
  }
  var e;
  (function(u) {
    u[u.ASCII = 0] = "ASCII", u[u.BINARY = 1] = "BINARY", u[u.OBJECT = 2] = "OBJECT";
  })(e || (e = {}));
  function n(u, r, f, p, v = e.ASCII) {
    const m = (0, t.createHash)(r);
    if (typeof u != "string" && !Buffer.isBuffer(u))
      throw (0, a.newError)(c, "ERR_INVALID_UUID_NAME");
    m.update(p), m.update(u);
    const w = m.digest();
    let S;
    switch (v) {
      case e.BINARY:
        w[6] = w[6] & 15 | f, w[8] = w[8] & 63 | 128, S = w;
        break;
      case e.OBJECT:
        w[6] = w[6] & 15 | f, w[8] = w[8] & 63 | 128, S = new i(w);
        break;
      default:
        S = s[w[0]] + s[w[1]] + s[w[2]] + s[w[3]] + "-" + s[w[4]] + s[w[5]] + "-" + s[w[6] & 15 | f] + s[w[7]] + "-" + s[w[8] & 63 | 128] + s[w[9]] + "-" + s[w[10]] + s[w[11]] + s[w[12]] + s[w[13]] + s[w[14]] + s[w[15]];
        break;
    }
    return S;
  }
  function l(u) {
    return s[u[0]] + s[u[1]] + s[u[2]] + s[u[3]] + "-" + s[u[4]] + s[u[5]] + "-" + s[u[6]] + s[u[7]] + "-" + s[u[8]] + s[u[9]] + "-" + s[u[10]] + s[u[11]] + s[u[12]] + s[u[13]] + s[u[14]] + s[u[15]];
  }
  return qr.nil = new i("00000000-0000-0000-0000-000000000000"), qr;
}
var Xr = {}, fi = {}, $u;
function _g() {
  return $u || ($u = 1, function(t) {
    (function(a) {
      a.parser = function(E, _) {
        return new o(E, _);
      }, a.SAXParser = o, a.SAXStream = l, a.createStream = n, a.MAX_BUFFER_LENGTH = 64 * 1024;
      var c = [
        "comment",
        "sgmlDecl",
        "textNode",
        "tagName",
        "doctype",
        "procInstName",
        "procInstBody",
        "entity",
        "attribName",
        "attribValue",
        "cdata",
        "script"
      ];
      a.EVENTS = [
        "text",
        "processinginstruction",
        "sgmldeclaration",
        "doctype",
        "comment",
        "opentagstart",
        "attribute",
        "opentag",
        "closetag",
        "opencdata",
        "cdata",
        "closecdata",
        "error",
        "end",
        "ready",
        "script",
        "opennamespace",
        "closenamespace"
      ];
      function o(E, _) {
        if (!(this instanceof o))
          return new o(E, _);
        var k = this;
        s(k), k.q = k.c = "", k.bufferCheckPosition = a.MAX_BUFFER_LENGTH, k.opt = _ || {}, k.opt.lowercase = k.opt.lowercase || k.opt.lowercasetags, k.looseCase = k.opt.lowercase ? "toLowerCase" : "toUpperCase", k.tags = [], k.closed = k.closedRoot = k.sawRoot = !1, k.tag = k.error = null, k.strict = !!E, k.noscript = !!(E || k.opt.noscript), k.state = b.BEGIN, k.strictEntities = k.opt.strictEntities, k.ENTITIES = k.strictEntities ? Object.create(a.XML_ENTITIES) : Object.create(a.ENTITIES), k.attribList = [], k.opt.xmlns && (k.ns = Object.create(v)), k.opt.unquotedAttributeValues === void 0 && (k.opt.unquotedAttributeValues = !E), k.trackPosition = k.opt.position !== !1, k.trackPosition && (k.position = k.line = k.column = 0), j(k, "onready");
      }
      Object.create || (Object.create = function(E) {
        function _() {
        }
        _.prototype = E;
        var k = new _();
        return k;
      }), Object.keys || (Object.keys = function(E) {
        var _ = [];
        for (var k in E) E.hasOwnProperty(k) && _.push(k);
        return _;
      });
      function h(E) {
        for (var _ = Math.max(a.MAX_BUFFER_LENGTH, 10), k = 0, L = 0, x = c.length; L < x; L++) {
          var P = E[c[L]].length;
          if (P > _)
            switch (c[L]) {
              case "textNode":
                H(E);
                break;
              case "cdata":
                U(E, "oncdata", E.cdata), E.cdata = "";
                break;
              case "script":
                U(E, "onscript", E.script), E.script = "";
                break;
              default:
                F(E, "Max buffer length exceeded: " + c[L]);
            }
          k = Math.max(k, P);
        }
        var z = a.MAX_BUFFER_LENGTH - k;
        E.bufferCheckPosition = z + E.position;
      }
      function s(E) {
        for (var _ = 0, k = c.length; _ < k; _++)
          E[c[_]] = "";
      }
      function i(E) {
        H(E), E.cdata !== "" && (U(E, "oncdata", E.cdata), E.cdata = ""), E.script !== "" && (U(E, "onscript", E.script), E.script = "");
      }
      o.prototype = {
        end: function() {
          D(this);
        },
        write: q,
        resume: function() {
          return this.error = null, this;
        },
        close: function() {
          return this.write(null);
        },
        flush: function() {
          i(this);
        }
      };
      var d;
      try {
        d = require("stream").Stream;
      } catch {
        d = function() {
        };
      }
      d || (d = function() {
      });
      var e = a.EVENTS.filter(function(E) {
        return E !== "error" && E !== "end";
      });
      function n(E, _) {
        return new l(E, _);
      }
      function l(E, _) {
        if (!(this instanceof l))
          return new l(E, _);
        d.apply(this), this._parser = new o(E, _), this.writable = !0, this.readable = !0;
        var k = this;
        this._parser.onend = function() {
          k.emit("end");
        }, this._parser.onerror = function(L) {
          k.emit("error", L), k._parser.error = null;
        }, this._decoder = null, e.forEach(function(L) {
          Object.defineProperty(k, "on" + L, {
            get: function() {
              return k._parser["on" + L];
            },
            set: function(x) {
              if (!x)
                return k.removeAllListeners(L), k._parser["on" + L] = x, x;
              k.on(L, x);
            },
            enumerable: !0,
            configurable: !1
          });
        });
      }
      l.prototype = Object.create(d.prototype, {
        constructor: {
          value: l
        }
      }), l.prototype.write = function(E) {
        if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(E)) {
          if (!this._decoder) {
            var _ = Kh.StringDecoder;
            this._decoder = new _("utf8");
          }
          E = this._decoder.write(E);
        }
        return this._parser.write(E.toString()), this.emit("data", E), !0;
      }, l.prototype.end = function(E) {
        return E && E.length && this.write(E), this._parser.end(), !0;
      }, l.prototype.on = function(E, _) {
        var k = this;
        return !k._parser["on" + E] && e.indexOf(E) !== -1 && (k._parser["on" + E] = function() {
          var L = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
          L.splice(0, 0, E), k.emit.apply(k, L);
        }), d.prototype.on.call(k, E, _);
      };
      var u = "[CDATA[", r = "DOCTYPE", f = "http://www.w3.org/XML/1998/namespace", p = "http://www.w3.org/2000/xmlns/", v = { xml: f, xmlns: p }, m = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, g = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, w = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, S = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      function O(E) {
        return E === " " || E === `
` || E === "\r" || E === "	";
      }
      function I(E) {
        return E === '"' || E === "'";
      }
      function T(E) {
        return E === ">" || O(E);
      }
      function R(E, _) {
        return E.test(_);
      }
      function A(E, _) {
        return !R(E, _);
      }
      var b = 0;
      a.STATE = {
        BEGIN: b++,
        // leading byte order mark or whitespace
        BEGIN_WHITESPACE: b++,
        // leading whitespace
        TEXT: b++,
        // general stuff
        TEXT_ENTITY: b++,
        // &amp and such.
        OPEN_WAKA: b++,
        // <
        SGML_DECL: b++,
        // <!BLARG
        SGML_DECL_QUOTED: b++,
        // <!BLARG foo "bar
        DOCTYPE: b++,
        // <!DOCTYPE
        DOCTYPE_QUOTED: b++,
        // <!DOCTYPE "//blah
        DOCTYPE_DTD: b++,
        // <!DOCTYPE "//blah" [ ...
        DOCTYPE_DTD_QUOTED: b++,
        // <!DOCTYPE "//blah" [ "foo
        COMMENT_STARTING: b++,
        // <!-
        COMMENT: b++,
        // <!--
        COMMENT_ENDING: b++,
        // <!-- blah -
        COMMENT_ENDED: b++,
        // <!-- blah --
        CDATA: b++,
        // <![CDATA[ something
        CDATA_ENDING: b++,
        // ]
        CDATA_ENDING_2: b++,
        // ]]
        PROC_INST: b++,
        // <?hi
        PROC_INST_BODY: b++,
        // <?hi there
        PROC_INST_ENDING: b++,
        // <?hi "there" ?
        OPEN_TAG: b++,
        // <strong
        OPEN_TAG_SLASH: b++,
        // <strong /
        ATTRIB: b++,
        // <a
        ATTRIB_NAME: b++,
        // <a foo
        ATTRIB_NAME_SAW_WHITE: b++,
        // <a foo _
        ATTRIB_VALUE: b++,
        // <a foo=
        ATTRIB_VALUE_QUOTED: b++,
        // <a foo="bar
        ATTRIB_VALUE_CLOSED: b++,
        // <a foo="bar"
        ATTRIB_VALUE_UNQUOTED: b++,
        // <a foo=bar
        ATTRIB_VALUE_ENTITY_Q: b++,
        // <foo bar="&quot;"
        ATTRIB_VALUE_ENTITY_U: b++,
        // <foo bar=&quot
        CLOSE_TAG: b++,
        // </a
        CLOSE_TAG_SAW_WHITE: b++,
        // </a   >
        SCRIPT: b++,
        // <script> ...
        SCRIPT_ENDING: b++
        // <script> ... <
      }, a.XML_ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'"
      }, a.ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'",
        AElig: 198,
        Aacute: 193,
        Acirc: 194,
        Agrave: 192,
        Aring: 197,
        Atilde: 195,
        Auml: 196,
        Ccedil: 199,
        ETH: 208,
        Eacute: 201,
        Ecirc: 202,
        Egrave: 200,
        Euml: 203,
        Iacute: 205,
        Icirc: 206,
        Igrave: 204,
        Iuml: 207,
        Ntilde: 209,
        Oacute: 211,
        Ocirc: 212,
        Ograve: 210,
        Oslash: 216,
        Otilde: 213,
        Ouml: 214,
        THORN: 222,
        Uacute: 218,
        Ucirc: 219,
        Ugrave: 217,
        Uuml: 220,
        Yacute: 221,
        aacute: 225,
        acirc: 226,
        aelig: 230,
        agrave: 224,
        aring: 229,
        atilde: 227,
        auml: 228,
        ccedil: 231,
        eacute: 233,
        ecirc: 234,
        egrave: 232,
        eth: 240,
        euml: 235,
        iacute: 237,
        icirc: 238,
        igrave: 236,
        iuml: 239,
        ntilde: 241,
        oacute: 243,
        ocirc: 244,
        ograve: 242,
        oslash: 248,
        otilde: 245,
        ouml: 246,
        szlig: 223,
        thorn: 254,
        uacute: 250,
        ucirc: 251,
        ugrave: 249,
        uuml: 252,
        yacute: 253,
        yuml: 255,
        copy: 169,
        reg: 174,
        nbsp: 160,
        iexcl: 161,
        cent: 162,
        pound: 163,
        curren: 164,
        yen: 165,
        brvbar: 166,
        sect: 167,
        uml: 168,
        ordf: 170,
        laquo: 171,
        not: 172,
        shy: 173,
        macr: 175,
        deg: 176,
        plusmn: 177,
        sup1: 185,
        sup2: 178,
        sup3: 179,
        acute: 180,
        micro: 181,
        para: 182,
        middot: 183,
        cedil: 184,
        ordm: 186,
        raquo: 187,
        frac14: 188,
        frac12: 189,
        frac34: 190,
        iquest: 191,
        times: 215,
        divide: 247,
        OElig: 338,
        oelig: 339,
        Scaron: 352,
        scaron: 353,
        Yuml: 376,
        fnof: 402,
        circ: 710,
        tilde: 732,
        Alpha: 913,
        Beta: 914,
        Gamma: 915,
        Delta: 916,
        Epsilon: 917,
        Zeta: 918,
        Eta: 919,
        Theta: 920,
        Iota: 921,
        Kappa: 922,
        Lambda: 923,
        Mu: 924,
        Nu: 925,
        Xi: 926,
        Omicron: 927,
        Pi: 928,
        Rho: 929,
        Sigma: 931,
        Tau: 932,
        Upsilon: 933,
        Phi: 934,
        Chi: 935,
        Psi: 936,
        Omega: 937,
        alpha: 945,
        beta: 946,
        gamma: 947,
        delta: 948,
        epsilon: 949,
        zeta: 950,
        eta: 951,
        theta: 952,
        iota: 953,
        kappa: 954,
        lambda: 955,
        mu: 956,
        nu: 957,
        xi: 958,
        omicron: 959,
        pi: 960,
        rho: 961,
        sigmaf: 962,
        sigma: 963,
        tau: 964,
        upsilon: 965,
        phi: 966,
        chi: 967,
        psi: 968,
        omega: 969,
        thetasym: 977,
        upsih: 978,
        piv: 982,
        ensp: 8194,
        emsp: 8195,
        thinsp: 8201,
        zwnj: 8204,
        zwj: 8205,
        lrm: 8206,
        rlm: 8207,
        ndash: 8211,
        mdash: 8212,
        lsquo: 8216,
        rsquo: 8217,
        sbquo: 8218,
        ldquo: 8220,
        rdquo: 8221,
        bdquo: 8222,
        dagger: 8224,
        Dagger: 8225,
        bull: 8226,
        hellip: 8230,
        permil: 8240,
        prime: 8242,
        Prime: 8243,
        lsaquo: 8249,
        rsaquo: 8250,
        oline: 8254,
        frasl: 8260,
        euro: 8364,
        image: 8465,
        weierp: 8472,
        real: 8476,
        trade: 8482,
        alefsym: 8501,
        larr: 8592,
        uarr: 8593,
        rarr: 8594,
        darr: 8595,
        harr: 8596,
        crarr: 8629,
        lArr: 8656,
        uArr: 8657,
        rArr: 8658,
        dArr: 8659,
        hArr: 8660,
        forall: 8704,
        part: 8706,
        exist: 8707,
        empty: 8709,
        nabla: 8711,
        isin: 8712,
        notin: 8713,
        ni: 8715,
        prod: 8719,
        sum: 8721,
        minus: 8722,
        lowast: 8727,
        radic: 8730,
        prop: 8733,
        infin: 8734,
        ang: 8736,
        and: 8743,
        or: 8744,
        cap: 8745,
        cup: 8746,
        int: 8747,
        there4: 8756,
        sim: 8764,
        cong: 8773,
        asymp: 8776,
        ne: 8800,
        equiv: 8801,
        le: 8804,
        ge: 8805,
        sub: 8834,
        sup: 8835,
        nsub: 8836,
        sube: 8838,
        supe: 8839,
        oplus: 8853,
        otimes: 8855,
        perp: 8869,
        sdot: 8901,
        lceil: 8968,
        rceil: 8969,
        lfloor: 8970,
        rfloor: 8971,
        lang: 9001,
        rang: 9002,
        loz: 9674,
        spades: 9824,
        clubs: 9827,
        hearts: 9829,
        diams: 9830
      }, Object.keys(a.ENTITIES).forEach(function(E) {
        var _ = a.ENTITIES[E], k = typeof _ == "number" ? String.fromCharCode(_) : _;
        a.ENTITIES[E] = k;
      });
      for (var G in a.STATE)
        a.STATE[a.STATE[G]] = G;
      b = a.STATE;
      function j(E, _, k) {
        E[_] && E[_](k);
      }
      function U(E, _, k) {
        E.textNode && H(E), j(E, _, k);
      }
      function H(E) {
        E.textNode = M(E.opt, E.textNode), E.textNode && j(E, "ontext", E.textNode), E.textNode = "";
      }
      function M(E, _) {
        return E.trim && (_ = _.trim()), E.normalize && (_ = _.replace(/\s+/g, " ")), _;
      }
      function F(E, _) {
        return H(E), E.trackPosition && (_ += `
Line: ` + E.line + `
Column: ` + E.column + `
Char: ` + E.c), _ = new Error(_), E.error = _, j(E, "onerror", _), E;
      }
      function D(E) {
        return E.sawRoot && !E.closedRoot && $(E, "Unclosed root tag"), E.state !== b.BEGIN && E.state !== b.BEGIN_WHITESPACE && E.state !== b.TEXT && F(E, "Unexpected end"), H(E), E.c = "", E.closed = !0, j(E, "onend"), o.call(E, E.strict, E.opt), E;
      }
      function $(E, _) {
        if (typeof E != "object" || !(E instanceof o))
          throw new Error("bad call to strictFail");
        E.strict && F(E, _);
      }
      function V(E) {
        E.strict || (E.tagName = E.tagName[E.looseCase]());
        var _ = E.tags[E.tags.length - 1] || E, k = E.tag = { name: E.tagName, attributes: {} };
        E.opt.xmlns && (k.ns = _.ns), E.attribList.length = 0, U(E, "onopentagstart", k);
      }
      function W(E, _) {
        var k = E.indexOf(":"), L = k < 0 ? ["", E] : E.split(":"), x = L[0], P = L[1];
        return _ && E === "xmlns" && (x = "xmlns", P = ""), { prefix: x, local: P };
      }
      function re(E) {
        if (E.strict || (E.attribName = E.attribName[E.looseCase]()), E.attribList.indexOf(E.attribName) !== -1 || E.tag.attributes.hasOwnProperty(E.attribName)) {
          E.attribName = E.attribValue = "";
          return;
        }
        if (E.opt.xmlns) {
          var _ = W(E.attribName, !0), k = _.prefix, L = _.local;
          if (k === "xmlns")
            if (L === "xml" && E.attribValue !== f)
              $(
                E,
                "xml: prefix must be bound to " + f + `
Actual: ` + E.attribValue
              );
            else if (L === "xmlns" && E.attribValue !== p)
              $(
                E,
                "xmlns: prefix must be bound to " + p + `
Actual: ` + E.attribValue
              );
            else {
              var x = E.tag, P = E.tags[E.tags.length - 1] || E;
              x.ns === P.ns && (x.ns = Object.create(P.ns)), x.ns[L] = E.attribValue;
            }
          E.attribList.push([E.attribName, E.attribValue]);
        } else
          E.tag.attributes[E.attribName] = E.attribValue, U(E, "onattribute", {
            name: E.attribName,
            value: E.attribValue
          });
        E.attribName = E.attribValue = "";
      }
      function ee(E, _) {
        if (E.opt.xmlns) {
          var k = E.tag, L = W(E.tagName);
          k.prefix = L.prefix, k.local = L.local, k.uri = k.ns[L.prefix] || "", k.prefix && !k.uri && ($(E, "Unbound namespace prefix: " + JSON.stringify(E.tagName)), k.uri = L.prefix);
          var x = E.tags[E.tags.length - 1] || E;
          k.ns && x.ns !== k.ns && Object.keys(k.ns).forEach(function(Y) {
            U(E, "onopennamespace", {
              prefix: Y,
              uri: k.ns[Y]
            });
          });
          for (var P = 0, z = E.attribList.length; P < z; P++) {
            var te = E.attribList[P], he = te[0], we = te[1], Ee = W(he, !0), Ne = Ee.prefix, ir = Ee.local, ar = Ne === "" ? "" : k.ns[Ne] || "", y = {
              name: he,
              value: we,
              prefix: Ne,
              local: ir,
              uri: ar
            };
            Ne && Ne !== "xmlns" && !ar && ($(E, "Unbound namespace prefix: " + JSON.stringify(Ne)), y.uri = Ne), E.tag.attributes[he] = y, U(E, "onattribute", y);
          }
          E.attribList.length = 0;
        }
        E.tag.isSelfClosing = !!_, E.sawRoot = !0, E.tags.push(E.tag), U(E, "onopentag", E.tag), _ || (!E.noscript && E.tagName.toLowerCase() === "script" ? E.state = b.SCRIPT : E.state = b.TEXT, E.tag = null, E.tagName = ""), E.attribName = E.attribValue = "", E.attribList.length = 0;
      }
      function oe(E) {
        if (!E.tagName) {
          $(E, "Weird empty close tag."), E.textNode += "</>", E.state = b.TEXT;
          return;
        }
        if (E.script) {
          if (E.tagName !== "script") {
            E.script += "</" + E.tagName + ">", E.tagName = "", E.state = b.SCRIPT;
            return;
          }
          U(E, "onscript", E.script), E.script = "";
        }
        var _ = E.tags.length, k = E.tagName;
        E.strict || (k = k[E.looseCase]());
        for (var L = k; _--; ) {
          var x = E.tags[_];
          if (x.name !== L)
            $(E, "Unexpected close tag");
          else
            break;
        }
        if (_ < 0) {
          $(E, "Unmatched closing tag: " + E.tagName), E.textNode += "</" + E.tagName + ">", E.state = b.TEXT;
          return;
        }
        E.tagName = k;
        for (var P = E.tags.length; P-- > _; ) {
          var z = E.tag = E.tags.pop();
          E.tagName = E.tag.name, U(E, "onclosetag", E.tagName);
          var te = {};
          for (var he in z.ns)
            te[he] = z.ns[he];
          var we = E.tags[E.tags.length - 1] || E;
          E.opt.xmlns && z.ns !== we.ns && Object.keys(z.ns).forEach(function(Ee) {
            var Ne = z.ns[Ee];
            U(E, "onclosenamespace", { prefix: Ee, uri: Ne });
          });
        }
        _ === 0 && (E.closedRoot = !0), E.tagName = E.attribValue = E.attribName = "", E.attribList.length = 0, E.state = b.TEXT;
      }
      function se(E) {
        var _ = E.entity, k = _.toLowerCase(), L, x = "";
        return E.ENTITIES[_] ? E.ENTITIES[_] : E.ENTITIES[k] ? E.ENTITIES[k] : (_ = k, _.charAt(0) === "#" && (_.charAt(1) === "x" ? (_ = _.slice(2), L = parseInt(_, 16), x = L.toString(16)) : (_ = _.slice(1), L = parseInt(_, 10), x = L.toString(10))), _ = _.replace(/^0+/, ""), isNaN(L) || x.toLowerCase() !== _ ? ($(E, "Invalid character entity"), "&" + E.entity + ";") : String.fromCodePoint(L));
      }
      function ye(E, _) {
        _ === "<" ? (E.state = b.OPEN_WAKA, E.startTagPosition = E.position) : O(_) || ($(E, "Non-whitespace before first tag."), E.textNode = _, E.state = b.TEXT);
      }
      function X(E, _) {
        var k = "";
        return _ < E.length && (k = E.charAt(_)), k;
      }
      function q(E) {
        var _ = this;
        if (this.error)
          throw this.error;
        if (_.closed)
          return F(
            _,
            "Cannot write after close. Assign an onready handler."
          );
        if (E === null)
          return D(_);
        typeof E == "object" && (E = E.toString());
        for (var k = 0, L = ""; L = X(E, k++), _.c = L, !!L; )
          switch (_.trackPosition && (_.position++, L === `
` ? (_.line++, _.column = 0) : _.column++), _.state) {
            case b.BEGIN:
              if (_.state = b.BEGIN_WHITESPACE, L === "\uFEFF")
                continue;
              ye(_, L);
              continue;
            case b.BEGIN_WHITESPACE:
              ye(_, L);
              continue;
            case b.TEXT:
              if (_.sawRoot && !_.closedRoot) {
                for (var x = k - 1; L && L !== "<" && L !== "&"; )
                  L = X(E, k++), L && _.trackPosition && (_.position++, L === `
` ? (_.line++, _.column = 0) : _.column++);
                _.textNode += E.substring(x, k - 1);
              }
              L === "<" && !(_.sawRoot && _.closedRoot && !_.strict) ? (_.state = b.OPEN_WAKA, _.startTagPosition = _.position) : (!O(L) && (!_.sawRoot || _.closedRoot) && $(_, "Text data outside of root node."), L === "&" ? _.state = b.TEXT_ENTITY : _.textNode += L);
              continue;
            case b.SCRIPT:
              L === "<" ? _.state = b.SCRIPT_ENDING : _.script += L;
              continue;
            case b.SCRIPT_ENDING:
              L === "/" ? _.state = b.CLOSE_TAG : (_.script += "<" + L, _.state = b.SCRIPT);
              continue;
            case b.OPEN_WAKA:
              if (L === "!")
                _.state = b.SGML_DECL, _.sgmlDecl = "";
              else if (!O(L)) if (R(m, L))
                _.state = b.OPEN_TAG, _.tagName = L;
              else if (L === "/")
                _.state = b.CLOSE_TAG, _.tagName = "";
              else if (L === "?")
                _.state = b.PROC_INST, _.procInstName = _.procInstBody = "";
              else {
                if ($(_, "Unencoded <"), _.startTagPosition + 1 < _.position) {
                  var P = _.position - _.startTagPosition;
                  L = new Array(P).join(" ") + L;
                }
                _.textNode += "<" + L, _.state = b.TEXT;
              }
              continue;
            case b.SGML_DECL:
              if (_.sgmlDecl + L === "--") {
                _.state = b.COMMENT, _.comment = "", _.sgmlDecl = "";
                continue;
              }
              _.doctype && _.doctype !== !0 && _.sgmlDecl ? (_.state = b.DOCTYPE_DTD, _.doctype += "<!" + _.sgmlDecl + L, _.sgmlDecl = "") : (_.sgmlDecl + L).toUpperCase() === u ? (U(_, "onopencdata"), _.state = b.CDATA, _.sgmlDecl = "", _.cdata = "") : (_.sgmlDecl + L).toUpperCase() === r ? (_.state = b.DOCTYPE, (_.doctype || _.sawRoot) && $(
                _,
                "Inappropriately located doctype declaration"
              ), _.doctype = "", _.sgmlDecl = "") : L === ">" ? (U(_, "onsgmldeclaration", _.sgmlDecl), _.sgmlDecl = "", _.state = b.TEXT) : (I(L) && (_.state = b.SGML_DECL_QUOTED), _.sgmlDecl += L);
              continue;
            case b.SGML_DECL_QUOTED:
              L === _.q && (_.state = b.SGML_DECL, _.q = ""), _.sgmlDecl += L;
              continue;
            case b.DOCTYPE:
              L === ">" ? (_.state = b.TEXT, U(_, "ondoctype", _.doctype), _.doctype = !0) : (_.doctype += L, L === "[" ? _.state = b.DOCTYPE_DTD : I(L) && (_.state = b.DOCTYPE_QUOTED, _.q = L));
              continue;
            case b.DOCTYPE_QUOTED:
              _.doctype += L, L === _.q && (_.q = "", _.state = b.DOCTYPE);
              continue;
            case b.DOCTYPE_DTD:
              L === "]" ? (_.doctype += L, _.state = b.DOCTYPE) : L === "<" ? (_.state = b.OPEN_WAKA, _.startTagPosition = _.position) : I(L) ? (_.doctype += L, _.state = b.DOCTYPE_DTD_QUOTED, _.q = L) : _.doctype += L;
              continue;
            case b.DOCTYPE_DTD_QUOTED:
              _.doctype += L, L === _.q && (_.state = b.DOCTYPE_DTD, _.q = "");
              continue;
            case b.COMMENT:
              L === "-" ? _.state = b.COMMENT_ENDING : _.comment += L;
              continue;
            case b.COMMENT_ENDING:
              L === "-" ? (_.state = b.COMMENT_ENDED, _.comment = M(_.opt, _.comment), _.comment && U(_, "oncomment", _.comment), _.comment = "") : (_.comment += "-" + L, _.state = b.COMMENT);
              continue;
            case b.COMMENT_ENDED:
              L !== ">" ? ($(_, "Malformed comment"), _.comment += "--" + L, _.state = b.COMMENT) : _.doctype && _.doctype !== !0 ? _.state = b.DOCTYPE_DTD : _.state = b.TEXT;
              continue;
            case b.CDATA:
              L === "]" ? _.state = b.CDATA_ENDING : _.cdata += L;
              continue;
            case b.CDATA_ENDING:
              L === "]" ? _.state = b.CDATA_ENDING_2 : (_.cdata += "]" + L, _.state = b.CDATA);
              continue;
            case b.CDATA_ENDING_2:
              L === ">" ? (_.cdata && U(_, "oncdata", _.cdata), U(_, "onclosecdata"), _.cdata = "", _.state = b.TEXT) : L === "]" ? _.cdata += "]" : (_.cdata += "]]" + L, _.state = b.CDATA);
              continue;
            case b.PROC_INST:
              L === "?" ? _.state = b.PROC_INST_ENDING : O(L) ? _.state = b.PROC_INST_BODY : _.procInstName += L;
              continue;
            case b.PROC_INST_BODY:
              if (!_.procInstBody && O(L))
                continue;
              L === "?" ? _.state = b.PROC_INST_ENDING : _.procInstBody += L;
              continue;
            case b.PROC_INST_ENDING:
              L === ">" ? (U(_, "onprocessinginstruction", {
                name: _.procInstName,
                body: _.procInstBody
              }), _.procInstName = _.procInstBody = "", _.state = b.TEXT) : (_.procInstBody += "?" + L, _.state = b.PROC_INST_BODY);
              continue;
            case b.OPEN_TAG:
              R(g, L) ? _.tagName += L : (V(_), L === ">" ? ee(_) : L === "/" ? _.state = b.OPEN_TAG_SLASH : (O(L) || $(_, "Invalid character in tag name"), _.state = b.ATTRIB));
              continue;
            case b.OPEN_TAG_SLASH:
              L === ">" ? (ee(_, !0), oe(_)) : ($(_, "Forward-slash in opening tag not followed by >"), _.state = b.ATTRIB);
              continue;
            case b.ATTRIB:
              if (O(L))
                continue;
              L === ">" ? ee(_) : L === "/" ? _.state = b.OPEN_TAG_SLASH : R(m, L) ? (_.attribName = L, _.attribValue = "", _.state = b.ATTRIB_NAME) : $(_, "Invalid attribute name");
              continue;
            case b.ATTRIB_NAME:
              L === "=" ? _.state = b.ATTRIB_VALUE : L === ">" ? ($(_, "Attribute without value"), _.attribValue = _.attribName, re(_), ee(_)) : O(L) ? _.state = b.ATTRIB_NAME_SAW_WHITE : R(g, L) ? _.attribName += L : $(_, "Invalid attribute name");
              continue;
            case b.ATTRIB_NAME_SAW_WHITE:
              if (L === "=")
                _.state = b.ATTRIB_VALUE;
              else {
                if (O(L))
                  continue;
                $(_, "Attribute without value"), _.tag.attributes[_.attribName] = "", _.attribValue = "", U(_, "onattribute", {
                  name: _.attribName,
                  value: ""
                }), _.attribName = "", L === ">" ? ee(_) : R(m, L) ? (_.attribName = L, _.state = b.ATTRIB_NAME) : ($(_, "Invalid attribute name"), _.state = b.ATTRIB);
              }
              continue;
            case b.ATTRIB_VALUE:
              if (O(L))
                continue;
              I(L) ? (_.q = L, _.state = b.ATTRIB_VALUE_QUOTED) : (_.opt.unquotedAttributeValues || F(_, "Unquoted attribute value"), _.state = b.ATTRIB_VALUE_UNQUOTED, _.attribValue = L);
              continue;
            case b.ATTRIB_VALUE_QUOTED:
              if (L !== _.q) {
                L === "&" ? _.state = b.ATTRIB_VALUE_ENTITY_Q : _.attribValue += L;
                continue;
              }
              re(_), _.q = "", _.state = b.ATTRIB_VALUE_CLOSED;
              continue;
            case b.ATTRIB_VALUE_CLOSED:
              O(L) ? _.state = b.ATTRIB : L === ">" ? ee(_) : L === "/" ? _.state = b.OPEN_TAG_SLASH : R(m, L) ? ($(_, "No whitespace between attributes"), _.attribName = L, _.attribValue = "", _.state = b.ATTRIB_NAME) : $(_, "Invalid attribute name");
              continue;
            case b.ATTRIB_VALUE_UNQUOTED:
              if (!T(L)) {
                L === "&" ? _.state = b.ATTRIB_VALUE_ENTITY_U : _.attribValue += L;
                continue;
              }
              re(_), L === ">" ? ee(_) : _.state = b.ATTRIB;
              continue;
            case b.CLOSE_TAG:
              if (_.tagName)
                L === ">" ? oe(_) : R(g, L) ? _.tagName += L : _.script ? (_.script += "</" + _.tagName, _.tagName = "", _.state = b.SCRIPT) : (O(L) || $(_, "Invalid tagname in closing tag"), _.state = b.CLOSE_TAG_SAW_WHITE);
              else {
                if (O(L))
                  continue;
                A(m, L) ? _.script ? (_.script += "</" + L, _.state = b.SCRIPT) : $(_, "Invalid tagname in closing tag.") : _.tagName = L;
              }
              continue;
            case b.CLOSE_TAG_SAW_WHITE:
              if (O(L))
                continue;
              L === ">" ? oe(_) : $(_, "Invalid characters in closing tag");
              continue;
            case b.TEXT_ENTITY:
            case b.ATTRIB_VALUE_ENTITY_Q:
            case b.ATTRIB_VALUE_ENTITY_U:
              var z, te;
              switch (_.state) {
                case b.TEXT_ENTITY:
                  z = b.TEXT, te = "textNode";
                  break;
                case b.ATTRIB_VALUE_ENTITY_Q:
                  z = b.ATTRIB_VALUE_QUOTED, te = "attribValue";
                  break;
                case b.ATTRIB_VALUE_ENTITY_U:
                  z = b.ATTRIB_VALUE_UNQUOTED, te = "attribValue";
                  break;
              }
              if (L === ";") {
                var he = se(_);
                _.opt.unparsedEntities && !Object.values(a.XML_ENTITIES).includes(he) ? (_.entity = "", _.state = z, _.write(he)) : (_[te] += he, _.entity = "", _.state = z);
              } else R(_.entity.length ? S : w, L) ? _.entity += L : ($(_, "Invalid character in entity name"), _[te] += "&" + _.entity + L, _.entity = "", _.state = z);
              continue;
            default:
              throw new Error(_, "Unknown state: " + _.state);
          }
        return _.position >= _.bufferCheckPosition && h(_), _;
      }
      /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
      String.fromCodePoint || function() {
        var E = String.fromCharCode, _ = Math.floor, k = function() {
          var L = 16384, x = [], P, z, te = -1, he = arguments.length;
          if (!he)
            return "";
          for (var we = ""; ++te < he; ) {
            var Ee = Number(arguments[te]);
            if (!isFinite(Ee) || // `NaN`, `+Infinity`, or `-Infinity`
            Ee < 0 || // not a valid Unicode code point
            Ee > 1114111 || // not a valid Unicode code point
            _(Ee) !== Ee)
              throw RangeError("Invalid code point: " + Ee);
            Ee <= 65535 ? x.push(Ee) : (Ee -= 65536, P = (Ee >> 10) + 55296, z = Ee % 1024 + 56320, x.push(P, z)), (te + 1 === he || x.length > L) && (we += E.apply(null, x), x.length = 0);
          }
          return we;
        };
        Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
          value: k,
          configurable: !0,
          writable: !0
        }) : String.fromCodePoint = k;
      }();
    })(t);
  }(fi)), fi;
}
var qu;
function bg() {
  if (qu) return Xr;
  qu = 1, Object.defineProperty(Xr, "__esModule", { value: !0 }), Xr.XElement = void 0, Xr.parseXml = i;
  const t = _g(), a = Vn();
  class c {
    constructor(e) {
      if (this.name = e, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !e)
        throw (0, a.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
      if (!h(e))
        throw (0, a.newError)(`Invalid element name: ${e}`, "ERR_XML_ELEMENT_INVALID_NAME");
    }
    attribute(e) {
      const n = this.attributes === null ? null : this.attributes[e];
      if (n == null)
        throw (0, a.newError)(`No attribute "${e}"`, "ERR_XML_MISSED_ATTRIBUTE");
      return n;
    }
    removeAttribute(e) {
      this.attributes !== null && delete this.attributes[e];
    }
    element(e, n = !1, l = null) {
      const u = this.elementOrNull(e, n);
      if (u === null)
        throw (0, a.newError)(l || `No element "${e}"`, "ERR_XML_MISSED_ELEMENT");
      return u;
    }
    elementOrNull(e, n = !1) {
      if (this.elements === null)
        return null;
      for (const l of this.elements)
        if (s(l, e, n))
          return l;
      return null;
    }
    getElements(e, n = !1) {
      return this.elements === null ? [] : this.elements.filter((l) => s(l, e, n));
    }
    elementValueOrEmpty(e, n = !1) {
      const l = this.elementOrNull(e, n);
      return l === null ? "" : l.value;
    }
  }
  Xr.XElement = c;
  const o = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
  function h(d) {
    return o.test(d);
  }
  function s(d, e, n) {
    const l = d.name;
    return l === e || n === !0 && l.length === e.length && l.toLowerCase() === e.toLowerCase();
  }
  function i(d) {
    let e = null;
    const n = t.parser(!0, {}), l = [];
    return n.onopentag = (u) => {
      const r = new c(u.name);
      if (r.attributes = u.attributes, e === null)
        e = r;
      else {
        const f = l[l.length - 1];
        f.elements == null && (f.elements = []), f.elements.push(r);
      }
      l.push(r);
    }, n.onclosetag = () => {
      l.pop();
    }, n.ontext = (u) => {
      l.length > 0 && (l[l.length - 1].value = u);
    }, n.oncdata = (u) => {
      const r = l[l.length - 1];
      r.value = u, r.isCData = !0;
    }, n.onerror = (u) => {
      throw u;
    }, n.write(d), e;
  }
  return Xr;
}
var dt = {}, Mu;
function Sg() {
  if (Mu) return dt;
  Mu = 1, Object.defineProperty(dt, "__esModule", { value: !0 }), dt.MemoLazy = void 0;
  let t = class {
    constructor(o, h) {
      this.selector = o, this.creator = h, this.selected = void 0, this._value = void 0;
    }
    get hasValue() {
      return this._value !== void 0;
    }
    get value() {
      const o = this.selector();
      if (this._value !== void 0 && a(this.selected, o))
        return this._value;
      this.selected = o;
      const h = this.creator(o);
      return this.value = h, h;
    }
    set value(o) {
      this._value = o;
    }
  };
  dt.MemoLazy = t;
  function a(c, o) {
    if (typeof c == "object" && c !== null && (typeof o == "object" && o !== null)) {
      const i = Object.keys(c), d = Object.keys(o);
      return i.length === d.length && i.every((e) => a(c[e], o[e]));
    }
    return c === o;
  }
  return dt;
}
var nn = {}, ku;
function Rg() {
  if (ku) return nn;
  ku = 1, Object.defineProperty(nn, "__esModule", { value: !0 }), nn.retry = a;
  const t = ks();
  async function a(c, o, h, s = 0, i = 0, d) {
    var e;
    const n = new t.CancellationToken();
    try {
      return await c();
    } catch (l) {
      if ((!((e = d == null ? void 0 : d(l)) !== null && e !== void 0) || e) && o > 0 && !n.cancelled)
        return await new Promise((u) => setTimeout(u, h + s * i)), await a(c, o - 1, h, s, i + 1, d);
      throw l;
    }
  }
  return nn;
}
var Uu;
function Ge() {
  return Uu || (Uu = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.CURRENT_APP_PACKAGE_FILE_NAME = t.CURRENT_APP_INSTALLER_FILE_NAME = t.retry = t.MemoLazy = t.newError = t.XElement = t.parseXml = t.ProgressCallbackTransform = t.UUID = t.parseDn = t.githubUrl = t.getS3LikeProviderBaseUrl = t.configureRequestUrl = t.parseJson = t.safeStringifyJson = t.configureRequestOptionsFromUrl = t.configureRequestOptions = t.safeGetHeader = t.DigestTransform = t.HttpExecutor = t.createHttpError = t.HttpError = t.CancellationError = t.CancellationToken = void 0, t.asArray = u;
    var a = ks();
    Object.defineProperty(t, "CancellationToken", { enumerable: !0, get: function() {
      return a.CancellationToken;
    } }), Object.defineProperty(t, "CancellationError", { enumerable: !0, get: function() {
      return a.CancellationError;
    } });
    var c = vg();
    Object.defineProperty(t, "HttpError", { enumerable: !0, get: function() {
      return c.HttpError;
    } }), Object.defineProperty(t, "createHttpError", { enumerable: !0, get: function() {
      return c.createHttpError;
    } }), Object.defineProperty(t, "HttpExecutor", { enumerable: !0, get: function() {
      return c.HttpExecutor;
    } }), Object.defineProperty(t, "DigestTransform", { enumerable: !0, get: function() {
      return c.DigestTransform;
    } }), Object.defineProperty(t, "safeGetHeader", { enumerable: !0, get: function() {
      return c.safeGetHeader;
    } }), Object.defineProperty(t, "configureRequestOptions", { enumerable: !0, get: function() {
      return c.configureRequestOptions;
    } }), Object.defineProperty(t, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
      return c.configureRequestOptionsFromUrl;
    } }), Object.defineProperty(t, "safeStringifyJson", { enumerable: !0, get: function() {
      return c.safeStringifyJson;
    } }), Object.defineProperty(t, "parseJson", { enumerable: !0, get: function() {
      return c.parseJson;
    } }), Object.defineProperty(t, "configureRequestUrl", { enumerable: !0, get: function() {
      return c.configureRequestUrl;
    } });
    var o = yg();
    Object.defineProperty(t, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
      return o.getS3LikeProviderBaseUrl;
    } }), Object.defineProperty(t, "githubUrl", { enumerable: !0, get: function() {
      return o.githubUrl;
    } });
    var h = wg();
    Object.defineProperty(t, "parseDn", { enumerable: !0, get: function() {
      return h.parseDn;
    } });
    var s = Eg();
    Object.defineProperty(t, "UUID", { enumerable: !0, get: function() {
      return s.UUID;
    } });
    var i = rp();
    Object.defineProperty(t, "ProgressCallbackTransform", { enumerable: !0, get: function() {
      return i.ProgressCallbackTransform;
    } });
    var d = bg();
    Object.defineProperty(t, "parseXml", { enumerable: !0, get: function() {
      return d.parseXml;
    } }), Object.defineProperty(t, "XElement", { enumerable: !0, get: function() {
      return d.XElement;
    } });
    var e = Vn();
    Object.defineProperty(t, "newError", { enumerable: !0, get: function() {
      return e.newError;
    } });
    var n = Sg();
    Object.defineProperty(t, "MemoLazy", { enumerable: !0, get: function() {
      return n.MemoLazy;
    } });
    var l = Rg();
    Object.defineProperty(t, "retry", { enumerable: !0, get: function() {
      return l.retry;
    } }), t.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", t.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
    function u(r) {
      return r == null ? [] : Array.isArray(r) ? r : [r];
    }
  }(oi)), oi;
}
var di = {}, an = {}, ju;
function tr() {
  return ju || (ju = 1, an.fromCallback = function(t) {
    return Object.defineProperty(function(...a) {
      if (typeof a[a.length - 1] == "function") t.apply(this, a);
      else
        return new Promise((c, o) => {
          a.push((h, s) => h != null ? o(h) : c(s)), t.apply(this, a);
        });
    }, "name", { value: t.name });
  }, an.fromPromise = function(t) {
    return Object.defineProperty(function(...a) {
      const c = a[a.length - 1];
      if (typeof c != "function") return t.apply(this, a);
      a.pop(), t.apply(this, a).then((o) => c(null, o), c);
    }, "name", { value: t.name });
  }), an;
}
var hi, Bu;
function Tg() {
  if (Bu) return hi;
  Bu = 1;
  var t = og, a = process.cwd, c = null, o = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    return c || (c = a.call(process)), c;
  };
  try {
    process.cwd();
  } catch {
  }
  if (typeof process.chdir == "function") {
    var h = process.chdir;
    process.chdir = function(i) {
      c = null, h.call(process, i);
    }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, h);
  }
  hi = s;
  function s(i) {
    t.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && d(i), i.lutimes || e(i), i.chown = u(i.chown), i.fchown = u(i.fchown), i.lchown = u(i.lchown), i.chmod = n(i.chmod), i.fchmod = n(i.fchmod), i.lchmod = n(i.lchmod), i.chownSync = r(i.chownSync), i.fchownSync = r(i.fchownSync), i.lchownSync = r(i.lchownSync), i.chmodSync = l(i.chmodSync), i.fchmodSync = l(i.fchmodSync), i.lchmodSync = l(i.lchmodSync), i.stat = f(i.stat), i.fstat = f(i.fstat), i.lstat = f(i.lstat), i.statSync = p(i.statSync), i.fstatSync = p(i.fstatSync), i.lstatSync = p(i.lstatSync), i.chmod && !i.lchmod && (i.lchmod = function(m, g, w) {
      w && process.nextTick(w);
    }, i.lchmodSync = function() {
    }), i.chown && !i.lchown && (i.lchown = function(m, g, w, S) {
      S && process.nextTick(S);
    }, i.lchownSync = function() {
    }), o === "win32" && (i.rename = typeof i.rename != "function" ? i.rename : function(m) {
      function g(w, S, O) {
        var I = Date.now(), T = 0;
        m(w, S, function R(A) {
          if (A && (A.code === "EACCES" || A.code === "EPERM" || A.code === "EBUSY") && Date.now() - I < 6e4) {
            setTimeout(function() {
              i.stat(S, function(b, G) {
                b && b.code === "ENOENT" ? m(w, S, R) : O(A);
              });
            }, T), T < 100 && (T += 10);
            return;
          }
          O && O(A);
        });
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(g, m), g;
    }(i.rename)), i.read = typeof i.read != "function" ? i.read : function(m) {
      function g(w, S, O, I, T, R) {
        var A;
        if (R && typeof R == "function") {
          var b = 0;
          A = function(G, j, U) {
            if (G && G.code === "EAGAIN" && b < 10)
              return b++, m.call(i, w, S, O, I, T, A);
            R.apply(this, arguments);
          };
        }
        return m.call(i, w, S, O, I, T, A);
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(g, m), g;
    }(i.read), i.readSync = typeof i.readSync != "function" ? i.readSync : /* @__PURE__ */ function(m) {
      return function(g, w, S, O, I) {
        for (var T = 0; ; )
          try {
            return m.call(i, g, w, S, O, I);
          } catch (R) {
            if (R.code === "EAGAIN" && T < 10) {
              T++;
              continue;
            }
            throw R;
          }
      };
    }(i.readSync);
    function d(m) {
      m.lchmod = function(g, w, S) {
        m.open(
          g,
          t.O_WRONLY | t.O_SYMLINK,
          w,
          function(O, I) {
            if (O) {
              S && S(O);
              return;
            }
            m.fchmod(I, w, function(T) {
              m.close(I, function(R) {
                S && S(T || R);
              });
            });
          }
        );
      }, m.lchmodSync = function(g, w) {
        var S = m.openSync(g, t.O_WRONLY | t.O_SYMLINK, w), O = !0, I;
        try {
          I = m.fchmodSync(S, w), O = !1;
        } finally {
          if (O)
            try {
              m.closeSync(S);
            } catch {
            }
          else
            m.closeSync(S);
        }
        return I;
      };
    }
    function e(m) {
      t.hasOwnProperty("O_SYMLINK") && m.futimes ? (m.lutimes = function(g, w, S, O) {
        m.open(g, t.O_SYMLINK, function(I, T) {
          if (I) {
            O && O(I);
            return;
          }
          m.futimes(T, w, S, function(R) {
            m.close(T, function(A) {
              O && O(R || A);
            });
          });
        });
      }, m.lutimesSync = function(g, w, S) {
        var O = m.openSync(g, t.O_SYMLINK), I, T = !0;
        try {
          I = m.futimesSync(O, w, S), T = !1;
        } finally {
          if (T)
            try {
              m.closeSync(O);
            } catch {
            }
          else
            m.closeSync(O);
        }
        return I;
      }) : m.futimes && (m.lutimes = function(g, w, S, O) {
        O && process.nextTick(O);
      }, m.lutimesSync = function() {
      });
    }
    function n(m) {
      return m && function(g, w, S) {
        return m.call(i, g, w, function(O) {
          v(O) && (O = null), S && S.apply(this, arguments);
        });
      };
    }
    function l(m) {
      return m && function(g, w) {
        try {
          return m.call(i, g, w);
        } catch (S) {
          if (!v(S)) throw S;
        }
      };
    }
    function u(m) {
      return m && function(g, w, S, O) {
        return m.call(i, g, w, S, function(I) {
          v(I) && (I = null), O && O.apply(this, arguments);
        });
      };
    }
    function r(m) {
      return m && function(g, w, S) {
        try {
          return m.call(i, g, w, S);
        } catch (O) {
          if (!v(O)) throw O;
        }
      };
    }
    function f(m) {
      return m && function(g, w, S) {
        typeof w == "function" && (S = w, w = null);
        function O(I, T) {
          T && (T.uid < 0 && (T.uid += 4294967296), T.gid < 0 && (T.gid += 4294967296)), S && S.apply(this, arguments);
        }
        return w ? m.call(i, g, w, O) : m.call(i, g, O);
      };
    }
    function p(m) {
      return m && function(g, w) {
        var S = w ? m.call(i, g, w) : m.call(i, g);
        return S && (S.uid < 0 && (S.uid += 4294967296), S.gid < 0 && (S.gid += 4294967296)), S;
      };
    }
    function v(m) {
      if (!m || m.code === "ENOSYS")
        return !0;
      var g = !process.getuid || process.getuid() !== 0;
      return !!(g && (m.code === "EINVAL" || m.code === "EPERM"));
    }
  }
  return hi;
}
var pi, Hu;
function Ag() {
  if (Hu) return pi;
  Hu = 1;
  var t = Hr.Stream;
  pi = a;
  function a(c) {
    return {
      ReadStream: o,
      WriteStream: h
    };
    function o(s, i) {
      if (!(this instanceof o)) return new o(s, i);
      t.call(this);
      var d = this;
      this.path = s, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, i = i || {};
      for (var e = Object.keys(i), n = 0, l = e.length; n < l; n++) {
        var u = e[n];
        this[u] = i[u];
      }
      if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.end === void 0)
          this.end = 1 / 0;
        else if (typeof this.end != "number")
          throw TypeError("end must be a Number");
        if (this.start > this.end)
          throw new Error("start must be <= end");
        this.pos = this.start;
      }
      if (this.fd !== null) {
        process.nextTick(function() {
          d._read();
        });
        return;
      }
      c.open(this.path, this.flags, this.mode, function(r, f) {
        if (r) {
          d.emit("error", r), d.readable = !1;
          return;
        }
        d.fd = f, d.emit("open", f), d._read();
      });
    }
    function h(s, i) {
      if (!(this instanceof h)) return new h(s, i);
      t.call(this), this.path = s, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, i = i || {};
      for (var d = Object.keys(i), e = 0, n = d.length; e < n; e++) {
        var l = d[e];
        this[l] = i[l];
      }
      if (this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.start < 0)
          throw new Error("start must be >= zero");
        this.pos = this.start;
      }
      this.busy = !1, this._queue = [], this.fd === null && (this._open = c.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
    }
  }
  return pi;
}
var mi, Gu;
function Og() {
  if (Gu) return mi;
  Gu = 1, mi = a;
  var t = Object.getPrototypeOf || function(c) {
    return c.__proto__;
  };
  function a(c) {
    if (c === null || typeof c != "object")
      return c;
    if (c instanceof Object)
      var o = { __proto__: t(c) };
    else
      var o = /* @__PURE__ */ Object.create(null);
    return Object.getOwnPropertyNames(c).forEach(function(h) {
      Object.defineProperty(o, h, Object.getOwnPropertyDescriptor(c, h));
    }), o;
  }
  return mi;
}
var on, Wu;
function Ze() {
  if (Wu) return on;
  Wu = 1;
  var t = He, a = Tg(), c = Ag(), o = Og(), h = ur, s, i;
  typeof Symbol == "function" && typeof Symbol.for == "function" ? (s = Symbol.for("graceful-fs.queue"), i = Symbol.for("graceful-fs.previous")) : (s = "___graceful-fs.queue", i = "___graceful-fs.previous");
  function d() {
  }
  function e(m, g) {
    Object.defineProperty(m, s, {
      get: function() {
        return g;
      }
    });
  }
  var n = d;
  if (h.debuglog ? n = h.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (n = function() {
    var m = h.format.apply(h, arguments);
    m = "GFS4: " + m.split(/\n/).join(`
GFS4: `), console.error(m);
  }), !t[s]) {
    var l = Xe[s] || [];
    e(t, l), t.close = function(m) {
      function g(w, S) {
        return m.call(t, w, function(O) {
          O || p(), typeof S == "function" && S.apply(this, arguments);
        });
      }
      return Object.defineProperty(g, i, {
        value: m
      }), g;
    }(t.close), t.closeSync = function(m) {
      function g(w) {
        m.apply(t, arguments), p();
      }
      return Object.defineProperty(g, i, {
        value: m
      }), g;
    }(t.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
      n(t[s]), Jh.equal(t[s].length, 0);
    });
  }
  Xe[s] || e(Xe, t[s]), on = u(o(t)), process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !t.__patched && (on = u(t), t.__patched = !0);
  function u(m) {
    a(m), m.gracefulify = u, m.createReadStream = ee, m.createWriteStream = oe;
    var g = m.readFile;
    m.readFile = w;
    function w(X, q, E) {
      return typeof q == "function" && (E = q, q = null), _(X, q, E);
      function _(k, L, x, P) {
        return g(k, L, function(z) {
          z && (z.code === "EMFILE" || z.code === "ENFILE") ? r([_, [k, L, x], z, P || Date.now(), Date.now()]) : typeof x == "function" && x.apply(this, arguments);
        });
      }
    }
    var S = m.writeFile;
    m.writeFile = O;
    function O(X, q, E, _) {
      return typeof E == "function" && (_ = E, E = null), k(X, q, E, _);
      function k(L, x, P, z, te) {
        return S(L, x, P, function(he) {
          he && (he.code === "EMFILE" || he.code === "ENFILE") ? r([k, [L, x, P, z], he, te || Date.now(), Date.now()]) : typeof z == "function" && z.apply(this, arguments);
        });
      }
    }
    var I = m.appendFile;
    I && (m.appendFile = T);
    function T(X, q, E, _) {
      return typeof E == "function" && (_ = E, E = null), k(X, q, E, _);
      function k(L, x, P, z, te) {
        return I(L, x, P, function(he) {
          he && (he.code === "EMFILE" || he.code === "ENFILE") ? r([k, [L, x, P, z], he, te || Date.now(), Date.now()]) : typeof z == "function" && z.apply(this, arguments);
        });
      }
    }
    var R = m.copyFile;
    R && (m.copyFile = A);
    function A(X, q, E, _) {
      return typeof E == "function" && (_ = E, E = 0), k(X, q, E, _);
      function k(L, x, P, z, te) {
        return R(L, x, P, function(he) {
          he && (he.code === "EMFILE" || he.code === "ENFILE") ? r([k, [L, x, P, z], he, te || Date.now(), Date.now()]) : typeof z == "function" && z.apply(this, arguments);
        });
      }
    }
    var b = m.readdir;
    m.readdir = j;
    var G = /^v[0-5]\./;
    function j(X, q, E) {
      typeof q == "function" && (E = q, q = null);
      var _ = G.test(process.version) ? function(x, P, z, te) {
        return b(x, k(
          x,
          P,
          z,
          te
        ));
      } : function(x, P, z, te) {
        return b(x, P, k(
          x,
          P,
          z,
          te
        ));
      };
      return _(X, q, E);
      function k(L, x, P, z) {
        return function(te, he) {
          te && (te.code === "EMFILE" || te.code === "ENFILE") ? r([
            _,
            [L, x, P],
            te,
            z || Date.now(),
            Date.now()
          ]) : (he && he.sort && he.sort(), typeof P == "function" && P.call(this, te, he));
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var U = c(m);
      $ = U.ReadStream, W = U.WriteStream;
    }
    var H = m.ReadStream;
    H && ($.prototype = Object.create(H.prototype), $.prototype.open = V);
    var M = m.WriteStream;
    M && (W.prototype = Object.create(M.prototype), W.prototype.open = re), Object.defineProperty(m, "ReadStream", {
      get: function() {
        return $;
      },
      set: function(X) {
        $ = X;
      },
      enumerable: !0,
      configurable: !0
    }), Object.defineProperty(m, "WriteStream", {
      get: function() {
        return W;
      },
      set: function(X) {
        W = X;
      },
      enumerable: !0,
      configurable: !0
    });
    var F = $;
    Object.defineProperty(m, "FileReadStream", {
      get: function() {
        return F;
      },
      set: function(X) {
        F = X;
      },
      enumerable: !0,
      configurable: !0
    });
    var D = W;
    Object.defineProperty(m, "FileWriteStream", {
      get: function() {
        return D;
      },
      set: function(X) {
        D = X;
      },
      enumerable: !0,
      configurable: !0
    });
    function $(X, q) {
      return this instanceof $ ? (H.apply(this, arguments), this) : $.apply(Object.create($.prototype), arguments);
    }
    function V() {
      var X = this;
      ye(X.path, X.flags, X.mode, function(q, E) {
        q ? (X.autoClose && X.destroy(), X.emit("error", q)) : (X.fd = E, X.emit("open", E), X.read());
      });
    }
    function W(X, q) {
      return this instanceof W ? (M.apply(this, arguments), this) : W.apply(Object.create(W.prototype), arguments);
    }
    function re() {
      var X = this;
      ye(X.path, X.flags, X.mode, function(q, E) {
        q ? (X.destroy(), X.emit("error", q)) : (X.fd = E, X.emit("open", E));
      });
    }
    function ee(X, q) {
      return new m.ReadStream(X, q);
    }
    function oe(X, q) {
      return new m.WriteStream(X, q);
    }
    var se = m.open;
    m.open = ye;
    function ye(X, q, E, _) {
      return typeof E == "function" && (_ = E, E = null), k(X, q, E, _);
      function k(L, x, P, z, te) {
        return se(L, x, P, function(he, we) {
          he && (he.code === "EMFILE" || he.code === "ENFILE") ? r([k, [L, x, P, z], he, te || Date.now(), Date.now()]) : typeof z == "function" && z.apply(this, arguments);
        });
      }
    }
    return m;
  }
  function r(m) {
    n("ENQUEUE", m[0].name, m[1]), t[s].push(m), v();
  }
  var f;
  function p() {
    for (var m = Date.now(), g = 0; g < t[s].length; ++g)
      t[s][g].length > 2 && (t[s][g][3] = m, t[s][g][4] = m);
    v();
  }
  function v() {
    if (clearTimeout(f), f = void 0, t[s].length !== 0) {
      var m = t[s].shift(), g = m[0], w = m[1], S = m[2], O = m[3], I = m[4];
      if (O === void 0)
        n("RETRY", g.name, w), g.apply(null, w);
      else if (Date.now() - O >= 6e4) {
        n("TIMEOUT", g.name, w);
        var T = w.pop();
        typeof T == "function" && T.call(null, S);
      } else {
        var R = Date.now() - I, A = Math.max(I - O, 1), b = Math.min(A * 1.2, 100);
        R >= b ? (n("RETRY", g.name, w), g.apply(null, w.concat([O]))) : t[s].push(m);
      }
      f === void 0 && (f = setTimeout(v, 0));
    }
  }
  return on;
}
var zu;
function tt() {
  return zu || (zu = 1, function(t) {
    const a = tr().fromCallback, c = Ze(), o = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "lchmod",
      "lchown",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((h) => typeof c[h] == "function");
    Object.assign(t, c), o.forEach((h) => {
      t[h] = a(c[h]);
    }), t.exists = function(h, s) {
      return typeof s == "function" ? c.exists(h, s) : new Promise((i) => c.exists(h, i));
    }, t.read = function(h, s, i, d, e, n) {
      return typeof n == "function" ? c.read(h, s, i, d, e, n) : new Promise((l, u) => {
        c.read(h, s, i, d, e, (r, f, p) => {
          if (r) return u(r);
          l({ bytesRead: f, buffer: p });
        });
      });
    }, t.write = function(h, s, ...i) {
      return typeof i[i.length - 1] == "function" ? c.write(h, s, ...i) : new Promise((d, e) => {
        c.write(h, s, ...i, (n, l, u) => {
          if (n) return e(n);
          d({ bytesWritten: l, buffer: u });
        });
      });
    }, typeof c.writev == "function" && (t.writev = function(h, s, ...i) {
      return typeof i[i.length - 1] == "function" ? c.writev(h, s, ...i) : new Promise((d, e) => {
        c.writev(h, s, ...i, (n, l, u) => {
          if (n) return e(n);
          d({ bytesWritten: l, buffers: u });
        });
      });
    }), typeof c.realpath.native == "function" ? t.realpath.native = a(c.realpath.native) : process.emitWarning(
      "fs.realpath.native is not a function. Is fs being monkey-patched?",
      "Warning",
      "fs-extra-WARN0003"
    );
  }(di)), di;
}
var sn = {}, gi = {}, Yu;
function Cg() {
  if (Yu) return gi;
  Yu = 1;
  const t = Ae;
  return gi.checkPath = function(c) {
    if (process.platform === "win32" && /[<>:"|?*]/.test(c.replace(t.parse(c).root, ""))) {
      const h = new Error(`Path contains invalid characters: ${c}`);
      throw h.code = "EINVAL", h;
    }
  }, gi;
}
var Vu;
function xg() {
  if (Vu) return sn;
  Vu = 1;
  const t = /* @__PURE__ */ tt(), { checkPath: a } = /* @__PURE__ */ Cg(), c = (o) => {
    const h = { mode: 511 };
    return typeof o == "number" ? o : { ...h, ...o }.mode;
  };
  return sn.makeDir = async (o, h) => (a(o), t.mkdir(o, {
    mode: c(h),
    recursive: !0
  })), sn.makeDirSync = (o, h) => (a(o), t.mkdirSync(o, {
    mode: c(h),
    recursive: !0
  })), sn;
}
var vi, Xu;
function gr() {
  if (Xu) return vi;
  Xu = 1;
  const t = tr().fromPromise, { makeDir: a, makeDirSync: c } = /* @__PURE__ */ xg(), o = t(a);
  return vi = {
    mkdirs: o,
    mkdirsSync: c,
    // alias
    mkdirp: o,
    mkdirpSync: c,
    ensureDir: o,
    ensureDirSync: c
  }, vi;
}
var yi, Ku;
function Gr() {
  if (Ku) return yi;
  Ku = 1;
  const t = tr().fromPromise, a = /* @__PURE__ */ tt();
  function c(o) {
    return a.access(o).then(() => !0).catch(() => !1);
  }
  return yi = {
    pathExists: t(c),
    pathExistsSync: a.existsSync
  }, yi;
}
var wi, Ju;
function tp() {
  if (Ju) return wi;
  Ju = 1;
  const t = Ze();
  function a(o, h, s, i) {
    t.open(o, "r+", (d, e) => {
      if (d) return i(d);
      t.futimes(e, h, s, (n) => {
        t.close(e, (l) => {
          i && i(n || l);
        });
      });
    });
  }
  function c(o, h, s) {
    const i = t.openSync(o, "r+");
    return t.futimesSync(i, h, s), t.closeSync(i);
  }
  return wi = {
    utimesMillis: a,
    utimesMillisSync: c
  }, wi;
}
var Ei, Qu;
function nt() {
  if (Qu) return Ei;
  Qu = 1;
  const t = /* @__PURE__ */ tt(), a = Ae, c = ur;
  function o(r, f, p) {
    const v = p.dereference ? (m) => t.stat(m, { bigint: !0 }) : (m) => t.lstat(m, { bigint: !0 });
    return Promise.all([
      v(r),
      v(f).catch((m) => {
        if (m.code === "ENOENT") return null;
        throw m;
      })
    ]).then(([m, g]) => ({ srcStat: m, destStat: g }));
  }
  function h(r, f, p) {
    let v;
    const m = p.dereference ? (w) => t.statSync(w, { bigint: !0 }) : (w) => t.lstatSync(w, { bigint: !0 }), g = m(r);
    try {
      v = m(f);
    } catch (w) {
      if (w.code === "ENOENT") return { srcStat: g, destStat: null };
      throw w;
    }
    return { srcStat: g, destStat: v };
  }
  function s(r, f, p, v, m) {
    c.callbackify(o)(r, f, v, (g, w) => {
      if (g) return m(g);
      const { srcStat: S, destStat: O } = w;
      if (O) {
        if (n(S, O)) {
          const I = a.basename(r), T = a.basename(f);
          return p === "move" && I !== T && I.toLowerCase() === T.toLowerCase() ? m(null, { srcStat: S, destStat: O, isChangingCase: !0 }) : m(new Error("Source and destination must not be the same."));
        }
        if (S.isDirectory() && !O.isDirectory())
          return m(new Error(`Cannot overwrite non-directory '${f}' with directory '${r}'.`));
        if (!S.isDirectory() && O.isDirectory())
          return m(new Error(`Cannot overwrite directory '${f}' with non-directory '${r}'.`));
      }
      return S.isDirectory() && l(r, f) ? m(new Error(u(r, f, p))) : m(null, { srcStat: S, destStat: O });
    });
  }
  function i(r, f, p, v) {
    const { srcStat: m, destStat: g } = h(r, f, v);
    if (g) {
      if (n(m, g)) {
        const w = a.basename(r), S = a.basename(f);
        if (p === "move" && w !== S && w.toLowerCase() === S.toLowerCase())
          return { srcStat: m, destStat: g, isChangingCase: !0 };
        throw new Error("Source and destination must not be the same.");
      }
      if (m.isDirectory() && !g.isDirectory())
        throw new Error(`Cannot overwrite non-directory '${f}' with directory '${r}'.`);
      if (!m.isDirectory() && g.isDirectory())
        throw new Error(`Cannot overwrite directory '${f}' with non-directory '${r}'.`);
    }
    if (m.isDirectory() && l(r, f))
      throw new Error(u(r, f, p));
    return { srcStat: m, destStat: g };
  }
  function d(r, f, p, v, m) {
    const g = a.resolve(a.dirname(r)), w = a.resolve(a.dirname(p));
    if (w === g || w === a.parse(w).root) return m();
    t.stat(w, { bigint: !0 }, (S, O) => S ? S.code === "ENOENT" ? m() : m(S) : n(f, O) ? m(new Error(u(r, p, v))) : d(r, f, w, v, m));
  }
  function e(r, f, p, v) {
    const m = a.resolve(a.dirname(r)), g = a.resolve(a.dirname(p));
    if (g === m || g === a.parse(g).root) return;
    let w;
    try {
      w = t.statSync(g, { bigint: !0 });
    } catch (S) {
      if (S.code === "ENOENT") return;
      throw S;
    }
    if (n(f, w))
      throw new Error(u(r, p, v));
    return e(r, f, g, v);
  }
  function n(r, f) {
    return f.ino && f.dev && f.ino === r.ino && f.dev === r.dev;
  }
  function l(r, f) {
    const p = a.resolve(r).split(a.sep).filter((m) => m), v = a.resolve(f).split(a.sep).filter((m) => m);
    return p.reduce((m, g, w) => m && v[w] === g, !0);
  }
  function u(r, f, p) {
    return `Cannot ${p} '${r}' to a subdirectory of itself, '${f}'.`;
  }
  return Ei = {
    checkPaths: s,
    checkPathsSync: i,
    checkParentPaths: d,
    checkParentPathsSync: e,
    isSrcSubdir: l,
    areIdentical: n
  }, Ei;
}
var _i, Zu;
function Pg() {
  if (Zu) return _i;
  Zu = 1;
  const t = Ze(), a = Ae, c = gr().mkdirs, o = Gr().pathExists, h = tp().utimesMillis, s = /* @__PURE__ */ nt();
  function i(j, U, H, M) {
    typeof H == "function" && !M ? (M = H, H = {}) : typeof H == "function" && (H = { filter: H }), M = M || function() {
    }, H = H || {}, H.clobber = "clobber" in H ? !!H.clobber : !0, H.overwrite = "overwrite" in H ? !!H.overwrite : H.clobber, H.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0001"
    ), s.checkPaths(j, U, "copy", H, (F, D) => {
      if (F) return M(F);
      const { srcStat: $, destStat: V } = D;
      s.checkParentPaths(j, $, U, "copy", (W) => W ? M(W) : H.filter ? e(d, V, j, U, H, M) : d(V, j, U, H, M));
    });
  }
  function d(j, U, H, M, F) {
    const D = a.dirname(H);
    o(D, ($, V) => {
      if ($) return F($);
      if (V) return l(j, U, H, M, F);
      c(D, (W) => W ? F(W) : l(j, U, H, M, F));
    });
  }
  function e(j, U, H, M, F, D) {
    Promise.resolve(F.filter(H, M)).then(($) => $ ? j(U, H, M, F, D) : D(), ($) => D($));
  }
  function n(j, U, H, M, F) {
    return M.filter ? e(l, j, U, H, M, F) : l(j, U, H, M, F);
  }
  function l(j, U, H, M, F) {
    (M.dereference ? t.stat : t.lstat)(U, ($, V) => $ ? F($) : V.isDirectory() ? O(V, j, U, H, M, F) : V.isFile() || V.isCharacterDevice() || V.isBlockDevice() ? u(V, j, U, H, M, F) : V.isSymbolicLink() ? b(j, U, H, M, F) : V.isSocket() ? F(new Error(`Cannot copy a socket file: ${U}`)) : V.isFIFO() ? F(new Error(`Cannot copy a FIFO pipe: ${U}`)) : F(new Error(`Unknown file: ${U}`)));
  }
  function u(j, U, H, M, F, D) {
    return U ? r(j, H, M, F, D) : f(j, H, M, F, D);
  }
  function r(j, U, H, M, F) {
    if (M.overwrite)
      t.unlink(H, (D) => D ? F(D) : f(j, U, H, M, F));
    else return M.errorOnExist ? F(new Error(`'${H}' already exists`)) : F();
  }
  function f(j, U, H, M, F) {
    t.copyFile(U, H, (D) => D ? F(D) : M.preserveTimestamps ? p(j.mode, U, H, F) : w(H, j.mode, F));
  }
  function p(j, U, H, M) {
    return v(j) ? m(H, j, (F) => F ? M(F) : g(j, U, H, M)) : g(j, U, H, M);
  }
  function v(j) {
    return (j & 128) === 0;
  }
  function m(j, U, H) {
    return w(j, U | 128, H);
  }
  function g(j, U, H, M) {
    S(U, H, (F) => F ? M(F) : w(H, j, M));
  }
  function w(j, U, H) {
    return t.chmod(j, U, H);
  }
  function S(j, U, H) {
    t.stat(j, (M, F) => M ? H(M) : h(U, F.atime, F.mtime, H));
  }
  function O(j, U, H, M, F, D) {
    return U ? T(H, M, F, D) : I(j.mode, H, M, F, D);
  }
  function I(j, U, H, M, F) {
    t.mkdir(H, (D) => {
      if (D) return F(D);
      T(U, H, M, ($) => $ ? F($) : w(H, j, F));
    });
  }
  function T(j, U, H, M) {
    t.readdir(j, (F, D) => F ? M(F) : R(D, j, U, H, M));
  }
  function R(j, U, H, M, F) {
    const D = j.pop();
    return D ? A(j, D, U, H, M, F) : F();
  }
  function A(j, U, H, M, F, D) {
    const $ = a.join(H, U), V = a.join(M, U);
    s.checkPaths($, V, "copy", F, (W, re) => {
      if (W) return D(W);
      const { destStat: ee } = re;
      n(ee, $, V, F, (oe) => oe ? D(oe) : R(j, H, M, F, D));
    });
  }
  function b(j, U, H, M, F) {
    t.readlink(U, (D, $) => {
      if (D) return F(D);
      if (M.dereference && ($ = a.resolve(process.cwd(), $)), j)
        t.readlink(H, (V, W) => V ? V.code === "EINVAL" || V.code === "UNKNOWN" ? t.symlink($, H, F) : F(V) : (M.dereference && (W = a.resolve(process.cwd(), W)), s.isSrcSubdir($, W) ? F(new Error(`Cannot copy '${$}' to a subdirectory of itself, '${W}'.`)) : j.isDirectory() && s.isSrcSubdir(W, $) ? F(new Error(`Cannot overwrite '${W}' with '${$}'.`)) : G($, H, F)));
      else
        return t.symlink($, H, F);
    });
  }
  function G(j, U, H) {
    t.unlink(U, (M) => M ? H(M) : t.symlink(j, U, H));
  }
  return _i = i, _i;
}
var bi, el;
function Dg() {
  if (el) return bi;
  el = 1;
  const t = Ze(), a = Ae, c = gr().mkdirsSync, o = tp().utimesMillisSync, h = /* @__PURE__ */ nt();
  function s(R, A, b) {
    typeof b == "function" && (b = { filter: b }), b = b || {}, b.clobber = "clobber" in b ? !!b.clobber : !0, b.overwrite = "overwrite" in b ? !!b.overwrite : b.clobber, b.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0002"
    );
    const { srcStat: G, destStat: j } = h.checkPathsSync(R, A, "copy", b);
    return h.checkParentPathsSync(R, G, A, "copy"), i(j, R, A, b);
  }
  function i(R, A, b, G) {
    if (G.filter && !G.filter(A, b)) return;
    const j = a.dirname(b);
    return t.existsSync(j) || c(j), e(R, A, b, G);
  }
  function d(R, A, b, G) {
    if (!(G.filter && !G.filter(A, b)))
      return e(R, A, b, G);
  }
  function e(R, A, b, G) {
    const U = (G.dereference ? t.statSync : t.lstatSync)(A);
    if (U.isDirectory()) return g(U, R, A, b, G);
    if (U.isFile() || U.isCharacterDevice() || U.isBlockDevice()) return n(U, R, A, b, G);
    if (U.isSymbolicLink()) return I(R, A, b, G);
    throw U.isSocket() ? new Error(`Cannot copy a socket file: ${A}`) : U.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${A}`) : new Error(`Unknown file: ${A}`);
  }
  function n(R, A, b, G, j) {
    return A ? l(R, b, G, j) : u(R, b, G, j);
  }
  function l(R, A, b, G) {
    if (G.overwrite)
      return t.unlinkSync(b), u(R, A, b, G);
    if (G.errorOnExist)
      throw new Error(`'${b}' already exists`);
  }
  function u(R, A, b, G) {
    return t.copyFileSync(A, b), G.preserveTimestamps && r(R.mode, A, b), v(b, R.mode);
  }
  function r(R, A, b) {
    return f(R) && p(b, R), m(A, b);
  }
  function f(R) {
    return (R & 128) === 0;
  }
  function p(R, A) {
    return v(R, A | 128);
  }
  function v(R, A) {
    return t.chmodSync(R, A);
  }
  function m(R, A) {
    const b = t.statSync(R);
    return o(A, b.atime, b.mtime);
  }
  function g(R, A, b, G, j) {
    return A ? S(b, G, j) : w(R.mode, b, G, j);
  }
  function w(R, A, b, G) {
    return t.mkdirSync(b), S(A, b, G), v(b, R);
  }
  function S(R, A, b) {
    t.readdirSync(R).forEach((G) => O(G, R, A, b));
  }
  function O(R, A, b, G) {
    const j = a.join(A, R), U = a.join(b, R), { destStat: H } = h.checkPathsSync(j, U, "copy", G);
    return d(H, j, U, G);
  }
  function I(R, A, b, G) {
    let j = t.readlinkSync(A);
    if (G.dereference && (j = a.resolve(process.cwd(), j)), R) {
      let U;
      try {
        U = t.readlinkSync(b);
      } catch (H) {
        if (H.code === "EINVAL" || H.code === "UNKNOWN") return t.symlinkSync(j, b);
        throw H;
      }
      if (G.dereference && (U = a.resolve(process.cwd(), U)), h.isSrcSubdir(j, U))
        throw new Error(`Cannot copy '${j}' to a subdirectory of itself, '${U}'.`);
      if (t.statSync(b).isDirectory() && h.isSrcSubdir(U, j))
        throw new Error(`Cannot overwrite '${U}' with '${j}'.`);
      return T(j, b);
    } else
      return t.symlinkSync(j, b);
  }
  function T(R, A) {
    return t.unlinkSync(A), t.symlinkSync(R, A);
  }
  return bi = s, bi;
}
var Si, rl;
function Us() {
  if (rl) return Si;
  rl = 1;
  const t = tr().fromCallback;
  return Si = {
    copy: t(/* @__PURE__ */ Pg()),
    copySync: /* @__PURE__ */ Dg()
  }, Si;
}
var Ri, tl;
function Ig() {
  if (tl) return Ri;
  tl = 1;
  const t = Ze(), a = Ae, c = Jh, o = process.platform === "win32";
  function h(p) {
    [
      "unlink",
      "chmod",
      "stat",
      "lstat",
      "rmdir",
      "readdir"
    ].forEach((m) => {
      p[m] = p[m] || t[m], m = m + "Sync", p[m] = p[m] || t[m];
    }), p.maxBusyTries = p.maxBusyTries || 3;
  }
  function s(p, v, m) {
    let g = 0;
    typeof v == "function" && (m = v, v = {}), c(p, "rimraf: missing path"), c.strictEqual(typeof p, "string", "rimraf: path should be a string"), c.strictEqual(typeof m, "function", "rimraf: callback function required"), c(v, "rimraf: invalid options argument provided"), c.strictEqual(typeof v, "object", "rimraf: options should be object"), h(v), i(p, v, function w(S) {
      if (S) {
        if ((S.code === "EBUSY" || S.code === "ENOTEMPTY" || S.code === "EPERM") && g < v.maxBusyTries) {
          g++;
          const O = g * 100;
          return setTimeout(() => i(p, v, w), O);
        }
        S.code === "ENOENT" && (S = null);
      }
      m(S);
    });
  }
  function i(p, v, m) {
    c(p), c(v), c(typeof m == "function"), v.lstat(p, (g, w) => {
      if (g && g.code === "ENOENT")
        return m(null);
      if (g && g.code === "EPERM" && o)
        return d(p, v, g, m);
      if (w && w.isDirectory())
        return n(p, v, g, m);
      v.unlink(p, (S) => {
        if (S) {
          if (S.code === "ENOENT")
            return m(null);
          if (S.code === "EPERM")
            return o ? d(p, v, S, m) : n(p, v, S, m);
          if (S.code === "EISDIR")
            return n(p, v, S, m);
        }
        return m(S);
      });
    });
  }
  function d(p, v, m, g) {
    c(p), c(v), c(typeof g == "function"), v.chmod(p, 438, (w) => {
      w ? g(w.code === "ENOENT" ? null : m) : v.stat(p, (S, O) => {
        S ? g(S.code === "ENOENT" ? null : m) : O.isDirectory() ? n(p, v, m, g) : v.unlink(p, g);
      });
    });
  }
  function e(p, v, m) {
    let g;
    c(p), c(v);
    try {
      v.chmodSync(p, 438);
    } catch (w) {
      if (w.code === "ENOENT")
        return;
      throw m;
    }
    try {
      g = v.statSync(p);
    } catch (w) {
      if (w.code === "ENOENT")
        return;
      throw m;
    }
    g.isDirectory() ? r(p, v, m) : v.unlinkSync(p);
  }
  function n(p, v, m, g) {
    c(p), c(v), c(typeof g == "function"), v.rmdir(p, (w) => {
      w && (w.code === "ENOTEMPTY" || w.code === "EEXIST" || w.code === "EPERM") ? l(p, v, g) : w && w.code === "ENOTDIR" ? g(m) : g(w);
    });
  }
  function l(p, v, m) {
    c(p), c(v), c(typeof m == "function"), v.readdir(p, (g, w) => {
      if (g) return m(g);
      let S = w.length, O;
      if (S === 0) return v.rmdir(p, m);
      w.forEach((I) => {
        s(a.join(p, I), v, (T) => {
          if (!O) {
            if (T) return m(O = T);
            --S === 0 && v.rmdir(p, m);
          }
        });
      });
    });
  }
  function u(p, v) {
    let m;
    v = v || {}, h(v), c(p, "rimraf: missing path"), c.strictEqual(typeof p, "string", "rimraf: path should be a string"), c(v, "rimraf: missing options"), c.strictEqual(typeof v, "object", "rimraf: options should be object");
    try {
      m = v.lstatSync(p);
    } catch (g) {
      if (g.code === "ENOENT")
        return;
      g.code === "EPERM" && o && e(p, v, g);
    }
    try {
      m && m.isDirectory() ? r(p, v, null) : v.unlinkSync(p);
    } catch (g) {
      if (g.code === "ENOENT")
        return;
      if (g.code === "EPERM")
        return o ? e(p, v, g) : r(p, v, g);
      if (g.code !== "EISDIR")
        throw g;
      r(p, v, g);
    }
  }
  function r(p, v, m) {
    c(p), c(v);
    try {
      v.rmdirSync(p);
    } catch (g) {
      if (g.code === "ENOTDIR")
        throw m;
      if (g.code === "ENOTEMPTY" || g.code === "EEXIST" || g.code === "EPERM")
        f(p, v);
      else if (g.code !== "ENOENT")
        throw g;
    }
  }
  function f(p, v) {
    if (c(p), c(v), v.readdirSync(p).forEach((m) => u(a.join(p, m), v)), o) {
      const m = Date.now();
      do
        try {
          return v.rmdirSync(p, v);
        } catch {
        }
      while (Date.now() - m < 500);
    } else
      return v.rmdirSync(p, v);
  }
  return Ri = s, s.sync = u, Ri;
}
var Ti, nl;
function Xn() {
  if (nl) return Ti;
  nl = 1;
  const t = Ze(), a = tr().fromCallback, c = /* @__PURE__ */ Ig();
  function o(s, i) {
    if (t.rm) return t.rm(s, { recursive: !0, force: !0 }, i);
    c(s, i);
  }
  function h(s) {
    if (t.rmSync) return t.rmSync(s, { recursive: !0, force: !0 });
    c.sync(s);
  }
  return Ti = {
    remove: a(o),
    removeSync: h
  }, Ti;
}
var Ai, il;
function Ng() {
  if (il) return Ai;
  il = 1;
  const t = tr().fromPromise, a = /* @__PURE__ */ tt(), c = Ae, o = /* @__PURE__ */ gr(), h = /* @__PURE__ */ Xn(), s = t(async function(e) {
    let n;
    try {
      n = await a.readdir(e);
    } catch {
      return o.mkdirs(e);
    }
    return Promise.all(n.map((l) => h.remove(c.join(e, l))));
  });
  function i(d) {
    let e;
    try {
      e = a.readdirSync(d);
    } catch {
      return o.mkdirsSync(d);
    }
    e.forEach((n) => {
      n = c.join(d, n), h.removeSync(n);
    });
  }
  return Ai = {
    emptyDirSync: i,
    emptydirSync: i,
    emptyDir: s,
    emptydir: s
  }, Ai;
}
var Oi, al;
function Lg() {
  if (al) return Oi;
  al = 1;
  const t = tr().fromCallback, a = Ae, c = Ze(), o = /* @__PURE__ */ gr();
  function h(i, d) {
    function e() {
      c.writeFile(i, "", (n) => {
        if (n) return d(n);
        d();
      });
    }
    c.stat(i, (n, l) => {
      if (!n && l.isFile()) return d();
      const u = a.dirname(i);
      c.stat(u, (r, f) => {
        if (r)
          return r.code === "ENOENT" ? o.mkdirs(u, (p) => {
            if (p) return d(p);
            e();
          }) : d(r);
        f.isDirectory() ? e() : c.readdir(u, (p) => {
          if (p) return d(p);
        });
      });
    });
  }
  function s(i) {
    let d;
    try {
      d = c.statSync(i);
    } catch {
    }
    if (d && d.isFile()) return;
    const e = a.dirname(i);
    try {
      c.statSync(e).isDirectory() || c.readdirSync(e);
    } catch (n) {
      if (n && n.code === "ENOENT") o.mkdirsSync(e);
      else throw n;
    }
    c.writeFileSync(i, "");
  }
  return Oi = {
    createFile: t(h),
    createFileSync: s
  }, Oi;
}
var Ci, ol;
function Fg() {
  if (ol) return Ci;
  ol = 1;
  const t = tr().fromCallback, a = Ae, c = Ze(), o = /* @__PURE__ */ gr(), h = Gr().pathExists, { areIdentical: s } = /* @__PURE__ */ nt();
  function i(e, n, l) {
    function u(r, f) {
      c.link(r, f, (p) => {
        if (p) return l(p);
        l(null);
      });
    }
    c.lstat(n, (r, f) => {
      c.lstat(e, (p, v) => {
        if (p)
          return p.message = p.message.replace("lstat", "ensureLink"), l(p);
        if (f && s(v, f)) return l(null);
        const m = a.dirname(n);
        h(m, (g, w) => {
          if (g) return l(g);
          if (w) return u(e, n);
          o.mkdirs(m, (S) => {
            if (S) return l(S);
            u(e, n);
          });
        });
      });
    });
  }
  function d(e, n) {
    let l;
    try {
      l = c.lstatSync(n);
    } catch {
    }
    try {
      const f = c.lstatSync(e);
      if (l && s(f, l)) return;
    } catch (f) {
      throw f.message = f.message.replace("lstat", "ensureLink"), f;
    }
    const u = a.dirname(n);
    return c.existsSync(u) || o.mkdirsSync(u), c.linkSync(e, n);
  }
  return Ci = {
    createLink: t(i),
    createLinkSync: d
  }, Ci;
}
var xi, sl;
function $g() {
  if (sl) return xi;
  sl = 1;
  const t = Ae, a = Ze(), c = Gr().pathExists;
  function o(s, i, d) {
    if (t.isAbsolute(s))
      return a.lstat(s, (e) => e ? (e.message = e.message.replace("lstat", "ensureSymlink"), d(e)) : d(null, {
        toCwd: s,
        toDst: s
      }));
    {
      const e = t.dirname(i), n = t.join(e, s);
      return c(n, (l, u) => l ? d(l) : u ? d(null, {
        toCwd: n,
        toDst: s
      }) : a.lstat(s, (r) => r ? (r.message = r.message.replace("lstat", "ensureSymlink"), d(r)) : d(null, {
        toCwd: s,
        toDst: t.relative(e, s)
      })));
    }
  }
  function h(s, i) {
    let d;
    if (t.isAbsolute(s)) {
      if (d = a.existsSync(s), !d) throw new Error("absolute srcpath does not exist");
      return {
        toCwd: s,
        toDst: s
      };
    } else {
      const e = t.dirname(i), n = t.join(e, s);
      if (d = a.existsSync(n), d)
        return {
          toCwd: n,
          toDst: s
        };
      if (d = a.existsSync(s), !d) throw new Error("relative srcpath does not exist");
      return {
        toCwd: s,
        toDst: t.relative(e, s)
      };
    }
  }
  return xi = {
    symlinkPaths: o,
    symlinkPathsSync: h
  }, xi;
}
var Pi, ul;
function qg() {
  if (ul) return Pi;
  ul = 1;
  const t = Ze();
  function a(o, h, s) {
    if (s = typeof h == "function" ? h : s, h = typeof h == "function" ? !1 : h, h) return s(null, h);
    t.lstat(o, (i, d) => {
      if (i) return s(null, "file");
      h = d && d.isDirectory() ? "dir" : "file", s(null, h);
    });
  }
  function c(o, h) {
    let s;
    if (h) return h;
    try {
      s = t.lstatSync(o);
    } catch {
      return "file";
    }
    return s && s.isDirectory() ? "dir" : "file";
  }
  return Pi = {
    symlinkType: a,
    symlinkTypeSync: c
  }, Pi;
}
var Di, ll;
function Mg() {
  if (ll) return Di;
  ll = 1;
  const t = tr().fromCallback, a = Ae, c = /* @__PURE__ */ tt(), o = /* @__PURE__ */ gr(), h = o.mkdirs, s = o.mkdirsSync, i = /* @__PURE__ */ $g(), d = i.symlinkPaths, e = i.symlinkPathsSync, n = /* @__PURE__ */ qg(), l = n.symlinkType, u = n.symlinkTypeSync, r = Gr().pathExists, { areIdentical: f } = /* @__PURE__ */ nt();
  function p(g, w, S, O) {
    O = typeof S == "function" ? S : O, S = typeof S == "function" ? !1 : S, c.lstat(w, (I, T) => {
      !I && T.isSymbolicLink() ? Promise.all([
        c.stat(g),
        c.stat(w)
      ]).then(([R, A]) => {
        if (f(R, A)) return O(null);
        v(g, w, S, O);
      }) : v(g, w, S, O);
    });
  }
  function v(g, w, S, O) {
    d(g, w, (I, T) => {
      if (I) return O(I);
      g = T.toDst, l(T.toCwd, S, (R, A) => {
        if (R) return O(R);
        const b = a.dirname(w);
        r(b, (G, j) => {
          if (G) return O(G);
          if (j) return c.symlink(g, w, A, O);
          h(b, (U) => {
            if (U) return O(U);
            c.symlink(g, w, A, O);
          });
        });
      });
    });
  }
  function m(g, w, S) {
    let O;
    try {
      O = c.lstatSync(w);
    } catch {
    }
    if (O && O.isSymbolicLink()) {
      const A = c.statSync(g), b = c.statSync(w);
      if (f(A, b)) return;
    }
    const I = e(g, w);
    g = I.toDst, S = u(I.toCwd, S);
    const T = a.dirname(w);
    return c.existsSync(T) || s(T), c.symlinkSync(g, w, S);
  }
  return Di = {
    createSymlink: t(p),
    createSymlinkSync: m
  }, Di;
}
var Ii, cl;
function kg() {
  if (cl) return Ii;
  cl = 1;
  const { createFile: t, createFileSync: a } = /* @__PURE__ */ Lg(), { createLink: c, createLinkSync: o } = /* @__PURE__ */ Fg(), { createSymlink: h, createSymlinkSync: s } = /* @__PURE__ */ Mg();
  return Ii = {
    // file
    createFile: t,
    createFileSync: a,
    ensureFile: t,
    ensureFileSync: a,
    // link
    createLink: c,
    createLinkSync: o,
    ensureLink: c,
    ensureLinkSync: o,
    // symlink
    createSymlink: h,
    createSymlinkSync: s,
    ensureSymlink: h,
    ensureSymlinkSync: s
  }, Ii;
}
var Ni, fl;
function js() {
  if (fl) return Ni;
  fl = 1;
  function t(c, { EOL: o = `
`, finalEOL: h = !0, replacer: s = null, spaces: i } = {}) {
    const d = h ? o : "";
    return JSON.stringify(c, s, i).replace(/\n/g, o) + d;
  }
  function a(c) {
    return Buffer.isBuffer(c) && (c = c.toString("utf8")), c.replace(/^\uFEFF/, "");
  }
  return Ni = { stringify: t, stripBom: a }, Ni;
}
var Li, dl;
function Ug() {
  if (dl) return Li;
  dl = 1;
  let t;
  try {
    t = Ze();
  } catch {
    t = He;
  }
  const a = tr(), { stringify: c, stripBom: o } = js();
  async function h(u, r = {}) {
    typeof r == "string" && (r = { encoding: r });
    const f = r.fs || t, p = "throws" in r ? r.throws : !0;
    let v = await a.fromCallback(f.readFile)(u, r);
    v = o(v);
    let m;
    try {
      m = JSON.parse(v, r ? r.reviver : null);
    } catch (g) {
      if (p)
        throw g.message = `${u}: ${g.message}`, g;
      return null;
    }
    return m;
  }
  const s = a.fromPromise(h);
  function i(u, r = {}) {
    typeof r == "string" && (r = { encoding: r });
    const f = r.fs || t, p = "throws" in r ? r.throws : !0;
    try {
      let v = f.readFileSync(u, r);
      return v = o(v), JSON.parse(v, r.reviver);
    } catch (v) {
      if (p)
        throw v.message = `${u}: ${v.message}`, v;
      return null;
    }
  }
  async function d(u, r, f = {}) {
    const p = f.fs || t, v = c(r, f);
    await a.fromCallback(p.writeFile)(u, v, f);
  }
  const e = a.fromPromise(d);
  function n(u, r, f = {}) {
    const p = f.fs || t, v = c(r, f);
    return p.writeFileSync(u, v, f);
  }
  return Li = {
    readFile: s,
    readFileSync: i,
    writeFile: e,
    writeFileSync: n
  }, Li;
}
var Fi, hl;
function jg() {
  if (hl) return Fi;
  hl = 1;
  const t = Ug();
  return Fi = {
    // jsonfile exports
    readJson: t.readFile,
    readJsonSync: t.readFileSync,
    writeJson: t.writeFile,
    writeJsonSync: t.writeFileSync
  }, Fi;
}
var $i, pl;
function Bs() {
  if (pl) return $i;
  pl = 1;
  const t = tr().fromCallback, a = Ze(), c = Ae, o = /* @__PURE__ */ gr(), h = Gr().pathExists;
  function s(d, e, n, l) {
    typeof n == "function" && (l = n, n = "utf8");
    const u = c.dirname(d);
    h(u, (r, f) => {
      if (r) return l(r);
      if (f) return a.writeFile(d, e, n, l);
      o.mkdirs(u, (p) => {
        if (p) return l(p);
        a.writeFile(d, e, n, l);
      });
    });
  }
  function i(d, ...e) {
    const n = c.dirname(d);
    if (a.existsSync(n))
      return a.writeFileSync(d, ...e);
    o.mkdirsSync(n), a.writeFileSync(d, ...e);
  }
  return $i = {
    outputFile: t(s),
    outputFileSync: i
  }, $i;
}
var qi, ml;
function Bg() {
  if (ml) return qi;
  ml = 1;
  const { stringify: t } = js(), { outputFile: a } = /* @__PURE__ */ Bs();
  async function c(o, h, s = {}) {
    const i = t(h, s);
    await a(o, i, s);
  }
  return qi = c, qi;
}
var Mi, gl;
function Hg() {
  if (gl) return Mi;
  gl = 1;
  const { stringify: t } = js(), { outputFileSync: a } = /* @__PURE__ */ Bs();
  function c(o, h, s) {
    const i = t(h, s);
    a(o, i, s);
  }
  return Mi = c, Mi;
}
var ki, vl;
function Gg() {
  if (vl) return ki;
  vl = 1;
  const t = tr().fromPromise, a = /* @__PURE__ */ jg();
  return a.outputJson = t(/* @__PURE__ */ Bg()), a.outputJsonSync = /* @__PURE__ */ Hg(), a.outputJSON = a.outputJson, a.outputJSONSync = a.outputJsonSync, a.writeJSON = a.writeJson, a.writeJSONSync = a.writeJsonSync, a.readJSON = a.readJson, a.readJSONSync = a.readJsonSync, ki = a, ki;
}
var Ui, yl;
function Wg() {
  if (yl) return Ui;
  yl = 1;
  const t = Ze(), a = Ae, c = Us().copy, o = Xn().remove, h = gr().mkdirp, s = Gr().pathExists, i = /* @__PURE__ */ nt();
  function d(r, f, p, v) {
    typeof p == "function" && (v = p, p = {}), p = p || {};
    const m = p.overwrite || p.clobber || !1;
    i.checkPaths(r, f, "move", p, (g, w) => {
      if (g) return v(g);
      const { srcStat: S, isChangingCase: O = !1 } = w;
      i.checkParentPaths(r, S, f, "move", (I) => {
        if (I) return v(I);
        if (e(f)) return n(r, f, m, O, v);
        h(a.dirname(f), (T) => T ? v(T) : n(r, f, m, O, v));
      });
    });
  }
  function e(r) {
    const f = a.dirname(r);
    return a.parse(f).root === f;
  }
  function n(r, f, p, v, m) {
    if (v) return l(r, f, p, m);
    if (p)
      return o(f, (g) => g ? m(g) : l(r, f, p, m));
    s(f, (g, w) => g ? m(g) : w ? m(new Error("dest already exists.")) : l(r, f, p, m));
  }
  function l(r, f, p, v) {
    t.rename(r, f, (m) => m ? m.code !== "EXDEV" ? v(m) : u(r, f, p, v) : v());
  }
  function u(r, f, p, v) {
    c(r, f, {
      overwrite: p,
      errorOnExist: !0
    }, (g) => g ? v(g) : o(r, v));
  }
  return Ui = d, Ui;
}
var ji, wl;
function zg() {
  if (wl) return ji;
  wl = 1;
  const t = Ze(), a = Ae, c = Us().copySync, o = Xn().removeSync, h = gr().mkdirpSync, s = /* @__PURE__ */ nt();
  function i(u, r, f) {
    f = f || {};
    const p = f.overwrite || f.clobber || !1, { srcStat: v, isChangingCase: m = !1 } = s.checkPathsSync(u, r, "move", f);
    return s.checkParentPathsSync(u, v, r, "move"), d(r) || h(a.dirname(r)), e(u, r, p, m);
  }
  function d(u) {
    const r = a.dirname(u);
    return a.parse(r).root === r;
  }
  function e(u, r, f, p) {
    if (p) return n(u, r, f);
    if (f)
      return o(r), n(u, r, f);
    if (t.existsSync(r)) throw new Error("dest already exists.");
    return n(u, r, f);
  }
  function n(u, r, f) {
    try {
      t.renameSync(u, r);
    } catch (p) {
      if (p.code !== "EXDEV") throw p;
      return l(u, r, f);
    }
  }
  function l(u, r, f) {
    return c(u, r, {
      overwrite: f,
      errorOnExist: !0
    }), o(u);
  }
  return ji = i, ji;
}
var Bi, El;
function Yg() {
  if (El) return Bi;
  El = 1;
  const t = tr().fromCallback;
  return Bi = {
    move: t(/* @__PURE__ */ Wg()),
    moveSync: /* @__PURE__ */ zg()
  }, Bi;
}
var Hi, _l;
function Pr() {
  return _l || (_l = 1, Hi = {
    // Export promiseified graceful-fs:
    .../* @__PURE__ */ tt(),
    // Export extra methods:
    .../* @__PURE__ */ Us(),
    .../* @__PURE__ */ Ng(),
    .../* @__PURE__ */ kg(),
    .../* @__PURE__ */ Gg(),
    .../* @__PURE__ */ gr(),
    .../* @__PURE__ */ Yg(),
    .../* @__PURE__ */ Bs(),
    .../* @__PURE__ */ Gr(),
    .../* @__PURE__ */ Xn()
  }), Hi;
}
var ht = {}, Mr = {}, Ye = {}, un = {}, Rr = {}, bl;
function kt() {
  if (bl) return Rr;
  bl = 1;
  function t(i) {
    return typeof i > "u" || i === null;
  }
  function a(i) {
    return typeof i == "object" && i !== null;
  }
  function c(i) {
    return Array.isArray(i) ? i : t(i) ? [] : [i];
  }
  function o(i, d) {
    var e, n, l, u;
    if (d)
      for (u = Object.keys(d), e = 0, n = u.length; e < n; e += 1)
        l = u[e], i[l] = d[l];
    return i;
  }
  function h(i, d) {
    var e = "", n;
    for (n = 0; n < d; n += 1)
      e += i;
    return e;
  }
  function s(i) {
    return i === 0 && Number.NEGATIVE_INFINITY === 1 / i;
  }
  return Rr.isNothing = t, Rr.isObject = a, Rr.toArray = c, Rr.repeat = h, Rr.isNegativeZero = s, Rr.extend = o, Rr;
}
var Gi, Sl;
function Ut() {
  if (Sl) return Gi;
  Sl = 1;
  function t(c, o) {
    var h = "", s = c.reason || "(unknown reason)";
    return c.mark ? (c.mark.name && (h += 'in "' + c.mark.name + '" '), h += "(" + (c.mark.line + 1) + ":" + (c.mark.column + 1) + ")", !o && c.mark.snippet && (h += `

` + c.mark.snippet), s + " " + h) : s;
  }
  function a(c, o) {
    Error.call(this), this.name = "YAMLException", this.reason = c, this.mark = o, this.message = t(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
  }
  return a.prototype = Object.create(Error.prototype), a.prototype.constructor = a, a.prototype.toString = function(o) {
    return this.name + ": " + t(this, o);
  }, Gi = a, Gi;
}
var Wi, Rl;
function Vg() {
  if (Rl) return Wi;
  Rl = 1;
  var t = kt();
  function a(h, s, i, d, e) {
    var n = "", l = "", u = Math.floor(e / 2) - 1;
    return d - s > u && (n = " ... ", s = d - u + n.length), i - d > u && (l = " ...", i = d + u - l.length), {
      str: n + h.slice(s, i).replace(/\t/g, "→") + l,
      pos: d - s + n.length
      // relative position
    };
  }
  function c(h, s) {
    return t.repeat(" ", s - h.length) + h;
  }
  function o(h, s) {
    if (s = Object.create(s || null), !h.buffer) return null;
    s.maxLength || (s.maxLength = 79), typeof s.indent != "number" && (s.indent = 1), typeof s.linesBefore != "number" && (s.linesBefore = 3), typeof s.linesAfter != "number" && (s.linesAfter = 2);
    for (var i = /\r?\n|\r|\0/g, d = [0], e = [], n, l = -1; n = i.exec(h.buffer); )
      e.push(n.index), d.push(n.index + n[0].length), h.position <= n.index && l < 0 && (l = d.length - 2);
    l < 0 && (l = d.length - 1);
    var u = "", r, f, p = Math.min(h.line + s.linesAfter, e.length).toString().length, v = s.maxLength - (s.indent + p + 3);
    for (r = 1; r <= s.linesBefore && !(l - r < 0); r++)
      f = a(
        h.buffer,
        d[l - r],
        e[l - r],
        h.position - (d[l] - d[l - r]),
        v
      ), u = t.repeat(" ", s.indent) + c((h.line - r + 1).toString(), p) + " | " + f.str + `
` + u;
    for (f = a(h.buffer, d[l], e[l], h.position, v), u += t.repeat(" ", s.indent) + c((h.line + 1).toString(), p) + " | " + f.str + `
`, u += t.repeat("-", s.indent + p + 3 + f.pos) + `^
`, r = 1; r <= s.linesAfter && !(l + r >= e.length); r++)
      f = a(
        h.buffer,
        d[l + r],
        e[l + r],
        h.position - (d[l] - d[l + r]),
        v
      ), u += t.repeat(" ", s.indent) + c((h.line + r + 1).toString(), p) + " | " + f.str + `
`;
    return u.replace(/\n$/, "");
  }
  return Wi = o, Wi;
}
var zi, Tl;
function Ke() {
  if (Tl) return zi;
  Tl = 1;
  var t = Ut(), a = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ], c = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function o(s) {
    var i = {};
    return s !== null && Object.keys(s).forEach(function(d) {
      s[d].forEach(function(e) {
        i[String(e)] = d;
      });
    }), i;
  }
  function h(s, i) {
    if (i = i || {}, Object.keys(i).forEach(function(d) {
      if (a.indexOf(d) === -1)
        throw new t('Unknown option "' + d + '" is met in definition of "' + s + '" YAML type.');
    }), this.options = i, this.tag = s, this.kind = i.kind || null, this.resolve = i.resolve || function() {
      return !0;
    }, this.construct = i.construct || function(d) {
      return d;
    }, this.instanceOf = i.instanceOf || null, this.predicate = i.predicate || null, this.represent = i.represent || null, this.representName = i.representName || null, this.defaultStyle = i.defaultStyle || null, this.multi = i.multi || !1, this.styleAliases = o(i.styleAliases || null), c.indexOf(this.kind) === -1)
      throw new t('Unknown kind "' + this.kind + '" is specified for "' + s + '" YAML type.');
  }
  return zi = h, zi;
}
var Yi, Al;
function np() {
  if (Al) return Yi;
  Al = 1;
  var t = Ut(), a = Ke();
  function c(s, i) {
    var d = [];
    return s[i].forEach(function(e) {
      var n = d.length;
      d.forEach(function(l, u) {
        l.tag === e.tag && l.kind === e.kind && l.multi === e.multi && (n = u);
      }), d[n] = e;
    }), d;
  }
  function o() {
    var s = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    }, i, d;
    function e(n) {
      n.multi ? (s.multi[n.kind].push(n), s.multi.fallback.push(n)) : s[n.kind][n.tag] = s.fallback[n.tag] = n;
    }
    for (i = 0, d = arguments.length; i < d; i += 1)
      arguments[i].forEach(e);
    return s;
  }
  function h(s) {
    return this.extend(s);
  }
  return h.prototype.extend = function(i) {
    var d = [], e = [];
    if (i instanceof a)
      e.push(i);
    else if (Array.isArray(i))
      e = e.concat(i);
    else if (i && (Array.isArray(i.implicit) || Array.isArray(i.explicit)))
      i.implicit && (d = d.concat(i.implicit)), i.explicit && (e = e.concat(i.explicit));
    else
      throw new t("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    d.forEach(function(l) {
      if (!(l instanceof a))
        throw new t("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      if (l.loadKind && l.loadKind !== "scalar")
        throw new t("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      if (l.multi)
        throw new t("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }), e.forEach(function(l) {
      if (!(l instanceof a))
        throw new t("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    });
    var n = Object.create(h.prototype);
    return n.implicit = (this.implicit || []).concat(d), n.explicit = (this.explicit || []).concat(e), n.compiledImplicit = c(n, "implicit"), n.compiledExplicit = c(n, "explicit"), n.compiledTypeMap = o(n.compiledImplicit, n.compiledExplicit), n;
  }, Yi = h, Yi;
}
var Vi, Ol;
function ip() {
  if (Ol) return Vi;
  Ol = 1;
  var t = Ke();
  return Vi = new t("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(a) {
      return a !== null ? a : "";
    }
  }), Vi;
}
var Xi, Cl;
function ap() {
  if (Cl) return Xi;
  Cl = 1;
  var t = Ke();
  return Xi = new t("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(a) {
      return a !== null ? a : [];
    }
  }), Xi;
}
var Ki, xl;
function op() {
  if (xl) return Ki;
  xl = 1;
  var t = Ke();
  return Ki = new t("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(a) {
      return a !== null ? a : {};
    }
  }), Ki;
}
var Ji, Pl;
function sp() {
  if (Pl) return Ji;
  Pl = 1;
  var t = np();
  return Ji = new t({
    explicit: [
      ip(),
      ap(),
      op()
    ]
  }), Ji;
}
var Qi, Dl;
function up() {
  if (Dl) return Qi;
  Dl = 1;
  var t = Ke();
  function a(h) {
    if (h === null) return !0;
    var s = h.length;
    return s === 1 && h === "~" || s === 4 && (h === "null" || h === "Null" || h === "NULL");
  }
  function c() {
    return null;
  }
  function o(h) {
    return h === null;
  }
  return Qi = new t("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: a,
    construct: c,
    predicate: o,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  }), Qi;
}
var Zi, Il;
function lp() {
  if (Il) return Zi;
  Il = 1;
  var t = Ke();
  function a(h) {
    if (h === null) return !1;
    var s = h.length;
    return s === 4 && (h === "true" || h === "True" || h === "TRUE") || s === 5 && (h === "false" || h === "False" || h === "FALSE");
  }
  function c(h) {
    return h === "true" || h === "True" || h === "TRUE";
  }
  function o(h) {
    return Object.prototype.toString.call(h) === "[object Boolean]";
  }
  return Zi = new t("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: a,
    construct: c,
    predicate: o,
    represent: {
      lowercase: function(h) {
        return h ? "true" : "false";
      },
      uppercase: function(h) {
        return h ? "TRUE" : "FALSE";
      },
      camelcase: function(h) {
        return h ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  }), Zi;
}
var ea, Nl;
function cp() {
  if (Nl) return ea;
  Nl = 1;
  var t = kt(), a = Ke();
  function c(e) {
    return 48 <= e && e <= 57 || 65 <= e && e <= 70 || 97 <= e && e <= 102;
  }
  function o(e) {
    return 48 <= e && e <= 55;
  }
  function h(e) {
    return 48 <= e && e <= 57;
  }
  function s(e) {
    if (e === null) return !1;
    var n = e.length, l = 0, u = !1, r;
    if (!n) return !1;
    if (r = e[l], (r === "-" || r === "+") && (r = e[++l]), r === "0") {
      if (l + 1 === n) return !0;
      if (r = e[++l], r === "b") {
        for (l++; l < n; l++)
          if (r = e[l], r !== "_") {
            if (r !== "0" && r !== "1") return !1;
            u = !0;
          }
        return u && r !== "_";
      }
      if (r === "x") {
        for (l++; l < n; l++)
          if (r = e[l], r !== "_") {
            if (!c(e.charCodeAt(l))) return !1;
            u = !0;
          }
        return u && r !== "_";
      }
      if (r === "o") {
        for (l++; l < n; l++)
          if (r = e[l], r !== "_") {
            if (!o(e.charCodeAt(l))) return !1;
            u = !0;
          }
        return u && r !== "_";
      }
    }
    if (r === "_") return !1;
    for (; l < n; l++)
      if (r = e[l], r !== "_") {
        if (!h(e.charCodeAt(l)))
          return !1;
        u = !0;
      }
    return !(!u || r === "_");
  }
  function i(e) {
    var n = e, l = 1, u;
    if (n.indexOf("_") !== -1 && (n = n.replace(/_/g, "")), u = n[0], (u === "-" || u === "+") && (u === "-" && (l = -1), n = n.slice(1), u = n[0]), n === "0") return 0;
    if (u === "0") {
      if (n[1] === "b") return l * parseInt(n.slice(2), 2);
      if (n[1] === "x") return l * parseInt(n.slice(2), 16);
      if (n[1] === "o") return l * parseInt(n.slice(2), 8);
    }
    return l * parseInt(n, 10);
  }
  function d(e) {
    return Object.prototype.toString.call(e) === "[object Number]" && e % 1 === 0 && !t.isNegativeZero(e);
  }
  return ea = new a("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: s,
    construct: i,
    predicate: d,
    represent: {
      binary: function(e) {
        return e >= 0 ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1);
      },
      octal: function(e) {
        return e >= 0 ? "0o" + e.toString(8) : "-0o" + e.toString(8).slice(1);
      },
      decimal: function(e) {
        return e.toString(10);
      },
      /* eslint-disable max-len */
      hexadecimal: function(e) {
        return e >= 0 ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  }), ea;
}
var ra, Ll;
function fp() {
  if (Ll) return ra;
  Ll = 1;
  var t = kt(), a = Ke(), c = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function o(e) {
    return !(e === null || !c.test(e) || // Quick hack to not allow integers end with `_`
    // Probably should update regexp & check speed
    e[e.length - 1] === "_");
  }
  function h(e) {
    var n, l;
    return n = e.replace(/_/g, "").toLowerCase(), l = n[0] === "-" ? -1 : 1, "+-".indexOf(n[0]) >= 0 && (n = n.slice(1)), n === ".inf" ? l === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : n === ".nan" ? NaN : l * parseFloat(n, 10);
  }
  var s = /^[-+]?[0-9]+e/;
  function i(e, n) {
    var l;
    if (isNaN(e))
      switch (n) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    else if (Number.POSITIVE_INFINITY === e)
      switch (n) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    else if (Number.NEGATIVE_INFINITY === e)
      switch (n) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    else if (t.isNegativeZero(e))
      return "-0.0";
    return l = e.toString(10), s.test(l) ? l.replace("e", ".e") : l;
  }
  function d(e) {
    return Object.prototype.toString.call(e) === "[object Number]" && (e % 1 !== 0 || t.isNegativeZero(e));
  }
  return ra = new a("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: o,
    construct: h,
    predicate: d,
    represent: i,
    defaultStyle: "lowercase"
  }), ra;
}
var ta, Fl;
function dp() {
  return Fl || (Fl = 1, ta = sp().extend({
    implicit: [
      up(),
      lp(),
      cp(),
      fp()
    ]
  })), ta;
}
var na, $l;
function hp() {
  return $l || ($l = 1, na = dp()), na;
}
var ia, ql;
function pp() {
  if (ql) return ia;
  ql = 1;
  var t = Ke(), a = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  ), c = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function o(i) {
    return i === null ? !1 : a.exec(i) !== null || c.exec(i) !== null;
  }
  function h(i) {
    var d, e, n, l, u, r, f, p = 0, v = null, m, g, w;
    if (d = a.exec(i), d === null && (d = c.exec(i)), d === null) throw new Error("Date resolve error");
    if (e = +d[1], n = +d[2] - 1, l = +d[3], !d[4])
      return new Date(Date.UTC(e, n, l));
    if (u = +d[4], r = +d[5], f = +d[6], d[7]) {
      for (p = d[7].slice(0, 3); p.length < 3; )
        p += "0";
      p = +p;
    }
    return d[9] && (m = +d[10], g = +(d[11] || 0), v = (m * 60 + g) * 6e4, d[9] === "-" && (v = -v)), w = new Date(Date.UTC(e, n, l, u, r, f, p)), v && w.setTime(w.getTime() - v), w;
  }
  function s(i) {
    return i.toISOString();
  }
  return ia = new t("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: o,
    construct: h,
    instanceOf: Date,
    represent: s
  }), ia;
}
var aa, Ml;
function mp() {
  if (Ml) return aa;
  Ml = 1;
  var t = Ke();
  function a(c) {
    return c === "<<" || c === null;
  }
  return aa = new t("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: a
  }), aa;
}
var oa, kl;
function gp() {
  if (kl) return oa;
  kl = 1;
  var t = Ke(), a = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function c(i) {
    if (i === null) return !1;
    var d, e, n = 0, l = i.length, u = a;
    for (e = 0; e < l; e++)
      if (d = u.indexOf(i.charAt(e)), !(d > 64)) {
        if (d < 0) return !1;
        n += 6;
      }
    return n % 8 === 0;
  }
  function o(i) {
    var d, e, n = i.replace(/[\r\n=]/g, ""), l = n.length, u = a, r = 0, f = [];
    for (d = 0; d < l; d++)
      d % 4 === 0 && d && (f.push(r >> 16 & 255), f.push(r >> 8 & 255), f.push(r & 255)), r = r << 6 | u.indexOf(n.charAt(d));
    return e = l % 4 * 6, e === 0 ? (f.push(r >> 16 & 255), f.push(r >> 8 & 255), f.push(r & 255)) : e === 18 ? (f.push(r >> 10 & 255), f.push(r >> 2 & 255)) : e === 12 && f.push(r >> 4 & 255), new Uint8Array(f);
  }
  function h(i) {
    var d = "", e = 0, n, l, u = i.length, r = a;
    for (n = 0; n < u; n++)
      n % 3 === 0 && n && (d += r[e >> 18 & 63], d += r[e >> 12 & 63], d += r[e >> 6 & 63], d += r[e & 63]), e = (e << 8) + i[n];
    return l = u % 3, l === 0 ? (d += r[e >> 18 & 63], d += r[e >> 12 & 63], d += r[e >> 6 & 63], d += r[e & 63]) : l === 2 ? (d += r[e >> 10 & 63], d += r[e >> 4 & 63], d += r[e << 2 & 63], d += r[64]) : l === 1 && (d += r[e >> 2 & 63], d += r[e << 4 & 63], d += r[64], d += r[64]), d;
  }
  function s(i) {
    return Object.prototype.toString.call(i) === "[object Uint8Array]";
  }
  return oa = new t("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: c,
    construct: o,
    predicate: s,
    represent: h
  }), oa;
}
var sa, Ul;
function vp() {
  if (Ul) return sa;
  Ul = 1;
  var t = Ke(), a = Object.prototype.hasOwnProperty, c = Object.prototype.toString;
  function o(s) {
    if (s === null) return !0;
    var i = [], d, e, n, l, u, r = s;
    for (d = 0, e = r.length; d < e; d += 1) {
      if (n = r[d], u = !1, c.call(n) !== "[object Object]") return !1;
      for (l in n)
        if (a.call(n, l))
          if (!u) u = !0;
          else return !1;
      if (!u) return !1;
      if (i.indexOf(l) === -1) i.push(l);
      else return !1;
    }
    return !0;
  }
  function h(s) {
    return s !== null ? s : [];
  }
  return sa = new t("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: o,
    construct: h
  }), sa;
}
var ua, jl;
function yp() {
  if (jl) return ua;
  jl = 1;
  var t = Ke(), a = Object.prototype.toString;
  function c(h) {
    if (h === null) return !0;
    var s, i, d, e, n, l = h;
    for (n = new Array(l.length), s = 0, i = l.length; s < i; s += 1) {
      if (d = l[s], a.call(d) !== "[object Object]" || (e = Object.keys(d), e.length !== 1)) return !1;
      n[s] = [e[0], d[e[0]]];
    }
    return !0;
  }
  function o(h) {
    if (h === null) return [];
    var s, i, d, e, n, l = h;
    for (n = new Array(l.length), s = 0, i = l.length; s < i; s += 1)
      d = l[s], e = Object.keys(d), n[s] = [e[0], d[e[0]]];
    return n;
  }
  return ua = new t("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: c,
    construct: o
  }), ua;
}
var la, Bl;
function wp() {
  if (Bl) return la;
  Bl = 1;
  var t = Ke(), a = Object.prototype.hasOwnProperty;
  function c(h) {
    if (h === null) return !0;
    var s, i = h;
    for (s in i)
      if (a.call(i, s) && i[s] !== null)
        return !1;
    return !0;
  }
  function o(h) {
    return h !== null ? h : {};
  }
  return la = new t("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: c,
    construct: o
  }), la;
}
var ca, Hl;
function Hs() {
  return Hl || (Hl = 1, ca = hp().extend({
    implicit: [
      pp(),
      mp()
    ],
    explicit: [
      gp(),
      vp(),
      yp(),
      wp()
    ]
  })), ca;
}
var Gl;
function Xg() {
  if (Gl) return un;
  Gl = 1;
  var t = kt(), a = Ut(), c = Vg(), o = Hs(), h = Object.prototype.hasOwnProperty, s = 1, i = 2, d = 3, e = 4, n = 1, l = 2, u = 3, r = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, f = /[\x85\u2028\u2029]/, p = /[,\[\]\{\}]/, v = /^(?:!|!!|![a-z\-]+!)$/i, m = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
  function g(y) {
    return Object.prototype.toString.call(y);
  }
  function w(y) {
    return y === 10 || y === 13;
  }
  function S(y) {
    return y === 9 || y === 32;
  }
  function O(y) {
    return y === 9 || y === 32 || y === 10 || y === 13;
  }
  function I(y) {
    return y === 44 || y === 91 || y === 93 || y === 123 || y === 125;
  }
  function T(y) {
    var Y;
    return 48 <= y && y <= 57 ? y - 48 : (Y = y | 32, 97 <= Y && Y <= 102 ? Y - 97 + 10 : -1);
  }
  function R(y) {
    return y === 120 ? 2 : y === 117 ? 4 : y === 85 ? 8 : 0;
  }
  function A(y) {
    return 48 <= y && y <= 57 ? y - 48 : -1;
  }
  function b(y) {
    return y === 48 ? "\0" : y === 97 ? "\x07" : y === 98 ? "\b" : y === 116 || y === 9 ? "	" : y === 110 ? `
` : y === 118 ? "\v" : y === 102 ? "\f" : y === 114 ? "\r" : y === 101 ? "\x1B" : y === 32 ? " " : y === 34 ? '"' : y === 47 ? "/" : y === 92 ? "\\" : y === 78 ? "" : y === 95 ? " " : y === 76 ? "\u2028" : y === 80 ? "\u2029" : "";
  }
  function G(y) {
    return y <= 65535 ? String.fromCharCode(y) : String.fromCharCode(
      (y - 65536 >> 10) + 55296,
      (y - 65536 & 1023) + 56320
    );
  }
  for (var j = new Array(256), U = new Array(256), H = 0; H < 256; H++)
    j[H] = b(H) ? 1 : 0, U[H] = b(H);
  function M(y, Y) {
    this.input = y, this.filename = Y.filename || null, this.schema = Y.schema || o, this.onWarning = Y.onWarning || null, this.legacy = Y.legacy || !1, this.json = Y.json || !1, this.listener = Y.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = y.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
  }
  function F(y, Y) {
    var J = {
      name: y.filename,
      buffer: y.input.slice(0, -1),
      // omit trailing \0
      position: y.position,
      line: y.line,
      column: y.position - y.lineStart
    };
    return J.snippet = c(J), new a(Y, J);
  }
  function D(y, Y) {
    throw F(y, Y);
  }
  function $(y, Y) {
    y.onWarning && y.onWarning.call(null, F(y, Y));
  }
  var V = {
    YAML: function(Y, J, fe) {
      var Q, ce, ae;
      Y.version !== null && D(Y, "duplication of %YAML directive"), fe.length !== 1 && D(Y, "YAML directive accepts exactly one argument"), Q = /^([0-9]+)\.([0-9]+)$/.exec(fe[0]), Q === null && D(Y, "ill-formed argument of the YAML directive"), ce = parseInt(Q[1], 10), ae = parseInt(Q[2], 10), ce !== 1 && D(Y, "unacceptable YAML version of the document"), Y.version = fe[0], Y.checkLineBreaks = ae < 2, ae !== 1 && ae !== 2 && $(Y, "unsupported YAML version of the document");
    },
    TAG: function(Y, J, fe) {
      var Q, ce;
      fe.length !== 2 && D(Y, "TAG directive accepts exactly two arguments"), Q = fe[0], ce = fe[1], v.test(Q) || D(Y, "ill-formed tag handle (first argument) of the TAG directive"), h.call(Y.tagMap, Q) && D(Y, 'there is a previously declared suffix for "' + Q + '" tag handle'), m.test(ce) || D(Y, "ill-formed tag prefix (second argument) of the TAG directive");
      try {
        ce = decodeURIComponent(ce);
      } catch {
        D(Y, "tag prefix is malformed: " + ce);
      }
      Y.tagMap[Q] = ce;
    }
  };
  function W(y, Y, J, fe) {
    var Q, ce, ae, de;
    if (Y < J) {
      if (de = y.input.slice(Y, J), fe)
        for (Q = 0, ce = de.length; Q < ce; Q += 1)
          ae = de.charCodeAt(Q), ae === 9 || 32 <= ae && ae <= 1114111 || D(y, "expected valid JSON character");
      else r.test(de) && D(y, "the stream contains non-printable characters");
      y.result += de;
    }
  }
  function re(y, Y, J, fe) {
    var Q, ce, ae, de;
    for (t.isObject(J) || D(y, "cannot merge mappings; the provided source object is unacceptable"), Q = Object.keys(J), ae = 0, de = Q.length; ae < de; ae += 1)
      ce = Q[ae], h.call(Y, ce) || (Y[ce] = J[ce], fe[ce] = !0);
  }
  function ee(y, Y, J, fe, Q, ce, ae, de, be) {
    var Se, Ce;
    if (Array.isArray(Q))
      for (Q = Array.prototype.slice.call(Q), Se = 0, Ce = Q.length; Se < Ce; Se += 1)
        Array.isArray(Q[Se]) && D(y, "nested arrays are not supported inside keys"), typeof Q == "object" && g(Q[Se]) === "[object Object]" && (Q[Se] = "[object Object]");
    if (typeof Q == "object" && g(Q) === "[object Object]" && (Q = "[object Object]"), Q = String(Q), Y === null && (Y = {}), fe === "tag:yaml.org,2002:merge")
      if (Array.isArray(ce))
        for (Se = 0, Ce = ce.length; Se < Ce; Se += 1)
          re(y, Y, ce[Se], J);
      else
        re(y, Y, ce, J);
    else
      !y.json && !h.call(J, Q) && h.call(Y, Q) && (y.line = ae || y.line, y.lineStart = de || y.lineStart, y.position = be || y.position, D(y, "duplicated mapping key")), Q === "__proto__" ? Object.defineProperty(Y, Q, {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        value: ce
      }) : Y[Q] = ce, delete J[Q];
    return Y;
  }
  function oe(y) {
    var Y;
    Y = y.input.charCodeAt(y.position), Y === 10 ? y.position++ : Y === 13 ? (y.position++, y.input.charCodeAt(y.position) === 10 && y.position++) : D(y, "a line break is expected"), y.line += 1, y.lineStart = y.position, y.firstTabInLine = -1;
  }
  function se(y, Y, J) {
    for (var fe = 0, Q = y.input.charCodeAt(y.position); Q !== 0; ) {
      for (; S(Q); )
        Q === 9 && y.firstTabInLine === -1 && (y.firstTabInLine = y.position), Q = y.input.charCodeAt(++y.position);
      if (Y && Q === 35)
        do
          Q = y.input.charCodeAt(++y.position);
        while (Q !== 10 && Q !== 13 && Q !== 0);
      if (w(Q))
        for (oe(y), Q = y.input.charCodeAt(y.position), fe++, y.lineIndent = 0; Q === 32; )
          y.lineIndent++, Q = y.input.charCodeAt(++y.position);
      else
        break;
    }
    return J !== -1 && fe !== 0 && y.lineIndent < J && $(y, "deficient indentation"), fe;
  }
  function ye(y) {
    var Y = y.position, J;
    return J = y.input.charCodeAt(Y), !!((J === 45 || J === 46) && J === y.input.charCodeAt(Y + 1) && J === y.input.charCodeAt(Y + 2) && (Y += 3, J = y.input.charCodeAt(Y), J === 0 || O(J)));
  }
  function X(y, Y) {
    Y === 1 ? y.result += " " : Y > 1 && (y.result += t.repeat(`
`, Y - 1));
  }
  function q(y, Y, J) {
    var fe, Q, ce, ae, de, be, Se, Ce, ve = y.kind, ke = y.result, C;
    if (C = y.input.charCodeAt(y.position), O(C) || I(C) || C === 35 || C === 38 || C === 42 || C === 33 || C === 124 || C === 62 || C === 39 || C === 34 || C === 37 || C === 64 || C === 96 || (C === 63 || C === 45) && (Q = y.input.charCodeAt(y.position + 1), O(Q) || J && I(Q)))
      return !1;
    for (y.kind = "scalar", y.result = "", ce = ae = y.position, de = !1; C !== 0; ) {
      if (C === 58) {
        if (Q = y.input.charCodeAt(y.position + 1), O(Q) || J && I(Q))
          break;
      } else if (C === 35) {
        if (fe = y.input.charCodeAt(y.position - 1), O(fe))
          break;
      } else {
        if (y.position === y.lineStart && ye(y) || J && I(C))
          break;
        if (w(C))
          if (be = y.line, Se = y.lineStart, Ce = y.lineIndent, se(y, !1, -1), y.lineIndent >= Y) {
            de = !0, C = y.input.charCodeAt(y.position);
            continue;
          } else {
            y.position = ae, y.line = be, y.lineStart = Se, y.lineIndent = Ce;
            break;
          }
      }
      de && (W(y, ce, ae, !1), X(y, y.line - be), ce = ae = y.position, de = !1), S(C) || (ae = y.position + 1), C = y.input.charCodeAt(++y.position);
    }
    return W(y, ce, ae, !1), y.result ? !0 : (y.kind = ve, y.result = ke, !1);
  }
  function E(y, Y) {
    var J, fe, Q;
    if (J = y.input.charCodeAt(y.position), J !== 39)
      return !1;
    for (y.kind = "scalar", y.result = "", y.position++, fe = Q = y.position; (J = y.input.charCodeAt(y.position)) !== 0; )
      if (J === 39)
        if (W(y, fe, y.position, !0), J = y.input.charCodeAt(++y.position), J === 39)
          fe = y.position, y.position++, Q = y.position;
        else
          return !0;
      else w(J) ? (W(y, fe, Q, !0), X(y, se(y, !1, Y)), fe = Q = y.position) : y.position === y.lineStart && ye(y) ? D(y, "unexpected end of the document within a single quoted scalar") : (y.position++, Q = y.position);
    D(y, "unexpected end of the stream within a single quoted scalar");
  }
  function _(y, Y) {
    var J, fe, Q, ce, ae, de;
    if (de = y.input.charCodeAt(y.position), de !== 34)
      return !1;
    for (y.kind = "scalar", y.result = "", y.position++, J = fe = y.position; (de = y.input.charCodeAt(y.position)) !== 0; ) {
      if (de === 34)
        return W(y, J, y.position, !0), y.position++, !0;
      if (de === 92) {
        if (W(y, J, y.position, !0), de = y.input.charCodeAt(++y.position), w(de))
          se(y, !1, Y);
        else if (de < 256 && j[de])
          y.result += U[de], y.position++;
        else if ((ae = R(de)) > 0) {
          for (Q = ae, ce = 0; Q > 0; Q--)
            de = y.input.charCodeAt(++y.position), (ae = T(de)) >= 0 ? ce = (ce << 4) + ae : D(y, "expected hexadecimal character");
          y.result += G(ce), y.position++;
        } else
          D(y, "unknown escape sequence");
        J = fe = y.position;
      } else w(de) ? (W(y, J, fe, !0), X(y, se(y, !1, Y)), J = fe = y.position) : y.position === y.lineStart && ye(y) ? D(y, "unexpected end of the document within a double quoted scalar") : (y.position++, fe = y.position);
    }
    D(y, "unexpected end of the stream within a double quoted scalar");
  }
  function k(y, Y) {
    var J = !0, fe, Q, ce, ae = y.tag, de, be = y.anchor, Se, Ce, ve, ke, C, K = /* @__PURE__ */ Object.create(null), ie, Z, ue, le;
    if (le = y.input.charCodeAt(y.position), le === 91)
      Ce = 93, C = !1, de = [];
    else if (le === 123)
      Ce = 125, C = !0, de = {};
    else
      return !1;
    for (y.anchor !== null && (y.anchorMap[y.anchor] = de), le = y.input.charCodeAt(++y.position); le !== 0; ) {
      if (se(y, !0, Y), le = y.input.charCodeAt(y.position), le === Ce)
        return y.position++, y.tag = ae, y.anchor = be, y.kind = C ? "mapping" : "sequence", y.result = de, !0;
      J ? le === 44 && D(y, "expected the node content, but found ','") : D(y, "missed comma between flow collection entries"), Z = ie = ue = null, ve = ke = !1, le === 63 && (Se = y.input.charCodeAt(y.position + 1), O(Se) && (ve = ke = !0, y.position++, se(y, !0, Y))), fe = y.line, Q = y.lineStart, ce = y.position, we(y, Y, s, !1, !0), Z = y.tag, ie = y.result, se(y, !0, Y), le = y.input.charCodeAt(y.position), (ke || y.line === fe) && le === 58 && (ve = !0, le = y.input.charCodeAt(++y.position), se(y, !0, Y), we(y, Y, s, !1, !0), ue = y.result), C ? ee(y, de, K, Z, ie, ue, fe, Q, ce) : ve ? de.push(ee(y, null, K, Z, ie, ue, fe, Q, ce)) : de.push(ie), se(y, !0, Y), le = y.input.charCodeAt(y.position), le === 44 ? (J = !0, le = y.input.charCodeAt(++y.position)) : J = !1;
    }
    D(y, "unexpected end of the stream within a flow collection");
  }
  function L(y, Y) {
    var J, fe, Q = n, ce = !1, ae = !1, de = Y, be = 0, Se = !1, Ce, ve;
    if (ve = y.input.charCodeAt(y.position), ve === 124)
      fe = !1;
    else if (ve === 62)
      fe = !0;
    else
      return !1;
    for (y.kind = "scalar", y.result = ""; ve !== 0; )
      if (ve = y.input.charCodeAt(++y.position), ve === 43 || ve === 45)
        n === Q ? Q = ve === 43 ? u : l : D(y, "repeat of a chomping mode identifier");
      else if ((Ce = A(ve)) >= 0)
        Ce === 0 ? D(y, "bad explicit indentation width of a block scalar; it cannot be less than one") : ae ? D(y, "repeat of an indentation width identifier") : (de = Y + Ce - 1, ae = !0);
      else
        break;
    if (S(ve)) {
      do
        ve = y.input.charCodeAt(++y.position);
      while (S(ve));
      if (ve === 35)
        do
          ve = y.input.charCodeAt(++y.position);
        while (!w(ve) && ve !== 0);
    }
    for (; ve !== 0; ) {
      for (oe(y), y.lineIndent = 0, ve = y.input.charCodeAt(y.position); (!ae || y.lineIndent < de) && ve === 32; )
        y.lineIndent++, ve = y.input.charCodeAt(++y.position);
      if (!ae && y.lineIndent > de && (de = y.lineIndent), w(ve)) {
        be++;
        continue;
      }
      if (y.lineIndent < de) {
        Q === u ? y.result += t.repeat(`
`, ce ? 1 + be : be) : Q === n && ce && (y.result += `
`);
        break;
      }
      for (fe ? S(ve) ? (Se = !0, y.result += t.repeat(`
`, ce ? 1 + be : be)) : Se ? (Se = !1, y.result += t.repeat(`
`, be + 1)) : be === 0 ? ce && (y.result += " ") : y.result += t.repeat(`
`, be) : y.result += t.repeat(`
`, ce ? 1 + be : be), ce = !0, ae = !0, be = 0, J = y.position; !w(ve) && ve !== 0; )
        ve = y.input.charCodeAt(++y.position);
      W(y, J, y.position, !1);
    }
    return !0;
  }
  function x(y, Y) {
    var J, fe = y.tag, Q = y.anchor, ce = [], ae, de = !1, be;
    if (y.firstTabInLine !== -1) return !1;
    for (y.anchor !== null && (y.anchorMap[y.anchor] = ce), be = y.input.charCodeAt(y.position); be !== 0 && (y.firstTabInLine !== -1 && (y.position = y.firstTabInLine, D(y, "tab characters must not be used in indentation")), !(be !== 45 || (ae = y.input.charCodeAt(y.position + 1), !O(ae)))); ) {
      if (de = !0, y.position++, se(y, !0, -1) && y.lineIndent <= Y) {
        ce.push(null), be = y.input.charCodeAt(y.position);
        continue;
      }
      if (J = y.line, we(y, Y, d, !1, !0), ce.push(y.result), se(y, !0, -1), be = y.input.charCodeAt(y.position), (y.line === J || y.lineIndent > Y) && be !== 0)
        D(y, "bad indentation of a sequence entry");
      else if (y.lineIndent < Y)
        break;
    }
    return de ? (y.tag = fe, y.anchor = Q, y.kind = "sequence", y.result = ce, !0) : !1;
  }
  function P(y, Y, J) {
    var fe, Q, ce, ae, de, be, Se = y.tag, Ce = y.anchor, ve = {}, ke = /* @__PURE__ */ Object.create(null), C = null, K = null, ie = null, Z = !1, ue = !1, le;
    if (y.firstTabInLine !== -1) return !1;
    for (y.anchor !== null && (y.anchorMap[y.anchor] = ve), le = y.input.charCodeAt(y.position); le !== 0; ) {
      if (!Z && y.firstTabInLine !== -1 && (y.position = y.firstTabInLine, D(y, "tab characters must not be used in indentation")), fe = y.input.charCodeAt(y.position + 1), ce = y.line, (le === 63 || le === 58) && O(fe))
        le === 63 ? (Z && (ee(y, ve, ke, C, K, null, ae, de, be), C = K = ie = null), ue = !0, Z = !0, Q = !0) : Z ? (Z = !1, Q = !0) : D(y, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), y.position += 1, le = fe;
      else {
        if (ae = y.line, de = y.lineStart, be = y.position, !we(y, J, i, !1, !0))
          break;
        if (y.line === ce) {
          for (le = y.input.charCodeAt(y.position); S(le); )
            le = y.input.charCodeAt(++y.position);
          if (le === 58)
            le = y.input.charCodeAt(++y.position), O(le) || D(y, "a whitespace character is expected after the key-value separator within a block mapping"), Z && (ee(y, ve, ke, C, K, null, ae, de, be), C = K = ie = null), ue = !0, Z = !1, Q = !1, C = y.tag, K = y.result;
          else if (ue)
            D(y, "can not read an implicit mapping pair; a colon is missed");
          else
            return y.tag = Se, y.anchor = Ce, !0;
        } else if (ue)
          D(y, "can not read a block mapping entry; a multiline key may not be an implicit key");
        else
          return y.tag = Se, y.anchor = Ce, !0;
      }
      if ((y.line === ce || y.lineIndent > Y) && (Z && (ae = y.line, de = y.lineStart, be = y.position), we(y, Y, e, !0, Q) && (Z ? K = y.result : ie = y.result), Z || (ee(y, ve, ke, C, K, ie, ae, de, be), C = K = ie = null), se(y, !0, -1), le = y.input.charCodeAt(y.position)), (y.line === ce || y.lineIndent > Y) && le !== 0)
        D(y, "bad indentation of a mapping entry");
      else if (y.lineIndent < Y)
        break;
    }
    return Z && ee(y, ve, ke, C, K, null, ae, de, be), ue && (y.tag = Se, y.anchor = Ce, y.kind = "mapping", y.result = ve), ue;
  }
  function z(y) {
    var Y, J = !1, fe = !1, Q, ce, ae;
    if (ae = y.input.charCodeAt(y.position), ae !== 33) return !1;
    if (y.tag !== null && D(y, "duplication of a tag property"), ae = y.input.charCodeAt(++y.position), ae === 60 ? (J = !0, ae = y.input.charCodeAt(++y.position)) : ae === 33 ? (fe = !0, Q = "!!", ae = y.input.charCodeAt(++y.position)) : Q = "!", Y = y.position, J) {
      do
        ae = y.input.charCodeAt(++y.position);
      while (ae !== 0 && ae !== 62);
      y.position < y.length ? (ce = y.input.slice(Y, y.position), ae = y.input.charCodeAt(++y.position)) : D(y, "unexpected end of the stream within a verbatim tag");
    } else {
      for (; ae !== 0 && !O(ae); )
        ae === 33 && (fe ? D(y, "tag suffix cannot contain exclamation marks") : (Q = y.input.slice(Y - 1, y.position + 1), v.test(Q) || D(y, "named tag handle cannot contain such characters"), fe = !0, Y = y.position + 1)), ae = y.input.charCodeAt(++y.position);
      ce = y.input.slice(Y, y.position), p.test(ce) && D(y, "tag suffix cannot contain flow indicator characters");
    }
    ce && !m.test(ce) && D(y, "tag name cannot contain such characters: " + ce);
    try {
      ce = decodeURIComponent(ce);
    } catch {
      D(y, "tag name is malformed: " + ce);
    }
    return J ? y.tag = ce : h.call(y.tagMap, Q) ? y.tag = y.tagMap[Q] + ce : Q === "!" ? y.tag = "!" + ce : Q === "!!" ? y.tag = "tag:yaml.org,2002:" + ce : D(y, 'undeclared tag handle "' + Q + '"'), !0;
  }
  function te(y) {
    var Y, J;
    if (J = y.input.charCodeAt(y.position), J !== 38) return !1;
    for (y.anchor !== null && D(y, "duplication of an anchor property"), J = y.input.charCodeAt(++y.position), Y = y.position; J !== 0 && !O(J) && !I(J); )
      J = y.input.charCodeAt(++y.position);
    return y.position === Y && D(y, "name of an anchor node must contain at least one character"), y.anchor = y.input.slice(Y, y.position), !0;
  }
  function he(y) {
    var Y, J, fe;
    if (fe = y.input.charCodeAt(y.position), fe !== 42) return !1;
    for (fe = y.input.charCodeAt(++y.position), Y = y.position; fe !== 0 && !O(fe) && !I(fe); )
      fe = y.input.charCodeAt(++y.position);
    return y.position === Y && D(y, "name of an alias node must contain at least one character"), J = y.input.slice(Y, y.position), h.call(y.anchorMap, J) || D(y, 'unidentified alias "' + J + '"'), y.result = y.anchorMap[J], se(y, !0, -1), !0;
  }
  function we(y, Y, J, fe, Q) {
    var ce, ae, de, be = 1, Se = !1, Ce = !1, ve, ke, C, K, ie, Z;
    if (y.listener !== null && y.listener("open", y), y.tag = null, y.anchor = null, y.kind = null, y.result = null, ce = ae = de = e === J || d === J, fe && se(y, !0, -1) && (Se = !0, y.lineIndent > Y ? be = 1 : y.lineIndent === Y ? be = 0 : y.lineIndent < Y && (be = -1)), be === 1)
      for (; z(y) || te(y); )
        se(y, !0, -1) ? (Se = !0, de = ce, y.lineIndent > Y ? be = 1 : y.lineIndent === Y ? be = 0 : y.lineIndent < Y && (be = -1)) : de = !1;
    if (de && (de = Se || Q), (be === 1 || e === J) && (s === J || i === J ? ie = Y : ie = Y + 1, Z = y.position - y.lineStart, be === 1 ? de && (x(y, Z) || P(y, Z, ie)) || k(y, ie) ? Ce = !0 : (ae && L(y, ie) || E(y, ie) || _(y, ie) ? Ce = !0 : he(y) ? (Ce = !0, (y.tag !== null || y.anchor !== null) && D(y, "alias node should not have any properties")) : q(y, ie, s === J) && (Ce = !0, y.tag === null && (y.tag = "?")), y.anchor !== null && (y.anchorMap[y.anchor] = y.result)) : be === 0 && (Ce = de && x(y, Z))), y.tag === null)
      y.anchor !== null && (y.anchorMap[y.anchor] = y.result);
    else if (y.tag === "?") {
      for (y.result !== null && y.kind !== "scalar" && D(y, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + y.kind + '"'), ve = 0, ke = y.implicitTypes.length; ve < ke; ve += 1)
        if (K = y.implicitTypes[ve], K.resolve(y.result)) {
          y.result = K.construct(y.result), y.tag = K.tag, y.anchor !== null && (y.anchorMap[y.anchor] = y.result);
          break;
        }
    } else if (y.tag !== "!") {
      if (h.call(y.typeMap[y.kind || "fallback"], y.tag))
        K = y.typeMap[y.kind || "fallback"][y.tag];
      else
        for (K = null, C = y.typeMap.multi[y.kind || "fallback"], ve = 0, ke = C.length; ve < ke; ve += 1)
          if (y.tag.slice(0, C[ve].tag.length) === C[ve].tag) {
            K = C[ve];
            break;
          }
      K || D(y, "unknown tag !<" + y.tag + ">"), y.result !== null && K.kind !== y.kind && D(y, "unacceptable node kind for !<" + y.tag + '> tag; it should be "' + K.kind + '", not "' + y.kind + '"'), K.resolve(y.result, y.tag) ? (y.result = K.construct(y.result, y.tag), y.anchor !== null && (y.anchorMap[y.anchor] = y.result)) : D(y, "cannot resolve a node with !<" + y.tag + "> explicit tag");
    }
    return y.listener !== null && y.listener("close", y), y.tag !== null || y.anchor !== null || Ce;
  }
  function Ee(y) {
    var Y = y.position, J, fe, Q, ce = !1, ae;
    for (y.version = null, y.checkLineBreaks = y.legacy, y.tagMap = /* @__PURE__ */ Object.create(null), y.anchorMap = /* @__PURE__ */ Object.create(null); (ae = y.input.charCodeAt(y.position)) !== 0 && (se(y, !0, -1), ae = y.input.charCodeAt(y.position), !(y.lineIndent > 0 || ae !== 37)); ) {
      for (ce = !0, ae = y.input.charCodeAt(++y.position), J = y.position; ae !== 0 && !O(ae); )
        ae = y.input.charCodeAt(++y.position);
      for (fe = y.input.slice(J, y.position), Q = [], fe.length < 1 && D(y, "directive name must not be less than one character in length"); ae !== 0; ) {
        for (; S(ae); )
          ae = y.input.charCodeAt(++y.position);
        if (ae === 35) {
          do
            ae = y.input.charCodeAt(++y.position);
          while (ae !== 0 && !w(ae));
          break;
        }
        if (w(ae)) break;
        for (J = y.position; ae !== 0 && !O(ae); )
          ae = y.input.charCodeAt(++y.position);
        Q.push(y.input.slice(J, y.position));
      }
      ae !== 0 && oe(y), h.call(V, fe) ? V[fe](y, fe, Q) : $(y, 'unknown document directive "' + fe + '"');
    }
    if (se(y, !0, -1), y.lineIndent === 0 && y.input.charCodeAt(y.position) === 45 && y.input.charCodeAt(y.position + 1) === 45 && y.input.charCodeAt(y.position + 2) === 45 ? (y.position += 3, se(y, !0, -1)) : ce && D(y, "directives end mark is expected"), we(y, y.lineIndent - 1, e, !1, !0), se(y, !0, -1), y.checkLineBreaks && f.test(y.input.slice(Y, y.position)) && $(y, "non-ASCII line breaks are interpreted as content"), y.documents.push(y.result), y.position === y.lineStart && ye(y)) {
      y.input.charCodeAt(y.position) === 46 && (y.position += 3, se(y, !0, -1));
      return;
    }
    if (y.position < y.length - 1)
      D(y, "end of the stream or a document separator is expected");
    else
      return;
  }
  function Ne(y, Y) {
    y = String(y), Y = Y || {}, y.length !== 0 && (y.charCodeAt(y.length - 1) !== 10 && y.charCodeAt(y.length - 1) !== 13 && (y += `
`), y.charCodeAt(0) === 65279 && (y = y.slice(1)));
    var J = new M(y, Y), fe = y.indexOf("\0");
    for (fe !== -1 && (J.position = fe, D(J, "null byte is not allowed in input")), J.input += "\0"; J.input.charCodeAt(J.position) === 32; )
      J.lineIndent += 1, J.position += 1;
    for (; J.position < J.length - 1; )
      Ee(J);
    return J.documents;
  }
  function ir(y, Y, J) {
    Y !== null && typeof Y == "object" && typeof J > "u" && (J = Y, Y = null);
    var fe = Ne(y, J);
    if (typeof Y != "function")
      return fe;
    for (var Q = 0, ce = fe.length; Q < ce; Q += 1)
      Y(fe[Q]);
  }
  function ar(y, Y) {
    var J = Ne(y, Y);
    if (J.length !== 0) {
      if (J.length === 1)
        return J[0];
      throw new a("expected a single document in the stream, but found more");
    }
  }
  return un.loadAll = ir, un.load = ar, un;
}
var fa = {}, Wl;
function Kg() {
  if (Wl) return fa;
  Wl = 1;
  var t = kt(), a = Ut(), c = Hs(), o = Object.prototype.toString, h = Object.prototype.hasOwnProperty, s = 65279, i = 9, d = 10, e = 13, n = 32, l = 33, u = 34, r = 35, f = 37, p = 38, v = 39, m = 42, g = 44, w = 45, S = 58, O = 61, I = 62, T = 63, R = 64, A = 91, b = 93, G = 96, j = 123, U = 124, H = 125, M = {};
  M[0] = "\\0", M[7] = "\\a", M[8] = "\\b", M[9] = "\\t", M[10] = "\\n", M[11] = "\\v", M[12] = "\\f", M[13] = "\\r", M[27] = "\\e", M[34] = '\\"', M[92] = "\\\\", M[133] = "\\N", M[160] = "\\_", M[8232] = "\\L", M[8233] = "\\P";
  var F = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ], D = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function $(C, K) {
    var ie, Z, ue, le, ge, pe, _e;
    if (K === null) return {};
    for (ie = {}, Z = Object.keys(K), ue = 0, le = Z.length; ue < le; ue += 1)
      ge = Z[ue], pe = String(K[ge]), ge.slice(0, 2) === "!!" && (ge = "tag:yaml.org,2002:" + ge.slice(2)), _e = C.compiledTypeMap.fallback[ge], _e && h.call(_e.styleAliases, pe) && (pe = _e.styleAliases[pe]), ie[ge] = pe;
    return ie;
  }
  function V(C) {
    var K, ie, Z;
    if (K = C.toString(16).toUpperCase(), C <= 255)
      ie = "x", Z = 2;
    else if (C <= 65535)
      ie = "u", Z = 4;
    else if (C <= 4294967295)
      ie = "U", Z = 8;
    else
      throw new a("code point within a string may not be greater than 0xFFFFFFFF");
    return "\\" + ie + t.repeat("0", Z - K.length) + K;
  }
  var W = 1, re = 2;
  function ee(C) {
    this.schema = C.schema || c, this.indent = Math.max(1, C.indent || 2), this.noArrayIndent = C.noArrayIndent || !1, this.skipInvalid = C.skipInvalid || !1, this.flowLevel = t.isNothing(C.flowLevel) ? -1 : C.flowLevel, this.styleMap = $(this.schema, C.styles || null), this.sortKeys = C.sortKeys || !1, this.lineWidth = C.lineWidth || 80, this.noRefs = C.noRefs || !1, this.noCompatMode = C.noCompatMode || !1, this.condenseFlow = C.condenseFlow || !1, this.quotingType = C.quotingType === '"' ? re : W, this.forceQuotes = C.forceQuotes || !1, this.replacer = typeof C.replacer == "function" ? C.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
  }
  function oe(C, K) {
    for (var ie = t.repeat(" ", K), Z = 0, ue = -1, le = "", ge, pe = C.length; Z < pe; )
      ue = C.indexOf(`
`, Z), ue === -1 ? (ge = C.slice(Z), Z = pe) : (ge = C.slice(Z, ue + 1), Z = ue + 1), ge.length && ge !== `
` && (le += ie), le += ge;
    return le;
  }
  function se(C, K) {
    return `
` + t.repeat(" ", C.indent * K);
  }
  function ye(C, K) {
    var ie, Z, ue;
    for (ie = 0, Z = C.implicitTypes.length; ie < Z; ie += 1)
      if (ue = C.implicitTypes[ie], ue.resolve(K))
        return !0;
    return !1;
  }
  function X(C) {
    return C === n || C === i;
  }
  function q(C) {
    return 32 <= C && C <= 126 || 161 <= C && C <= 55295 && C !== 8232 && C !== 8233 || 57344 <= C && C <= 65533 && C !== s || 65536 <= C && C <= 1114111;
  }
  function E(C) {
    return q(C) && C !== s && C !== e && C !== d;
  }
  function _(C, K, ie) {
    var Z = E(C), ue = Z && !X(C);
    return (
      // ns-plain-safe
      (ie ? (
        // c = flow-in
        Z
      ) : Z && C !== g && C !== A && C !== b && C !== j && C !== H) && C !== r && !(K === S && !ue) || E(K) && !X(K) && C === r || K === S && ue
    );
  }
  function k(C) {
    return q(C) && C !== s && !X(C) && C !== w && C !== T && C !== S && C !== g && C !== A && C !== b && C !== j && C !== H && C !== r && C !== p && C !== m && C !== l && C !== U && C !== O && C !== I && C !== v && C !== u && C !== f && C !== R && C !== G;
  }
  function L(C) {
    return !X(C) && C !== S;
  }
  function x(C, K) {
    var ie = C.charCodeAt(K), Z;
    return ie >= 55296 && ie <= 56319 && K + 1 < C.length && (Z = C.charCodeAt(K + 1), Z >= 56320 && Z <= 57343) ? (ie - 55296) * 1024 + Z - 56320 + 65536 : ie;
  }
  function P(C) {
    var K = /^\n* /;
    return K.test(C);
  }
  var z = 1, te = 2, he = 3, we = 4, Ee = 5;
  function Ne(C, K, ie, Z, ue, le, ge, pe) {
    var _e, Re = 0, De = null, Fe = !1, xe = !1, Yr = Z !== -1, lr = -1, Dr = k(x(C, 0)) && L(x(C, C.length - 1));
    if (K || ge)
      for (_e = 0; _e < C.length; Re >= 65536 ? _e += 2 : _e++) {
        if (Re = x(C, _e), !q(Re))
          return Ee;
        Dr = Dr && _(Re, De, pe), De = Re;
      }
    else {
      for (_e = 0; _e < C.length; Re >= 65536 ? _e += 2 : _e++) {
        if (Re = x(C, _e), Re === d)
          Fe = !0, Yr && (xe = xe || // Foldable line = too long, and not more-indented.
          _e - lr - 1 > Z && C[lr + 1] !== " ", lr = _e);
        else if (!q(Re))
          return Ee;
        Dr = Dr && _(Re, De, pe), De = Re;
      }
      xe = xe || Yr && _e - lr - 1 > Z && C[lr + 1] !== " ";
    }
    return !Fe && !xe ? Dr && !ge && !ue(C) ? z : le === re ? Ee : te : ie > 9 && P(C) ? Ee : ge ? le === re ? Ee : te : xe ? we : he;
  }
  function ir(C, K, ie, Z, ue) {
    C.dump = function() {
      if (K.length === 0)
        return C.quotingType === re ? '""' : "''";
      if (!C.noCompatMode && (F.indexOf(K) !== -1 || D.test(K)))
        return C.quotingType === re ? '"' + K + '"' : "'" + K + "'";
      var le = C.indent * Math.max(1, ie), ge = C.lineWidth === -1 ? -1 : Math.max(Math.min(C.lineWidth, 40), C.lineWidth - le), pe = Z || C.flowLevel > -1 && ie >= C.flowLevel;
      function _e(Re) {
        return ye(C, Re);
      }
      switch (Ne(
        K,
        pe,
        C.indent,
        ge,
        _e,
        C.quotingType,
        C.forceQuotes && !Z,
        ue
      )) {
        case z:
          return K;
        case te:
          return "'" + K.replace(/'/g, "''") + "'";
        case he:
          return "|" + ar(K, C.indent) + y(oe(K, le));
        case we:
          return ">" + ar(K, C.indent) + y(oe(Y(K, ge), le));
        case Ee:
          return '"' + fe(K) + '"';
        default:
          throw new a("impossible error: invalid scalar style");
      }
    }();
  }
  function ar(C, K) {
    var ie = P(C) ? String(K) : "", Z = C[C.length - 1] === `
`, ue = Z && (C[C.length - 2] === `
` || C === `
`), le = ue ? "+" : Z ? "" : "-";
    return ie + le + `
`;
  }
  function y(C) {
    return C[C.length - 1] === `
` ? C.slice(0, -1) : C;
  }
  function Y(C, K) {
    for (var ie = /(\n+)([^\n]*)/g, Z = function() {
      var Re = C.indexOf(`
`);
      return Re = Re !== -1 ? Re : C.length, ie.lastIndex = Re, J(C.slice(0, Re), K);
    }(), ue = C[0] === `
` || C[0] === " ", le, ge; ge = ie.exec(C); ) {
      var pe = ge[1], _e = ge[2];
      le = _e[0] === " ", Z += pe + (!ue && !le && _e !== "" ? `
` : "") + J(_e, K), ue = le;
    }
    return Z;
  }
  function J(C, K) {
    if (C === "" || C[0] === " ") return C;
    for (var ie = / [^ ]/g, Z, ue = 0, le, ge = 0, pe = 0, _e = ""; Z = ie.exec(C); )
      pe = Z.index, pe - ue > K && (le = ge > ue ? ge : pe, _e += `
` + C.slice(ue, le), ue = le + 1), ge = pe;
    return _e += `
`, C.length - ue > K && ge > ue ? _e += C.slice(ue, ge) + `
` + C.slice(ge + 1) : _e += C.slice(ue), _e.slice(1);
  }
  function fe(C) {
    for (var K = "", ie = 0, Z, ue = 0; ue < C.length; ie >= 65536 ? ue += 2 : ue++)
      ie = x(C, ue), Z = M[ie], !Z && q(ie) ? (K += C[ue], ie >= 65536 && (K += C[ue + 1])) : K += Z || V(ie);
    return K;
  }
  function Q(C, K, ie) {
    var Z = "", ue = C.tag, le, ge, pe;
    for (le = 0, ge = ie.length; le < ge; le += 1)
      pe = ie[le], C.replacer && (pe = C.replacer.call(ie, String(le), pe)), (Se(C, K, pe, !1, !1) || typeof pe > "u" && Se(C, K, null, !1, !1)) && (Z !== "" && (Z += "," + (C.condenseFlow ? "" : " ")), Z += C.dump);
    C.tag = ue, C.dump = "[" + Z + "]";
  }
  function ce(C, K, ie, Z) {
    var ue = "", le = C.tag, ge, pe, _e;
    for (ge = 0, pe = ie.length; ge < pe; ge += 1)
      _e = ie[ge], C.replacer && (_e = C.replacer.call(ie, String(ge), _e)), (Se(C, K + 1, _e, !0, !0, !1, !0) || typeof _e > "u" && Se(C, K + 1, null, !0, !0, !1, !0)) && ((!Z || ue !== "") && (ue += se(C, K)), C.dump && d === C.dump.charCodeAt(0) ? ue += "-" : ue += "- ", ue += C.dump);
    C.tag = le, C.dump = ue || "[]";
  }
  function ae(C, K, ie) {
    var Z = "", ue = C.tag, le = Object.keys(ie), ge, pe, _e, Re, De;
    for (ge = 0, pe = le.length; ge < pe; ge += 1)
      De = "", Z !== "" && (De += ", "), C.condenseFlow && (De += '"'), _e = le[ge], Re = ie[_e], C.replacer && (Re = C.replacer.call(ie, _e, Re)), Se(C, K, _e, !1, !1) && (C.dump.length > 1024 && (De += "? "), De += C.dump + (C.condenseFlow ? '"' : "") + ":" + (C.condenseFlow ? "" : " "), Se(C, K, Re, !1, !1) && (De += C.dump, Z += De));
    C.tag = ue, C.dump = "{" + Z + "}";
  }
  function de(C, K, ie, Z) {
    var ue = "", le = C.tag, ge = Object.keys(ie), pe, _e, Re, De, Fe, xe;
    if (C.sortKeys === !0)
      ge.sort();
    else if (typeof C.sortKeys == "function")
      ge.sort(C.sortKeys);
    else if (C.sortKeys)
      throw new a("sortKeys must be a boolean or a function");
    for (pe = 0, _e = ge.length; pe < _e; pe += 1)
      xe = "", (!Z || ue !== "") && (xe += se(C, K)), Re = ge[pe], De = ie[Re], C.replacer && (De = C.replacer.call(ie, Re, De)), Se(C, K + 1, Re, !0, !0, !0) && (Fe = C.tag !== null && C.tag !== "?" || C.dump && C.dump.length > 1024, Fe && (C.dump && d === C.dump.charCodeAt(0) ? xe += "?" : xe += "? "), xe += C.dump, Fe && (xe += se(C, K)), Se(C, K + 1, De, !0, Fe) && (C.dump && d === C.dump.charCodeAt(0) ? xe += ":" : xe += ": ", xe += C.dump, ue += xe));
    C.tag = le, C.dump = ue || "{}";
  }
  function be(C, K, ie) {
    var Z, ue, le, ge, pe, _e;
    for (ue = ie ? C.explicitTypes : C.implicitTypes, le = 0, ge = ue.length; le < ge; le += 1)
      if (pe = ue[le], (pe.instanceOf || pe.predicate) && (!pe.instanceOf || typeof K == "object" && K instanceof pe.instanceOf) && (!pe.predicate || pe.predicate(K))) {
        if (ie ? pe.multi && pe.representName ? C.tag = pe.representName(K) : C.tag = pe.tag : C.tag = "?", pe.represent) {
          if (_e = C.styleMap[pe.tag] || pe.defaultStyle, o.call(pe.represent) === "[object Function]")
            Z = pe.represent(K, _e);
          else if (h.call(pe.represent, _e))
            Z = pe.represent[_e](K, _e);
          else
            throw new a("!<" + pe.tag + '> tag resolver accepts not "' + _e + '" style');
          C.dump = Z;
        }
        return !0;
      }
    return !1;
  }
  function Se(C, K, ie, Z, ue, le, ge) {
    C.tag = null, C.dump = ie, be(C, ie, !1) || be(C, ie, !0);
    var pe = o.call(C.dump), _e = Z, Re;
    Z && (Z = C.flowLevel < 0 || C.flowLevel > K);
    var De = pe === "[object Object]" || pe === "[object Array]", Fe, xe;
    if (De && (Fe = C.duplicates.indexOf(ie), xe = Fe !== -1), (C.tag !== null && C.tag !== "?" || xe || C.indent !== 2 && K > 0) && (ue = !1), xe && C.usedDuplicates[Fe])
      C.dump = "*ref_" + Fe;
    else {
      if (De && xe && !C.usedDuplicates[Fe] && (C.usedDuplicates[Fe] = !0), pe === "[object Object]")
        Z && Object.keys(C.dump).length !== 0 ? (de(C, K, C.dump, ue), xe && (C.dump = "&ref_" + Fe + C.dump)) : (ae(C, K, C.dump), xe && (C.dump = "&ref_" + Fe + " " + C.dump));
      else if (pe === "[object Array]")
        Z && C.dump.length !== 0 ? (C.noArrayIndent && !ge && K > 0 ? ce(C, K - 1, C.dump, ue) : ce(C, K, C.dump, ue), xe && (C.dump = "&ref_" + Fe + C.dump)) : (Q(C, K, C.dump), xe && (C.dump = "&ref_" + Fe + " " + C.dump));
      else if (pe === "[object String]")
        C.tag !== "?" && ir(C, C.dump, K, le, _e);
      else {
        if (pe === "[object Undefined]")
          return !1;
        if (C.skipInvalid) return !1;
        throw new a("unacceptable kind of an object to dump " + pe);
      }
      C.tag !== null && C.tag !== "?" && (Re = encodeURI(
        C.tag[0] === "!" ? C.tag.slice(1) : C.tag
      ).replace(/!/g, "%21"), C.tag[0] === "!" ? Re = "!" + Re : Re.slice(0, 18) === "tag:yaml.org,2002:" ? Re = "!!" + Re.slice(18) : Re = "!<" + Re + ">", C.dump = Re + " " + C.dump);
    }
    return !0;
  }
  function Ce(C, K) {
    var ie = [], Z = [], ue, le;
    for (ve(C, ie, Z), ue = 0, le = Z.length; ue < le; ue += 1)
      K.duplicates.push(ie[Z[ue]]);
    K.usedDuplicates = new Array(le);
  }
  function ve(C, K, ie) {
    var Z, ue, le;
    if (C !== null && typeof C == "object")
      if (ue = K.indexOf(C), ue !== -1)
        ie.indexOf(ue) === -1 && ie.push(ue);
      else if (K.push(C), Array.isArray(C))
        for (ue = 0, le = C.length; ue < le; ue += 1)
          ve(C[ue], K, ie);
      else
        for (Z = Object.keys(C), ue = 0, le = Z.length; ue < le; ue += 1)
          ve(C[Z[ue]], K, ie);
  }
  function ke(C, K) {
    K = K || {};
    var ie = new ee(K);
    ie.noRefs || Ce(C, ie);
    var Z = C;
    return ie.replacer && (Z = ie.replacer.call({ "": Z }, "", Z)), Se(ie, 0, Z, !0, !0) ? ie.dump + `
` : "";
  }
  return fa.dump = ke, fa;
}
var zl;
function Gs() {
  if (zl) return Ye;
  zl = 1;
  var t = Xg(), a = Kg();
  function c(o, h) {
    return function() {
      throw new Error("Function yaml." + o + " is removed in js-yaml 4. Use yaml." + h + " instead, which is now safe by default.");
    };
  }
  return Ye.Type = Ke(), Ye.Schema = np(), Ye.FAILSAFE_SCHEMA = sp(), Ye.JSON_SCHEMA = dp(), Ye.CORE_SCHEMA = hp(), Ye.DEFAULT_SCHEMA = Hs(), Ye.load = t.load, Ye.loadAll = t.loadAll, Ye.dump = a.dump, Ye.YAMLException = Ut(), Ye.types = {
    binary: gp(),
    float: fp(),
    map: op(),
    null: up(),
    pairs: yp(),
    set: wp(),
    timestamp: pp(),
    bool: lp(),
    int: cp(),
    merge: mp(),
    omap: vp(),
    seq: ap(),
    str: ip()
  }, Ye.safeLoad = c("safeLoad", "load"), Ye.safeLoadAll = c("safeLoadAll", "loadAll"), Ye.safeDump = c("safeDump", "dump"), Ye;
}
var pt = {}, Yl;
function Jg() {
  if (Yl) return pt;
  Yl = 1, Object.defineProperty(pt, "__esModule", { value: !0 }), pt.Lazy = void 0;
  class t {
    constructor(c) {
      this._value = null, this.creator = c;
    }
    get hasValue() {
      return this.creator == null;
    }
    get value() {
      if (this.creator == null)
        return this._value;
      const c = this.creator();
      return this.value = c, c;
    }
    set value(c) {
      this._value = c, this.creator = null;
    }
  }
  return pt.Lazy = t, pt;
}
var ln = { exports: {} }, da, Vl;
function Kn() {
  if (Vl) return da;
  Vl = 1;
  const t = "2.0.0", a = 256, c = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
  9007199254740991, o = 16, h = a - 6;
  return da = {
    MAX_LENGTH: a,
    MAX_SAFE_COMPONENT_LENGTH: o,
    MAX_SAFE_BUILD_LENGTH: h,
    MAX_SAFE_INTEGER: c,
    RELEASE_TYPES: [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ],
    SEMVER_SPEC_VERSION: t,
    FLAG_INCLUDE_PRERELEASE: 1,
    FLAG_LOOSE: 2
  }, da;
}
var ha, Xl;
function Jn() {
  return Xl || (Xl = 1, ha = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...a) => console.error("SEMVER", ...a) : () => {
  }), ha;
}
var Kl;
function jt() {
  return Kl || (Kl = 1, function(t, a) {
    const {
      MAX_SAFE_COMPONENT_LENGTH: c,
      MAX_SAFE_BUILD_LENGTH: o,
      MAX_LENGTH: h
    } = Kn(), s = Jn();
    a = t.exports = {};
    const i = a.re = [], d = a.safeRe = [], e = a.src = [], n = a.t = {};
    let l = 0;
    const u = "[a-zA-Z0-9-]", r = [
      ["\\s", 1],
      ["\\d", h],
      [u, o]
    ], f = (v) => {
      for (const [m, g] of r)
        v = v.split(`${m}*`).join(`${m}{0,${g}}`).split(`${m}+`).join(`${m}{1,${g}}`);
      return v;
    }, p = (v, m, g) => {
      const w = f(m), S = l++;
      s(v, S, m), n[v] = S, e[S] = m, i[S] = new RegExp(m, g ? "g" : void 0), d[S] = new RegExp(w, g ? "g" : void 0);
    };
    p("NUMERICIDENTIFIER", "0|[1-9]\\d*"), p("NUMERICIDENTIFIERLOOSE", "\\d+"), p("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${u}*`), p("MAINVERSION", `(${e[n.NUMERICIDENTIFIER]})\\.(${e[n.NUMERICIDENTIFIER]})\\.(${e[n.NUMERICIDENTIFIER]})`), p("MAINVERSIONLOOSE", `(${e[n.NUMERICIDENTIFIERLOOSE]})\\.(${e[n.NUMERICIDENTIFIERLOOSE]})\\.(${e[n.NUMERICIDENTIFIERLOOSE]})`), p("PRERELEASEIDENTIFIER", `(?:${e[n.NUMERICIDENTIFIER]}|${e[n.NONNUMERICIDENTIFIER]})`), p("PRERELEASEIDENTIFIERLOOSE", `(?:${e[n.NUMERICIDENTIFIERLOOSE]}|${e[n.NONNUMERICIDENTIFIER]})`), p("PRERELEASE", `(?:-(${e[n.PRERELEASEIDENTIFIER]}(?:\\.${e[n.PRERELEASEIDENTIFIER]})*))`), p("PRERELEASELOOSE", `(?:-?(${e[n.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${e[n.PRERELEASEIDENTIFIERLOOSE]})*))`), p("BUILDIDENTIFIER", `${u}+`), p("BUILD", `(?:\\+(${e[n.BUILDIDENTIFIER]}(?:\\.${e[n.BUILDIDENTIFIER]})*))`), p("FULLPLAIN", `v?${e[n.MAINVERSION]}${e[n.PRERELEASE]}?${e[n.BUILD]}?`), p("FULL", `^${e[n.FULLPLAIN]}$`), p("LOOSEPLAIN", `[v=\\s]*${e[n.MAINVERSIONLOOSE]}${e[n.PRERELEASELOOSE]}?${e[n.BUILD]}?`), p("LOOSE", `^${e[n.LOOSEPLAIN]}$`), p("GTLT", "((?:<|>)?=?)"), p("XRANGEIDENTIFIERLOOSE", `${e[n.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), p("XRANGEIDENTIFIER", `${e[n.NUMERICIDENTIFIER]}|x|X|\\*`), p("XRANGEPLAIN", `[v=\\s]*(${e[n.XRANGEIDENTIFIER]})(?:\\.(${e[n.XRANGEIDENTIFIER]})(?:\\.(${e[n.XRANGEIDENTIFIER]})(?:${e[n.PRERELEASE]})?${e[n.BUILD]}?)?)?`), p("XRANGEPLAINLOOSE", `[v=\\s]*(${e[n.XRANGEIDENTIFIERLOOSE]})(?:\\.(${e[n.XRANGEIDENTIFIERLOOSE]})(?:\\.(${e[n.XRANGEIDENTIFIERLOOSE]})(?:${e[n.PRERELEASELOOSE]})?${e[n.BUILD]}?)?)?`), p("XRANGE", `^${e[n.GTLT]}\\s*${e[n.XRANGEPLAIN]}$`), p("XRANGELOOSE", `^${e[n.GTLT]}\\s*${e[n.XRANGEPLAINLOOSE]}$`), p("COERCEPLAIN", `(^|[^\\d])(\\d{1,${c}})(?:\\.(\\d{1,${c}}))?(?:\\.(\\d{1,${c}}))?`), p("COERCE", `${e[n.COERCEPLAIN]}(?:$|[^\\d])`), p("COERCEFULL", e[n.COERCEPLAIN] + `(?:${e[n.PRERELEASE]})?(?:${e[n.BUILD]})?(?:$|[^\\d])`), p("COERCERTL", e[n.COERCE], !0), p("COERCERTLFULL", e[n.COERCEFULL], !0), p("LONETILDE", "(?:~>?)"), p("TILDETRIM", `(\\s*)${e[n.LONETILDE]}\\s+`, !0), a.tildeTrimReplace = "$1~", p("TILDE", `^${e[n.LONETILDE]}${e[n.XRANGEPLAIN]}$`), p("TILDELOOSE", `^${e[n.LONETILDE]}${e[n.XRANGEPLAINLOOSE]}$`), p("LONECARET", "(?:\\^)"), p("CARETTRIM", `(\\s*)${e[n.LONECARET]}\\s+`, !0), a.caretTrimReplace = "$1^", p("CARET", `^${e[n.LONECARET]}${e[n.XRANGEPLAIN]}$`), p("CARETLOOSE", `^${e[n.LONECARET]}${e[n.XRANGEPLAINLOOSE]}$`), p("COMPARATORLOOSE", `^${e[n.GTLT]}\\s*(${e[n.LOOSEPLAIN]})$|^$`), p("COMPARATOR", `^${e[n.GTLT]}\\s*(${e[n.FULLPLAIN]})$|^$`), p("COMPARATORTRIM", `(\\s*)${e[n.GTLT]}\\s*(${e[n.LOOSEPLAIN]}|${e[n.XRANGEPLAIN]})`, !0), a.comparatorTrimReplace = "$1$2$3", p("HYPHENRANGE", `^\\s*(${e[n.XRANGEPLAIN]})\\s+-\\s+(${e[n.XRANGEPLAIN]})\\s*$`), p("HYPHENRANGELOOSE", `^\\s*(${e[n.XRANGEPLAINLOOSE]})\\s+-\\s+(${e[n.XRANGEPLAINLOOSE]})\\s*$`), p("STAR", "(<|>)?=?\\s*\\*"), p("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), p("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }(ln, ln.exports)), ln.exports;
}
var pa, Jl;
function Ws() {
  if (Jl) return pa;
  Jl = 1;
  const t = Object.freeze({ loose: !0 }), a = Object.freeze({});
  return pa = (o) => o ? typeof o != "object" ? t : o : a, pa;
}
var ma, Ql;
function Ep() {
  if (Ql) return ma;
  Ql = 1;
  const t = /^[0-9]+$/, a = (o, h) => {
    const s = t.test(o), i = t.test(h);
    return s && i && (o = +o, h = +h), o === h ? 0 : s && !i ? -1 : i && !s ? 1 : o < h ? -1 : 1;
  };
  return ma = {
    compareIdentifiers: a,
    rcompareIdentifiers: (o, h) => a(h, o)
  }, ma;
}
var ga, Zl;
function Je() {
  if (Zl) return ga;
  Zl = 1;
  const t = Jn(), { MAX_LENGTH: a, MAX_SAFE_INTEGER: c } = Kn(), { safeRe: o, t: h } = jt(), s = Ws(), { compareIdentifiers: i } = Ep();
  class d {
    constructor(n, l) {
      if (l = s(l), n instanceof d) {
        if (n.loose === !!l.loose && n.includePrerelease === !!l.includePrerelease)
          return n;
        n = n.version;
      } else if (typeof n != "string")
        throw new TypeError(`Invalid version. Must be a string. Got type "${typeof n}".`);
      if (n.length > a)
        throw new TypeError(
          `version is longer than ${a} characters`
        );
      t("SemVer", n, l), this.options = l, this.loose = !!l.loose, this.includePrerelease = !!l.includePrerelease;
      const u = n.trim().match(l.loose ? o[h.LOOSE] : o[h.FULL]);
      if (!u)
        throw new TypeError(`Invalid Version: ${n}`);
      if (this.raw = n, this.major = +u[1], this.minor = +u[2], this.patch = +u[3], this.major > c || this.major < 0)
        throw new TypeError("Invalid major version");
      if (this.minor > c || this.minor < 0)
        throw new TypeError("Invalid minor version");
      if (this.patch > c || this.patch < 0)
        throw new TypeError("Invalid patch version");
      u[4] ? this.prerelease = u[4].split(".").map((r) => {
        if (/^[0-9]+$/.test(r)) {
          const f = +r;
          if (f >= 0 && f < c)
            return f;
        }
        return r;
      }) : this.prerelease = [], this.build = u[5] ? u[5].split(".") : [], this.format();
    }
    format() {
      return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
    }
    toString() {
      return this.version;
    }
    compare(n) {
      if (t("SemVer.compare", this.version, this.options, n), !(n instanceof d)) {
        if (typeof n == "string" && n === this.version)
          return 0;
        n = new d(n, this.options);
      }
      return n.version === this.version ? 0 : this.compareMain(n) || this.comparePre(n);
    }
    compareMain(n) {
      return n instanceof d || (n = new d(n, this.options)), i(this.major, n.major) || i(this.minor, n.minor) || i(this.patch, n.patch);
    }
    comparePre(n) {
      if (n instanceof d || (n = new d(n, this.options)), this.prerelease.length && !n.prerelease.length)
        return -1;
      if (!this.prerelease.length && n.prerelease.length)
        return 1;
      if (!this.prerelease.length && !n.prerelease.length)
        return 0;
      let l = 0;
      do {
        const u = this.prerelease[l], r = n.prerelease[l];
        if (t("prerelease compare", l, u, r), u === void 0 && r === void 0)
          return 0;
        if (r === void 0)
          return 1;
        if (u === void 0)
          return -1;
        if (u === r)
          continue;
        return i(u, r);
      } while (++l);
    }
    compareBuild(n) {
      n instanceof d || (n = new d(n, this.options));
      let l = 0;
      do {
        const u = this.build[l], r = n.build[l];
        if (t("build compare", l, u, r), u === void 0 && r === void 0)
          return 0;
        if (r === void 0)
          return 1;
        if (u === void 0)
          return -1;
        if (u === r)
          continue;
        return i(u, r);
      } while (++l);
    }
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    inc(n, l, u) {
      switch (n) {
        case "premajor":
          this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", l, u);
          break;
        case "preminor":
          this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", l, u);
          break;
        case "prepatch":
          this.prerelease.length = 0, this.inc("patch", l, u), this.inc("pre", l, u);
          break;
        // If the input is a non-prerelease version, this acts the same as
        // prepatch.
        case "prerelease":
          this.prerelease.length === 0 && this.inc("patch", l, u), this.inc("pre", l, u);
          break;
        case "major":
          (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
          break;
        case "minor":
          (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
          break;
        case "patch":
          this.prerelease.length === 0 && this.patch++, this.prerelease = [];
          break;
        // This probably shouldn't be used publicly.
        // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
        case "pre": {
          const r = Number(u) ? 1 : 0;
          if (!l && u === !1)
            throw new Error("invalid increment argument: identifier is empty");
          if (this.prerelease.length === 0)
            this.prerelease = [r];
          else {
            let f = this.prerelease.length;
            for (; --f >= 0; )
              typeof this.prerelease[f] == "number" && (this.prerelease[f]++, f = -2);
            if (f === -1) {
              if (l === this.prerelease.join(".") && u === !1)
                throw new Error("invalid increment argument: identifier already exists");
              this.prerelease.push(r);
            }
          }
          if (l) {
            let f = [l, r];
            u === !1 && (f = [l]), i(this.prerelease[0], l) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = f) : this.prerelease = f;
          }
          break;
        }
        default:
          throw new Error(`invalid increment argument: ${n}`);
      }
      return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
    }
  }
  return ga = d, ga;
}
var va, ec;
function it() {
  if (ec) return va;
  ec = 1;
  const t = Je();
  return va = (c, o, h = !1) => {
    if (c instanceof t)
      return c;
    try {
      return new t(c, o);
    } catch (s) {
      if (!h)
        return null;
      throw s;
    }
  }, va;
}
var ya, rc;
function Qg() {
  if (rc) return ya;
  rc = 1;
  const t = it();
  return ya = (c, o) => {
    const h = t(c, o);
    return h ? h.version : null;
  }, ya;
}
var wa, tc;
function Zg() {
  if (tc) return wa;
  tc = 1;
  const t = it();
  return wa = (c, o) => {
    const h = t(c.trim().replace(/^[=v]+/, ""), o);
    return h ? h.version : null;
  }, wa;
}
var Ea, nc;
function e0() {
  if (nc) return Ea;
  nc = 1;
  const t = Je();
  return Ea = (c, o, h, s, i) => {
    typeof h == "string" && (i = s, s = h, h = void 0);
    try {
      return new t(
        c instanceof t ? c.version : c,
        h
      ).inc(o, s, i).version;
    } catch {
      return null;
    }
  }, Ea;
}
var _a, ic;
function r0() {
  if (ic) return _a;
  ic = 1;
  const t = it();
  return _a = (c, o) => {
    const h = t(c, null, !0), s = t(o, null, !0), i = h.compare(s);
    if (i === 0)
      return null;
    const d = i > 0, e = d ? h : s, n = d ? s : h, l = !!e.prerelease.length;
    if (!!n.prerelease.length && !l)
      return !n.patch && !n.minor ? "major" : e.patch ? "patch" : e.minor ? "minor" : "major";
    const r = l ? "pre" : "";
    return h.major !== s.major ? r + "major" : h.minor !== s.minor ? r + "minor" : h.patch !== s.patch ? r + "patch" : "prerelease";
  }, _a;
}
var ba, ac;
function t0() {
  if (ac) return ba;
  ac = 1;
  const t = Je();
  return ba = (c, o) => new t(c, o).major, ba;
}
var Sa, oc;
function n0() {
  if (oc) return Sa;
  oc = 1;
  const t = Je();
  return Sa = (c, o) => new t(c, o).minor, Sa;
}
var Ra, sc;
function i0() {
  if (sc) return Ra;
  sc = 1;
  const t = Je();
  return Ra = (c, o) => new t(c, o).patch, Ra;
}
var Ta, uc;
function a0() {
  if (uc) return Ta;
  uc = 1;
  const t = it();
  return Ta = (c, o) => {
    const h = t(c, o);
    return h && h.prerelease.length ? h.prerelease : null;
  }, Ta;
}
var Aa, lc;
function dr() {
  if (lc) return Aa;
  lc = 1;
  const t = Je();
  return Aa = (c, o, h) => new t(c, h).compare(new t(o, h)), Aa;
}
var Oa, cc;
function o0() {
  if (cc) return Oa;
  cc = 1;
  const t = dr();
  return Oa = (c, o, h) => t(o, c, h), Oa;
}
var Ca, fc;
function s0() {
  if (fc) return Ca;
  fc = 1;
  const t = dr();
  return Ca = (c, o) => t(c, o, !0), Ca;
}
var xa, dc;
function zs() {
  if (dc) return xa;
  dc = 1;
  const t = Je();
  return xa = (c, o, h) => {
    const s = new t(c, h), i = new t(o, h);
    return s.compare(i) || s.compareBuild(i);
  }, xa;
}
var Pa, hc;
function u0() {
  if (hc) return Pa;
  hc = 1;
  const t = zs();
  return Pa = (c, o) => c.sort((h, s) => t(h, s, o)), Pa;
}
var Da, pc;
function l0() {
  if (pc) return Da;
  pc = 1;
  const t = zs();
  return Da = (c, o) => c.sort((h, s) => t(s, h, o)), Da;
}
var Ia, mc;
function Qn() {
  if (mc) return Ia;
  mc = 1;
  const t = dr();
  return Ia = (c, o, h) => t(c, o, h) > 0, Ia;
}
var Na, gc;
function Ys() {
  if (gc) return Na;
  gc = 1;
  const t = dr();
  return Na = (c, o, h) => t(c, o, h) < 0, Na;
}
var La, vc;
function _p() {
  if (vc) return La;
  vc = 1;
  const t = dr();
  return La = (c, o, h) => t(c, o, h) === 0, La;
}
var Fa, yc;
function bp() {
  if (yc) return Fa;
  yc = 1;
  const t = dr();
  return Fa = (c, o, h) => t(c, o, h) !== 0, Fa;
}
var $a, wc;
function Vs() {
  if (wc) return $a;
  wc = 1;
  const t = dr();
  return $a = (c, o, h) => t(c, o, h) >= 0, $a;
}
var qa, Ec;
function Xs() {
  if (Ec) return qa;
  Ec = 1;
  const t = dr();
  return qa = (c, o, h) => t(c, o, h) <= 0, qa;
}
var Ma, _c;
function Sp() {
  if (_c) return Ma;
  _c = 1;
  const t = _p(), a = bp(), c = Qn(), o = Vs(), h = Ys(), s = Xs();
  return Ma = (d, e, n, l) => {
    switch (e) {
      case "===":
        return typeof d == "object" && (d = d.version), typeof n == "object" && (n = n.version), d === n;
      case "!==":
        return typeof d == "object" && (d = d.version), typeof n == "object" && (n = n.version), d !== n;
      case "":
      case "=":
      case "==":
        return t(d, n, l);
      case "!=":
        return a(d, n, l);
      case ">":
        return c(d, n, l);
      case ">=":
        return o(d, n, l);
      case "<":
        return h(d, n, l);
      case "<=":
        return s(d, n, l);
      default:
        throw new TypeError(`Invalid operator: ${e}`);
    }
  }, Ma;
}
var ka, bc;
function c0() {
  if (bc) return ka;
  bc = 1;
  const t = Je(), a = it(), { safeRe: c, t: o } = jt();
  return ka = (s, i) => {
    if (s instanceof t)
      return s;
    if (typeof s == "number" && (s = String(s)), typeof s != "string")
      return null;
    i = i || {};
    let d = null;
    if (!i.rtl)
      d = s.match(i.includePrerelease ? c[o.COERCEFULL] : c[o.COERCE]);
    else {
      const f = i.includePrerelease ? c[o.COERCERTLFULL] : c[o.COERCERTL];
      let p;
      for (; (p = f.exec(s)) && (!d || d.index + d[0].length !== s.length); )
        (!d || p.index + p[0].length !== d.index + d[0].length) && (d = p), f.lastIndex = p.index + p[1].length + p[2].length;
      f.lastIndex = -1;
    }
    if (d === null)
      return null;
    const e = d[2], n = d[3] || "0", l = d[4] || "0", u = i.includePrerelease && d[5] ? `-${d[5]}` : "", r = i.includePrerelease && d[6] ? `+${d[6]}` : "";
    return a(`${e}.${n}.${l}${u}${r}`, i);
  }, ka;
}
var Ua, Sc;
function f0() {
  if (Sc) return Ua;
  Sc = 1;
  class t {
    constructor() {
      this.max = 1e3, this.map = /* @__PURE__ */ new Map();
    }
    get(c) {
      const o = this.map.get(c);
      if (o !== void 0)
        return this.map.delete(c), this.map.set(c, o), o;
    }
    delete(c) {
      return this.map.delete(c);
    }
    set(c, o) {
      if (!this.delete(c) && o !== void 0) {
        if (this.map.size >= this.max) {
          const s = this.map.keys().next().value;
          this.delete(s);
        }
        this.map.set(c, o);
      }
      return this;
    }
  }
  return Ua = t, Ua;
}
var ja, Rc;
function hr() {
  if (Rc) return ja;
  Rc = 1;
  const t = /\s+/g;
  class a {
    constructor(F, D) {
      if (D = h(D), F instanceof a)
        return F.loose === !!D.loose && F.includePrerelease === !!D.includePrerelease ? F : new a(F.raw, D);
      if (F instanceof s)
        return this.raw = F.value, this.set = [[F]], this.formatted = void 0, this;
      if (this.options = D, this.loose = !!D.loose, this.includePrerelease = !!D.includePrerelease, this.raw = F.trim().replace(t, " "), this.set = this.raw.split("||").map(($) => this.parseRange($.trim())).filter(($) => $.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const $ = this.set[0];
        if (this.set = this.set.filter((V) => !v(V[0])), this.set.length === 0)
          this.set = [$];
        else if (this.set.length > 1) {
          for (const V of this.set)
            if (V.length === 1 && m(V[0])) {
              this.set = [V];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let F = 0; F < this.set.length; F++) {
          F > 0 && (this.formatted += "||");
          const D = this.set[F];
          for (let $ = 0; $ < D.length; $++)
            $ > 0 && (this.formatted += " "), this.formatted += D[$].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(F) {
      const $ = ((this.options.includePrerelease && f) | (this.options.loose && p)) + ":" + F, V = o.get($);
      if (V)
        return V;
      const W = this.options.loose, re = W ? e[n.HYPHENRANGELOOSE] : e[n.HYPHENRANGE];
      F = F.replace(re, U(this.options.includePrerelease)), i("hyphen replace", F), F = F.replace(e[n.COMPARATORTRIM], l), i("comparator trim", F), F = F.replace(e[n.TILDETRIM], u), i("tilde trim", F), F = F.replace(e[n.CARETTRIM], r), i("caret trim", F);
      let ee = F.split(" ").map((X) => w(X, this.options)).join(" ").split(/\s+/).map((X) => j(X, this.options));
      W && (ee = ee.filter((X) => (i("loose invalid filter", X, this.options), !!X.match(e[n.COMPARATORLOOSE])))), i("range list", ee);
      const oe = /* @__PURE__ */ new Map(), se = ee.map((X) => new s(X, this.options));
      for (const X of se) {
        if (v(X))
          return [X];
        oe.set(X.value, X);
      }
      oe.size > 1 && oe.has("") && oe.delete("");
      const ye = [...oe.values()];
      return o.set($, ye), ye;
    }
    intersects(F, D) {
      if (!(F instanceof a))
        throw new TypeError("a Range is required");
      return this.set.some(($) => g($, D) && F.set.some((V) => g(V, D) && $.every((W) => V.every((re) => W.intersects(re, D)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(F) {
      if (!F)
        return !1;
      if (typeof F == "string")
        try {
          F = new d(F, this.options);
        } catch {
          return !1;
        }
      for (let D = 0; D < this.set.length; D++)
        if (H(this.set[D], F, this.options))
          return !0;
      return !1;
    }
  }
  ja = a;
  const c = f0(), o = new c(), h = Ws(), s = Zn(), i = Jn(), d = Je(), {
    safeRe: e,
    t: n,
    comparatorTrimReplace: l,
    tildeTrimReplace: u,
    caretTrimReplace: r
  } = jt(), { FLAG_INCLUDE_PRERELEASE: f, FLAG_LOOSE: p } = Kn(), v = (M) => M.value === "<0.0.0-0", m = (M) => M.value === "", g = (M, F) => {
    let D = !0;
    const $ = M.slice();
    let V = $.pop();
    for (; D && $.length; )
      D = $.every((W) => V.intersects(W, F)), V = $.pop();
    return D;
  }, w = (M, F) => (i("comp", M, F), M = T(M, F), i("caret", M), M = O(M, F), i("tildes", M), M = A(M, F), i("xrange", M), M = G(M, F), i("stars", M), M), S = (M) => !M || M.toLowerCase() === "x" || M === "*", O = (M, F) => M.trim().split(/\s+/).map((D) => I(D, F)).join(" "), I = (M, F) => {
    const D = F.loose ? e[n.TILDELOOSE] : e[n.TILDE];
    return M.replace(D, ($, V, W, re, ee) => {
      i("tilde", M, $, V, W, re, ee);
      let oe;
      return S(V) ? oe = "" : S(W) ? oe = `>=${V}.0.0 <${+V + 1}.0.0-0` : S(re) ? oe = `>=${V}.${W}.0 <${V}.${+W + 1}.0-0` : ee ? (i("replaceTilde pr", ee), oe = `>=${V}.${W}.${re}-${ee} <${V}.${+W + 1}.0-0`) : oe = `>=${V}.${W}.${re} <${V}.${+W + 1}.0-0`, i("tilde return", oe), oe;
    });
  }, T = (M, F) => M.trim().split(/\s+/).map((D) => R(D, F)).join(" "), R = (M, F) => {
    i("caret", M, F);
    const D = F.loose ? e[n.CARETLOOSE] : e[n.CARET], $ = F.includePrerelease ? "-0" : "";
    return M.replace(D, (V, W, re, ee, oe) => {
      i("caret", M, V, W, re, ee, oe);
      let se;
      return S(W) ? se = "" : S(re) ? se = `>=${W}.0.0${$} <${+W + 1}.0.0-0` : S(ee) ? W === "0" ? se = `>=${W}.${re}.0${$} <${W}.${+re + 1}.0-0` : se = `>=${W}.${re}.0${$} <${+W + 1}.0.0-0` : oe ? (i("replaceCaret pr", oe), W === "0" ? re === "0" ? se = `>=${W}.${re}.${ee}-${oe} <${W}.${re}.${+ee + 1}-0` : se = `>=${W}.${re}.${ee}-${oe} <${W}.${+re + 1}.0-0` : se = `>=${W}.${re}.${ee}-${oe} <${+W + 1}.0.0-0`) : (i("no pr"), W === "0" ? re === "0" ? se = `>=${W}.${re}.${ee}${$} <${W}.${re}.${+ee + 1}-0` : se = `>=${W}.${re}.${ee}${$} <${W}.${+re + 1}.0-0` : se = `>=${W}.${re}.${ee} <${+W + 1}.0.0-0`), i("caret return", se), se;
    });
  }, A = (M, F) => (i("replaceXRanges", M, F), M.split(/\s+/).map((D) => b(D, F)).join(" ")), b = (M, F) => {
    M = M.trim();
    const D = F.loose ? e[n.XRANGELOOSE] : e[n.XRANGE];
    return M.replace(D, ($, V, W, re, ee, oe) => {
      i("xRange", M, $, V, W, re, ee, oe);
      const se = S(W), ye = se || S(re), X = ye || S(ee), q = X;
      return V === "=" && q && (V = ""), oe = F.includePrerelease ? "-0" : "", se ? V === ">" || V === "<" ? $ = "<0.0.0-0" : $ = "*" : V && q ? (ye && (re = 0), ee = 0, V === ">" ? (V = ">=", ye ? (W = +W + 1, re = 0, ee = 0) : (re = +re + 1, ee = 0)) : V === "<=" && (V = "<", ye ? W = +W + 1 : re = +re + 1), V === "<" && (oe = "-0"), $ = `${V + W}.${re}.${ee}${oe}`) : ye ? $ = `>=${W}.0.0${oe} <${+W + 1}.0.0-0` : X && ($ = `>=${W}.${re}.0${oe} <${W}.${+re + 1}.0-0`), i("xRange return", $), $;
    });
  }, G = (M, F) => (i("replaceStars", M, F), M.trim().replace(e[n.STAR], "")), j = (M, F) => (i("replaceGTE0", M, F), M.trim().replace(e[F.includePrerelease ? n.GTE0PRE : n.GTE0], "")), U = (M) => (F, D, $, V, W, re, ee, oe, se, ye, X, q) => (S($) ? D = "" : S(V) ? D = `>=${$}.0.0${M ? "-0" : ""}` : S(W) ? D = `>=${$}.${V}.0${M ? "-0" : ""}` : re ? D = `>=${D}` : D = `>=${D}${M ? "-0" : ""}`, S(se) ? oe = "" : S(ye) ? oe = `<${+se + 1}.0.0-0` : S(X) ? oe = `<${se}.${+ye + 1}.0-0` : q ? oe = `<=${se}.${ye}.${X}-${q}` : M ? oe = `<${se}.${ye}.${+X + 1}-0` : oe = `<=${oe}`, `${D} ${oe}`.trim()), H = (M, F, D) => {
    for (let $ = 0; $ < M.length; $++)
      if (!M[$].test(F))
        return !1;
    if (F.prerelease.length && !D.includePrerelease) {
      for (let $ = 0; $ < M.length; $++)
        if (i(M[$].semver), M[$].semver !== s.ANY && M[$].semver.prerelease.length > 0) {
          const V = M[$].semver;
          if (V.major === F.major && V.minor === F.minor && V.patch === F.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return ja;
}
var Ba, Tc;
function Zn() {
  if (Tc) return Ba;
  Tc = 1;
  const t = Symbol("SemVer ANY");
  class a {
    static get ANY() {
      return t;
    }
    constructor(l, u) {
      if (u = c(u), l instanceof a) {
        if (l.loose === !!u.loose)
          return l;
        l = l.value;
      }
      l = l.trim().split(/\s+/).join(" "), i("comparator", l, u), this.options = u, this.loose = !!u.loose, this.parse(l), this.semver === t ? this.value = "" : this.value = this.operator + this.semver.version, i("comp", this);
    }
    parse(l) {
      const u = this.options.loose ? o[h.COMPARATORLOOSE] : o[h.COMPARATOR], r = l.match(u);
      if (!r)
        throw new TypeError(`Invalid comparator: ${l}`);
      this.operator = r[1] !== void 0 ? r[1] : "", this.operator === "=" && (this.operator = ""), r[2] ? this.semver = new d(r[2], this.options.loose) : this.semver = t;
    }
    toString() {
      return this.value;
    }
    test(l) {
      if (i("Comparator.test", l, this.options.loose), this.semver === t || l === t)
        return !0;
      if (typeof l == "string")
        try {
          l = new d(l, this.options);
        } catch {
          return !1;
        }
      return s(l, this.operator, this.semver, this.options);
    }
    intersects(l, u) {
      if (!(l instanceof a))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new e(l.value, u).test(this.value) : l.operator === "" ? l.value === "" ? !0 : new e(this.value, u).test(l.semver) : (u = c(u), u.includePrerelease && (this.value === "<0.0.0-0" || l.value === "<0.0.0-0") || !u.includePrerelease && (this.value.startsWith("<0.0.0") || l.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && l.operator.startsWith(">") || this.operator.startsWith("<") && l.operator.startsWith("<") || this.semver.version === l.semver.version && this.operator.includes("=") && l.operator.includes("=") || s(this.semver, "<", l.semver, u) && this.operator.startsWith(">") && l.operator.startsWith("<") || s(this.semver, ">", l.semver, u) && this.operator.startsWith("<") && l.operator.startsWith(">")));
    }
  }
  Ba = a;
  const c = Ws(), { safeRe: o, t: h } = jt(), s = Sp(), i = Jn(), d = Je(), e = hr();
  return Ba;
}
var Ha, Ac;
function ei() {
  if (Ac) return Ha;
  Ac = 1;
  const t = hr();
  return Ha = (c, o, h) => {
    try {
      o = new t(o, h);
    } catch {
      return !1;
    }
    return o.test(c);
  }, Ha;
}
var Ga, Oc;
function d0() {
  if (Oc) return Ga;
  Oc = 1;
  const t = hr();
  return Ga = (c, o) => new t(c, o).set.map((h) => h.map((s) => s.value).join(" ").trim().split(" ")), Ga;
}
var Wa, Cc;
function h0() {
  if (Cc) return Wa;
  Cc = 1;
  const t = Je(), a = hr();
  return Wa = (o, h, s) => {
    let i = null, d = null, e = null;
    try {
      e = new a(h, s);
    } catch {
      return null;
    }
    return o.forEach((n) => {
      e.test(n) && (!i || d.compare(n) === -1) && (i = n, d = new t(i, s));
    }), i;
  }, Wa;
}
var za, xc;
function p0() {
  if (xc) return za;
  xc = 1;
  const t = Je(), a = hr();
  return za = (o, h, s) => {
    let i = null, d = null, e = null;
    try {
      e = new a(h, s);
    } catch {
      return null;
    }
    return o.forEach((n) => {
      e.test(n) && (!i || d.compare(n) === 1) && (i = n, d = new t(i, s));
    }), i;
  }, za;
}
var Ya, Pc;
function m0() {
  if (Pc) return Ya;
  Pc = 1;
  const t = Je(), a = hr(), c = Qn();
  return Ya = (h, s) => {
    h = new a(h, s);
    let i = new t("0.0.0");
    if (h.test(i) || (i = new t("0.0.0-0"), h.test(i)))
      return i;
    i = null;
    for (let d = 0; d < h.set.length; ++d) {
      const e = h.set[d];
      let n = null;
      e.forEach((l) => {
        const u = new t(l.semver.version);
        switch (l.operator) {
          case ">":
            u.prerelease.length === 0 ? u.patch++ : u.prerelease.push(0), u.raw = u.format();
          /* fallthrough */
          case "":
          case ">=":
            (!n || c(u, n)) && (n = u);
            break;
          case "<":
          case "<=":
            break;
          /* istanbul ignore next */
          default:
            throw new Error(`Unexpected operation: ${l.operator}`);
        }
      }), n && (!i || c(i, n)) && (i = n);
    }
    return i && h.test(i) ? i : null;
  }, Ya;
}
var Va, Dc;
function g0() {
  if (Dc) return Va;
  Dc = 1;
  const t = hr();
  return Va = (c, o) => {
    try {
      return new t(c, o).range || "*";
    } catch {
      return null;
    }
  }, Va;
}
var Xa, Ic;
function Ks() {
  if (Ic) return Xa;
  Ic = 1;
  const t = Je(), a = Zn(), { ANY: c } = a, o = hr(), h = ei(), s = Qn(), i = Ys(), d = Xs(), e = Vs();
  return Xa = (l, u, r, f) => {
    l = new t(l, f), u = new o(u, f);
    let p, v, m, g, w;
    switch (r) {
      case ">":
        p = s, v = d, m = i, g = ">", w = ">=";
        break;
      case "<":
        p = i, v = e, m = s, g = "<", w = "<=";
        break;
      default:
        throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    if (h(l, u, f))
      return !1;
    for (let S = 0; S < u.set.length; ++S) {
      const O = u.set[S];
      let I = null, T = null;
      if (O.forEach((R) => {
        R.semver === c && (R = new a(">=0.0.0")), I = I || R, T = T || R, p(R.semver, I.semver, f) ? I = R : m(R.semver, T.semver, f) && (T = R);
      }), I.operator === g || I.operator === w || (!T.operator || T.operator === g) && v(l, T.semver))
        return !1;
      if (T.operator === w && m(l, T.semver))
        return !1;
    }
    return !0;
  }, Xa;
}
var Ka, Nc;
function v0() {
  if (Nc) return Ka;
  Nc = 1;
  const t = Ks();
  return Ka = (c, o, h) => t(c, o, ">", h), Ka;
}
var Ja, Lc;
function y0() {
  if (Lc) return Ja;
  Lc = 1;
  const t = Ks();
  return Ja = (c, o, h) => t(c, o, "<", h), Ja;
}
var Qa, Fc;
function w0() {
  if (Fc) return Qa;
  Fc = 1;
  const t = hr();
  return Qa = (c, o, h) => (c = new t(c, h), o = new t(o, h), c.intersects(o, h)), Qa;
}
var Za, $c;
function E0() {
  if ($c) return Za;
  $c = 1;
  const t = ei(), a = dr();
  return Za = (c, o, h) => {
    const s = [];
    let i = null, d = null;
    const e = c.sort((r, f) => a(r, f, h));
    for (const r of e)
      t(r, o, h) ? (d = r, i || (i = r)) : (d && s.push([i, d]), d = null, i = null);
    i && s.push([i, null]);
    const n = [];
    for (const [r, f] of s)
      r === f ? n.push(r) : !f && r === e[0] ? n.push("*") : f ? r === e[0] ? n.push(`<=${f}`) : n.push(`${r} - ${f}`) : n.push(`>=${r}`);
    const l = n.join(" || "), u = typeof o.raw == "string" ? o.raw : String(o);
    return l.length < u.length ? l : o;
  }, Za;
}
var eo, qc;
function _0() {
  if (qc) return eo;
  qc = 1;
  const t = hr(), a = Zn(), { ANY: c } = a, o = ei(), h = dr(), s = (u, r, f = {}) => {
    if (u === r)
      return !0;
    u = new t(u, f), r = new t(r, f);
    let p = !1;
    e: for (const v of u.set) {
      for (const m of r.set) {
        const g = e(v, m, f);
        if (p = p || g !== null, g)
          continue e;
      }
      if (p)
        return !1;
    }
    return !0;
  }, i = [new a(">=0.0.0-0")], d = [new a(">=0.0.0")], e = (u, r, f) => {
    if (u === r)
      return !0;
    if (u.length === 1 && u[0].semver === c) {
      if (r.length === 1 && r[0].semver === c)
        return !0;
      f.includePrerelease ? u = i : u = d;
    }
    if (r.length === 1 && r[0].semver === c) {
      if (f.includePrerelease)
        return !0;
      r = d;
    }
    const p = /* @__PURE__ */ new Set();
    let v, m;
    for (const A of u)
      A.operator === ">" || A.operator === ">=" ? v = n(v, A, f) : A.operator === "<" || A.operator === "<=" ? m = l(m, A, f) : p.add(A.semver);
    if (p.size > 1)
      return null;
    let g;
    if (v && m) {
      if (g = h(v.semver, m.semver, f), g > 0)
        return null;
      if (g === 0 && (v.operator !== ">=" || m.operator !== "<="))
        return null;
    }
    for (const A of p) {
      if (v && !o(A, String(v), f) || m && !o(A, String(m), f))
        return null;
      for (const b of r)
        if (!o(A, String(b), f))
          return !1;
      return !0;
    }
    let w, S, O, I, T = m && !f.includePrerelease && m.semver.prerelease.length ? m.semver : !1, R = v && !f.includePrerelease && v.semver.prerelease.length ? v.semver : !1;
    T && T.prerelease.length === 1 && m.operator === "<" && T.prerelease[0] === 0 && (T = !1);
    for (const A of r) {
      if (I = I || A.operator === ">" || A.operator === ">=", O = O || A.operator === "<" || A.operator === "<=", v) {
        if (R && A.semver.prerelease && A.semver.prerelease.length && A.semver.major === R.major && A.semver.minor === R.minor && A.semver.patch === R.patch && (R = !1), A.operator === ">" || A.operator === ">=") {
          if (w = n(v, A, f), w === A && w !== v)
            return !1;
        } else if (v.operator === ">=" && !o(v.semver, String(A), f))
          return !1;
      }
      if (m) {
        if (T && A.semver.prerelease && A.semver.prerelease.length && A.semver.major === T.major && A.semver.minor === T.minor && A.semver.patch === T.patch && (T = !1), A.operator === "<" || A.operator === "<=") {
          if (S = l(m, A, f), S === A && S !== m)
            return !1;
        } else if (m.operator === "<=" && !o(m.semver, String(A), f))
          return !1;
      }
      if (!A.operator && (m || v) && g !== 0)
        return !1;
    }
    return !(v && O && !m && g !== 0 || m && I && !v && g !== 0 || R || T);
  }, n = (u, r, f) => {
    if (!u)
      return r;
    const p = h(u.semver, r.semver, f);
    return p > 0 ? u : p < 0 || r.operator === ">" && u.operator === ">=" ? r : u;
  }, l = (u, r, f) => {
    if (!u)
      return r;
    const p = h(u.semver, r.semver, f);
    return p < 0 ? u : p > 0 || r.operator === "<" && u.operator === "<=" ? r : u;
  };
  return eo = s, eo;
}
var ro, Mc;
function Rp() {
  if (Mc) return ro;
  Mc = 1;
  const t = jt(), a = Kn(), c = Je(), o = Ep(), h = it(), s = Qg(), i = Zg(), d = e0(), e = r0(), n = t0(), l = n0(), u = i0(), r = a0(), f = dr(), p = o0(), v = s0(), m = zs(), g = u0(), w = l0(), S = Qn(), O = Ys(), I = _p(), T = bp(), R = Vs(), A = Xs(), b = Sp(), G = c0(), j = Zn(), U = hr(), H = ei(), M = d0(), F = h0(), D = p0(), $ = m0(), V = g0(), W = Ks(), re = v0(), ee = y0(), oe = w0(), se = E0(), ye = _0();
  return ro = {
    parse: h,
    valid: s,
    clean: i,
    inc: d,
    diff: e,
    major: n,
    minor: l,
    patch: u,
    prerelease: r,
    compare: f,
    rcompare: p,
    compareLoose: v,
    compareBuild: m,
    sort: g,
    rsort: w,
    gt: S,
    lt: O,
    eq: I,
    neq: T,
    gte: R,
    lte: A,
    cmp: b,
    coerce: G,
    Comparator: j,
    Range: U,
    satisfies: H,
    toComparators: M,
    maxSatisfying: F,
    minSatisfying: D,
    minVersion: $,
    validRange: V,
    outside: W,
    gtr: re,
    ltr: ee,
    intersects: oe,
    simplifyRange: se,
    subset: ye,
    SemVer: c,
    re: t.re,
    src: t.src,
    tokens: t.t,
    SEMVER_SPEC_VERSION: a.SEMVER_SPEC_VERSION,
    RELEASE_TYPES: a.RELEASE_TYPES,
    compareIdentifiers: o.compareIdentifiers,
    rcompareIdentifiers: o.rcompareIdentifiers
  }, ro;
}
var Kr = {}, Lt = { exports: {} };
Lt.exports;
var kc;
function b0() {
  return kc || (kc = 1, function(t, a) {
    var c = 200, o = "__lodash_hash_undefined__", h = 1, s = 2, i = 9007199254740991, d = "[object Arguments]", e = "[object Array]", n = "[object AsyncFunction]", l = "[object Boolean]", u = "[object Date]", r = "[object Error]", f = "[object Function]", p = "[object GeneratorFunction]", v = "[object Map]", m = "[object Number]", g = "[object Null]", w = "[object Object]", S = "[object Promise]", O = "[object Proxy]", I = "[object RegExp]", T = "[object Set]", R = "[object String]", A = "[object Symbol]", b = "[object Undefined]", G = "[object WeakMap]", j = "[object ArrayBuffer]", U = "[object DataView]", H = "[object Float32Array]", M = "[object Float64Array]", F = "[object Int8Array]", D = "[object Int16Array]", $ = "[object Int32Array]", V = "[object Uint8Array]", W = "[object Uint8ClampedArray]", re = "[object Uint16Array]", ee = "[object Uint32Array]", oe = /[\\^$.*+?()[\]{}|]/g, se = /^\[object .+?Constructor\]$/, ye = /^(?:0|[1-9]\d*)$/, X = {};
    X[H] = X[M] = X[F] = X[D] = X[$] = X[V] = X[W] = X[re] = X[ee] = !0, X[d] = X[e] = X[j] = X[l] = X[U] = X[u] = X[r] = X[f] = X[v] = X[m] = X[w] = X[I] = X[T] = X[R] = X[G] = !1;
    var q = typeof Xe == "object" && Xe && Xe.Object === Object && Xe, E = typeof self == "object" && self && self.Object === Object && self, _ = q || E || Function("return this")(), k = a && !a.nodeType && a, L = k && !0 && t && !t.nodeType && t, x = L && L.exports === k, P = x && q.process, z = function() {
      try {
        return P && P.binding && P.binding("util");
      } catch {
      }
    }(), te = z && z.isTypedArray;
    function he(N, B) {
      for (var ne = -1, me = N == null ? 0 : N.length, Ie = 0, Te = []; ++ne < me; ) {
        var $e = N[ne];
        B($e, ne, N) && (Te[Ie++] = $e);
      }
      return Te;
    }
    function we(N, B) {
      for (var ne = -1, me = B.length, Ie = N.length; ++ne < me; )
        N[Ie + ne] = B[ne];
      return N;
    }
    function Ee(N, B) {
      for (var ne = -1, me = N == null ? 0 : N.length; ++ne < me; )
        if (B(N[ne], ne, N))
          return !0;
      return !1;
    }
    function Ne(N, B) {
      for (var ne = -1, me = Array(N); ++ne < N; )
        me[ne] = B(ne);
      return me;
    }
    function ir(N) {
      return function(B) {
        return N(B);
      };
    }
    function ar(N, B) {
      return N.has(B);
    }
    function y(N, B) {
      return N == null ? void 0 : N[B];
    }
    function Y(N) {
      var B = -1, ne = Array(N.size);
      return N.forEach(function(me, Ie) {
        ne[++B] = [Ie, me];
      }), ne;
    }
    function J(N, B) {
      return function(ne) {
        return N(B(ne));
      };
    }
    function fe(N) {
      var B = -1, ne = Array(N.size);
      return N.forEach(function(me) {
        ne[++B] = me;
      }), ne;
    }
    var Q = Array.prototype, ce = Function.prototype, ae = Object.prototype, de = _["__core-js_shared__"], be = ce.toString, Se = ae.hasOwnProperty, Ce = function() {
      var N = /[^.]+$/.exec(de && de.keys && de.keys.IE_PROTO || "");
      return N ? "Symbol(src)_1." + N : "";
    }(), ve = ae.toString, ke = RegExp(
      "^" + be.call(Se).replace(oe, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    ), C = x ? _.Buffer : void 0, K = _.Symbol, ie = _.Uint8Array, Z = ae.propertyIsEnumerable, ue = Q.splice, le = K ? K.toStringTag : void 0, ge = Object.getOwnPropertySymbols, pe = C ? C.isBuffer : void 0, _e = J(Object.keys, Object), Re = Vr(_, "DataView"), De = Vr(_, "Map"), Fe = Vr(_, "Promise"), xe = Vr(_, "Set"), Yr = Vr(_, "WeakMap"), lr = Vr(Object, "create"), Dr = Lr(Re), fm = Lr(De), dm = Lr(Fe), hm = Lr(xe), pm = Lr(Yr), fu = K ? K.prototype : void 0, ni = fu ? fu.valueOf : void 0;
    function Ir(N) {
      var B = -1, ne = N == null ? 0 : N.length;
      for (this.clear(); ++B < ne; ) {
        var me = N[B];
        this.set(me[0], me[1]);
      }
    }
    function mm() {
      this.__data__ = lr ? lr(null) : {}, this.size = 0;
    }
    function gm(N) {
      var B = this.has(N) && delete this.__data__[N];
      return this.size -= B ? 1 : 0, B;
    }
    function vm(N) {
      var B = this.__data__;
      if (lr) {
        var ne = B[N];
        return ne === o ? void 0 : ne;
      }
      return Se.call(B, N) ? B[N] : void 0;
    }
    function ym(N) {
      var B = this.__data__;
      return lr ? B[N] !== void 0 : Se.call(B, N);
    }
    function wm(N, B) {
      var ne = this.__data__;
      return this.size += this.has(N) ? 0 : 1, ne[N] = lr && B === void 0 ? o : B, this;
    }
    Ir.prototype.clear = mm, Ir.prototype.delete = gm, Ir.prototype.get = vm, Ir.prototype.has = ym, Ir.prototype.set = wm;
    function vr(N) {
      var B = -1, ne = N == null ? 0 : N.length;
      for (this.clear(); ++B < ne; ) {
        var me = N[B];
        this.set(me[0], me[1]);
      }
    }
    function Em() {
      this.__data__ = [], this.size = 0;
    }
    function _m(N) {
      var B = this.__data__, ne = Yt(B, N);
      if (ne < 0)
        return !1;
      var me = B.length - 1;
      return ne == me ? B.pop() : ue.call(B, ne, 1), --this.size, !0;
    }
    function bm(N) {
      var B = this.__data__, ne = Yt(B, N);
      return ne < 0 ? void 0 : B[ne][1];
    }
    function Sm(N) {
      return Yt(this.__data__, N) > -1;
    }
    function Rm(N, B) {
      var ne = this.__data__, me = Yt(ne, N);
      return me < 0 ? (++this.size, ne.push([N, B])) : ne[me][1] = B, this;
    }
    vr.prototype.clear = Em, vr.prototype.delete = _m, vr.prototype.get = bm, vr.prototype.has = Sm, vr.prototype.set = Rm;
    function Nr(N) {
      var B = -1, ne = N == null ? 0 : N.length;
      for (this.clear(); ++B < ne; ) {
        var me = N[B];
        this.set(me[0], me[1]);
      }
    }
    function Tm() {
      this.size = 0, this.__data__ = {
        hash: new Ir(),
        map: new (De || vr)(),
        string: new Ir()
      };
    }
    function Am(N) {
      var B = Vt(this, N).delete(N);
      return this.size -= B ? 1 : 0, B;
    }
    function Om(N) {
      return Vt(this, N).get(N);
    }
    function Cm(N) {
      return Vt(this, N).has(N);
    }
    function xm(N, B) {
      var ne = Vt(this, N), me = ne.size;
      return ne.set(N, B), this.size += ne.size == me ? 0 : 1, this;
    }
    Nr.prototype.clear = Tm, Nr.prototype.delete = Am, Nr.prototype.get = Om, Nr.prototype.has = Cm, Nr.prototype.set = xm;
    function zt(N) {
      var B = -1, ne = N == null ? 0 : N.length;
      for (this.__data__ = new Nr(); ++B < ne; )
        this.add(N[B]);
    }
    function Pm(N) {
      return this.__data__.set(N, o), this;
    }
    function Dm(N) {
      return this.__data__.has(N);
    }
    zt.prototype.add = zt.prototype.push = Pm, zt.prototype.has = Dm;
    function _r(N) {
      var B = this.__data__ = new vr(N);
      this.size = B.size;
    }
    function Im() {
      this.__data__ = new vr(), this.size = 0;
    }
    function Nm(N) {
      var B = this.__data__, ne = B.delete(N);
      return this.size = B.size, ne;
    }
    function Lm(N) {
      return this.__data__.get(N);
    }
    function Fm(N) {
      return this.__data__.has(N);
    }
    function $m(N, B) {
      var ne = this.__data__;
      if (ne instanceof vr) {
        var me = ne.__data__;
        if (!De || me.length < c - 1)
          return me.push([N, B]), this.size = ++ne.size, this;
        ne = this.__data__ = new Nr(me);
      }
      return ne.set(N, B), this.size = ne.size, this;
    }
    _r.prototype.clear = Im, _r.prototype.delete = Nm, _r.prototype.get = Lm, _r.prototype.has = Fm, _r.prototype.set = $m;
    function qm(N, B) {
      var ne = Xt(N), me = !ne && Qm(N), Ie = !ne && !me && ii(N), Te = !ne && !me && !Ie && Eu(N), $e = ne || me || Ie || Te, je = $e ? Ne(N.length, String) : [], Be = je.length;
      for (var Le in N)
        Se.call(N, Le) && !($e && // Safari 9 has enumerable `arguments.length` in strict mode.
        (Le == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        Ie && (Le == "offset" || Le == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        Te && (Le == "buffer" || Le == "byteLength" || Le == "byteOffset") || // Skip index properties.
        Ym(Le, Be))) && je.push(Le);
      return je;
    }
    function Yt(N, B) {
      for (var ne = N.length; ne--; )
        if (gu(N[ne][0], B))
          return ne;
      return -1;
    }
    function Mm(N, B, ne) {
      var me = B(N);
      return Xt(N) ? me : we(me, ne(N));
    }
    function ut(N) {
      return N == null ? N === void 0 ? b : g : le && le in Object(N) ? Wm(N) : Jm(N);
    }
    function du(N) {
      return lt(N) && ut(N) == d;
    }
    function hu(N, B, ne, me, Ie) {
      return N === B ? !0 : N == null || B == null || !lt(N) && !lt(B) ? N !== N && B !== B : km(N, B, ne, me, hu, Ie);
    }
    function km(N, B, ne, me, Ie, Te) {
      var $e = Xt(N), je = Xt(B), Be = $e ? e : br(N), Le = je ? e : br(B);
      Be = Be == d ? w : Be, Le = Le == d ? w : Le;
      var er = Be == w, cr = Le == w, We = Be == Le;
      if (We && ii(N)) {
        if (!ii(B))
          return !1;
        $e = !0, er = !1;
      }
      if (We && !er)
        return Te || (Te = new _r()), $e || Eu(N) ? pu(N, B, ne, me, Ie, Te) : Hm(N, B, Be, ne, me, Ie, Te);
      if (!(ne & h)) {
        var or = er && Se.call(N, "__wrapped__"), sr = cr && Se.call(B, "__wrapped__");
        if (or || sr) {
          var Sr = or ? N.value() : N, yr = sr ? B.value() : B;
          return Te || (Te = new _r()), Ie(Sr, yr, ne, me, Te);
        }
      }
      return We ? (Te || (Te = new _r()), Gm(N, B, ne, me, Ie, Te)) : !1;
    }
    function Um(N) {
      if (!wu(N) || Xm(N))
        return !1;
      var B = vu(N) ? ke : se;
      return B.test(Lr(N));
    }
    function jm(N) {
      return lt(N) && yu(N.length) && !!X[ut(N)];
    }
    function Bm(N) {
      if (!Km(N))
        return _e(N);
      var B = [];
      for (var ne in Object(N))
        Se.call(N, ne) && ne != "constructor" && B.push(ne);
      return B;
    }
    function pu(N, B, ne, me, Ie, Te) {
      var $e = ne & h, je = N.length, Be = B.length;
      if (je != Be && !($e && Be > je))
        return !1;
      var Le = Te.get(N);
      if (Le && Te.get(B))
        return Le == B;
      var er = -1, cr = !0, We = ne & s ? new zt() : void 0;
      for (Te.set(N, B), Te.set(B, N); ++er < je; ) {
        var or = N[er], sr = B[er];
        if (me)
          var Sr = $e ? me(sr, or, er, B, N, Te) : me(or, sr, er, N, B, Te);
        if (Sr !== void 0) {
          if (Sr)
            continue;
          cr = !1;
          break;
        }
        if (We) {
          if (!Ee(B, function(yr, Fr) {
            if (!ar(We, Fr) && (or === yr || Ie(or, yr, ne, me, Te)))
              return We.push(Fr);
          })) {
            cr = !1;
            break;
          }
        } else if (!(or === sr || Ie(or, sr, ne, me, Te))) {
          cr = !1;
          break;
        }
      }
      return Te.delete(N), Te.delete(B), cr;
    }
    function Hm(N, B, ne, me, Ie, Te, $e) {
      switch (ne) {
        case U:
          if (N.byteLength != B.byteLength || N.byteOffset != B.byteOffset)
            return !1;
          N = N.buffer, B = B.buffer;
        case j:
          return !(N.byteLength != B.byteLength || !Te(new ie(N), new ie(B)));
        case l:
        case u:
        case m:
          return gu(+N, +B);
        case r:
          return N.name == B.name && N.message == B.message;
        case I:
        case R:
          return N == B + "";
        case v:
          var je = Y;
        case T:
          var Be = me & h;
          if (je || (je = fe), N.size != B.size && !Be)
            return !1;
          var Le = $e.get(N);
          if (Le)
            return Le == B;
          me |= s, $e.set(N, B);
          var er = pu(je(N), je(B), me, Ie, Te, $e);
          return $e.delete(N), er;
        case A:
          if (ni)
            return ni.call(N) == ni.call(B);
      }
      return !1;
    }
    function Gm(N, B, ne, me, Ie, Te) {
      var $e = ne & h, je = mu(N), Be = je.length, Le = mu(B), er = Le.length;
      if (Be != er && !$e)
        return !1;
      for (var cr = Be; cr--; ) {
        var We = je[cr];
        if (!($e ? We in B : Se.call(B, We)))
          return !1;
      }
      var or = Te.get(N);
      if (or && Te.get(B))
        return or == B;
      var sr = !0;
      Te.set(N, B), Te.set(B, N);
      for (var Sr = $e; ++cr < Be; ) {
        We = je[cr];
        var yr = N[We], Fr = B[We];
        if (me)
          var _u = $e ? me(Fr, yr, We, B, N, Te) : me(yr, Fr, We, N, B, Te);
        if (!(_u === void 0 ? yr === Fr || Ie(yr, Fr, ne, me, Te) : _u)) {
          sr = !1;
          break;
        }
        Sr || (Sr = We == "constructor");
      }
      if (sr && !Sr) {
        var Kt = N.constructor, Jt = B.constructor;
        Kt != Jt && "constructor" in N && "constructor" in B && !(typeof Kt == "function" && Kt instanceof Kt && typeof Jt == "function" && Jt instanceof Jt) && (sr = !1);
      }
      return Te.delete(N), Te.delete(B), sr;
    }
    function mu(N) {
      return Mm(N, rg, zm);
    }
    function Vt(N, B) {
      var ne = N.__data__;
      return Vm(B) ? ne[typeof B == "string" ? "string" : "hash"] : ne.map;
    }
    function Vr(N, B) {
      var ne = y(N, B);
      return Um(ne) ? ne : void 0;
    }
    function Wm(N) {
      var B = Se.call(N, le), ne = N[le];
      try {
        N[le] = void 0;
        var me = !0;
      } catch {
      }
      var Ie = ve.call(N);
      return me && (B ? N[le] = ne : delete N[le]), Ie;
    }
    var zm = ge ? function(N) {
      return N == null ? [] : (N = Object(N), he(ge(N), function(B) {
        return Z.call(N, B);
      }));
    } : tg, br = ut;
    (Re && br(new Re(new ArrayBuffer(1))) != U || De && br(new De()) != v || Fe && br(Fe.resolve()) != S || xe && br(new xe()) != T || Yr && br(new Yr()) != G) && (br = function(N) {
      var B = ut(N), ne = B == w ? N.constructor : void 0, me = ne ? Lr(ne) : "";
      if (me)
        switch (me) {
          case Dr:
            return U;
          case fm:
            return v;
          case dm:
            return S;
          case hm:
            return T;
          case pm:
            return G;
        }
      return B;
    });
    function Ym(N, B) {
      return B = B ?? i, !!B && (typeof N == "number" || ye.test(N)) && N > -1 && N % 1 == 0 && N < B;
    }
    function Vm(N) {
      var B = typeof N;
      return B == "string" || B == "number" || B == "symbol" || B == "boolean" ? N !== "__proto__" : N === null;
    }
    function Xm(N) {
      return !!Ce && Ce in N;
    }
    function Km(N) {
      var B = N && N.constructor, ne = typeof B == "function" && B.prototype || ae;
      return N === ne;
    }
    function Jm(N) {
      return ve.call(N);
    }
    function Lr(N) {
      if (N != null) {
        try {
          return be.call(N);
        } catch {
        }
        try {
          return N + "";
        } catch {
        }
      }
      return "";
    }
    function gu(N, B) {
      return N === B || N !== N && B !== B;
    }
    var Qm = du(/* @__PURE__ */ function() {
      return arguments;
    }()) ? du : function(N) {
      return lt(N) && Se.call(N, "callee") && !Z.call(N, "callee");
    }, Xt = Array.isArray;
    function Zm(N) {
      return N != null && yu(N.length) && !vu(N);
    }
    var ii = pe || ng;
    function eg(N, B) {
      return hu(N, B);
    }
    function vu(N) {
      if (!wu(N))
        return !1;
      var B = ut(N);
      return B == f || B == p || B == n || B == O;
    }
    function yu(N) {
      return typeof N == "number" && N > -1 && N % 1 == 0 && N <= i;
    }
    function wu(N) {
      var B = typeof N;
      return N != null && (B == "object" || B == "function");
    }
    function lt(N) {
      return N != null && typeof N == "object";
    }
    var Eu = te ? ir(te) : jm;
    function rg(N) {
      return Zm(N) ? qm(N) : Bm(N);
    }
    function tg() {
      return [];
    }
    function ng() {
      return !1;
    }
    t.exports = eg;
  }(Lt, Lt.exports)), Lt.exports;
}
var Uc;
function S0() {
  if (Uc) return Kr;
  Uc = 1, Object.defineProperty(Kr, "__esModule", { value: !0 }), Kr.DownloadedUpdateHelper = void 0, Kr.createTempUpdateFile = d;
  const t = Mt, a = He, c = b0(), o = /* @__PURE__ */ Pr(), h = Ae;
  let s = class {
    constructor(n) {
      this.cacheDir = n, this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, this._downloadedFileInfo = null;
    }
    get downloadedFileInfo() {
      return this._downloadedFileInfo;
    }
    get file() {
      return this._file;
    }
    get packageFile() {
      return this._packageFile;
    }
    get cacheDirForPendingUpdate() {
      return h.join(this.cacheDir, "pending");
    }
    async validateDownloadedPath(n, l, u, r) {
      if (this.versionInfo != null && this.file === n && this.fileInfo != null)
        return c(this.versionInfo, l) && c(this.fileInfo.info, u.info) && await (0, o.pathExists)(n) ? n : null;
      const f = await this.getValidCachedUpdateFile(u, r);
      return f === null ? null : (r.info(`Update has already been downloaded to ${n}).`), this._file = f, f);
    }
    async setDownloadedFile(n, l, u, r, f, p) {
      this._file = n, this._packageFile = l, this.versionInfo = u, this.fileInfo = r, this._downloadedFileInfo = {
        fileName: f,
        sha512: r.info.sha512,
        isAdminRightsRequired: r.info.isAdminRightsRequired === !0
      }, p && await (0, o.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
    }
    async clear() {
      this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
    }
    async cleanCacheDirForPendingUpdate() {
      try {
        await (0, o.emptyDir)(this.cacheDirForPendingUpdate);
      } catch {
      }
    }
    /**
     * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
     * @param fileInfo
     * @param logger
     */
    async getValidCachedUpdateFile(n, l) {
      const u = this.getUpdateInfoFile();
      if (!await (0, o.pathExists)(u))
        return null;
      let f;
      try {
        f = await (0, o.readJson)(u);
      } catch (g) {
        let w = "No cached update info available";
        return g.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), w += ` (error on read: ${g.message})`), l.info(w), null;
      }
      if (!((f == null ? void 0 : f.fileName) !== null))
        return l.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
      if (n.info.sha512 !== f.sha512)
        return l.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${f.sha512}, expected: ${n.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
      const v = h.join(this.cacheDirForPendingUpdate, f.fileName);
      if (!await (0, o.pathExists)(v))
        return l.info("Cached update file doesn't exist"), null;
      const m = await i(v);
      return n.info.sha512 !== m ? (l.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${m}, expected: ${n.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = f, v);
    }
    getUpdateInfoFile() {
      return h.join(this.cacheDirForPendingUpdate, "update-info.json");
    }
  };
  Kr.DownloadedUpdateHelper = s;
  function i(e, n = "sha512", l = "base64", u) {
    return new Promise((r, f) => {
      const p = (0, t.createHash)(n);
      p.on("error", f).setEncoding(l), (0, a.createReadStream)(e, {
        ...u,
        highWaterMark: 1024 * 1024
        /* better to use more memory but hash faster */
      }).on("error", f).on("end", () => {
        p.end(), r(p.read());
      }).pipe(p, { end: !1 });
    });
  }
  async function d(e, n, l) {
    let u = 0, r = h.join(n, e);
    for (let f = 0; f < 3; f++)
      try {
        return await (0, o.unlink)(r), r;
      } catch (p) {
        if (p.code === "ENOENT")
          return r;
        l.warn(`Error on remove temp update file: ${p}`), r = h.join(n, `${u++}-${e}`);
      }
    return r;
  }
  return Kr;
}
var mt = {}, cn = {}, jc;
function R0() {
  if (jc) return cn;
  jc = 1, Object.defineProperty(cn, "__esModule", { value: !0 }), cn.getAppCacheDir = c;
  const t = Ae, a = fr;
  function c() {
    const o = (0, a.homedir)();
    let h;
    return process.platform === "win32" ? h = process.env.LOCALAPPDATA || t.join(o, "AppData", "Local") : process.platform === "darwin" ? h = t.join(o, "Library", "Caches") : h = process.env.XDG_CACHE_HOME || t.join(o, ".cache"), h;
  }
  return cn;
}
var Bc;
function T0() {
  if (Bc) return mt;
  Bc = 1, Object.defineProperty(mt, "__esModule", { value: !0 }), mt.ElectronAppAdapter = void 0;
  const t = Ae, a = R0();
  let c = class {
    constructor(h = jr.app) {
      this.app = h;
    }
    whenReady() {
      return this.app.whenReady();
    }
    get version() {
      return this.app.getVersion();
    }
    get name() {
      return this.app.getName();
    }
    get isPackaged() {
      return this.app.isPackaged === !0;
    }
    get appUpdateConfigPath() {
      return this.isPackaged ? t.join(process.resourcesPath, "app-update.yml") : t.join(this.app.getAppPath(), "dev-app-update.yml");
    }
    get userDataPath() {
      return this.app.getPath("userData");
    }
    get baseCachePath() {
      return (0, a.getAppCacheDir)();
    }
    quit() {
      this.app.quit();
    }
    relaunch() {
      this.app.relaunch();
    }
    onQuit(h) {
      this.app.once("quit", (s, i) => h(i));
    }
  };
  return mt.ElectronAppAdapter = c, mt;
}
var to = {}, Hc;
function A0() {
  return Hc || (Hc = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.ElectronHttpExecutor = t.NET_SESSION_NAME = void 0, t.getNetSession = c;
    const a = Ge();
    t.NET_SESSION_NAME = "electron-updater";
    function c() {
      return jr.session.fromPartition(t.NET_SESSION_NAME, {
        cache: !1
      });
    }
    class o extends a.HttpExecutor {
      constructor(s) {
        super(), this.proxyLoginCallback = s, this.cachedSession = null;
      }
      async download(s, i, d) {
        return await d.cancellationToken.createPromise((e, n, l) => {
          const u = {
            headers: d.headers || void 0,
            redirect: "manual"
          };
          (0, a.configureRequestUrl)(s, u), (0, a.configureRequestOptions)(u), this.doDownload(u, {
            destination: i,
            options: d,
            onCancel: l,
            callback: (r) => {
              r == null ? e(i) : n(r);
            },
            responseHandler: null
          }, 0);
        });
      }
      createRequest(s, i) {
        s.headers && s.headers.Host && (s.host = s.headers.Host, delete s.headers.Host), this.cachedSession == null && (this.cachedSession = c());
        const d = jr.net.request({
          ...s,
          session: this.cachedSession
        });
        return d.on("response", i), this.proxyLoginCallback != null && d.on("login", this.proxyLoginCallback), d;
      }
      addRedirectHandlers(s, i, d, e, n) {
        s.on("redirect", (l, u, r) => {
          s.abort(), e > this.maxRedirects ? d(this.createMaxRedirectError()) : n(a.HttpExecutor.prepareRedirectUrlOptions(r, i));
        });
      }
    }
    t.ElectronHttpExecutor = o;
  }(to)), to;
}
var gt = {}, kr = {}, no, Gc;
function O0() {
  if (Gc) return no;
  Gc = 1;
  var t = 1 / 0, a = "[object Symbol]", c = /[\\^$.*+?()[\]{}|]/g, o = RegExp(c.source), h = typeof Xe == "object" && Xe && Xe.Object === Object && Xe, s = typeof self == "object" && self && self.Object === Object && self, i = h || s || Function("return this")(), d = Object.prototype, e = d.toString, n = i.Symbol, l = n ? n.prototype : void 0, u = l ? l.toString : void 0;
  function r(g) {
    if (typeof g == "string")
      return g;
    if (p(g))
      return u ? u.call(g) : "";
    var w = g + "";
    return w == "0" && 1 / g == -t ? "-0" : w;
  }
  function f(g) {
    return !!g && typeof g == "object";
  }
  function p(g) {
    return typeof g == "symbol" || f(g) && e.call(g) == a;
  }
  function v(g) {
    return g == null ? "" : r(g);
  }
  function m(g) {
    return g = v(g), g && o.test(g) ? g.replace(c, "\\$&") : g;
  }
  return no = m, no;
}
var Wc;
function Wr() {
  if (Wc) return kr;
  Wc = 1, Object.defineProperty(kr, "__esModule", { value: !0 }), kr.newBaseUrl = c, kr.newUrlFromBase = o, kr.getChannelFilename = h, kr.blockmapFiles = s;
  const t = rt, a = O0();
  function c(i) {
    const d = new t.URL(i);
    return d.pathname.endsWith("/") || (d.pathname += "/"), d;
  }
  function o(i, d, e = !1) {
    const n = new t.URL(i, d), l = d.search;
    return l != null && l.length !== 0 ? n.search = l : e && (n.search = `noCache=${Date.now().toString(32)}`), n;
  }
  function h(i) {
    return `${i}.yml`;
  }
  function s(i, d, e) {
    const n = o(`${i.pathname}.blockmap`, i);
    return [o(`${i.pathname.replace(new RegExp(a(e), "g"), d)}.blockmap`, i), n];
  }
  return kr;
}
var wr = {}, zc;
function pr() {
  if (zc) return wr;
  zc = 1, Object.defineProperty(wr, "__esModule", { value: !0 }), wr.Provider = void 0, wr.findFile = h, wr.parseUpdateInfo = s, wr.getFileList = i, wr.resolveFiles = d;
  const t = Ge(), a = Gs(), c = Wr();
  let o = class {
    constructor(n) {
      this.runtimeOptions = n, this.requestHeaders = null, this.executor = n.executor;
    }
    get isUseMultipleRangeRequest() {
      return this.runtimeOptions.isUseMultipleRangeRequest !== !1;
    }
    getChannelFilePrefix() {
      if (this.runtimeOptions.platform === "linux") {
        const n = process.env.TEST_UPDATER_ARCH || process.arch;
        return "-linux" + (n === "x64" ? "" : `-${n}`);
      } else
        return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
    }
    // due to historical reasons for windows we use channel name without platform specifier
    getDefaultChannelName() {
      return this.getCustomChannelName("latest");
    }
    getCustomChannelName(n) {
      return `${n}${this.getChannelFilePrefix()}`;
    }
    get fileExtraDownloadHeaders() {
      return null;
    }
    setRequestHeaders(n) {
      this.requestHeaders = n;
    }
    /**
     * Method to perform API request only to resolve update info, but not to download update.
     */
    httpRequest(n, l, u) {
      return this.executor.request(this.createRequestOptions(n, l), u);
    }
    createRequestOptions(n, l) {
      const u = {};
      return this.requestHeaders == null ? l != null && (u.headers = l) : u.headers = l == null ? this.requestHeaders : { ...this.requestHeaders, ...l }, (0, t.configureRequestUrl)(n, u), u;
    }
  };
  wr.Provider = o;
  function h(e, n, l) {
    if (e.length === 0)
      throw (0, t.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
    const u = e.find((r) => r.url.pathname.toLowerCase().endsWith(`.${n}`));
    return u ?? (l == null ? e[0] : e.find((r) => !l.some((f) => r.url.pathname.toLowerCase().endsWith(`.${f}`))));
  }
  function s(e, n, l) {
    if (e == null)
      throw (0, t.newError)(`Cannot parse update info from ${n} in the latest release artifacts (${l}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    let u;
    try {
      u = (0, a.load)(e);
    } catch (r) {
      throw (0, t.newError)(`Cannot parse update info from ${n} in the latest release artifacts (${l}): ${r.stack || r.message}, rawData: ${e}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    }
    return u;
  }
  function i(e) {
    const n = e.files;
    if (n != null && n.length > 0)
      return n;
    if (e.path != null)
      return [
        {
          url: e.path,
          sha2: e.sha2,
          sha512: e.sha512
        }
      ];
    throw (0, t.newError)(`No files provided: ${(0, t.safeStringifyJson)(e)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
  }
  function d(e, n, l = (u) => u) {
    const r = i(e).map((v) => {
      if (v.sha2 == null && v.sha512 == null)
        throw (0, t.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, t.safeStringifyJson)(v)}`, "ERR_UPDATER_NO_CHECKSUM");
      return {
        url: (0, c.newUrlFromBase)(l(v.url), n),
        info: v
      };
    }), f = e.packages, p = f == null ? null : f[process.arch] || f.ia32;
    return p != null && (r[0].packageInfo = {
      ...p,
      path: (0, c.newUrlFromBase)(l(p.path), n).href
    }), r;
  }
  return wr;
}
var Yc;
function Tp() {
  if (Yc) return gt;
  Yc = 1, Object.defineProperty(gt, "__esModule", { value: !0 }), gt.GenericProvider = void 0;
  const t = Ge(), a = Wr(), c = pr();
  let o = class extends c.Provider {
    constructor(s, i, d) {
      super(d), this.configuration = s, this.updater = i, this.baseUrl = (0, a.newBaseUrl)(this.configuration.url);
    }
    get channel() {
      const s = this.updater.channel || this.configuration.channel;
      return s == null ? this.getDefaultChannelName() : this.getCustomChannelName(s);
    }
    async getLatestVersion() {
      const s = (0, a.getChannelFilename)(this.channel), i = (0, a.newUrlFromBase)(s, this.baseUrl, this.updater.isAddNoCacheQuery);
      for (let d = 0; ; d++)
        try {
          return (0, c.parseUpdateInfo)(await this.httpRequest(i), s, i);
        } catch (e) {
          if (e instanceof t.HttpError && e.statusCode === 404)
            throw (0, t.newError)(`Cannot find channel "${s}" update info: ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
          if (e.code === "ECONNREFUSED" && d < 3) {
            await new Promise((n, l) => {
              try {
                setTimeout(n, 1e3 * d);
              } catch (u) {
                l(u);
              }
            });
            continue;
          }
          throw e;
        }
    }
    resolveFiles(s) {
      return (0, c.resolveFiles)(s, this.baseUrl);
    }
  };
  return gt.GenericProvider = o, gt;
}
var vt = {}, yt = {}, Vc;
function C0() {
  if (Vc) return yt;
  Vc = 1, Object.defineProperty(yt, "__esModule", { value: !0 }), yt.BitbucketProvider = void 0;
  const t = Ge(), a = Wr(), c = pr();
  let o = class extends c.Provider {
    constructor(s, i, d) {
      super({
        ...d,
        isUseMultipleRangeRequest: !1
      }), this.configuration = s, this.updater = i;
      const { owner: e, slug: n } = s;
      this.baseUrl = (0, a.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${e}/${n}/downloads`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "latest";
    }
    async getLatestVersion() {
      const s = new t.CancellationToken(), i = (0, a.getChannelFilename)(this.getCustomChannelName(this.channel)), d = (0, a.newUrlFromBase)(i, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const e = await this.httpRequest(d, void 0, s);
        return (0, c.parseUpdateInfo)(e, i, d);
      } catch (e) {
        throw (0, t.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(s) {
      return (0, c.resolveFiles)(s, this.baseUrl);
    }
    toString() {
      const { owner: s, slug: i } = this.configuration;
      return `Bitbucket (owner: ${s}, slug: ${i}, channel: ${this.channel})`;
    }
  };
  return yt.BitbucketProvider = o, yt;
}
var Tr = {}, Xc;
function Ap() {
  if (Xc) return Tr;
  Xc = 1, Object.defineProperty(Tr, "__esModule", { value: !0 }), Tr.GitHubProvider = Tr.BaseGitHubProvider = void 0, Tr.computeReleaseNotes = n;
  const t = Ge(), a = Rp(), c = rt, o = Wr(), h = pr(), s = /\/tag\/([^/]+)$/;
  class i extends h.Provider {
    constructor(u, r, f) {
      super({
        ...f,
        /* because GitHib uses S3 */
        isUseMultipleRangeRequest: !1
      }), this.options = u, this.baseUrl = (0, o.newBaseUrl)((0, t.githubUrl)(u, r));
      const p = r === "github.com" ? "api.github.com" : r;
      this.baseApiUrl = (0, o.newBaseUrl)((0, t.githubUrl)(u, p));
    }
    computeGithubBasePath(u) {
      const r = this.options.host;
      return r && !["github.com", "api.github.com"].includes(r) ? `/api/v3${u}` : u;
    }
  }
  Tr.BaseGitHubProvider = i;
  let d = class extends i {
    constructor(u, r, f) {
      super(u, "github.com", f), this.options = u, this.updater = r;
    }
    get channel() {
      const u = this.updater.channel || this.options.channel;
      return u == null ? this.getDefaultChannelName() : this.getCustomChannelName(u);
    }
    async getLatestVersion() {
      var u, r, f, p, v;
      const m = new t.CancellationToken(), g = await this.httpRequest((0, o.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
        accept: "application/xml, application/atom+xml, text/xml, */*"
      }, m), w = (0, t.parseXml)(g);
      let S = w.element("entry", !1, "No published versions on GitHub"), O = null;
      try {
        if (this.updater.allowPrerelease) {
          const G = ((u = this.updater) === null || u === void 0 ? void 0 : u.channel) || ((r = a.prerelease(this.updater.currentVersion)) === null || r === void 0 ? void 0 : r[0]) || null;
          if (G === null)
            O = s.exec(S.element("link").attribute("href"))[1];
          else
            for (const j of w.getElements("entry")) {
              const U = s.exec(j.element("link").attribute("href"));
              if (U === null)
                continue;
              const H = U[1], M = ((f = a.prerelease(H)) === null || f === void 0 ? void 0 : f[0]) || null, F = !G || ["alpha", "beta"].includes(G), D = M !== null && !["alpha", "beta"].includes(String(M));
              if (F && !D && !(G === "beta" && M === "alpha")) {
                O = H;
                break;
              }
              if (M && M === G) {
                O = H;
                break;
              }
            }
        } else {
          O = await this.getLatestTagName(m);
          for (const G of w.getElements("entry"))
            if (s.exec(G.element("link").attribute("href"))[1] === O) {
              S = G;
              break;
            }
        }
      } catch (G) {
        throw (0, t.newError)(`Cannot parse releases feed: ${G.stack || G.message},
XML:
${g}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
      }
      if (O == null)
        throw (0, t.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
      let I, T = "", R = "";
      const A = async (G) => {
        T = (0, o.getChannelFilename)(G), R = (0, o.newUrlFromBase)(this.getBaseDownloadPath(String(O), T), this.baseUrl);
        const j = this.createRequestOptions(R);
        try {
          return await this.executor.request(j, m);
        } catch (U) {
          throw U instanceof t.HttpError && U.statusCode === 404 ? (0, t.newError)(`Cannot find ${T} in the latest release artifacts (${R}): ${U.stack || U.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : U;
        }
      };
      try {
        let G = this.channel;
        this.updater.allowPrerelease && (!((p = a.prerelease(O)) === null || p === void 0) && p[0]) && (G = this.getCustomChannelName(String((v = a.prerelease(O)) === null || v === void 0 ? void 0 : v[0]))), I = await A(G);
      } catch (G) {
        if (this.updater.allowPrerelease)
          I = await A(this.getDefaultChannelName());
        else
          throw G;
      }
      const b = (0, h.parseUpdateInfo)(I, T, R);
      return b.releaseName == null && (b.releaseName = S.elementValueOrEmpty("title")), b.releaseNotes == null && (b.releaseNotes = n(this.updater.currentVersion, this.updater.fullChangelog, w, S)), {
        tag: O,
        ...b
      };
    }
    async getLatestTagName(u) {
      const r = this.options, f = r.host == null || r.host === "github.com" ? (0, o.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new c.URL(`${this.computeGithubBasePath(`/repos/${r.owner}/${r.repo}/releases`)}/latest`, this.baseApiUrl);
      try {
        const p = await this.httpRequest(f, { Accept: "application/json" }, u);
        return p == null ? null : JSON.parse(p).tag_name;
      } catch (p) {
        throw (0, t.newError)(`Unable to find latest version on GitHub (${f}), please ensure a production release exists: ${p.stack || p.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return `/${this.options.owner}/${this.options.repo}/releases`;
    }
    resolveFiles(u) {
      return (0, h.resolveFiles)(u, this.baseUrl, (r) => this.getBaseDownloadPath(u.tag, r.replace(/ /g, "-")));
    }
    getBaseDownloadPath(u, r) {
      return `${this.basePath}/download/${u}/${r}`;
    }
  };
  Tr.GitHubProvider = d;
  function e(l) {
    const u = l.elementValueOrEmpty("content");
    return u === "No content." ? "" : u;
  }
  function n(l, u, r, f) {
    if (!u)
      return e(f);
    const p = [];
    for (const v of r.getElements("entry")) {
      const m = /\/tag\/v?([^/]+)$/.exec(v.element("link").attribute("href"))[1];
      a.lt(l, m) && p.push({
        version: m,
        note: e(v)
      });
    }
    return p.sort((v, m) => a.rcompare(v.version, m.version));
  }
  return Tr;
}
var wt = {}, Kc;
function x0() {
  if (Kc) return wt;
  Kc = 1, Object.defineProperty(wt, "__esModule", { value: !0 }), wt.KeygenProvider = void 0;
  const t = Ge(), a = Wr(), c = pr();
  let o = class extends c.Provider {
    constructor(s, i, d) {
      super({
        ...d,
        isUseMultipleRangeRequest: !1
      }), this.configuration = s, this.updater = i, this.baseUrl = (0, a.newBaseUrl)(`https://api.keygen.sh/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "stable";
    }
    async getLatestVersion() {
      const s = new t.CancellationToken(), i = (0, a.getChannelFilename)(this.getCustomChannelName(this.channel)), d = (0, a.newUrlFromBase)(i, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const e = await this.httpRequest(d, {
          Accept: "application/vnd.api+json",
          "Keygen-Version": "1.1"
        }, s);
        return (0, c.parseUpdateInfo)(e, i, d);
      } catch (e) {
        throw (0, t.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(s) {
      return (0, c.resolveFiles)(s, this.baseUrl);
    }
    toString() {
      const { account: s, product: i, platform: d } = this.configuration;
      return `Keygen (account: ${s}, product: ${i}, platform: ${d}, channel: ${this.channel})`;
    }
  };
  return wt.KeygenProvider = o, wt;
}
var Et = {}, Jc;
function P0() {
  if (Jc) return Et;
  Jc = 1, Object.defineProperty(Et, "__esModule", { value: !0 }), Et.PrivateGitHubProvider = void 0;
  const t = Ge(), a = Gs(), c = Ae, o = rt, h = Wr(), s = Ap(), i = pr();
  let d = class extends s.BaseGitHubProvider {
    constructor(n, l, u, r) {
      super(n, "api.github.com", r), this.updater = l, this.token = u;
    }
    createRequestOptions(n, l) {
      const u = super.createRequestOptions(n, l);
      return u.redirect = "manual", u;
    }
    async getLatestVersion() {
      const n = new t.CancellationToken(), l = (0, h.getChannelFilename)(this.getDefaultChannelName()), u = await this.getLatestVersionInfo(n), r = u.assets.find((v) => v.name === l);
      if (r == null)
        throw (0, t.newError)(`Cannot find ${l} in the release ${u.html_url || u.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      const f = new o.URL(r.url);
      let p;
      try {
        p = (0, a.load)(await this.httpRequest(f, this.configureHeaders("application/octet-stream"), n));
      } catch (v) {
        throw v instanceof t.HttpError && v.statusCode === 404 ? (0, t.newError)(`Cannot find ${l} in the latest release artifacts (${f}): ${v.stack || v.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : v;
      }
      return p.assets = u.assets, p;
    }
    get fileExtraDownloadHeaders() {
      return this.configureHeaders("application/octet-stream");
    }
    configureHeaders(n) {
      return {
        accept: n,
        authorization: `token ${this.token}`
      };
    }
    async getLatestVersionInfo(n) {
      const l = this.updater.allowPrerelease;
      let u = this.basePath;
      l || (u = `${u}/latest`);
      const r = (0, h.newUrlFromBase)(u, this.baseUrl);
      try {
        const f = JSON.parse(await this.httpRequest(r, this.configureHeaders("application/vnd.github.v3+json"), n));
        return l ? f.find((p) => p.prerelease) || f[0] : f;
      } catch (f) {
        throw (0, t.newError)(`Unable to find latest version on GitHub (${r}), please ensure a production release exists: ${f.stack || f.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
    }
    resolveFiles(n) {
      return (0, i.getFileList)(n).map((l) => {
        const u = c.posix.basename(l.url).replace(/ /g, "-"), r = n.assets.find((f) => f != null && f.name === u);
        if (r == null)
          throw (0, t.newError)(`Cannot find asset "${u}" in: ${JSON.stringify(n.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
        return {
          url: new o.URL(r.url),
          info: l
        };
      });
    }
  };
  return Et.PrivateGitHubProvider = d, Et;
}
var Qc;
function D0() {
  if (Qc) return vt;
  Qc = 1, Object.defineProperty(vt, "__esModule", { value: !0 }), vt.isUrlProbablySupportMultiRangeRequests = i, vt.createClient = d;
  const t = Ge(), a = C0(), c = Tp(), o = Ap(), h = x0(), s = P0();
  function i(e) {
    return !e.includes("s3.amazonaws.com");
  }
  function d(e, n, l) {
    if (typeof e == "string")
      throw (0, t.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
    const u = e.provider;
    switch (u) {
      case "github": {
        const r = e, f = (r.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || r.token;
        return f == null ? new o.GitHubProvider(r, n, l) : new s.PrivateGitHubProvider(r, n, f, l);
      }
      case "bitbucket":
        return new a.BitbucketProvider(e, n, l);
      case "keygen":
        return new h.KeygenProvider(e, n, l);
      case "s3":
      case "spaces":
        return new c.GenericProvider({
          provider: "generic",
          url: (0, t.getS3LikeProviderBaseUrl)(e),
          channel: e.channel || null
        }, n, {
          ...l,
          // https://github.com/minio/minio/issues/5285#issuecomment-350428955
          isUseMultipleRangeRequest: !1
        });
      case "generic": {
        const r = e;
        return new c.GenericProvider(r, n, {
          ...l,
          isUseMultipleRangeRequest: r.useMultipleRangeRequest !== !1 && i(r.url)
        });
      }
      case "custom": {
        const r = e, f = r.updateProvider;
        if (!f)
          throw (0, t.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
        return new f(r, n, l);
      }
      default:
        throw (0, t.newError)(`Unsupported provider: ${u}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
    }
  }
  return vt;
}
var _t = {}, bt = {}, Jr = {}, Qr = {}, Zc;
function Js() {
  if (Zc) return Qr;
  Zc = 1, Object.defineProperty(Qr, "__esModule", { value: !0 }), Qr.OperationKind = void 0, Qr.computeOperations = a;
  var t;
  (function(i) {
    i[i.COPY = 0] = "COPY", i[i.DOWNLOAD = 1] = "DOWNLOAD";
  })(t || (Qr.OperationKind = t = {}));
  function a(i, d, e) {
    const n = s(i.files), l = s(d.files);
    let u = null;
    const r = d.files[0], f = [], p = r.name, v = n.get(p);
    if (v == null)
      throw new Error(`no file ${p} in old blockmap`);
    const m = l.get(p);
    let g = 0;
    const { checksumToOffset: w, checksumToOldSize: S } = h(n.get(p), v.offset, e);
    let O = r.offset;
    for (let I = 0; I < m.checksums.length; O += m.sizes[I], I++) {
      const T = m.sizes[I], R = m.checksums[I];
      let A = w.get(R);
      A != null && S.get(R) !== T && (e.warn(`Checksum ("${R}") matches, but size differs (old: ${S.get(R)}, new: ${T})`), A = void 0), A === void 0 ? (g++, u != null && u.kind === t.DOWNLOAD && u.end === O ? u.end += T : (u = {
        kind: t.DOWNLOAD,
        start: O,
        end: O + T
        // oldBlocks: null,
      }, o(u, f, R, I))) : u != null && u.kind === t.COPY && u.end === A ? u.end += T : (u = {
        kind: t.COPY,
        start: A,
        end: A + T
        // oldBlocks: [checksum]
      }, o(u, f, R, I));
    }
    return g > 0 && e.info(`File${r.name === "file" ? "" : " " + r.name} has ${g} changed blocks`), f;
  }
  const c = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
  function o(i, d, e, n) {
    if (c && d.length !== 0) {
      const l = d[d.length - 1];
      if (l.kind === i.kind && i.start < l.end && i.start > l.start) {
        const u = [l.start, l.end, i.start, i.end].reduce((r, f) => r < f ? r : f);
        throw new Error(`operation (block index: ${n}, checksum: ${e}, kind: ${t[i.kind]}) overlaps previous operation (checksum: ${e}):
abs: ${l.start} until ${l.end} and ${i.start} until ${i.end}
rel: ${l.start - u} until ${l.end - u} and ${i.start - u} until ${i.end - u}`);
      }
    }
    d.push(i);
  }
  function h(i, d, e) {
    const n = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map();
    let u = d;
    for (let r = 0; r < i.checksums.length; r++) {
      const f = i.checksums[r], p = i.sizes[r], v = l.get(f);
      if (v === void 0)
        n.set(f, u), l.set(f, p);
      else if (e.debug != null) {
        const m = v === p ? "(same size)" : `(size: ${v}, this size: ${p})`;
        e.debug(`${f} duplicated in blockmap ${m}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
      }
      u += p;
    }
    return { checksumToOffset: n, checksumToOldSize: l };
  }
  function s(i) {
    const d = /* @__PURE__ */ new Map();
    for (const e of i)
      d.set(e.name, e);
    return d;
  }
  return Qr;
}
var ef;
function Op() {
  if (ef) return Jr;
  ef = 1, Object.defineProperty(Jr, "__esModule", { value: !0 }), Jr.DataSplitter = void 0, Jr.copyData = i;
  const t = Ge(), a = He, c = Hr, o = Js(), h = Buffer.from(`\r
\r
`);
  var s;
  (function(e) {
    e[e.INIT = 0] = "INIT", e[e.HEADER = 1] = "HEADER", e[e.BODY = 2] = "BODY";
  })(s || (s = {}));
  function i(e, n, l, u, r) {
    const f = (0, a.createReadStream)("", {
      fd: l,
      autoClose: !1,
      start: e.start,
      // end is inclusive
      end: e.end - 1
    });
    f.on("error", u), f.once("end", r), f.pipe(n, {
      end: !1
    });
  }
  let d = class extends c.Writable {
    constructor(n, l, u, r, f, p) {
      super(), this.out = n, this.options = l, this.partIndexToTaskIndex = u, this.partIndexToLength = f, this.finishHandler = p, this.partIndex = -1, this.headerListBuffer = null, this.readState = s.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = r.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
    }
    get isFinished() {
      return this.partIndex === this.partIndexToLength.length;
    }
    // noinspection JSUnusedGlobalSymbols
    _write(n, l, u) {
      if (this.isFinished) {
        console.error(`Trailing ignored data: ${n.length} bytes`);
        return;
      }
      this.handleData(n).then(u).catch(u);
    }
    async handleData(n) {
      let l = 0;
      if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
        throw (0, t.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
      if (this.ignoreByteCount > 0) {
        const u = Math.min(this.ignoreByteCount, n.length);
        this.ignoreByteCount -= u, l = u;
      } else if (this.remainingPartDataCount > 0) {
        const u = Math.min(this.remainingPartDataCount, n.length);
        this.remainingPartDataCount -= u, await this.processPartData(n, 0, u), l = u;
      }
      if (l !== n.length) {
        if (this.readState === s.HEADER) {
          const u = this.searchHeaderListEnd(n, l);
          if (u === -1)
            return;
          l = u, this.readState = s.BODY, this.headerListBuffer = null;
        }
        for (; ; ) {
          if (this.readState === s.BODY)
            this.readState = s.INIT;
          else {
            this.partIndex++;
            let p = this.partIndexToTaskIndex.get(this.partIndex);
            if (p == null)
              if (this.isFinished)
                p = this.options.end;
              else
                throw (0, t.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
            const v = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
            if (v < p)
              await this.copyExistingData(v, p);
            else if (v > p)
              throw (0, t.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
            if (this.isFinished) {
              this.onPartEnd(), this.finishHandler();
              return;
            }
            if (l = this.searchHeaderListEnd(n, l), l === -1) {
              this.readState = s.HEADER;
              return;
            }
          }
          const u = this.partIndexToLength[this.partIndex], r = l + u, f = Math.min(r, n.length);
          if (await this.processPartStarted(n, l, f), this.remainingPartDataCount = u - (f - l), this.remainingPartDataCount > 0)
            return;
          if (l = r + this.boundaryLength, l >= n.length) {
            this.ignoreByteCount = this.boundaryLength - (n.length - r);
            return;
          }
        }
      }
    }
    copyExistingData(n, l) {
      return new Promise((u, r) => {
        const f = () => {
          if (n === l) {
            u();
            return;
          }
          const p = this.options.tasks[n];
          if (p.kind !== o.OperationKind.COPY) {
            r(new Error("Task kind must be COPY"));
            return;
          }
          i(p, this.out, this.options.oldFileFd, r, () => {
            n++, f();
          });
        };
        f();
      });
    }
    searchHeaderListEnd(n, l) {
      const u = n.indexOf(h, l);
      if (u !== -1)
        return u + h.length;
      const r = l === 0 ? n : n.slice(l);
      return this.headerListBuffer == null ? this.headerListBuffer = r : this.headerListBuffer = Buffer.concat([this.headerListBuffer, r]), -1;
    }
    onPartEnd() {
      const n = this.partIndexToLength[this.partIndex - 1];
      if (this.actualPartLength !== n)
        throw (0, t.newError)(`Expected length: ${n} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
      this.actualPartLength = 0;
    }
    processPartStarted(n, l, u) {
      return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(n, l, u);
    }
    processPartData(n, l, u) {
      this.actualPartLength += u - l;
      const r = this.out;
      return r.write(l === 0 && n.length === u ? n : n.slice(l, u)) ? Promise.resolve() : new Promise((f, p) => {
        r.on("error", p), r.once("drain", () => {
          r.removeListener("error", p), f();
        });
      });
    }
  };
  return Jr.DataSplitter = d, Jr;
}
var St = {}, rf;
function I0() {
  if (rf) return St;
  rf = 1, Object.defineProperty(St, "__esModule", { value: !0 }), St.executeTasksUsingMultipleRangeRequests = o, St.checkIsRangesSupported = s;
  const t = Ge(), a = Op(), c = Js();
  function o(i, d, e, n, l) {
    const u = (r) => {
      if (r >= d.length) {
        i.fileMetadataBuffer != null && e.write(i.fileMetadataBuffer), e.end();
        return;
      }
      const f = r + 1e3;
      h(i, {
        tasks: d,
        start: r,
        end: Math.min(d.length, f),
        oldFileFd: n
      }, e, () => u(f), l);
    };
    return u;
  }
  function h(i, d, e, n, l) {
    let u = "bytes=", r = 0;
    const f = /* @__PURE__ */ new Map(), p = [];
    for (let g = d.start; g < d.end; g++) {
      const w = d.tasks[g];
      w.kind === c.OperationKind.DOWNLOAD && (u += `${w.start}-${w.end - 1}, `, f.set(r, g), r++, p.push(w.end - w.start));
    }
    if (r <= 1) {
      const g = (w) => {
        if (w >= d.end) {
          n();
          return;
        }
        const S = d.tasks[w++];
        if (S.kind === c.OperationKind.COPY)
          (0, a.copyData)(S, e, d.oldFileFd, l, () => g(w));
        else {
          const O = i.createRequestOptions();
          O.headers.Range = `bytes=${S.start}-${S.end - 1}`;
          const I = i.httpExecutor.createRequest(O, (T) => {
            s(T, l) && (T.pipe(e, {
              end: !1
            }), T.once("end", () => g(w)));
          });
          i.httpExecutor.addErrorAndTimeoutHandlers(I, l), I.end();
        }
      };
      g(d.start);
      return;
    }
    const v = i.createRequestOptions();
    v.headers.Range = u.substring(0, u.length - 2);
    const m = i.httpExecutor.createRequest(v, (g) => {
      if (!s(g, l))
        return;
      const w = (0, t.safeGetHeader)(g, "content-type"), S = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(w);
      if (S == null) {
        l(new Error(`Content-Type "multipart/byteranges" is expected, but got "${w}"`));
        return;
      }
      const O = new a.DataSplitter(e, d, f, S[1] || S[2], p, n);
      O.on("error", l), g.pipe(O), g.on("end", () => {
        setTimeout(() => {
          m.abort(), l(new Error("Response ends without calling any handlers"));
        }, 1e4);
      });
    });
    i.httpExecutor.addErrorAndTimeoutHandlers(m, l), m.end();
  }
  function s(i, d) {
    if (i.statusCode >= 400)
      return d((0, t.createHttpError)(i)), !1;
    if (i.statusCode !== 206) {
      const e = (0, t.safeGetHeader)(i, "accept-ranges");
      if (e == null || e === "none")
        return d(new Error(`Server doesn't support Accept-Ranges (response code ${i.statusCode})`)), !1;
    }
    return !0;
  }
  return St;
}
var Rt = {}, tf;
function N0() {
  if (tf) return Rt;
  tf = 1, Object.defineProperty(Rt, "__esModule", { value: !0 }), Rt.ProgressDifferentialDownloadCallbackTransform = void 0;
  const t = Hr;
  var a;
  (function(o) {
    o[o.COPY = 0] = "COPY", o[o.DOWNLOAD = 1] = "DOWNLOAD";
  })(a || (a = {}));
  let c = class extends t.Transform {
    constructor(h, s, i) {
      super(), this.progressDifferentialDownloadInfo = h, this.cancellationToken = s, this.onProgress = i, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = a.COPY, this.nextUpdate = this.start + 1e3;
    }
    _transform(h, s, i) {
      if (this.cancellationToken.cancelled) {
        i(new Error("cancelled"), null);
        return;
      }
      if (this.operationType == a.COPY) {
        i(null, h);
        return;
      }
      this.transferred += h.length, this.delta += h.length;
      const d = Date.now();
      d >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = d + 1e3, this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((d - this.start) / 1e3))
      }), this.delta = 0), i(null, h);
    }
    beginFileCopy() {
      this.operationType = a.COPY;
    }
    beginRangeDownload() {
      this.operationType = a.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
    }
    endRangeDownload() {
      this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      });
    }
    // Called when we are 100% done with the connection/download
    _flush(h) {
      if (this.cancellationToken.cancelled) {
        h(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, this.transferred = 0, h(null);
    }
  };
  return Rt.ProgressDifferentialDownloadCallbackTransform = c, Rt;
}
var nf;
function Cp() {
  if (nf) return bt;
  nf = 1, Object.defineProperty(bt, "__esModule", { value: !0 }), bt.DifferentialDownloader = void 0;
  const t = Ge(), a = /* @__PURE__ */ Pr(), c = He, o = Op(), h = rt, s = Js(), i = I0(), d = N0();
  let e = class {
    // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
    constructor(r, f, p) {
      this.blockAwareFileInfo = r, this.httpExecutor = f, this.options = p, this.fileMetadataBuffer = null, this.logger = p.logger;
    }
    createRequestOptions() {
      const r = {
        headers: {
          ...this.options.requestHeaders,
          accept: "*/*"
        }
      };
      return (0, t.configureRequestUrl)(this.options.newUrl, r), (0, t.configureRequestOptions)(r), r;
    }
    doDownload(r, f) {
      if (r.version !== f.version)
        throw new Error(`version is different (${r.version} - ${f.version}), full download is required`);
      const p = this.logger, v = (0, s.computeOperations)(r, f, p);
      p.debug != null && p.debug(JSON.stringify(v, null, 2));
      let m = 0, g = 0;
      for (const S of v) {
        const O = S.end - S.start;
        S.kind === s.OperationKind.DOWNLOAD ? m += O : g += O;
      }
      const w = this.blockAwareFileInfo.size;
      if (m + g + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== w)
        throw new Error(`Internal error, size mismatch: downloadSize: ${m}, copySize: ${g}, newSize: ${w}`);
      return p.info(`Full: ${n(w)}, To download: ${n(m)} (${Math.round(m / (w / 100))}%)`), this.downloadFile(v);
    }
    downloadFile(r) {
      const f = [], p = () => Promise.all(f.map((v) => (0, a.close)(v.descriptor).catch((m) => {
        this.logger.error(`cannot close file "${v.path}": ${m}`);
      })));
      return this.doDownloadFile(r, f).then(p).catch((v) => p().catch((m) => {
        try {
          this.logger.error(`cannot close files: ${m}`);
        } catch (g) {
          try {
            console.error(g);
          } catch {
          }
        }
        throw v;
      }).then(() => {
        throw v;
      }));
    }
    async doDownloadFile(r, f) {
      const p = await (0, a.open)(this.options.oldFile, "r");
      f.push({ descriptor: p, path: this.options.oldFile });
      const v = await (0, a.open)(this.options.newFile, "w");
      f.push({ descriptor: v, path: this.options.newFile });
      const m = (0, c.createWriteStream)(this.options.newFile, { fd: v });
      await new Promise((g, w) => {
        const S = [];
        let O;
        if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
          const U = [];
          let H = 0;
          for (const F of r)
            F.kind === s.OperationKind.DOWNLOAD && (U.push(F.end - F.start), H += F.end - F.start);
          const M = {
            expectedByteCounts: U,
            grandTotal: H
          };
          O = new d.ProgressDifferentialDownloadCallbackTransform(M, this.options.cancellationToken, this.options.onProgress), S.push(O);
        }
        const I = new t.DigestTransform(this.blockAwareFileInfo.sha512);
        I.isValidateOnEnd = !1, S.push(I), m.on("finish", () => {
          m.close(() => {
            f.splice(1, 1);
            try {
              I.validate();
            } catch (U) {
              w(U);
              return;
            }
            g(void 0);
          });
        }), S.push(m);
        let T = null;
        for (const U of S)
          U.on("error", w), T == null ? T = U : T = T.pipe(U);
        const R = S[0];
        let A;
        if (this.options.isUseMultipleRangeRequest) {
          A = (0, i.executeTasksUsingMultipleRangeRequests)(this, r, R, p, w), A(0);
          return;
        }
        let b = 0, G = null;
        this.logger.info(`Differential download: ${this.options.newUrl}`);
        const j = this.createRequestOptions();
        j.redirect = "manual", A = (U) => {
          var H, M;
          if (U >= r.length) {
            this.fileMetadataBuffer != null && R.write(this.fileMetadataBuffer), R.end();
            return;
          }
          const F = r[U++];
          if (F.kind === s.OperationKind.COPY) {
            O && O.beginFileCopy(), (0, o.copyData)(F, R, p, w, () => A(U));
            return;
          }
          const D = `bytes=${F.start}-${F.end - 1}`;
          j.headers.range = D, (M = (H = this.logger) === null || H === void 0 ? void 0 : H.debug) === null || M === void 0 || M.call(H, `download range: ${D}`), O && O.beginRangeDownload();
          const $ = this.httpExecutor.createRequest(j, (V) => {
            V.on("error", w), V.on("aborted", () => {
              w(new Error("response has been aborted by the server"));
            }), V.statusCode >= 400 && w((0, t.createHttpError)(V)), V.pipe(R, {
              end: !1
            }), V.once("end", () => {
              O && O.endRangeDownload(), ++b === 100 ? (b = 0, setTimeout(() => A(U), 1e3)) : A(U);
            });
          });
          $.on("redirect", (V, W, re) => {
            this.logger.info(`Redirect to ${l(re)}`), G = re, (0, t.configureRequestUrl)(new h.URL(G), j), $.followRedirect();
          }), this.httpExecutor.addErrorAndTimeoutHandlers($, w), $.end();
        }, A(0);
      });
    }
    async readRemoteBytes(r, f) {
      const p = Buffer.allocUnsafe(f + 1 - r), v = this.createRequestOptions();
      v.headers.range = `bytes=${r}-${f}`;
      let m = 0;
      if (await this.request(v, (g) => {
        g.copy(p, m), m += g.length;
      }), m !== p.length)
        throw new Error(`Received data length ${m} is not equal to expected ${p.length}`);
      return p;
    }
    request(r, f) {
      return new Promise((p, v) => {
        const m = this.httpExecutor.createRequest(r, (g) => {
          (0, i.checkIsRangesSupported)(g, v) && (g.on("error", v), g.on("aborted", () => {
            v(new Error("response has been aborted by the server"));
          }), g.on("data", f), g.on("end", () => p()));
        });
        this.httpExecutor.addErrorAndTimeoutHandlers(m, v), m.end();
      });
    }
  };
  bt.DifferentialDownloader = e;
  function n(u, r = " KB") {
    return new Intl.NumberFormat("en").format((u / 1024).toFixed(2)) + r;
  }
  function l(u) {
    const r = u.indexOf("?");
    return r < 0 ? u : u.substring(0, r);
  }
  return bt;
}
var af;
function L0() {
  if (af) return _t;
  af = 1, Object.defineProperty(_t, "__esModule", { value: !0 }), _t.GenericDifferentialDownloader = void 0;
  const t = Cp();
  let a = class extends t.DifferentialDownloader {
    download(o, h) {
      return this.doDownload(o, h);
    }
  };
  return _t.GenericDifferentialDownloader = a, _t;
}
var of;
function Qs() {
  if (of) return Mr;
  of = 1, Object.defineProperty(Mr, "__esModule", { value: !0 }), Mr.NoOpLogger = Mr.AppUpdater = void 0;
  const t = Ge(), a = Mt, c = fr, o = $s, h = /* @__PURE__ */ Pr(), s = Gs(), i = Jg(), d = Ae, e = Rp(), n = S0(), l = T0(), u = A0(), r = Tp(), f = at(), p = D0(), v = Ms, m = Wr(), g = L0();
  let w = class xp extends o.EventEmitter {
    /**
     * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
     */
    get channel() {
      return this._channel;
    }
    /**
     * Set the update channel. Overrides `channel` in the update configuration.
     *
     * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
     */
    set channel(T) {
      if (this._channel != null) {
        if (typeof T != "string")
          throw (0, t.newError)(`Channel must be a string, but got: ${T}`, "ERR_UPDATER_INVALID_CHANNEL");
        if (T.length === 0)
          throw (0, t.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
      }
      this._channel = T, this.allowDowngrade = !0;
    }
    /**
     *  Shortcut for explicitly adding auth tokens to request headers
     */
    addAuthHeader(T) {
      this.requestHeaders = Object.assign({}, this.requestHeaders, {
        authorization: T
      });
    }
    // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    get netSession() {
      return (0, u.getNetSession)();
    }
    /**
     * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
     * Set it to `null` if you would like to disable a logging feature.
     */
    get logger() {
      return this._logger;
    }
    set logger(T) {
      this._logger = T ?? new O();
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * test only
     * @private
     */
    set updateConfigPath(T) {
      this.clientPromise = null, this._appUpdateConfigPath = T, this.configOnDisk = new i.Lazy(() => this.loadUpdateConfig());
    }
    constructor(T, R) {
      super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new f.UpdaterSignal(this), this._appUpdateConfigPath = null, this.clientPromise = null, this.stagingUserIdPromise = new i.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new i.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (G) => {
        this._logger.error(`Error: ${G.stack || G.message}`);
      }), R == null ? (this.app = new l.ElectronAppAdapter(), this.httpExecutor = new u.ElectronHttpExecutor((G, j) => this.emit("login", G, j))) : (this.app = R, this.httpExecutor = null);
      const A = this.app.version, b = (0, e.parse)(A);
      if (b == null)
        throw (0, t.newError)(`App version is not a valid semver version: "${A}"`, "ERR_UPDATER_INVALID_VERSION");
      this.currentVersion = b, this.allowPrerelease = S(b), T != null && (this.setFeedURL(T), typeof T != "string" && T.requestHeaders && (this.requestHeaders = T.requestHeaders));
    }
    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    getFeedURL() {
      return "Deprecated. Do not use it.";
    }
    /**
     * Configure update provider. If value is `string`, [GenericServerOptions](./publish.md#genericserveroptions) will be set with value as `url`.
     * @param options If you want to override configuration in the `app-update.yml`.
     */
    setFeedURL(T) {
      const R = this.createProviderRuntimeOptions();
      let A;
      typeof T == "string" ? A = new r.GenericProvider({ provider: "generic", url: T }, this, {
        ...R,
        isUseMultipleRangeRequest: (0, p.isUrlProbablySupportMultiRangeRequests)(T)
      }) : A = (0, p.createClient)(T, this, R), this.clientPromise = Promise.resolve(A);
    }
    /**
     * Asks the server whether there is an update.
     */
    checkForUpdates() {
      if (!this.isUpdaterActive())
        return Promise.resolve(null);
      let T = this.checkForUpdatesPromise;
      if (T != null)
        return this._logger.info("Checking for update (already in progress)"), T;
      const R = () => this.checkForUpdatesPromise = null;
      return this._logger.info("Checking for update"), T = this.doCheckForUpdates().then((A) => (R(), A)).catch((A) => {
        throw R(), this.emit("error", A, `Cannot check for updates: ${(A.stack || A).toString()}`), A;
      }), this.checkForUpdatesPromise = T, T;
    }
    isUpdaterActive() {
      return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
    }
    // noinspection JSUnusedGlobalSymbols
    checkForUpdatesAndNotify(T) {
      return this.checkForUpdates().then((R) => R != null && R.downloadPromise ? (R.downloadPromise.then(() => {
        const A = xp.formatDownloadNotification(R.updateInfo.version, this.app.name, T);
        new jr.Notification(A).show();
      }), R) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), R));
    }
    static formatDownloadNotification(T, R, A) {
      return A == null && (A = {
        title: "A new update is ready to install",
        body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
      }), A = {
        title: A.title.replace("{appName}", R).replace("{version}", T),
        body: A.body.replace("{appName}", R).replace("{version}", T)
      }, A;
    }
    async isStagingMatch(T) {
      const R = T.stagingPercentage;
      let A = R;
      if (A == null)
        return !0;
      if (A = parseInt(A, 10), isNaN(A))
        return this._logger.warn(`Staging percentage is NaN: ${R}`), !0;
      A = A / 100;
      const b = await this.stagingUserIdPromise.value, j = t.UUID.parse(b).readUInt32BE(12) / 4294967295;
      return this._logger.info(`Staging percentage: ${A}, percentage: ${j}, user id: ${b}`), j < A;
    }
    computeFinalHeaders(T) {
      return this.requestHeaders != null && Object.assign(T, this.requestHeaders), T;
    }
    async isUpdateAvailable(T) {
      const R = (0, e.parse)(T.version);
      if (R == null)
        throw (0, t.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${T.version}"`, "ERR_UPDATER_INVALID_VERSION");
      const A = this.currentVersion;
      if ((0, e.eq)(R, A))
        return !1;
      const b = T == null ? void 0 : T.minimumSystemVersion, G = (0, c.release)();
      if (b)
        try {
          if ((0, e.lt)(G, b))
            return this._logger.info(`Current OS version ${G} is less than the minimum OS version required ${b} for version ${G}`), !1;
        } catch (M) {
          this._logger.warn(`Failed to compare current OS version(${G}) with minimum OS version(${b}): ${(M.message || M).toString()}`);
        }
      if (!await this.isStagingMatch(T))
        return !1;
      const U = (0, e.gt)(R, A), H = (0, e.lt)(R, A);
      return U ? !0 : this.allowDowngrade && H;
    }
    async getUpdateInfoAndProvider() {
      await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((A) => (0, p.createClient)(A, this, this.createProviderRuntimeOptions())));
      const T = await this.clientPromise, R = await this.stagingUserIdPromise.value;
      return T.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": R })), {
        info: await T.getLatestVersion(),
        provider: T
      };
    }
    createProviderRuntimeOptions() {
      return {
        isUseMultipleRangeRequest: !0,
        platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
        executor: this.httpExecutor
      };
    }
    async doCheckForUpdates() {
      this.emit("checking-for-update");
      const T = await this.getUpdateInfoAndProvider(), R = T.info;
      if (!await this.isUpdateAvailable(R))
        return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${R.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", R), {
          versionInfo: R,
          updateInfo: R
        };
      this.updateInfoAndProvider = T, this.onUpdateAvailable(R);
      const A = new t.CancellationToken();
      return {
        versionInfo: R,
        updateInfo: R,
        cancellationToken: A,
        downloadPromise: this.autoDownload ? this.downloadUpdate(A) : null
      };
    }
    onUpdateAvailable(T) {
      this._logger.info(`Found version ${T.version} (url: ${(0, t.asArray)(T.files).map((R) => R.url).join(", ")})`), this.emit("update-available", T);
    }
    /**
     * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
     * @returns {Promise<Array<string>>} Paths to downloaded files.
     */
    downloadUpdate(T = new t.CancellationToken()) {
      const R = this.updateInfoAndProvider;
      if (R == null) {
        const b = new Error("Please check update first");
        return this.dispatchError(b), Promise.reject(b);
      }
      if (this.downloadPromise != null)
        return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
      this._logger.info(`Downloading update from ${(0, t.asArray)(R.info.files).map((b) => b.url).join(", ")}`);
      const A = (b) => {
        if (!(b instanceof t.CancellationError))
          try {
            this.dispatchError(b);
          } catch (G) {
            this._logger.warn(`Cannot dispatch error event: ${G.stack || G}`);
          }
        return b;
      };
      return this.downloadPromise = this.doDownloadUpdate({
        updateInfoAndProvider: R,
        requestHeaders: this.computeRequestHeaders(R.provider),
        cancellationToken: T,
        disableWebInstaller: this.disableWebInstaller,
        disableDifferentialDownload: this.disableDifferentialDownload
      }).catch((b) => {
        throw A(b);
      }).finally(() => {
        this.downloadPromise = null;
      }), this.downloadPromise;
    }
    dispatchError(T) {
      this.emit("error", T, (T.stack || T).toString());
    }
    dispatchUpdateDownloaded(T) {
      this.emit(f.UPDATE_DOWNLOADED, T);
    }
    async loadUpdateConfig() {
      return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, s.load)(await (0, h.readFile)(this._appUpdateConfigPath, "utf-8"));
    }
    computeRequestHeaders(T) {
      const R = T.fileExtraDownloadHeaders;
      if (R != null) {
        const A = this.requestHeaders;
        return A == null ? R : {
          ...R,
          ...A
        };
      }
      return this.computeFinalHeaders({ accept: "*/*" });
    }
    async getOrCreateStagingUserId() {
      const T = d.join(this.app.userDataPath, ".updaterId");
      try {
        const A = await (0, h.readFile)(T, "utf-8");
        if (t.UUID.check(A))
          return A;
        this._logger.warn(`Staging user id file exists, but content was invalid: ${A}`);
      } catch (A) {
        A.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${A}`);
      }
      const R = t.UUID.v5((0, a.randomBytes)(4096), t.UUID.OID);
      this._logger.info(`Generated new staging user ID: ${R}`);
      try {
        await (0, h.outputFile)(T, R);
      } catch (A) {
        this._logger.warn(`Couldn't write out staging user ID: ${A}`);
      }
      return R;
    }
    /** @internal */
    get isAddNoCacheQuery() {
      const T = this.requestHeaders;
      if (T == null)
        return !0;
      for (const R of Object.keys(T)) {
        const A = R.toLowerCase();
        if (A === "authorization" || A === "private-token")
          return !1;
      }
      return !0;
    }
    async getOrCreateDownloadHelper() {
      let T = this.downloadedUpdateHelper;
      if (T == null) {
        const R = (await this.configOnDisk.value).updaterCacheDirName, A = this._logger;
        R == null && A.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
        const b = d.join(this.app.baseCachePath, R || this.app.name);
        A.debug != null && A.debug(`updater cache dir: ${b}`), T = new n.DownloadedUpdateHelper(b), this.downloadedUpdateHelper = T;
      }
      return T;
    }
    async executeDownload(T) {
      const R = T.fileInfo, A = {
        headers: T.downloadUpdateOptions.requestHeaders,
        cancellationToken: T.downloadUpdateOptions.cancellationToken,
        sha2: R.info.sha2,
        sha512: R.info.sha512
      };
      this.listenerCount(f.DOWNLOAD_PROGRESS) > 0 && (A.onProgress = (se) => this.emit(f.DOWNLOAD_PROGRESS, se));
      const b = T.downloadUpdateOptions.updateInfoAndProvider.info, G = b.version, j = R.packageInfo;
      function U() {
        const se = decodeURIComponent(T.fileInfo.url.pathname);
        return se.endsWith(`.${T.fileExtension}`) ? d.basename(se) : T.fileInfo.info.url;
      }
      const H = await this.getOrCreateDownloadHelper(), M = H.cacheDirForPendingUpdate;
      await (0, h.mkdir)(M, { recursive: !0 });
      const F = U();
      let D = d.join(M, F);
      const $ = j == null ? null : d.join(M, `package-${G}${d.extname(j.path) || ".7z"}`), V = async (se) => (await H.setDownloadedFile(D, $, b, R, F, se), await T.done({
        ...b,
        downloadedFile: D
      }), $ == null ? [D] : [D, $]), W = this._logger, re = await H.validateDownloadedPath(D, b, R, W);
      if (re != null)
        return D = re, await V(!1);
      const ee = async () => (await H.clear().catch(() => {
      }), await (0, h.unlink)(D).catch(() => {
      })), oe = await (0, n.createTempUpdateFile)(`temp-${F}`, M, W);
      try {
        await T.task(oe, A, $, ee), await (0, t.retry)(() => (0, h.rename)(oe, D), 60, 500, 0, 0, (se) => se instanceof Error && /^EBUSY:/.test(se.message));
      } catch (se) {
        throw await ee(), se instanceof t.CancellationError && (W.info("cancelled"), this.emit("update-cancelled", b)), se;
      }
      return W.info(`New version ${G} has been downloaded to ${D}`), await V(!0);
    }
    async differentialDownloadInstaller(T, R, A, b, G) {
      try {
        if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
          return !0;
        const j = (0, m.blockmapFiles)(T.url, this.app.version, R.updateInfoAndProvider.info.version);
        this._logger.info(`Download block maps (old: "${j[0]}", new: ${j[1]})`);
        const U = async (F) => {
          const D = await this.httpExecutor.downloadToBuffer(F, {
            headers: R.requestHeaders,
            cancellationToken: R.cancellationToken
          });
          if (D == null || D.length === 0)
            throw new Error(`Blockmap "${F.href}" is empty`);
          try {
            return JSON.parse((0, v.gunzipSync)(D).toString());
          } catch ($) {
            throw new Error(`Cannot parse blockmap "${F.href}", error: ${$}`);
          }
        }, H = {
          newUrl: T.url,
          oldFile: d.join(this.downloadedUpdateHelper.cacheDir, G),
          logger: this._logger,
          newFile: A,
          isUseMultipleRangeRequest: b.isUseMultipleRangeRequest,
          requestHeaders: R.requestHeaders,
          cancellationToken: R.cancellationToken
        };
        this.listenerCount(f.DOWNLOAD_PROGRESS) > 0 && (H.onProgress = (F) => this.emit(f.DOWNLOAD_PROGRESS, F));
        const M = await Promise.all(j.map((F) => U(F)));
        return await new g.GenericDifferentialDownloader(T.info, this.httpExecutor, H).download(M[0], M[1]), !1;
      } catch (j) {
        if (this._logger.error(`Cannot download differentially, fallback to full download: ${j.stack || j}`), this._testOnlyOptions != null)
          throw j;
        return !0;
      }
    }
  };
  Mr.AppUpdater = w;
  function S(I) {
    const T = (0, e.prerelease)(I);
    return T != null && T.length > 0;
  }
  class O {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    info(T) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    warn(T) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error(T) {
    }
  }
  return Mr.NoOpLogger = O, Mr;
}
var sf;
function Bt() {
  if (sf) return ht;
  sf = 1, Object.defineProperty(ht, "__esModule", { value: !0 }), ht.BaseUpdater = void 0;
  const t = Wn, a = Qs();
  let c = class extends a.AppUpdater {
    constructor(h, s) {
      super(h, s), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
    }
    quitAndInstall(h = !1, s = !1) {
      this._logger.info("Install on explicit quitAndInstall"), this.install(h, h ? s : this.autoRunAppAfterInstall) ? setImmediate(() => {
        jr.autoUpdater.emit("before-quit-for-update"), this.app.quit();
      }) : this.quitAndInstallCalled = !1;
    }
    executeDownload(h) {
      return super.executeDownload({
        ...h,
        done: (s) => (this.dispatchUpdateDownloaded(s), this.addQuitHandler(), Promise.resolve())
      });
    }
    // must be sync (because quit even handler is not async)
    install(h = !1, s = !1) {
      if (this.quitAndInstallCalled)
        return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
      const i = this.downloadedUpdateHelper, d = i && i.file ? process.platform === "linux" ? i.file.replace(/ /g, "\\ ") : i.file : null, e = i == null ? null : i.downloadedFileInfo;
      if (d == null || e == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      this.quitAndInstallCalled = !0;
      try {
        return this._logger.info(`Install: isSilent: ${h}, isForceRunAfter: ${s}`), this.doInstall({
          installerPath: d,
          isSilent: h,
          isForceRunAfter: s,
          isAdminRightsRequired: e.isAdminRightsRequired
        });
      } catch (n) {
        return this.dispatchError(n), !1;
      }
    }
    addQuitHandler() {
      this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((h) => {
        if (this.quitAndInstallCalled) {
          this._logger.info("Update installer has already been triggered. Quitting application.");
          return;
        }
        if (!this.autoInstallOnAppQuit) {
          this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
          return;
        }
        if (h !== 0) {
          this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${h}`);
          return;
        }
        this._logger.info("Auto install update on quit"), this.install(!0, !1);
      }));
    }
    wrapSudo() {
      const { name: h } = this.app, s = `"${h} would like to update"`, i = this.spawnSyncLog("which gksudo || which kdesudo || which pkexec || which beesu"), d = [i];
      return /kdesudo/i.test(i) ? (d.push("--comment", s), d.push("-c")) : /gksudo/i.test(i) ? d.push("--message", s) : /pkexec/i.test(i) && d.push("--disable-internal-agent"), d.join(" ");
    }
    spawnSyncLog(h, s = [], i = {}) {
      return this._logger.info(`Executing: ${h} with args: ${s}`), (0, t.spawnSync)(h, s, {
        env: { ...process.env, ...i },
        encoding: "utf-8",
        shell: !0
      }).stdout.trim();
    }
    /**
     * This handles both node 8 and node 10 way of emitting error when spawning a process
     *   - node 8: Throws the error
     *   - node 10: Emit the error(Need to listen with on)
     */
    // https://github.com/electron-userland/electron-builder/issues/1129
    // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
    async spawnLog(h, s = [], i = void 0, d = "ignore") {
      return this._logger.info(`Executing: ${h} with args: ${s}`), new Promise((e, n) => {
        try {
          const l = { stdio: d, env: i, detached: !0 }, u = (0, t.spawn)(h, s, l);
          u.on("error", (r) => {
            n(r);
          }), u.unref(), u.pid !== void 0 && e(!0);
        } catch (l) {
          n(l);
        }
      });
    }
  };
  return ht.BaseUpdater = c, ht;
}
var Tt = {}, At = {}, uf;
function Pp() {
  if (uf) return At;
  uf = 1, Object.defineProperty(At, "__esModule", { value: !0 }), At.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
  const t = /* @__PURE__ */ Pr(), a = Cp(), c = Ms;
  let o = class extends a.DifferentialDownloader {
    async download() {
      const d = this.blockAwareFileInfo, e = d.size, n = e - (d.blockMapSize + 4);
      this.fileMetadataBuffer = await this.readRemoteBytes(n, e - 1);
      const l = h(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
      await this.doDownload(await s(this.options.oldFile), l);
    }
  };
  At.FileWithEmbeddedBlockMapDifferentialDownloader = o;
  function h(i) {
    return JSON.parse((0, c.inflateRawSync)(i).toString());
  }
  async function s(i) {
    const d = await (0, t.open)(i, "r");
    try {
      const e = (await (0, t.fstat)(d)).size, n = Buffer.allocUnsafe(4);
      await (0, t.read)(d, n, 0, n.length, e - n.length);
      const l = Buffer.allocUnsafe(n.readUInt32BE(0));
      return await (0, t.read)(d, l, 0, l.length, e - n.length - l.length), await (0, t.close)(d), h(l);
    } catch (e) {
      throw await (0, t.close)(d), e;
    }
  }
  return At;
}
var lf;
function cf() {
  if (lf) return Tt;
  lf = 1, Object.defineProperty(Tt, "__esModule", { value: !0 }), Tt.AppImageUpdater = void 0;
  const t = Ge(), a = Wn, c = /* @__PURE__ */ Pr(), o = He, h = Ae, s = Bt(), i = Pp(), d = at(), e = pr();
  let n = class extends s.BaseUpdater {
    constructor(u, r) {
      super(u, r);
    }
    isUpdaterActive() {
      return process.env.APPIMAGE == null ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
    }
    /*** @private */
    doDownloadUpdate(u) {
      const r = u.updateInfoAndProvider.provider, f = (0, e.findFile)(r.resolveFiles(u.updateInfoAndProvider.info), "AppImage", ["rpm", "deb"]);
      return this.executeDownload({
        fileExtension: "AppImage",
        fileInfo: f,
        downloadUpdateOptions: u,
        task: async (p, v) => {
          const m = process.env.APPIMAGE;
          if (m == null)
            throw (0, t.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
          let g = !1;
          try {
            const w = {
              newUrl: f.url,
              oldFile: m,
              logger: this._logger,
              newFile: p,
              isUseMultipleRangeRequest: r.isUseMultipleRangeRequest,
              requestHeaders: u.requestHeaders,
              cancellationToken: u.cancellationToken
            };
            this.listenerCount(d.DOWNLOAD_PROGRESS) > 0 && (w.onProgress = (S) => this.emit(d.DOWNLOAD_PROGRESS, S)), await new i.FileWithEmbeddedBlockMapDifferentialDownloader(f.info, this.httpExecutor, w).download();
          } catch (w) {
            this._logger.error(`Cannot download differentially, fallback to full download: ${w.stack || w}`), g = process.platform === "linux";
          }
          g && await this.httpExecutor.download(f.url, p, v), await (0, c.chmod)(p, 493);
        }
      });
    }
    doInstall(u) {
      const r = process.env.APPIMAGE;
      if (r == null)
        throw (0, t.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
      (0, o.unlinkSync)(r);
      let f;
      const p = h.basename(r);
      h.basename(u.installerPath) === p || !/\d+\.\d+\.\d+/.test(p) ? f = r : f = h.join(h.dirname(r), h.basename(u.installerPath)), (0, a.execFileSync)("mv", ["-f", u.installerPath, f]), f !== r && this.emit("appimage-filename-updated", f);
      const v = {
        ...process.env,
        APPIMAGE_SILENT_INSTALL: "true"
      };
      return u.isForceRunAfter ? this.spawnLog(f, [], v) : (v.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, a.execFileSync)(f, [], { env: v })), !0;
    }
  };
  return Tt.AppImageUpdater = n, Tt;
}
var Ot = {}, ff;
function df() {
  if (ff) return Ot;
  ff = 1, Object.defineProperty(Ot, "__esModule", { value: !0 }), Ot.DebUpdater = void 0;
  const t = Bt(), a = at(), c = pr();
  let o = class extends t.BaseUpdater {
    constructor(s, i) {
      super(s, i);
    }
    /*** @private */
    doDownloadUpdate(s) {
      const i = s.updateInfoAndProvider.provider, d = (0, c.findFile)(i.resolveFiles(s.updateInfoAndProvider.info), "deb", ["AppImage", "rpm"]);
      return this.executeDownload({
        fileExtension: "deb",
        fileInfo: d,
        downloadUpdateOptions: s,
        task: async (e, n) => {
          this.listenerCount(a.DOWNLOAD_PROGRESS) > 0 && (n.onProgress = (l) => this.emit(a.DOWNLOAD_PROGRESS, l)), await this.httpExecutor.download(d.url, e, n);
        }
      });
    }
    doInstall(s) {
      const i = this.wrapSudo(), d = /pkexec/i.test(i) ? "" : '"', e = ["dpkg", "-i", s.installerPath, "||", "apt-get", "install", "-f", "-y"];
      return this.spawnSyncLog(i, [`${d}/bin/bash`, "-c", `'${e.join(" ")}'${d}`]), s.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return Ot.DebUpdater = o, Ot;
}
var Ct = {}, hf;
function pf() {
  if (hf) return Ct;
  hf = 1, Object.defineProperty(Ct, "__esModule", { value: !0 }), Ct.RpmUpdater = void 0;
  const t = Bt(), a = at(), c = pr();
  let o = class extends t.BaseUpdater {
    constructor(s, i) {
      super(s, i);
    }
    /*** @private */
    doDownloadUpdate(s) {
      const i = s.updateInfoAndProvider.provider, d = (0, c.findFile)(i.resolveFiles(s.updateInfoAndProvider.info), "rpm", ["AppImage", "deb"]);
      return this.executeDownload({
        fileExtension: "rpm",
        fileInfo: d,
        downloadUpdateOptions: s,
        task: async (e, n) => {
          this.listenerCount(a.DOWNLOAD_PROGRESS) > 0 && (n.onProgress = (l) => this.emit(a.DOWNLOAD_PROGRESS, l)), await this.httpExecutor.download(d.url, e, n);
        }
      });
    }
    doInstall(s) {
      const i = s.installerPath, d = this.wrapSudo(), e = /pkexec/i.test(d) ? "" : '"', n = this.spawnSyncLog("which zypper");
      let l;
      return n ? l = [n, "--no-refresh", "install", "--allow-unsigned-rpm", "-y", "-f", i] : l = [this.spawnSyncLog("which dnf || which yum"), "-y", "install", i], this.spawnSyncLog(d, [`${e}/bin/bash`, "-c", `'${l.join(" ")}'${e}`]), s.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return Ct.RpmUpdater = o, Ct;
}
var xt = {}, mf;
function gf() {
  if (mf) return xt;
  mf = 1, Object.defineProperty(xt, "__esModule", { value: !0 }), xt.MacUpdater = void 0;
  const t = Ge(), a = /* @__PURE__ */ Pr(), c = He, o = Ae, h = Qh, s = Qs(), i = pr(), d = Wn, e = Mt;
  let n = class extends s.AppUpdater {
    constructor(u, r) {
      super(u, r), this.nativeUpdater = jr.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (f) => {
        this._logger.warn(f), this.emit("error", f);
      }), this.nativeUpdater.on("update-downloaded", () => {
        this.squirrelDownloadedUpdate = !0, this.debug("nativeUpdater.update-downloaded");
      });
    }
    debug(u) {
      this._logger.debug != null && this._logger.debug(u);
    }
    closeServerIfExists() {
      this.server && (this.debug("Closing proxy server"), this.server.close((u) => {
        u && this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
      }));
    }
    async doDownloadUpdate(u) {
      let r = u.updateInfoAndProvider.provider.resolveFiles(u.updateInfoAndProvider.info);
      const f = this._logger, p = "sysctl.proc_translated";
      let v = !1;
      try {
        this.debug("Checking for macOS Rosetta environment"), v = (0, d.execFileSync)("sysctl", [p], { encoding: "utf8" }).includes(`${p}: 1`), f.info(`Checked for macOS Rosetta environment (isRosetta=${v})`);
      } catch (I) {
        f.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${I}`);
      }
      let m = !1;
      try {
        this.debug("Checking for arm64 in uname");
        const T = (0, d.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
        f.info(`Checked 'uname -a': arm64=${T}`), m = m || T;
      } catch (I) {
        f.warn(`uname shell command to check for arm64 failed: ${I}`);
      }
      m = m || process.arch === "arm64" || v;
      const g = (I) => {
        var T;
        return I.url.pathname.includes("arm64") || ((T = I.info.url) === null || T === void 0 ? void 0 : T.includes("arm64"));
      };
      m && r.some(g) ? r = r.filter((I) => m === g(I)) : r = r.filter((I) => !g(I));
      const w = (0, i.findFile)(r, "zip", ["pkg", "dmg"]);
      if (w == null)
        throw (0, t.newError)(`ZIP file not provided: ${(0, t.safeStringifyJson)(r)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
      const S = u.updateInfoAndProvider.provider, O = "update.zip";
      return this.executeDownload({
        fileExtension: "zip",
        fileInfo: w,
        downloadUpdateOptions: u,
        task: async (I, T) => {
          const R = o.join(this.downloadedUpdateHelper.cacheDir, O), A = () => (0, a.pathExistsSync)(R) ? !u.disableDifferentialDownload : (f.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
          let b = !0;
          A() && (b = await this.differentialDownloadInstaller(w, u, I, S, O)), b && await this.httpExecutor.download(w.url, I, T);
        },
        done: (I) => {
          if (!u.disableDifferentialDownload)
            try {
              const T = o.join(this.downloadedUpdateHelper.cacheDir, O);
              (0, c.copyFileSync)(I.downloadedFile, T);
            } catch (T) {
              this._logger.warn(`Unable to copy file for caching for future differential downloads: ${T.message}`);
            }
          return this.updateDownloaded(w, I);
        }
      });
    }
    async updateDownloaded(u, r) {
      var f;
      const p = r.downloadedFile, v = (f = u.info.size) !== null && f !== void 0 ? f : (await (0, a.stat)(p)).size, m = this._logger, g = `fileToProxy=${u.url.href}`;
      this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${g})`), this.server = (0, h.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${g})`), this.server.on("close", () => {
        m.info(`Proxy server for native Squirrel.Mac is closed (${g})`);
      });
      const w = (S) => {
        const O = S.address();
        return typeof O == "string" ? O : `http://127.0.0.1:${O == null ? void 0 : O.port}`;
      };
      return await new Promise((S, O) => {
        const I = (0, e.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), T = Buffer.from(`autoupdater:${I}`, "ascii"), R = `/${(0, e.randomBytes)(64).toString("hex")}.zip`;
        this.server.on("request", (A, b) => {
          const G = A.url;
          if (m.info(`${G} requested`), G === "/") {
            if (!A.headers.authorization || A.headers.authorization.indexOf("Basic ") === -1) {
              b.statusCode = 401, b.statusMessage = "Invalid Authentication Credentials", b.end(), m.warn("No authenthication info");
              return;
            }
            const H = A.headers.authorization.split(" ")[1], M = Buffer.from(H, "base64").toString("ascii"), [F, D] = M.split(":");
            if (F !== "autoupdater" || D !== I) {
              b.statusCode = 401, b.statusMessage = "Invalid Authentication Credentials", b.end(), m.warn("Invalid authenthication credentials");
              return;
            }
            const $ = Buffer.from(`{ "url": "${w(this.server)}${R}" }`);
            b.writeHead(200, { "Content-Type": "application/json", "Content-Length": $.length }), b.end($);
            return;
          }
          if (!G.startsWith(R)) {
            m.warn(`${G} requested, but not supported`), b.writeHead(404), b.end();
            return;
          }
          m.info(`${R} requested by Squirrel.Mac, pipe ${p}`);
          let j = !1;
          b.on("finish", () => {
            j || (this.nativeUpdater.removeListener("error", O), S([]));
          });
          const U = (0, c.createReadStream)(p);
          U.on("error", (H) => {
            try {
              b.end();
            } catch (M) {
              m.warn(`cannot end response: ${M}`);
            }
            j = !0, this.nativeUpdater.removeListener("error", O), O(new Error(`Cannot pipe "${p}": ${H}`));
          }), b.writeHead(200, {
            "Content-Type": "application/zip",
            "Content-Length": v
          }), U.pipe(b);
        }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${g})`), this.server.listen(0, "127.0.0.1", () => {
          this.debug(`Proxy server for native Squirrel.Mac is listening (address=${w(this.server)}, ${g})`), this.nativeUpdater.setFeedURL({
            url: w(this.server),
            headers: {
              "Cache-Control": "no-cache",
              Authorization: `Basic ${T.toString("base64")}`
            }
          }), this.dispatchUpdateDownloaded(r), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", O), this.nativeUpdater.checkForUpdates()) : S([]);
        });
      });
    }
    quitAndInstall() {
      this.squirrelDownloadedUpdate ? (this.nativeUpdater.quitAndInstall(), this.closeServerIfExists()) : (this.nativeUpdater.on("update-downloaded", () => {
        this.nativeUpdater.quitAndInstall(), this.closeServerIfExists();
      }), this.autoInstallOnAppQuit || this.nativeUpdater.checkForUpdates());
    }
  };
  return xt.MacUpdater = n, xt;
}
var Pt = {}, fn = {}, vf;
function F0() {
  if (vf) return fn;
  vf = 1, Object.defineProperty(fn, "__esModule", { value: !0 }), fn.verifySignature = h;
  const t = Ge(), a = Wn, c = fr, o = Ae;
  function h(e, n, l) {
    return new Promise((u, r) => {
      const f = n.replace(/'/g, "''");
      l.info(`Verifying signature ${f}`), (0, a.execFile)('set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${f}' | ConvertTo-Json -Compress"`], {
        shell: !0,
        timeout: 20 * 1e3
      }, (p, v, m) => {
        var g;
        try {
          if (p != null || m) {
            i(l, p, m, r), u(null);
            return;
          }
          const w = s(v);
          if (w.Status === 0) {
            try {
              const T = o.normalize(w.Path), R = o.normalize(n);
              if (l.info(`LiteralPath: ${T}. Update Path: ${R}`), T !== R) {
                i(l, new Error(`LiteralPath of ${T} is different than ${R}`), m, r), u(null);
                return;
              }
            } catch (T) {
              l.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(g = T.message) !== null && g !== void 0 ? g : T.stack}`);
            }
            const O = (0, t.parseDn)(w.SignerCertificate.Subject);
            let I = !1;
            for (const T of e) {
              const R = (0, t.parseDn)(T);
              if (R.size ? I = Array.from(R.keys()).every((b) => R.get(b) === O.get(b)) : T === O.get("CN") && (l.warn(`Signature validated using only CN ${T}. Please add your full Distinguished Name (DN) to publisherNames configuration`), I = !0), I) {
                u(null);
                return;
              }
            }
          }
          const S = `publisherNames: ${e.join(" | ")}, raw info: ` + JSON.stringify(w, (O, I) => O === "RawData" ? void 0 : I, 2);
          l.warn(`Sign verification failed, installer signed with incorrect certificate: ${S}`), u(S);
        } catch (w) {
          i(l, w, null, r), u(null);
          return;
        }
      });
    });
  }
  function s(e) {
    const n = JSON.parse(e);
    delete n.PrivateKey, delete n.IsOSBinary, delete n.SignatureType;
    const l = n.SignerCertificate;
    return l != null && (delete l.Archived, delete l.Extensions, delete l.Handle, delete l.HasPrivateKey, delete l.SubjectName), n;
  }
  function i(e, n, l, u) {
    if (d()) {
      e.warn(`Cannot execute Get-AuthenticodeSignature: ${n || l}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    try {
      (0, a.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1e3 });
    } catch (r) {
      e.warn(`Cannot execute ConvertTo-Json: ${r.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    n != null && u(n), l && u(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${l}. Failing signature validation due to unknown stderr.`));
  }
  function d() {
    const e = c.release();
    return e.startsWith("6.") && !e.startsWith("6.3");
  }
  return fn;
}
var yf;
function wf() {
  if (yf) return Pt;
  yf = 1, Object.defineProperty(Pt, "__esModule", { value: !0 }), Pt.NsisUpdater = void 0;
  const t = Ge(), a = Ae, c = Bt(), o = Pp(), h = at(), s = pr(), i = /* @__PURE__ */ Pr(), d = F0(), e = rt;
  let n = class extends c.BaseUpdater {
    constructor(u, r) {
      super(u, r), this._verifyUpdateCodeSignature = (f, p) => (0, d.verifySignature)(f, p, this._logger);
    }
    /**
     * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
     * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
     */
    get verifyUpdateCodeSignature() {
      return this._verifyUpdateCodeSignature;
    }
    set verifyUpdateCodeSignature(u) {
      u && (this._verifyUpdateCodeSignature = u);
    }
    /*** @private */
    doDownloadUpdate(u) {
      const r = u.updateInfoAndProvider.provider, f = (0, s.findFile)(r.resolveFiles(u.updateInfoAndProvider.info), "exe");
      return this.executeDownload({
        fileExtension: "exe",
        downloadUpdateOptions: u,
        fileInfo: f,
        task: async (p, v, m, g) => {
          const w = f.packageInfo, S = w != null && m != null;
          if (S && u.disableWebInstaller)
            throw (0, t.newError)(`Unable to download new version ${u.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
          !S && !u.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (S || u.disableDifferentialDownload || await this.differentialDownloadInstaller(f, u, p, r, t.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(f.url, p, v);
          const O = await this.verifySignature(p);
          if (O != null)
            throw await g(), (0, t.newError)(`New version ${u.updateInfoAndProvider.info.version} is not signed by the application owner: ${O}`, "ERR_UPDATER_INVALID_SIGNATURE");
          if (S && await this.differentialDownloadWebPackage(u, w, m, r))
            try {
              await this.httpExecutor.download(new e.URL(w.path), m, {
                headers: u.requestHeaders,
                cancellationToken: u.cancellationToken,
                sha512: w.sha512
              });
            } catch (I) {
              try {
                await (0, i.unlink)(m);
              } catch {
              }
              throw I;
            }
        }
      });
    }
    // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
    // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
    // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
    async verifySignature(u) {
      let r;
      try {
        if (r = (await this.configOnDisk.value).publisherName, r == null)
          return null;
      } catch (f) {
        if (f.code === "ENOENT")
          return null;
        throw f;
      }
      return await this._verifyUpdateCodeSignature(Array.isArray(r) ? r : [r], u);
    }
    doInstall(u) {
      const r = ["--updated"];
      u.isSilent && r.push("/S"), u.isForceRunAfter && r.push("--force-run"), this.installDirectory && r.push(`/D=${this.installDirectory}`);
      const f = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
      f != null && r.push(`--package-file=${f}`);
      const p = () => {
        this.spawnLog(a.join(process.resourcesPath, "elevate.exe"), [u.installerPath].concat(r)).catch((v) => this.dispatchError(v));
      };
      return u.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), p(), !0) : (this.spawnLog(u.installerPath, r).catch((v) => {
        const m = v.code;
        this._logger.info(`Cannot run installer: error code: ${m}, error message: "${v.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), m === "UNKNOWN" || m === "EACCES" ? p() : m === "ENOENT" ? jr.shell.openPath(u.installerPath).catch((g) => this.dispatchError(g)) : this.dispatchError(v);
      }), !0);
    }
    async differentialDownloadWebPackage(u, r, f, p) {
      if (r.blockMapSize == null)
        return !0;
      try {
        const v = {
          newUrl: new e.URL(r.path),
          oldFile: a.join(this.downloadedUpdateHelper.cacheDir, t.CURRENT_APP_PACKAGE_FILE_NAME),
          logger: this._logger,
          newFile: f,
          requestHeaders: this.requestHeaders,
          isUseMultipleRangeRequest: p.isUseMultipleRangeRequest,
          cancellationToken: u.cancellationToken
        };
        this.listenerCount(h.DOWNLOAD_PROGRESS) > 0 && (v.onProgress = (m) => this.emit(h.DOWNLOAD_PROGRESS, m)), await new o.FileWithEmbeddedBlockMapDifferentialDownloader(r, this.httpExecutor, v).download();
      } catch (v) {
        return this._logger.error(`Cannot download differentially, fallback to full download: ${v.stack || v}`), process.platform === "win32";
      }
      return !1;
    }
  };
  return Pt.NsisUpdater = n, Pt;
}
var Ef;
function at() {
  return Ef || (Ef = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.UpdaterSignal = t.UPDATE_DOWNLOADED = t.DOWNLOAD_PROGRESS = t.NsisUpdater = t.MacUpdater = t.RpmUpdater = t.DebUpdater = t.AppImageUpdater = t.Provider = t.CancellationToken = t.NoOpLogger = t.AppUpdater = t.BaseUpdater = void 0;
    const a = Ge();
    Object.defineProperty(t, "CancellationToken", { enumerable: !0, get: function() {
      return a.CancellationToken;
    } });
    const c = /* @__PURE__ */ Pr(), o = Ae;
    var h = Bt();
    Object.defineProperty(t, "BaseUpdater", { enumerable: !0, get: function() {
      return h.BaseUpdater;
    } });
    var s = Qs();
    Object.defineProperty(t, "AppUpdater", { enumerable: !0, get: function() {
      return s.AppUpdater;
    } }), Object.defineProperty(t, "NoOpLogger", { enumerable: !0, get: function() {
      return s.NoOpLogger;
    } });
    var i = pr();
    Object.defineProperty(t, "Provider", { enumerable: !0, get: function() {
      return i.Provider;
    } });
    var d = cf();
    Object.defineProperty(t, "AppImageUpdater", { enumerable: !0, get: function() {
      return d.AppImageUpdater;
    } });
    var e = df();
    Object.defineProperty(t, "DebUpdater", { enumerable: !0, get: function() {
      return e.DebUpdater;
    } });
    var n = pf();
    Object.defineProperty(t, "RpmUpdater", { enumerable: !0, get: function() {
      return n.RpmUpdater;
    } });
    var l = gf();
    Object.defineProperty(t, "MacUpdater", { enumerable: !0, get: function() {
      return l.MacUpdater;
    } });
    var u = wf();
    Object.defineProperty(t, "NsisUpdater", { enumerable: !0, get: function() {
      return u.NsisUpdater;
    } });
    let r;
    function f() {
      if (process.platform === "win32")
        r = new (wf()).NsisUpdater();
      else if (process.platform === "darwin")
        r = new (gf()).MacUpdater();
      else {
        r = new (cf()).AppImageUpdater();
        try {
          const m = o.join(process.resourcesPath, "package-type");
          if (!(0, c.existsSync)(m))
            return r;
          console.info("Checking for beta autoupdate feature for deb/rpm distributions");
          const g = (0, c.readFileSync)(m).toString().trim();
          switch (console.info("Found package-type:", g), g) {
            case "deb":
              r = new (df()).DebUpdater();
              break;
            case "rpm":
              r = new (pf()).RpmUpdater();
              break;
            default:
              break;
          }
        } catch (m) {
          console.warn("Unable to detect 'package-type' for autoUpdater (beta rpm/deb support). If you'd like to expand support, please consider contributing to electron-builder", m.message);
        }
      }
      return r;
    }
    Object.defineProperty(t, "autoUpdater", {
      enumerable: !0,
      get: () => r || f()
    }), t.DOWNLOAD_PROGRESS = "download-progress", t.UPDATE_DOWNLOADED = "update-downloaded";
    class p {
      constructor(g) {
        this.emitter = g;
      }
      /**
       * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
       */
      login(g) {
        v(this.emitter, "login", g);
      }
      progress(g) {
        v(this.emitter, t.DOWNLOAD_PROGRESS, g);
      }
      updateDownloaded(g) {
        v(this.emitter, t.UPDATE_DOWNLOADED, g);
      }
      updateCancelled(g) {
        v(this.emitter, "update-cancelled", g);
      }
    }
    t.UpdaterSignal = p;
    function v(m, g, w) {
      m.on(g, w);
    }
  }(ai)), ai;
}
var $0 = at();
const q0 = /* @__PURE__ */ cg($0);
var io = {}, dn = {}, ao, _f;
function nr() {
  if (_f) return ao;
  _f = 1;
  class t extends Error {
    constructor(c) {
      super(`Format functions must be synchronous taking a two arguments: (info, opts)
Found: ${c.toString().split(`
`)[0]}
`), Error.captureStackTrace(this, t);
    }
  }
  return ao = (a) => {
    if (a.length > 2)
      throw new t(a);
    function c(h = {}) {
      this.options = h;
    }
    c.prototype.transform = a;
    function o(h) {
      return new c(h);
    }
    return o.Format = c, o;
  }, ao;
}
var Dt = { exports: {} }, oo = { exports: {} }, so = { exports: {} }, uo = { exports: {} }, bf;
function M0() {
  return bf || (bf = 1, function(t) {
    var a = {};
    t.exports = a;
    var c = {
      reset: [0, 0],
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29],
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      gray: [90, 39],
      grey: [90, 39],
      brightRed: [91, 39],
      brightGreen: [92, 39],
      brightYellow: [93, 39],
      brightBlue: [94, 39],
      brightMagenta: [95, 39],
      brightCyan: [96, 39],
      brightWhite: [97, 39],
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      bgGray: [100, 49],
      bgGrey: [100, 49],
      bgBrightRed: [101, 49],
      bgBrightGreen: [102, 49],
      bgBrightYellow: [103, 49],
      bgBrightBlue: [104, 49],
      bgBrightMagenta: [105, 49],
      bgBrightCyan: [106, 49],
      bgBrightWhite: [107, 49],
      // legacy styles for colors pre v1.0.0
      blackBG: [40, 49],
      redBG: [41, 49],
      greenBG: [42, 49],
      yellowBG: [43, 49],
      blueBG: [44, 49],
      magentaBG: [45, 49],
      cyanBG: [46, 49],
      whiteBG: [47, 49]
    };
    Object.keys(c).forEach(function(o) {
      var h = c[o], s = a[o] = [];
      s.open = "\x1B[" + h[0] + "m", s.close = "\x1B[" + h[1] + "m";
    });
  }(uo)), uo.exports;
}
var lo, Sf;
function k0() {
  return Sf || (Sf = 1, lo = function(t, a) {
    a = a || process.argv || [];
    var c = a.indexOf("--"), o = /^-{1,2}/.test(t) ? "" : "--", h = a.indexOf(o + t);
    return h !== -1 && (c === -1 ? !0 : h < c);
  }), lo;
}
var co, Rf;
function U0() {
  if (Rf) return co;
  Rf = 1;
  var t = fr, a = k0(), c = process.env, o = void 0;
  a("no-color") || a("no-colors") || a("color=false") ? o = !1 : (a("color") || a("colors") || a("color=true") || a("color=always")) && (o = !0), "FORCE_COLOR" in c && (o = c.FORCE_COLOR.length === 0 || parseInt(c.FORCE_COLOR, 10) !== 0);
  function h(d) {
    return d === 0 ? !1 : {
      level: d,
      hasBasic: !0,
      has256: d >= 2,
      has16m: d >= 3
    };
  }
  function s(d) {
    if (o === !1)
      return 0;
    if (a("color=16m") || a("color=full") || a("color=truecolor"))
      return 3;
    if (a("color=256"))
      return 2;
    if (d && !d.isTTY && o !== !0)
      return 0;
    var e = o ? 1 : 0;
    if (process.platform === "win32") {
      var n = t.release().split(".");
      return Number(process.versions.node.split(".")[0]) >= 8 && Number(n[0]) >= 10 && Number(n[2]) >= 10586 ? Number(n[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in c)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI"].some(function(u) {
        return u in c;
      }) || c.CI_NAME === "codeship" ? 1 : e;
    if ("TEAMCITY_VERSION" in c)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(c.TEAMCITY_VERSION) ? 1 : 0;
    if ("TERM_PROGRAM" in c) {
      var l = parseInt((c.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (c.TERM_PROGRAM) {
        case "iTerm.app":
          return l >= 3 ? 3 : 2;
        case "Hyper":
          return 3;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(c.TERM) ? 2 : /^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(c.TERM) || "COLORTERM" in c ? 1 : (c.TERM === "dumb", e);
  }
  function i(d) {
    var e = s(d);
    return h(e);
  }
  return co = {
    supportsColor: i,
    stdout: i(process.stdout),
    stderr: i(process.stderr)
  }, co;
}
var fo = { exports: {} }, Tf;
function j0() {
  return Tf || (Tf = 1, function(t) {
    t.exports = function(c, o) {
      var h = "";
      c = c || "Run the trap, drop the bass", c = c.split("");
      var s = {
        a: ["@", "Ą", "Ⱥ", "Ʌ", "Δ", "Λ", "Д"],
        b: ["ß", "Ɓ", "Ƀ", "ɮ", "β", "฿"],
        c: ["©", "Ȼ", "Ͼ"],
        d: ["Ð", "Ɗ", "Ԁ", "ԁ", "Ԃ", "ԃ"],
        e: [
          "Ë",
          "ĕ",
          "Ǝ",
          "ɘ",
          "Σ",
          "ξ",
          "Ҽ",
          "੬"
        ],
        f: ["Ӻ"],
        g: ["ɢ"],
        h: ["Ħ", "ƕ", "Ң", "Һ", "Ӈ", "Ԋ"],
        i: ["༏"],
        j: ["Ĵ"],
        k: ["ĸ", "Ҡ", "Ӄ", "Ԟ"],
        l: ["Ĺ"],
        m: ["ʍ", "Ӎ", "ӎ", "Ԡ", "ԡ", "൩"],
        n: ["Ñ", "ŋ", "Ɲ", "Ͷ", "Π", "Ҋ"],
        o: [
          "Ø",
          "õ",
          "ø",
          "Ǿ",
          "ʘ",
          "Ѻ",
          "ם",
          "۝",
          "๏"
        ],
        p: ["Ƿ", "Ҏ"],
        q: ["্"],
        r: ["®", "Ʀ", "Ȑ", "Ɍ", "ʀ", "Я"],
        s: ["§", "Ϟ", "ϟ", "Ϩ"],
        t: ["Ł", "Ŧ", "ͳ"],
        u: ["Ʊ", "Ս"],
        v: ["ט"],
        w: ["Ш", "Ѡ", "Ѽ", "൰"],
        x: ["Ҳ", "Ӿ", "Ӽ", "ӽ"],
        y: ["¥", "Ұ", "Ӌ"],
        z: ["Ƶ", "ɀ"]
      };
      return c.forEach(function(i) {
        i = i.toLowerCase();
        var d = s[i] || [" "], e = Math.floor(Math.random() * d.length);
        typeof s[i] < "u" ? h += s[i][e] : h += i;
      }), h;
    };
  }(fo)), fo.exports;
}
var ho = { exports: {} }, Af;
function B0() {
  return Af || (Af = 1, function(t) {
    t.exports = function(c, o) {
      c = c || "   he is here   ";
      var h = {
        up: [
          "̍",
          "̎",
          "̄",
          "̅",
          "̿",
          "̑",
          "̆",
          "̐",
          "͒",
          "͗",
          "͑",
          "̇",
          "̈",
          "̊",
          "͂",
          "̓",
          "̈",
          "͊",
          "͋",
          "͌",
          "̃",
          "̂",
          "̌",
          "͐",
          "̀",
          "́",
          "̋",
          "̏",
          "̒",
          "̓",
          "̔",
          "̽",
          "̉",
          "ͣ",
          "ͤ",
          "ͥ",
          "ͦ",
          "ͧ",
          "ͨ",
          "ͩ",
          "ͪ",
          "ͫ",
          "ͬ",
          "ͭ",
          "ͮ",
          "ͯ",
          "̾",
          "͛",
          "͆",
          "̚"
        ],
        down: [
          "̖",
          "̗",
          "̘",
          "̙",
          "̜",
          "̝",
          "̞",
          "̟",
          "̠",
          "̤",
          "̥",
          "̦",
          "̩",
          "̪",
          "̫",
          "̬",
          "̭",
          "̮",
          "̯",
          "̰",
          "̱",
          "̲",
          "̳",
          "̹",
          "̺",
          "̻",
          "̼",
          "ͅ",
          "͇",
          "͈",
          "͉",
          "͍",
          "͎",
          "͓",
          "͔",
          "͕",
          "͖",
          "͙",
          "͚",
          "̣"
        ],
        mid: [
          "̕",
          "̛",
          "̀",
          "́",
          "͘",
          "̡",
          "̢",
          "̧",
          "̨",
          "̴",
          "̵",
          "̶",
          "͜",
          "͝",
          "͞",
          "͟",
          "͠",
          "͢",
          "̸",
          "̷",
          "͡",
          " ҉"
        ]
      }, s = [].concat(h.up, h.down, h.mid);
      function i(n) {
        var l = Math.floor(Math.random() * n);
        return l;
      }
      function d(n) {
        var l = !1;
        return s.filter(function(u) {
          l = u === n;
        }), l;
      }
      function e(n, l) {
        var u = "", r, f;
        l = l || {}, l.up = typeof l.up < "u" ? l.up : !0, l.mid = typeof l.mid < "u" ? l.mid : !0, l.down = typeof l.down < "u" ? l.down : !0, l.size = typeof l.size < "u" ? l.size : "maxi", n = n.split("");
        for (f in n)
          if (!d(f)) {
            switch (u = u + n[f], r = { up: 0, down: 0, mid: 0 }, l.size) {
              case "mini":
                r.up = i(8), r.mid = i(2), r.down = i(8);
                break;
              case "maxi":
                r.up = i(16) + 3, r.mid = i(4) + 1, r.down = i(64) + 3;
                break;
              default:
                r.up = i(8) + 1, r.mid = i(6) / 2, r.down = i(8) + 1;
                break;
            }
            var p = ["up", "mid", "down"];
            for (var v in p)
              for (var m = p[v], g = 0; g <= r[m]; g++)
                l[m] && (u = u + h[m][i(h[m].length)]);
          }
        return u;
      }
      return e(c, o);
    };
  }(ho)), ho.exports;
}
var po = { exports: {} }, Of;
function H0() {
  return Of || (Of = 1, function(t) {
    t.exports = function(a) {
      return function(c, o, h) {
        if (c === " ") return c;
        switch (o % 3) {
          case 0:
            return a.red(c);
          case 1:
            return a.white(c);
          case 2:
            return a.blue(c);
        }
      };
    };
  }(po)), po.exports;
}
var mo = { exports: {} }, Cf;
function G0() {
  return Cf || (Cf = 1, function(t) {
    t.exports = function(a) {
      return function(c, o, h) {
        return o % 2 === 0 ? c : a.inverse(c);
      };
    };
  }(mo)), mo.exports;
}
var go = { exports: {} }, xf;
function W0() {
  return xf || (xf = 1, function(t) {
    t.exports = function(a) {
      var c = ["red", "yellow", "green", "blue", "magenta"];
      return function(o, h, s) {
        return o === " " ? o : a[c[h++ % c.length]](o);
      };
    };
  }(go)), go.exports;
}
var vo = { exports: {} }, Pf;
function z0() {
  return Pf || (Pf = 1, function(t) {
    t.exports = function(a) {
      var c = [
        "underline",
        "inverse",
        "grey",
        "yellow",
        "red",
        "green",
        "blue",
        "white",
        "cyan",
        "magenta",
        "brightYellow",
        "brightRed",
        "brightGreen",
        "brightBlue",
        "brightWhite",
        "brightCyan",
        "brightMagenta"
      ];
      return function(o, h, s) {
        return o === " " ? o : a[c[Math.round(Math.random() * (c.length - 2))]](o);
      };
    };
  }(vo)), vo.exports;
}
var Df;
function Y0() {
  return Df || (Df = 1, function(t) {
    var a = {};
    t.exports = a, a.themes = {};
    var c = ur, o = a.styles = M0(), h = Object.defineProperties, s = new RegExp(/[\r\n]+/g);
    a.supportsColor = U0().supportsColor, typeof a.enabled > "u" && (a.enabled = a.supportsColor() !== !1), a.enable = function() {
      a.enabled = !0;
    }, a.disable = function() {
      a.enabled = !1;
    }, a.stripColors = a.strip = function(v) {
      return ("" + v).replace(/\x1B\[\d+m/g, "");
    }, a.stylize = function(m, g) {
      if (!a.enabled)
        return m + "";
      var w = o[g];
      return !w && g in a ? a[g](m) : w.open + m + w.close;
    };
    var i = /[|\\{}()[\]^$+*?.]/g, d = function(v) {
      if (typeof v != "string")
        throw new TypeError("Expected a string");
      return v.replace(i, "\\$&");
    };
    function e(v) {
      var m = function g() {
        return u.apply(g, arguments);
      };
      return m._styles = v, m.__proto__ = l, m;
    }
    var n = function() {
      var v = {};
      return o.grey = o.gray, Object.keys(o).forEach(function(m) {
        o[m].closeRe = new RegExp(d(o[m].close), "g"), v[m] = {
          get: function() {
            return e(this._styles.concat(m));
          }
        };
      }), v;
    }(), l = h(function() {
    }, n);
    function u() {
      var v = Array.prototype.slice.call(arguments), m = v.map(function(I) {
        return I != null && I.constructor === String ? I : c.inspect(I);
      }).join(" ");
      if (!a.enabled || !m)
        return m;
      for (var g = m.indexOf(`
`) != -1, w = this._styles, S = w.length; S--; ) {
        var O = o[w[S]];
        m = O.open + m.replace(O.closeRe, O.open) + O.close, g && (m = m.replace(s, function(I) {
          return O.close + I + O.open;
        }));
      }
      return m;
    }
    a.setTheme = function(v) {
      if (typeof v == "string") {
        console.log("colors.setTheme now only accepts an object, not a string.  If you are trying to set a theme from a file, it is now your (the caller's) responsibility to require the file.  The old syntax looked like colors.setTheme(__dirname + '/../themes/generic-logging.js'); The new syntax looks like colors.setTheme(require(__dirname + '/../themes/generic-logging.js'));");
        return;
      }
      for (var m in v)
        (function(g) {
          a[g] = function(w) {
            if (typeof v[g] == "object") {
              var S = w;
              for (var O in v[g])
                S = a[v[g][O]](S);
              return S;
            }
            return a[v[g]](w);
          };
        })(m);
    };
    function r() {
      var v = {};
      return Object.keys(n).forEach(function(m) {
        v[m] = {
          get: function() {
            return e([m]);
          }
        };
      }), v;
    }
    var f = function(m, g) {
      var w = g.split("");
      return w = w.map(m), w.join("");
    };
    a.trap = j0(), a.zalgo = B0(), a.maps = {}, a.maps.america = H0()(a), a.maps.zebra = G0()(a), a.maps.rainbow = W0()(a), a.maps.random = z0()(a);
    for (var p in a.maps)
      (function(v) {
        a[v] = function(m) {
          return f(a.maps[v], m);
        };
      })(p);
    h(a, r());
  }(so)), so.exports;
}
var If;
function Dp() {
  return If || (If = 1, function(t) {
    var a = Y0();
    t.exports = a;
  }(oo)), oo.exports;
}
var yo = {}, wo = {}, hn = {}, Nf;
function V0() {
  return Nf || (Nf = 1, hn.levels = {
    error: 0,
    warn: 1,
    help: 2,
    data: 3,
    info: 4,
    debug: 5,
    prompt: 6,
    verbose: 7,
    input: 8,
    silly: 9
  }, hn.colors = {
    error: "red",
    warn: "yellow",
    help: "cyan",
    data: "grey",
    info: "green",
    debug: "blue",
    prompt: "grey",
    verbose: "cyan",
    input: "grey",
    silly: "magenta"
  }), hn;
}
var pn = {}, Lf;
function X0() {
  return Lf || (Lf = 1, pn.levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  }, pn.colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "green",
    verbose: "cyan",
    debug: "blue",
    silly: "magenta"
  }), pn;
}
var mn = {}, Ff;
function K0() {
  return Ff || (Ff = 1, mn.levels = {
    emerg: 0,
    alert: 1,
    crit: 2,
    error: 3,
    warning: 4,
    notice: 5,
    info: 6,
    debug: 7
  }, mn.colors = {
    emerg: "red",
    alert: "yellow",
    crit: "red",
    error: "red",
    warning: "red",
    notice: "yellow",
    info: "green",
    debug: "blue"
  }), mn;
}
var $f;
function J0() {
  return $f || ($f = 1, function(t) {
    Object.defineProperty(t, "cli", {
      value: V0()
    }), Object.defineProperty(t, "npm", {
      value: X0()
    }), Object.defineProperty(t, "syslog", {
      value: K0()
    });
  }(wo)), wo;
}
var qf;
function Ue() {
  return qf || (qf = 1, function(t) {
    Object.defineProperty(t, "LEVEL", {
      value: Symbol.for("level")
    }), Object.defineProperty(t, "MESSAGE", {
      value: Symbol.for("message")
    }), Object.defineProperty(t, "SPLAT", {
      value: Symbol.for("splat")
    }), Object.defineProperty(t, "configs", {
      value: J0()
    });
  }(yo)), yo;
}
var Mf;
function Zs() {
  if (Mf) return Dt.exports;
  Mf = 1;
  const t = Dp(), { LEVEL: a, MESSAGE: c } = Ue();
  t.enabled = !0;
  const o = /\s+/;
  class h {
    constructor(i = {}) {
      i.colors && this.addColors(i.colors), this.options = i;
    }
    /*
     * Adds the colors Object to the set of allColors
     * known by the Colorizer
     *
     * @param {Object} colors Set of color mappings to add.
     */
    static addColors(i) {
      const d = Object.keys(i).reduce((e, n) => (e[n] = o.test(i[n]) ? i[n].split(o) : i[n], e), {});
      return h.allColors = Object.assign({}, h.allColors || {}, d), h.allColors;
    }
    /*
     * Adds the colors Object to the set of allColors
     * known by the Colorizer
     *
     * @param {Object} colors Set of color mappings to add.
     */
    addColors(i) {
      return h.addColors(i);
    }
    /*
     * function colorize (lookup, level, message)
     * Performs multi-step colorization using @colors/colors/safe
     */
    colorize(i, d, e) {
      if (typeof e > "u" && (e = d), !Array.isArray(h.allColors[i]))
        return t[h.allColors[i]](e);
      for (let n = 0, l = h.allColors[i].length; n < l; n++)
        e = t[h.allColors[i][n]](e);
      return e;
    }
    /*
     * function transform (info, opts)
     * Attempts to colorize the { level, message } of the given
     * `logform` info object.
     */
    transform(i, d) {
      return d.all && typeof i[c] == "string" && (i[c] = this.colorize(i[a], i.level, i[c])), (d.level || d.all || !d.message) && (i.level = this.colorize(i[a], i.level)), (d.all || d.message) && (i.message = this.colorize(i[a], i.level, i.message)), i;
    }
  }
  return Dt.exports = (s) => new h(s), Dt.exports.Colorizer = Dt.exports.Format = h, Dt.exports;
}
var Eo, kf;
function Q0() {
  if (kf) return Eo;
  kf = 1;
  const { Colorizer: t } = Zs();
  return Eo = (a) => (t.addColors(a.colors || a), a), Eo;
}
var _o, Uf;
function Z0() {
  return Uf || (Uf = 1, _o = nr()((a) => (a.message = `	${a.message}`, a))), _o;
}
var bo, jf;
function ev() {
  if (jf) return bo;
  jf = 1;
  const t = nr(), { LEVEL: a, MESSAGE: c } = Ue();
  return bo = t((o, { stack: h, cause: s }) => {
    if (o instanceof Error) {
      const d = Object.assign({}, o, {
        level: o.level,
        [a]: o[a] || o.level,
        message: o.message,
        [c]: o[c] || o.message
      });
      return h && (d.stack = o.stack), s && (d.cause = o.cause), d;
    }
    if (!(o.message instanceof Error)) return o;
    const i = o.message;
    return Object.assign(o, i), o.message = i.message, o[c] = i.message, h && (o.stack = i.stack), s && (o.cause = i.cause), o;
  }), bo;
}
var gn = { exports: {} }, It = { exports: {} }, Bf;
function Ip() {
  if (Bf) return It.exports;
  Bf = 1;
  const { configs: t, LEVEL: a, MESSAGE: c } = Ue();
  class o {
    constructor(s = { levels: t.npm.levels }) {
      this.paddings = o.paddingForLevels(s.levels, s.filler), this.options = s;
    }
    /**
     * Returns the maximum length of keys in the specified `levels` Object.
     * @param  {Object} levels Set of all levels to calculate longest level against.
     * @returns {Number} Maximum length of the longest level string.
     */
    static getLongestLevel(s) {
      const i = Object.keys(s).map((d) => d.length);
      return Math.max(...i);
    }
    /**
     * Returns the padding for the specified `level` assuming that the
     * maximum length of all levels it's associated with is `maxLength`.
     * @param  {String} level Level to calculate padding for.
     * @param  {String} filler Repeatable text to use for padding.
     * @param  {Number} maxLength Length of the longest level
     * @returns {String} Padding string for the `level`
     */
    static paddingForLevel(s, i, d) {
      const e = d + 1 - s.length, n = Math.floor(e / i.length);
      return `${i}${i.repeat(n)}`.slice(0, e);
    }
    /**
     * Returns an object with the string paddings for the given `levels`
     * using the specified `filler`.
     * @param  {Object} levels Set of all levels to calculate padding for.
     * @param  {String} filler Repeatable text to use for padding.
     * @returns {Object} Mapping of level to desired padding.
     */
    static paddingForLevels(s, i = " ") {
      const d = o.getLongestLevel(s);
      return Object.keys(s).reduce((e, n) => (e[n] = o.paddingForLevel(n, i, d), e), {});
    }
    /**
     * Prepends the padding onto the `message` based on the `LEVEL` of
     * the `info`. This is based on the behavior of `winston@2` which also
     * prepended the level onto the message.
     *
     * See: https://github.com/winstonjs/winston/blob/2.x/lib/winston/logger.js#L198-L201
     *
     * @param  {Info} info Logform info object
     * @param  {Object} opts Options passed along to this instance.
     * @returns {Info} Modified logform info object.
     */
    transform(s, i) {
      return s.message = `${this.paddings[s[a]]}${s.message}`, s[c] && (s[c] = `${this.paddings[s[a]]}${s[c]}`), s;
    }
  }
  return It.exports = (h) => new o(h), It.exports.Padder = It.exports.Format = o, It.exports;
}
var Hf;
function rv() {
  if (Hf) return gn.exports;
  Hf = 1;
  const { Colorizer: t } = Zs(), { Padder: a } = Ip(), { configs: c, MESSAGE: o } = Ue();
  class h {
    constructor(i = {}) {
      i.levels || (i.levels = c.cli.levels), this.colorizer = new t(i), this.padder = new a(i), this.options = i;
    }
    /*
     * function transform (info, opts)
     * Attempts to both:
     * 1. Pad the { level }
     * 2. Colorize the { level, message }
     * of the given `logform` info object depending on the `opts`.
     */
    transform(i, d) {
      return this.colorizer.transform(
        this.padder.transform(i, d),
        d
      ), i[o] = `${i.level}:${i.message}`, i;
    }
  }
  return gn.exports = (s) => new h(s), gn.exports.Format = h, gn.exports;
}
var vn = { exports: {} }, Gf;
function tv() {
  if (Gf) return vn.exports;
  Gf = 1;
  const t = nr();
  function a(o) {
    if (o.every(c))
      return (h) => {
        let s = h;
        for (let i = 0; i < o.length; i++)
          if (s = o[i].transform(s, o[i].options), !s)
            return !1;
        return s;
      };
  }
  function c(o) {
    if (typeof o.transform != "function")
      throw new Error([
        "No transform function found on format. Did you create a format instance?",
        "const myFormat = format(formatFn);",
        "const instance = myFormat();"
      ].join(`
`));
    return !0;
  }
  return vn.exports = (...o) => {
    const h = t(a(o)), s = h();
    return s.Format = h.Format, s;
  }, vn.exports.cascade = a, vn.exports;
}
var yn = { exports: {} }, Wf;
function ri() {
  return Wf || (Wf = 1, function(t, a) {
    const { hasOwnProperty: c } = Object.prototype, o = g();
    o.configure = g, o.stringify = o, o.default = o, a.stringify = o, a.configure = g, t.exports = o;
    const h = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]/;
    function s(w) {
      return w.length < 5e3 && !h.test(w) ? `"${w}"` : JSON.stringify(w);
    }
    function i(w, S) {
      if (w.length > 200 || S)
        return w.sort(S);
      for (let O = 1; O < w.length; O++) {
        const I = w[O];
        let T = O;
        for (; T !== 0 && w[T - 1] > I; )
          w[T] = w[T - 1], T--;
        w[T] = I;
      }
      return w;
    }
    const d = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(
        Object.getPrototypeOf(
          new Int8Array()
        )
      ),
      Symbol.toStringTag
    ).get;
    function e(w) {
      return d.call(w) !== void 0 && w.length !== 0;
    }
    function n(w, S, O) {
      w.length < O && (O = w.length);
      const I = S === "," ? "" : " ";
      let T = `"0":${I}${w[0]}`;
      for (let R = 1; R < O; R++)
        T += `${S}"${R}":${I}${w[R]}`;
      return T;
    }
    function l(w) {
      if (c.call(w, "circularValue")) {
        const S = w.circularValue;
        if (typeof S == "string")
          return `"${S}"`;
        if (S == null)
          return S;
        if (S === Error || S === TypeError)
          return {
            toString() {
              throw new TypeError("Converting circular structure to JSON");
            }
          };
        throw new TypeError('The "circularValue" argument must be of type string or the value null or undefined');
      }
      return '"[Circular]"';
    }
    function u(w) {
      let S;
      if (c.call(w, "deterministic") && (S = w.deterministic, typeof S != "boolean" && typeof S != "function"))
        throw new TypeError('The "deterministic" argument must be of type boolean or comparator function');
      return S === void 0 ? !0 : S;
    }
    function r(w, S) {
      let O;
      if (c.call(w, S) && (O = w[S], typeof O != "boolean"))
        throw new TypeError(`The "${S}" argument must be of type boolean`);
      return O === void 0 ? !0 : O;
    }
    function f(w, S) {
      let O;
      if (c.call(w, S)) {
        if (O = w[S], typeof O != "number")
          throw new TypeError(`The "${S}" argument must be of type number`);
        if (!Number.isInteger(O))
          throw new TypeError(`The "${S}" argument must be an integer`);
        if (O < 1)
          throw new RangeError(`The "${S}" argument must be >= 1`);
      }
      return O === void 0 ? 1 / 0 : O;
    }
    function p(w) {
      return w === 1 ? "1 item" : `${w} items`;
    }
    function v(w) {
      const S = /* @__PURE__ */ new Set();
      for (const O of w)
        (typeof O == "string" || typeof O == "number") && S.add(String(O));
      return S;
    }
    function m(w) {
      if (c.call(w, "strict")) {
        const S = w.strict;
        if (typeof S != "boolean")
          throw new TypeError('The "strict" argument must be of type boolean');
        if (S)
          return (O) => {
            let I = `Object can not safely be stringified. Received type ${typeof O}`;
            throw typeof O != "function" && (I += ` (${O.toString()})`), new Error(I);
          };
      }
    }
    function g(w) {
      w = { ...w };
      const S = m(w);
      S && (w.bigint === void 0 && (w.bigint = !1), "circularValue" in w || (w.circularValue = Error));
      const O = l(w), I = r(w, "bigint"), T = u(w), R = typeof T == "function" ? T : void 0, A = f(w, "maximumDepth"), b = f(w, "maximumBreadth");
      function G(F, D, $, V, W, re) {
        let ee = D[F];
        switch (typeof ee == "object" && ee !== null && typeof ee.toJSON == "function" && (ee = ee.toJSON(F)), ee = V.call(D, F, ee), typeof ee) {
          case "string":
            return s(ee);
          case "object": {
            if (ee === null)
              return "null";
            if ($.indexOf(ee) !== -1)
              return O;
            let oe = "", se = ",";
            const ye = re;
            if (Array.isArray(ee)) {
              if (ee.length === 0)
                return "[]";
              if (A < $.length + 1)
                return '"[Array]"';
              $.push(ee), W !== "" && (re += W, oe += `
${re}`, se = `,
${re}`);
              const L = Math.min(ee.length, b);
              let x = 0;
              for (; x < L - 1; x++) {
                const z = G(String(x), ee, $, V, W, re);
                oe += z !== void 0 ? z : "null", oe += se;
              }
              const P = G(String(x), ee, $, V, W, re);
              if (oe += P !== void 0 ? P : "null", ee.length - 1 > b) {
                const z = ee.length - b - 1;
                oe += `${se}"... ${p(z)} not stringified"`;
              }
              return W !== "" && (oe += `
${ye}`), $.pop(), `[${oe}]`;
            }
            let X = Object.keys(ee);
            const q = X.length;
            if (q === 0)
              return "{}";
            if (A < $.length + 1)
              return '"[Object]"';
            let E = "", _ = "";
            W !== "" && (re += W, se = `,
${re}`, E = " ");
            const k = Math.min(q, b);
            T && !e(ee) && (X = i(X, R)), $.push(ee);
            for (let L = 0; L < k; L++) {
              const x = X[L], P = G(x, ee, $, V, W, re);
              P !== void 0 && (oe += `${_}${s(x)}:${E}${P}`, _ = se);
            }
            if (q > b) {
              const L = q - b;
              oe += `${_}"...":${E}"${p(L)} not stringified"`, _ = se;
            }
            return W !== "" && _.length > 1 && (oe = `
${re}${oe}
${ye}`), $.pop(), `{${oe}}`;
          }
          case "number":
            return isFinite(ee) ? String(ee) : S ? S(ee) : "null";
          case "boolean":
            return ee === !0 ? "true" : "false";
          case "undefined":
            return;
          case "bigint":
            if (I)
              return String(ee);
          // fallthrough
          default:
            return S ? S(ee) : void 0;
        }
      }
      function j(F, D, $, V, W, re) {
        switch (typeof D == "object" && D !== null && typeof D.toJSON == "function" && (D = D.toJSON(F)), typeof D) {
          case "string":
            return s(D);
          case "object": {
            if (D === null)
              return "null";
            if ($.indexOf(D) !== -1)
              return O;
            const ee = re;
            let oe = "", se = ",";
            if (Array.isArray(D)) {
              if (D.length === 0)
                return "[]";
              if (A < $.length + 1)
                return '"[Array]"';
              $.push(D), W !== "" && (re += W, oe += `
${re}`, se = `,
${re}`);
              const q = Math.min(D.length, b);
              let E = 0;
              for (; E < q - 1; E++) {
                const k = j(String(E), D[E], $, V, W, re);
                oe += k !== void 0 ? k : "null", oe += se;
              }
              const _ = j(String(E), D[E], $, V, W, re);
              if (oe += _ !== void 0 ? _ : "null", D.length - 1 > b) {
                const k = D.length - b - 1;
                oe += `${se}"... ${p(k)} not stringified"`;
              }
              return W !== "" && (oe += `
${ee}`), $.pop(), `[${oe}]`;
            }
            $.push(D);
            let ye = "";
            W !== "" && (re += W, se = `,
${re}`, ye = " ");
            let X = "";
            for (const q of V) {
              const E = j(q, D[q], $, V, W, re);
              E !== void 0 && (oe += `${X}${s(q)}:${ye}${E}`, X = se);
            }
            return W !== "" && X.length > 1 && (oe = `
${re}${oe}
${ee}`), $.pop(), `{${oe}}`;
          }
          case "number":
            return isFinite(D) ? String(D) : S ? S(D) : "null";
          case "boolean":
            return D === !0 ? "true" : "false";
          case "undefined":
            return;
          case "bigint":
            if (I)
              return String(D);
          // fallthrough
          default:
            return S ? S(D) : void 0;
        }
      }
      function U(F, D, $, V, W) {
        switch (typeof D) {
          case "string":
            return s(D);
          case "object": {
            if (D === null)
              return "null";
            if (typeof D.toJSON == "function") {
              if (D = D.toJSON(F), typeof D != "object")
                return U(F, D, $, V, W);
              if (D === null)
                return "null";
            }
            if ($.indexOf(D) !== -1)
              return O;
            const re = W;
            if (Array.isArray(D)) {
              if (D.length === 0)
                return "[]";
              if (A < $.length + 1)
                return '"[Array]"';
              $.push(D), W += V;
              let E = `
${W}`;
              const _ = `,
${W}`, k = Math.min(D.length, b);
              let L = 0;
              for (; L < k - 1; L++) {
                const P = U(String(L), D[L], $, V, W);
                E += P !== void 0 ? P : "null", E += _;
              }
              const x = U(String(L), D[L], $, V, W);
              if (E += x !== void 0 ? x : "null", D.length - 1 > b) {
                const P = D.length - b - 1;
                E += `${_}"... ${p(P)} not stringified"`;
              }
              return E += `
${re}`, $.pop(), `[${E}]`;
            }
            let ee = Object.keys(D);
            const oe = ee.length;
            if (oe === 0)
              return "{}";
            if (A < $.length + 1)
              return '"[Object]"';
            W += V;
            const se = `,
${W}`;
            let ye = "", X = "", q = Math.min(oe, b);
            e(D) && (ye += n(D, se, b), ee = ee.slice(D.length), q -= D.length, X = se), T && (ee = i(ee, R)), $.push(D);
            for (let E = 0; E < q; E++) {
              const _ = ee[E], k = U(_, D[_], $, V, W);
              k !== void 0 && (ye += `${X}${s(_)}: ${k}`, X = se);
            }
            if (oe > b) {
              const E = oe - b;
              ye += `${X}"...": "${p(E)} not stringified"`, X = se;
            }
            return X !== "" && (ye = `
${W}${ye}
${re}`), $.pop(), `{${ye}}`;
          }
          case "number":
            return isFinite(D) ? String(D) : S ? S(D) : "null";
          case "boolean":
            return D === !0 ? "true" : "false";
          case "undefined":
            return;
          case "bigint":
            if (I)
              return String(D);
          // fallthrough
          default:
            return S ? S(D) : void 0;
        }
      }
      function H(F, D, $) {
        switch (typeof D) {
          case "string":
            return s(D);
          case "object": {
            if (D === null)
              return "null";
            if (typeof D.toJSON == "function") {
              if (D = D.toJSON(F), typeof D != "object")
                return H(F, D, $);
              if (D === null)
                return "null";
            }
            if ($.indexOf(D) !== -1)
              return O;
            let V = "";
            const W = D.length !== void 0;
            if (W && Array.isArray(D)) {
              if (D.length === 0)
                return "[]";
              if (A < $.length + 1)
                return '"[Array]"';
              $.push(D);
              const ye = Math.min(D.length, b);
              let X = 0;
              for (; X < ye - 1; X++) {
                const E = H(String(X), D[X], $);
                V += E !== void 0 ? E : "null", V += ",";
              }
              const q = H(String(X), D[X], $);
              if (V += q !== void 0 ? q : "null", D.length - 1 > b) {
                const E = D.length - b - 1;
                V += `,"... ${p(E)} not stringified"`;
              }
              return $.pop(), `[${V}]`;
            }
            let re = Object.keys(D);
            const ee = re.length;
            if (ee === 0)
              return "{}";
            if (A < $.length + 1)
              return '"[Object]"';
            let oe = "", se = Math.min(ee, b);
            W && e(D) && (V += n(D, ",", b), re = re.slice(D.length), se -= D.length, oe = ","), T && (re = i(re, R)), $.push(D);
            for (let ye = 0; ye < se; ye++) {
              const X = re[ye], q = H(X, D[X], $);
              q !== void 0 && (V += `${oe}${s(X)}:${q}`, oe = ",");
            }
            if (ee > b) {
              const ye = ee - b;
              V += `${oe}"...":"${p(ye)} not stringified"`;
            }
            return $.pop(), `{${V}}`;
          }
          case "number":
            return isFinite(D) ? String(D) : S ? S(D) : "null";
          case "boolean":
            return D === !0 ? "true" : "false";
          case "undefined":
            return;
          case "bigint":
            if (I)
              return String(D);
          // fallthrough
          default:
            return S ? S(D) : void 0;
        }
      }
      function M(F, D, $) {
        if (arguments.length > 1) {
          let V = "";
          if (typeof $ == "number" ? V = " ".repeat(Math.min($, 10)) : typeof $ == "string" && (V = $.slice(0, 10)), D != null) {
            if (typeof D == "function")
              return G("", { "": F }, [], D, V, "");
            if (Array.isArray(D))
              return j("", F, [], v(D), V, "");
          }
          if (V.length !== 0)
            return U("", F, [], V, "");
        }
        return H("", F, []);
      }
      return M;
    }
  }(yn, yn.exports)), yn.exports;
}
var So, zf;
function Np() {
  if (zf) return So;
  zf = 1;
  const t = nr(), { MESSAGE: a } = Ue(), c = ri();
  function o(h, s) {
    return typeof s == "bigint" ? s.toString() : s;
  }
  return So = t((h, s) => {
    const i = c.configure(s);
    return h[a] = i(h, s.replacer || o, s.space), h;
  }), So;
}
var Ro, Yf;
function nv() {
  return Yf || (Yf = 1, Ro = nr()((a, c) => c.message ? (a.message = `[${c.label}] ${a.message}`, a) : (a.label = c.label, a))), Ro;
}
var To, Vf;
function iv() {
  if (Vf) return To;
  Vf = 1;
  const t = nr(), { MESSAGE: a } = Ue(), c = ri();
  return To = t((o) => {
    const h = {};
    return o.message && (h["@message"] = o.message, delete o.message), o.timestamp && (h["@timestamp"] = o.timestamp, delete o.timestamp), h["@fields"] = o, o[a] = c(h), o;
  }), To;
}
var Ao, Xf;
function av() {
  if (Xf) return Ao;
  Xf = 1;
  const t = nr();
  function a(o, h, s) {
    const i = h.reduce((e, n) => (e[n] = o[n], delete o[n], e), {}), d = Object.keys(o).reduce((e, n) => (e[n] = o[n], delete o[n], e), {});
    return Object.assign(o, i, {
      [s]: d
    }), o;
  }
  function c(o, h, s) {
    return o[s] = h.reduce((i, d) => (i[d] = o[d], delete o[d], i), {}), o;
  }
  return Ao = t((o, h = {}) => {
    let s = "metadata";
    h.key && (s = h.key);
    let i = [];
    return !h.fillExcept && !h.fillWith && (i.push("level"), i.push("message")), h.fillExcept && (i = h.fillExcept), i.length > 0 ? a(o, i, s) : h.fillWith ? c(o, h.fillWith, s) : o;
  }), Ao;
}
var Oo, Kf;
function ov() {
  if (Kf) return Oo;
  Kf = 1;
  const t = nr(), a = Zh();
  return Oo = t((c) => {
    const o = +/* @__PURE__ */ new Date();
    return this.diff = o - (this.prevTime || o), this.prevTime = o, c.ms = `+${a(this.diff)}`, c;
  }), Oo;
}
var Co, Jf;
function sv() {
  if (Jf) return Co;
  Jf = 1;
  const t = ur.inspect, a = nr(), { LEVEL: c, MESSAGE: o, SPLAT: h } = Ue();
  return Co = a((s, i = {}) => {
    const d = Object.assign({}, s);
    return delete d[c], delete d[o], delete d[h], s[o] = t(d, !1, i.depth || null, i.colorize), s;
  }), Co;
}
var Nt = { exports: {} }, Qf;
function uv() {
  if (Qf) return Nt.exports;
  Qf = 1;
  const { MESSAGE: t } = Ue();
  class a {
    constructor(o) {
      this.template = o;
    }
    transform(o) {
      return o[t] = this.template(o), o;
    }
  }
  return Nt.exports = (c) => new a(c), Nt.exports.Printf = Nt.exports.Format = a, Nt.exports;
}
var xo, Zf;
function lv() {
  if (Zf) return xo;
  Zf = 1;
  const t = nr(), { MESSAGE: a } = Ue(), c = ri();
  return xo = t((o) => {
    const h = c(Object.assign({}, o, {
      level: void 0,
      message: void 0,
      splat: void 0
    })), s = o.padding && o.padding[o.level] || "";
    return h !== "{}" ? o[a] = `${o.level}:${s} ${o.message} ${h}` : o[a] = `${o.level}:${s} ${o.message}`, o;
  }), xo;
}
var Po, ed;
function cv() {
  if (ed) return Po;
  ed = 1;
  const t = ur, { SPLAT: a } = Ue(), c = /%[scdjifoO%]/g, o = /%%/g;
  class h {
    constructor(i) {
      this.options = i;
    }
    /**
       * Check to see if tokens <= splat.length, assign { splat, meta } into the
       * `info` accordingly, and write to this instance.
       *
       * @param  {Info} info Logform info message.
       * @param  {String[]} tokens Set of string interpolation tokens.
       * @returns {Info} Modified info message
       * @private
       */
    _splat(i, d) {
      const e = i.message, n = i[a] || i.splat || [], l = e.match(o), u = l && l.length || 0, f = d.length - u - n.length, p = f < 0 ? n.splice(f, -1 * f) : [], v = p.length;
      if (v)
        for (let m = 0; m < v; m++)
          Object.assign(i, p[m]);
      return i.message = t.format(e, ...n), i;
    }
    /**
      * Transforms the `info` message by using `util.format` to complete
      * any `info.message` provided it has string interpolation tokens.
      * If no tokens exist then `info` is immutable.
      *
      * @param  {Info} info Logform info message.
      * @param  {Object} opts Options for this instance.
      * @returns {Info} Modified info message
      */
    transform(i) {
      const d = i.message, e = i[a] || i.splat;
      if (!e || !e.length)
        return i;
      const n = d && d.match && d.match(c);
      if (!n && (e || e.length)) {
        const l = e.length > 1 ? e.splice(0) : e, u = l.length;
        if (u)
          for (let r = 0; r < u; r++)
            Object.assign(i, l[r]);
        return i;
      }
      return n ? this._splat(i, n) : i;
    }
  }
  return Po = (s) => new h(s), Po;
}
var Lp = /d{1,4}|M{1,4}|YY(?:YY)?|S{1,3}|Do|ZZ|Z|([HhMsDm])\1?|[aA]|"[^"]*"|'[^']*'/g, Or = "\\d\\d?", Ar = "\\d\\d", fv = "\\d{3}", dv = "\\d{4}", qt = "[^\\s]+", Fp = /\[([^]*?)\]/gm;
function $p(t, a) {
  for (var c = [], o = 0, h = t.length; o < h; o++)
    c.push(t[o].substr(0, a));
  return c;
}
var rd = function(t) {
  return function(a, c) {
    var o = c[t].map(function(s) {
      return s.toLowerCase();
    }), h = o.indexOf(a.toLowerCase());
    return h > -1 ? h : null;
  };
};
function xr(t) {
  for (var a = [], c = 1; c < arguments.length; c++)
    a[c - 1] = arguments[c];
  for (var o = 0, h = a; o < h.length; o++) {
    var s = h[o];
    for (var i in s)
      t[i] = s[i];
  }
  return t;
}
var qp = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
], Mp = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
], hv = $p(Mp, 3), pv = $p(qp, 3), eu = {
  dayNamesShort: pv,
  dayNames: qp,
  monthNamesShort: hv,
  monthNames: Mp,
  amPm: ["am", "pm"],
  DoFn: function(t) {
    return t + ["th", "st", "nd", "rd"][t % 10 > 3 ? 0 : (t - t % 10 !== 10 ? 1 : 0) * t % 10];
  }
}, Hn = xr({}, eu), kp = function(t) {
  return Hn = xr(Hn, t);
}, td = function(t) {
  return t.replace(/[|\\{()[^$+*?.-]/g, "\\$&");
}, Qe = function(t, a) {
  for (a === void 0 && (a = 2), t = String(t); t.length < a; )
    t = "0" + t;
  return t;
}, mv = {
  D: function(t) {
    return String(t.getDate());
  },
  DD: function(t) {
    return Qe(t.getDate());
  },
  Do: function(t, a) {
    return a.DoFn(t.getDate());
  },
  d: function(t) {
    return String(t.getDay());
  },
  dd: function(t) {
    return Qe(t.getDay());
  },
  ddd: function(t, a) {
    return a.dayNamesShort[t.getDay()];
  },
  dddd: function(t, a) {
    return a.dayNames[t.getDay()];
  },
  M: function(t) {
    return String(t.getMonth() + 1);
  },
  MM: function(t) {
    return Qe(t.getMonth() + 1);
  },
  MMM: function(t, a) {
    return a.monthNamesShort[t.getMonth()];
  },
  MMMM: function(t, a) {
    return a.monthNames[t.getMonth()];
  },
  YY: function(t) {
    return Qe(String(t.getFullYear()), 4).substr(2);
  },
  YYYY: function(t) {
    return Qe(t.getFullYear(), 4);
  },
  h: function(t) {
    return String(t.getHours() % 12 || 12);
  },
  hh: function(t) {
    return Qe(t.getHours() % 12 || 12);
  },
  H: function(t) {
    return String(t.getHours());
  },
  HH: function(t) {
    return Qe(t.getHours());
  },
  m: function(t) {
    return String(t.getMinutes());
  },
  mm: function(t) {
    return Qe(t.getMinutes());
  },
  s: function(t) {
    return String(t.getSeconds());
  },
  ss: function(t) {
    return Qe(t.getSeconds());
  },
  S: function(t) {
    return String(Math.round(t.getMilliseconds() / 100));
  },
  SS: function(t) {
    return Qe(Math.round(t.getMilliseconds() / 10), 2);
  },
  SSS: function(t) {
    return Qe(t.getMilliseconds(), 3);
  },
  a: function(t, a) {
    return t.getHours() < 12 ? a.amPm[0] : a.amPm[1];
  },
  A: function(t, a) {
    return t.getHours() < 12 ? a.amPm[0].toUpperCase() : a.amPm[1].toUpperCase();
  },
  ZZ: function(t) {
    var a = t.getTimezoneOffset();
    return (a > 0 ? "-" : "+") + Qe(Math.floor(Math.abs(a) / 60) * 100 + Math.abs(a) % 60, 4);
  },
  Z: function(t) {
    var a = t.getTimezoneOffset();
    return (a > 0 ? "-" : "+") + Qe(Math.floor(Math.abs(a) / 60), 2) + ":" + Qe(Math.abs(a) % 60, 2);
  }
}, nd = function(t) {
  return +t - 1;
}, id = [null, Or], ad = [null, qt], od = [
  "isPm",
  qt,
  function(t, a) {
    var c = t.toLowerCase();
    return c === a.amPm[0] ? 0 : c === a.amPm[1] ? 1 : null;
  }
], sd = [
  "timezoneOffset",
  "[^\\s]*?[\\+\\-]\\d\\d:?\\d\\d|[^\\s]*?Z?",
  function(t) {
    var a = (t + "").match(/([+-]|\d\d)/gi);
    if (a) {
      var c = +a[1] * 60 + parseInt(a[2], 10);
      return a[0] === "+" ? c : -c;
    }
    return 0;
  }
], gv = {
  D: ["day", Or],
  DD: ["day", Ar],
  Do: ["day", Or + qt, function(t) {
    return parseInt(t, 10);
  }],
  M: ["month", Or, nd],
  MM: ["month", Ar, nd],
  YY: [
    "year",
    Ar,
    function(t) {
      var a = /* @__PURE__ */ new Date(), c = +("" + a.getFullYear()).substr(0, 2);
      return +("" + (+t > 68 ? c - 1 : c) + t);
    }
  ],
  h: ["hour", Or, void 0, "isPm"],
  hh: ["hour", Ar, void 0, "isPm"],
  H: ["hour", Or],
  HH: ["hour", Ar],
  m: ["minute", Or],
  mm: ["minute", Ar],
  s: ["second", Or],
  ss: ["second", Ar],
  YYYY: ["year", dv],
  S: ["millisecond", "\\d", function(t) {
    return +t * 100;
  }],
  SS: ["millisecond", Ar, function(t) {
    return +t * 10;
  }],
  SSS: ["millisecond", fv],
  d: id,
  dd: id,
  ddd: ad,
  dddd: ad,
  MMM: ["month", qt, rd("monthNamesShort")],
  MMMM: ["month", qt, rd("monthNames")],
  a: od,
  A: od,
  ZZ: sd,
  Z: sd
}, Gn = {
  default: "ddd MMM DD YYYY HH:mm:ss",
  shortDate: "M/D/YY",
  mediumDate: "MMM D, YYYY",
  longDate: "MMMM D, YYYY",
  fullDate: "dddd, MMMM D, YYYY",
  isoDate: "YYYY-MM-DD",
  isoDateTime: "YYYY-MM-DDTHH:mm:ssZ",
  shortTime: "HH:mm",
  mediumTime: "HH:mm:ss",
  longTime: "HH:mm:ss.SSS"
}, Up = function(t) {
  return xr(Gn, t);
}, jp = function(t, a, c) {
  if (a === void 0 && (a = Gn.default), c === void 0 && (c = {}), typeof t == "number" && (t = new Date(t)), Object.prototype.toString.call(t) !== "[object Date]" || isNaN(t.getTime()))
    throw new Error("Invalid Date pass to format");
  a = Gn[a] || a;
  var o = [];
  a = a.replace(Fp, function(s, i) {
    return o.push(i), "@@@";
  });
  var h = xr(xr({}, Hn), c);
  return a = a.replace(Lp, function(s) {
    return mv[s](t, h);
  }), a.replace(/@@@/g, function() {
    return o.shift();
  });
};
function Bp(t, a, c) {
  if (c === void 0 && (c = {}), typeof a != "string")
    throw new Error("Invalid format in fecha parse");
  if (a = Gn[a] || a, t.length > 1e3)
    return null;
  var o = /* @__PURE__ */ new Date(), h = {
    year: o.getFullYear(),
    month: 0,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
    isPm: null,
    timezoneOffset: null
  }, s = [], i = [], d = a.replace(Fp, function(O, I) {
    return i.push(td(I)), "@@@";
  }), e = {}, n = {};
  d = td(d).replace(Lp, function(O) {
    var I = gv[O], T = I[0], R = I[1], A = I[3];
    if (e[T])
      throw new Error("Invalid format. " + T + " specified twice in format");
    return e[T] = !0, A && (n[A] = !0), s.push(I), "(" + R + ")";
  }), Object.keys(n).forEach(function(O) {
    if (!e[O])
      throw new Error("Invalid format. " + O + " is required in specified format");
  }), d = d.replace(/@@@/g, function() {
    return i.shift();
  });
  var l = t.match(new RegExp(d, "i"));
  if (!l)
    return null;
  for (var u = xr(xr({}, Hn), c), r = 1; r < l.length; r++) {
    var f = s[r - 1], p = f[0], v = f[2], m = v ? v(l[r], u) : +l[r];
    if (m == null)
      return null;
    h[p] = m;
  }
  h.isPm === 1 && h.hour != null && +h.hour != 12 ? h.hour = +h.hour + 12 : h.isPm === 0 && +h.hour == 12 && (h.hour = 0);
  var g;
  if (h.timezoneOffset == null) {
    g = new Date(h.year, h.month, h.day, h.hour, h.minute, h.second, h.millisecond);
    for (var w = [
      ["month", "getMonth"],
      ["day", "getDate"],
      ["hour", "getHours"],
      ["minute", "getMinutes"],
      ["second", "getSeconds"]
    ], r = 0, S = w.length; r < S; r++)
      if (e[w[r][0]] && h[w[r][0]] !== g[w[r][1]]())
        return null;
  } else if (g = new Date(Date.UTC(h.year, h.month, h.day, h.hour, h.minute - h.timezoneOffset, h.second, h.millisecond)), h.month > 11 || h.month < 0 || h.day > 31 || h.day < 1 || h.hour > 23 || h.hour < 0 || h.minute > 59 || h.minute < 0 || h.second > 59 || h.second < 0)
    return null;
  return g;
}
var vv = {
  format: jp,
  parse: Bp,
  defaultI18n: eu,
  setGlobalDateI18n: kp,
  setGlobalDateMasks: Up
};
const yv = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  assign: xr,
  default: vv,
  defaultI18n: eu,
  format: jp,
  parse: Bp,
  setGlobalDateI18n: kp,
  setGlobalDateMasks: Up
}, Symbol.toStringTag, { value: "Module" })), wv = /* @__PURE__ */ fg(yv);
var Do, ud;
function Ev() {
  if (ud) return Do;
  ud = 1;
  const t = wv;
  return Do = nr()((c, o = {}) => (o.format && (c.timestamp = typeof o.format == "function" ? o.format() : t.format(/* @__PURE__ */ new Date(), o.format)), c.timestamp || (c.timestamp = (/* @__PURE__ */ new Date()).toISOString()), o.alias && (c[o.alias] = c.timestamp), c)), Do;
}
var Io, ld;
function _v() {
  if (ld) return Io;
  ld = 1;
  const t = Dp(), a = nr(), { MESSAGE: c } = Ue();
  return Io = a((o, h) => (h.level !== !1 && (o.level = t.strip(o.level)), h.message !== !1 && (o.message = t.strip(String(o.message))), h.raw !== !1 && o[c] && (o[c] = t.strip(String(o[c]))), o)), Io;
}
var cd;
function Hp() {
  if (cd) return dn;
  cd = 1;
  const t = dn.format = nr();
  dn.levels = Q0();
  function a(c, o) {
    Object.defineProperty(t, c, {
      get() {
        return o();
      },
      configurable: !0
    });
  }
  return a("align", function() {
    return Z0();
  }), a("errors", function() {
    return ev();
  }), a("cli", function() {
    return rv();
  }), a("combine", function() {
    return tv();
  }), a("colorize", function() {
    return Zs();
  }), a("json", function() {
    return Np();
  }), a("label", function() {
    return nv();
  }), a("logstash", function() {
    return iv();
  }), a("metadata", function() {
    return av();
  }), a("ms", function() {
    return ov();
  }), a("padLevels", function() {
    return Ip();
  }), a("prettyPrint", function() {
    return sv();
  }), a("printf", function() {
    return uv();
  }), a("simple", function() {
    return lv();
  }), a("splat", function() {
    return cv();
  }), a("timestamp", function() {
    return Ev();
  }), a("uncolorize", function() {
    return _v();
  }), dn;
}
var No = {}, fd;
function Gp() {
  return fd || (fd = 1, function(t) {
    const { format: a } = ur;
    t.warn = {
      deprecated(c) {
        return () => {
          throw new Error(a("{ %s } was removed in winston@3.0.0.", c));
        };
      },
      useFormat(c) {
        return () => {
          throw new Error([
            a("{ %s } was removed in winston@3.0.0.", c),
            "Use a custom winston.format = winston.format(function) instead."
          ].join(`
`));
        };
      },
      forFunctions(c, o, h) {
        h.forEach((s) => {
          c[s] = t.warn[o](s);
        });
      },
      forProperties(c, o, h) {
        h.forEach((s) => {
          const i = t.warn[o](s);
          Object.defineProperty(c, s, {
            get: i,
            set: i
          });
        });
      }
    };
  }(No)), No;
}
const bv = "winston", Sv = "A logger for just about everything.", Rv = "3.17.0", Tv = "Charlie Robbins <charlie.robbins@gmail.com>", Av = ["David Hyde <dabh@alumni.stanford.edu>"], Ov = { type: "git", url: "https://github.com/winstonjs/winston.git" }, Cv = ["winston", "logger", "logging", "logs", "sysadmin", "bunyan", "pino", "loglevel", "tools", "json", "stream"], xv = { "@dabh/diagnostics": "^2.0.2", "@colors/colors": "^1.6.0", async: "^3.2.3", "is-stream": "^2.0.0", logform: "^2.7.0", "one-time": "^1.0.0", "readable-stream": "^3.4.0", "safe-stable-stringify": "^2.3.1", "stack-trace": "0.0.x", "triple-beam": "^1.3.0", "winston-transport": "^4.9.0" }, Pv = { "@babel/cli": "^7.23.9", "@babel/core": "^7.24.0", "@babel/preset-env": "^7.24.0", "@dabh/eslint-config-populist": "^4.4.0", "@types/node": "^20.11.24", "abstract-winston-transport": "^0.5.1", assume: "^2.2.0", "cross-spawn-async": "^2.2.5", eslint: "^8.57.0", hock: "^1.4.1", mocha: "^10.3.0", nyc: "^17.1.0", rimraf: "5.0.1", split2: "^4.1.0", "std-mocks": "^2.0.0", through2: "^4.0.2", "winston-compat": "^0.1.5" }, Dv = "./lib/winston.js", Iv = "./dist/winston", Nv = "./index.d.ts", Lv = { lint: "eslint lib/*.js lib/winston/*.js lib/winston/**/*.js --resolve-plugins-relative-to ./node_modules/@dabh/eslint-config-populist", test: "rimraf test/fixtures/logs/* && mocha", "test:coverage": "nyc npm run test:unit", "test:unit": "mocha test/unit", "test:integration": "mocha test/integration", build: "rimraf dist && babel lib -d dist", prepublishOnly: "npm run build" }, Fv = { node: ">= 12.0.0" }, $v = "MIT", qv = {
  name: bv,
  description: Sv,
  version: Rv,
  author: Tv,
  maintainers: Av,
  repository: Ov,
  keywords: Cv,
  dependencies: xv,
  devDependencies: Pv,
  main: Dv,
  browser: Iv,
  types: Nv,
  scripts: Lv,
  engines: Fv,
  license: $v
};
var Lo = {}, wn = { exports: {} }, Fo = { exports: {} }, $o, dd;
function Mv() {
  return dd || (dd = 1, $o = ur.deprecate), $o;
}
var qo, hd;
function Wp() {
  return hd || (hd = 1, qo = Hr), qo;
}
var Mo, pd;
function zp() {
  if (pd) return Mo;
  pd = 1;
  function t(i, d) {
    var e = this, n = this._readableState && this._readableState.destroyed, l = this._writableState && this._writableState.destroyed;
    return n || l ? (d ? d(i) : i && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, process.nextTick(h, this, i)) : process.nextTick(h, this, i)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this._writableState.destroyed = !0), this._destroy(i || null, function(u) {
      !d && u ? e._writableState ? e._writableState.errorEmitted ? process.nextTick(c, e) : (e._writableState.errorEmitted = !0, process.nextTick(a, e, u)) : process.nextTick(a, e, u) : d ? (process.nextTick(c, e), d(u)) : process.nextTick(c, e);
    }), this);
  }
  function a(i, d) {
    h(i, d), c(i);
  }
  function c(i) {
    i._writableState && !i._writableState.emitClose || i._readableState && !i._readableState.emitClose || i.emit("close");
  }
  function o() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending = !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted = !1);
  }
  function h(i, d) {
    i.emit("error", d);
  }
  function s(i, d) {
    var e = i._readableState, n = i._writableState;
    e && e.autoDestroy || n && n.autoDestroy ? i.destroy(d) : i.emit("error", d);
  }
  return Mo = {
    destroy: t,
    undestroy: o,
    errorOrDestroy: s
  }, Mo;
}
var ko = {}, md;
function zr() {
  if (md) return ko;
  md = 1;
  const t = {};
  function a(i, d, e) {
    e || (e = Error);
    function n(u, r, f) {
      return typeof d == "string" ? d : d(u, r, f);
    }
    class l extends e {
      constructor(r, f, p) {
        super(n(r, f, p));
      }
    }
    l.prototype.name = e.name, l.prototype.code = i, t[i] = l;
  }
  function c(i, d) {
    if (Array.isArray(i)) {
      const e = i.length;
      return i = i.map((n) => String(n)), e > 2 ? `one of ${d} ${i.slice(0, e - 1).join(", ")}, or ` + i[e - 1] : e === 2 ? `one of ${d} ${i[0]} or ${i[1]}` : `of ${d} ${i[0]}`;
    } else
      return `of ${d} ${String(i)}`;
  }
  function o(i, d, e) {
    return i.substr(0, d.length) === d;
  }
  function h(i, d, e) {
    return (e === void 0 || e > i.length) && (e = i.length), i.substring(e - d.length, e) === d;
  }
  function s(i, d, e) {
    return typeof e != "number" && (e = 0), e + d.length > i.length ? !1 : i.indexOf(d, e) !== -1;
  }
  return a("ERR_INVALID_OPT_VALUE", function(i, d) {
    return 'The value "' + d + '" is invalid for option "' + i + '"';
  }, TypeError), a("ERR_INVALID_ARG_TYPE", function(i, d, e) {
    let n;
    typeof d == "string" && o(d, "not ") ? (n = "must not be", d = d.replace(/^not /, "")) : n = "must be";
    let l;
    if (h(i, " argument"))
      l = `The ${i} ${n} ${c(d, "type")}`;
    else {
      const u = s(i, ".") ? "property" : "argument";
      l = `The "${i}" ${u} ${n} ${c(d, "type")}`;
    }
    return l += `. Received type ${typeof e}`, l;
  }, TypeError), a("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF"), a("ERR_METHOD_NOT_IMPLEMENTED", function(i) {
    return "The " + i + " method is not implemented";
  }), a("ERR_STREAM_PREMATURE_CLOSE", "Premature close"), a("ERR_STREAM_DESTROYED", function(i) {
    return "Cannot call " + i + " after a stream was destroyed";
  }), a("ERR_MULTIPLE_CALLBACK", "Callback called multiple times"), a("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable"), a("ERR_STREAM_WRITE_AFTER_END", "write after end"), a("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError), a("ERR_UNKNOWN_ENCODING", function(i) {
    return "Unknown encoding: " + i;
  }, TypeError), a("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event"), ko.codes = t, ko;
}
var Uo, gd;
function Yp() {
  if (gd) return Uo;
  gd = 1;
  var t = zr().codes.ERR_INVALID_OPT_VALUE;
  function a(o, h, s) {
    return o.highWaterMark != null ? o.highWaterMark : h ? o[s] : null;
  }
  function c(o, h, s, i) {
    var d = a(h, i, s);
    if (d != null) {
      if (!(isFinite(d) && Math.floor(d) === d) || d < 0) {
        var e = i ? s : "highWaterMark";
        throw new t(e, d);
      }
      return Math.floor(d);
    }
    return o.objectMode ? 16 : 16 * 1024;
  }
  return Uo = {
    getHighWaterMark: c
  }, Uo;
}
var En = { exports: {} }, _n = { exports: {} }, vd;
function kv() {
  return vd || (vd = 1, typeof Object.create == "function" ? _n.exports = function(a, c) {
    c && (a.super_ = c, a.prototype = Object.create(c.prototype, {
      constructor: {
        value: a,
        enumerable: !1,
        writable: !0,
        configurable: !0
      }
    }));
  } : _n.exports = function(a, c) {
    if (c) {
      a.super_ = c;
      var o = function() {
      };
      o.prototype = c.prototype, a.prototype = new o(), a.prototype.constructor = a;
    }
  }), _n.exports;
}
var yd;
function Ht() {
  if (yd) return En.exports;
  yd = 1;
  try {
    var t = require("util");
    if (typeof t.inherits != "function") throw "";
    En.exports = t.inherits;
  } catch {
    En.exports = kv();
  }
  return En.exports;
}
var jo, wd;
function Uv() {
  if (wd) return jo;
  wd = 1;
  function t(p, v) {
    var m = Object.keys(p);
    if (Object.getOwnPropertySymbols) {
      var g = Object.getOwnPropertySymbols(p);
      v && (g = g.filter(function(w) {
        return Object.getOwnPropertyDescriptor(p, w).enumerable;
      })), m.push.apply(m, g);
    }
    return m;
  }
  function a(p) {
    for (var v = 1; v < arguments.length; v++) {
      var m = arguments[v] != null ? arguments[v] : {};
      v % 2 ? t(Object(m), !0).forEach(function(g) {
        c(p, g, m[g]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(p, Object.getOwnPropertyDescriptors(m)) : t(Object(m)).forEach(function(g) {
        Object.defineProperty(p, g, Object.getOwnPropertyDescriptor(m, g));
      });
    }
    return p;
  }
  function c(p, v, m) {
    return v = i(v), v in p ? Object.defineProperty(p, v, { value: m, enumerable: !0, configurable: !0, writable: !0 }) : p[v] = m, p;
  }
  function o(p, v) {
    if (!(p instanceof v))
      throw new TypeError("Cannot call a class as a function");
  }
  function h(p, v) {
    for (var m = 0; m < v.length; m++) {
      var g = v[m];
      g.enumerable = g.enumerable || !1, g.configurable = !0, "value" in g && (g.writable = !0), Object.defineProperty(p, i(g.key), g);
    }
  }
  function s(p, v, m) {
    return v && h(p.prototype, v), Object.defineProperty(p, "prototype", { writable: !1 }), p;
  }
  function i(p) {
    var v = d(p, "string");
    return typeof v == "symbol" ? v : String(v);
  }
  function d(p, v) {
    if (typeof p != "object" || p === null) return p;
    var m = p[Symbol.toPrimitive];
    if (m !== void 0) {
      var g = m.call(p, v || "default");
      if (typeof g != "object") return g;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (v === "string" ? String : Number)(p);
  }
  var e = Yn, n = e.Buffer, l = ur, u = l.inspect, r = u && u.custom || "inspect";
  function f(p, v, m) {
    n.prototype.copy.call(p, v, m);
  }
  return jo = /* @__PURE__ */ function() {
    function p() {
      o(this, p), this.head = null, this.tail = null, this.length = 0;
    }
    return s(p, [{
      key: "push",
      value: function(m) {
        var g = {
          data: m,
          next: null
        };
        this.length > 0 ? this.tail.next = g : this.head = g, this.tail = g, ++this.length;
      }
    }, {
      key: "unshift",
      value: function(m) {
        var g = {
          data: m,
          next: this.head
        };
        this.length === 0 && (this.tail = g), this.head = g, ++this.length;
      }
    }, {
      key: "shift",
      value: function() {
        if (this.length !== 0) {
          var m = this.head.data;
          return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, m;
        }
      }
    }, {
      key: "clear",
      value: function() {
        this.head = this.tail = null, this.length = 0;
      }
    }, {
      key: "join",
      value: function(m) {
        if (this.length === 0) return "";
        for (var g = this.head, w = "" + g.data; g = g.next; ) w += m + g.data;
        return w;
      }
    }, {
      key: "concat",
      value: function(m) {
        if (this.length === 0) return n.alloc(0);
        for (var g = n.allocUnsafe(m >>> 0), w = this.head, S = 0; w; )
          f(w.data, g, S), S += w.data.length, w = w.next;
        return g;
      }
      // Consumes a specified amount of bytes or characters from the buffered data.
    }, {
      key: "consume",
      value: function(m, g) {
        var w;
        return m < this.head.data.length ? (w = this.head.data.slice(0, m), this.head.data = this.head.data.slice(m)) : m === this.head.data.length ? w = this.shift() : w = g ? this._getString(m) : this._getBuffer(m), w;
      }
    }, {
      key: "first",
      value: function() {
        return this.head.data;
      }
      // Consumes a specified amount of characters from the buffered data.
    }, {
      key: "_getString",
      value: function(m) {
        var g = this.head, w = 1, S = g.data;
        for (m -= S.length; g = g.next; ) {
          var O = g.data, I = m > O.length ? O.length : m;
          if (I === O.length ? S += O : S += O.slice(0, m), m -= I, m === 0) {
            I === O.length ? (++w, g.next ? this.head = g.next : this.head = this.tail = null) : (this.head = g, g.data = O.slice(I));
            break;
          }
          ++w;
        }
        return this.length -= w, S;
      }
      // Consumes a specified amount of bytes from the buffered data.
    }, {
      key: "_getBuffer",
      value: function(m) {
        var g = n.allocUnsafe(m), w = this.head, S = 1;
        for (w.data.copy(g), m -= w.data.length; w = w.next; ) {
          var O = w.data, I = m > O.length ? O.length : m;
          if (O.copy(g, g.length - m, 0, I), m -= I, m === 0) {
            I === O.length ? (++S, w.next ? this.head = w.next : this.head = this.tail = null) : (this.head = w, w.data = O.slice(I));
            break;
          }
          ++S;
        }
        return this.length -= S, g;
      }
      // Make sure the linked list only shows the minimal necessary information.
    }, {
      key: r,
      value: function(m, g) {
        return u(this, a(a({}, g), {}, {
          // Only inspect one level.
          depth: 0,
          // It should not recurse.
          customInspect: !1
        }));
      }
    }]), p;
  }(), jo;
}
var Bo = {}, bn = { exports: {} };
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
var Ed;
function jv() {
  return Ed || (Ed = 1, function(t, a) {
    var c = Yn, o = c.Buffer;
    function h(i, d) {
      for (var e in i)
        d[e] = i[e];
    }
    o.from && o.alloc && o.allocUnsafe && o.allocUnsafeSlow ? t.exports = c : (h(c, a), a.Buffer = s);
    function s(i, d, e) {
      return o(i, d, e);
    }
    s.prototype = Object.create(o.prototype), h(o, s), s.from = function(i, d, e) {
      if (typeof i == "number")
        throw new TypeError("Argument must not be a number");
      return o(i, d, e);
    }, s.alloc = function(i, d, e) {
      if (typeof i != "number")
        throw new TypeError("Argument must be a number");
      var n = o(i);
      return d !== void 0 ? typeof e == "string" ? n.fill(d, e) : n.fill(d) : n.fill(0), n;
    }, s.allocUnsafe = function(i) {
      if (typeof i != "number")
        throw new TypeError("Argument must be a number");
      return o(i);
    }, s.allocUnsafeSlow = function(i) {
      if (typeof i != "number")
        throw new TypeError("Argument must be a number");
      return c.SlowBuffer(i);
    };
  }(bn, bn.exports)), bn.exports;
}
var _d;
function bd() {
  if (_d) return Bo;
  _d = 1;
  var t = jv().Buffer, a = t.isEncoding || function(g) {
    switch (g = "" + g, g && g.toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
      case "raw":
        return !0;
      default:
        return !1;
    }
  };
  function c(g) {
    if (!g) return "utf8";
    for (var w; ; )
      switch (g) {
        case "utf8":
        case "utf-8":
          return "utf8";
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return "utf16le";
        case "latin1":
        case "binary":
          return "latin1";
        case "base64":
        case "ascii":
        case "hex":
          return g;
        default:
          if (w) return;
          g = ("" + g).toLowerCase(), w = !0;
      }
  }
  function o(g) {
    var w = c(g);
    if (typeof w != "string" && (t.isEncoding === a || !a(g))) throw new Error("Unknown encoding: " + g);
    return w || g;
  }
  Bo.StringDecoder = h;
  function h(g) {
    this.encoding = o(g);
    var w;
    switch (this.encoding) {
      case "utf16le":
        this.text = u, this.end = r, w = 4;
        break;
      case "utf8":
        this.fillLast = e, w = 4;
        break;
      case "base64":
        this.text = f, this.end = p, w = 3;
        break;
      default:
        this.write = v, this.end = m;
        return;
    }
    this.lastNeed = 0, this.lastTotal = 0, this.lastChar = t.allocUnsafe(w);
  }
  h.prototype.write = function(g) {
    if (g.length === 0) return "";
    var w, S;
    if (this.lastNeed) {
      if (w = this.fillLast(g), w === void 0) return "";
      S = this.lastNeed, this.lastNeed = 0;
    } else
      S = 0;
    return S < g.length ? w ? w + this.text(g, S) : this.text(g, S) : w || "";
  }, h.prototype.end = l, h.prototype.text = n, h.prototype.fillLast = function(g) {
    if (this.lastNeed <= g.length)
      return g.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    g.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, g.length), this.lastNeed -= g.length;
  };
  function s(g) {
    return g <= 127 ? 0 : g >> 5 === 6 ? 2 : g >> 4 === 14 ? 3 : g >> 3 === 30 ? 4 : g >> 6 === 2 ? -1 : -2;
  }
  function i(g, w, S) {
    var O = w.length - 1;
    if (O < S) return 0;
    var I = s(w[O]);
    return I >= 0 ? (I > 0 && (g.lastNeed = I - 1), I) : --O < S || I === -2 ? 0 : (I = s(w[O]), I >= 0 ? (I > 0 && (g.lastNeed = I - 2), I) : --O < S || I === -2 ? 0 : (I = s(w[O]), I >= 0 ? (I > 0 && (I === 2 ? I = 0 : g.lastNeed = I - 3), I) : 0));
  }
  function d(g, w, S) {
    if ((w[0] & 192) !== 128)
      return g.lastNeed = 0, "�";
    if (g.lastNeed > 1 && w.length > 1) {
      if ((w[1] & 192) !== 128)
        return g.lastNeed = 1, "�";
      if (g.lastNeed > 2 && w.length > 2 && (w[2] & 192) !== 128)
        return g.lastNeed = 2, "�";
    }
  }
  function e(g) {
    var w = this.lastTotal - this.lastNeed, S = d(this, g);
    if (S !== void 0) return S;
    if (this.lastNeed <= g.length)
      return g.copy(this.lastChar, w, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    g.copy(this.lastChar, w, 0, g.length), this.lastNeed -= g.length;
  }
  function n(g, w) {
    var S = i(this, g, w);
    if (!this.lastNeed) return g.toString("utf8", w);
    this.lastTotal = S;
    var O = g.length - (S - this.lastNeed);
    return g.copy(this.lastChar, 0, O), g.toString("utf8", w, O);
  }
  function l(g) {
    var w = g && g.length ? this.write(g) : "";
    return this.lastNeed ? w + "�" : w;
  }
  function u(g, w) {
    if ((g.length - w) % 2 === 0) {
      var S = g.toString("utf16le", w);
      if (S) {
        var O = S.charCodeAt(S.length - 1);
        if (O >= 55296 && O <= 56319)
          return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = g[g.length - 2], this.lastChar[1] = g[g.length - 1], S.slice(0, -1);
      }
      return S;
    }
    return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = g[g.length - 1], g.toString("utf16le", w, g.length - 1);
  }
  function r(g) {
    var w = g && g.length ? this.write(g) : "";
    if (this.lastNeed) {
      var S = this.lastTotal - this.lastNeed;
      return w + this.lastChar.toString("utf16le", 0, S);
    }
    return w;
  }
  function f(g, w) {
    var S = (g.length - w) % 3;
    return S === 0 ? g.toString("base64", w) : (this.lastNeed = 3 - S, this.lastTotal = 3, S === 1 ? this.lastChar[0] = g[g.length - 1] : (this.lastChar[0] = g[g.length - 2], this.lastChar[1] = g[g.length - 1]), g.toString("base64", w, g.length - S));
  }
  function p(g) {
    var w = g && g.length ? this.write(g) : "";
    return this.lastNeed ? w + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : w;
  }
  function v(g) {
    return g.toString(this.encoding);
  }
  function m(g) {
    return g && g.length ? this.write(g) : "";
  }
  return Bo;
}
var Ho, Sd;
function ru() {
  if (Sd) return Ho;
  Sd = 1;
  var t = zr().codes.ERR_STREAM_PREMATURE_CLOSE;
  function a(s) {
    var i = !1;
    return function() {
      if (!i) {
        i = !0;
        for (var d = arguments.length, e = new Array(d), n = 0; n < d; n++)
          e[n] = arguments[n];
        s.apply(this, e);
      }
    };
  }
  function c() {
  }
  function o(s) {
    return s.setHeader && typeof s.abort == "function";
  }
  function h(s, i, d) {
    if (typeof i == "function") return h(s, null, i);
    i || (i = {}), d = a(d || c);
    var e = i.readable || i.readable !== !1 && s.readable, n = i.writable || i.writable !== !1 && s.writable, l = function() {
      s.writable || r();
    }, u = s._writableState && s._writableState.finished, r = function() {
      n = !1, u = !0, e || d.call(s);
    }, f = s._readableState && s._readableState.endEmitted, p = function() {
      e = !1, f = !0, n || d.call(s);
    }, v = function(S) {
      d.call(s, S);
    }, m = function() {
      var S;
      if (e && !f)
        return (!s._readableState || !s._readableState.ended) && (S = new t()), d.call(s, S);
      if (n && !u)
        return (!s._writableState || !s._writableState.ended) && (S = new t()), d.call(s, S);
    }, g = function() {
      s.req.on("finish", r);
    };
    return o(s) ? (s.on("complete", r), s.on("abort", m), s.req ? g() : s.on("request", g)) : n && !s._writableState && (s.on("end", l), s.on("close", l)), s.on("end", p), s.on("finish", r), i.error !== !1 && s.on("error", v), s.on("close", m), function() {
      s.removeListener("complete", r), s.removeListener("abort", m), s.removeListener("request", g), s.req && s.req.removeListener("finish", r), s.removeListener("end", l), s.removeListener("close", l), s.removeListener("finish", r), s.removeListener("end", p), s.removeListener("error", v), s.removeListener("close", m);
    };
  }
  return Ho = h, Ho;
}
var Go, Rd;
function Bv() {
  if (Rd) return Go;
  Rd = 1;
  var t;
  function a(S, O, I) {
    return O = c(O), O in S ? Object.defineProperty(S, O, { value: I, enumerable: !0, configurable: !0, writable: !0 }) : S[O] = I, S;
  }
  function c(S) {
    var O = o(S, "string");
    return typeof O == "symbol" ? O : String(O);
  }
  function o(S, O) {
    if (typeof S != "object" || S === null) return S;
    var I = S[Symbol.toPrimitive];
    if (I !== void 0) {
      var T = I.call(S, O || "default");
      if (typeof T != "object") return T;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (O === "string" ? String : Number)(S);
  }
  var h = ru(), s = Symbol("lastResolve"), i = Symbol("lastReject"), d = Symbol("error"), e = Symbol("ended"), n = Symbol("lastPromise"), l = Symbol("handlePromise"), u = Symbol("stream");
  function r(S, O) {
    return {
      value: S,
      done: O
    };
  }
  function f(S) {
    var O = S[s];
    if (O !== null) {
      var I = S[u].read();
      I !== null && (S[n] = null, S[s] = null, S[i] = null, O(r(I, !1)));
    }
  }
  function p(S) {
    process.nextTick(f, S);
  }
  function v(S, O) {
    return function(I, T) {
      S.then(function() {
        if (O[e]) {
          I(r(void 0, !0));
          return;
        }
        O[l](I, T);
      }, T);
    };
  }
  var m = Object.getPrototypeOf(function() {
  }), g = Object.setPrototypeOf((t = {
    get stream() {
      return this[u];
    },
    next: function() {
      var O = this, I = this[d];
      if (I !== null)
        return Promise.reject(I);
      if (this[e])
        return Promise.resolve(r(void 0, !0));
      if (this[u].destroyed)
        return new Promise(function(b, G) {
          process.nextTick(function() {
            O[d] ? G(O[d]) : b(r(void 0, !0));
          });
        });
      var T = this[n], R;
      if (T)
        R = new Promise(v(T, this));
      else {
        var A = this[u].read();
        if (A !== null)
          return Promise.resolve(r(A, !1));
        R = new Promise(this[l]);
      }
      return this[n] = R, R;
    }
  }, a(t, Symbol.asyncIterator, function() {
    return this;
  }), a(t, "return", function() {
    var O = this;
    return new Promise(function(I, T) {
      O[u].destroy(null, function(R) {
        if (R) {
          T(R);
          return;
        }
        I(r(void 0, !0));
      });
    });
  }), t), m), w = function(O) {
    var I, T = Object.create(g, (I = {}, a(I, u, {
      value: O,
      writable: !0
    }), a(I, s, {
      value: null,
      writable: !0
    }), a(I, i, {
      value: null,
      writable: !0
    }), a(I, d, {
      value: null,
      writable: !0
    }), a(I, e, {
      value: O._readableState.endEmitted,
      writable: !0
    }), a(I, l, {
      value: function(A, b) {
        var G = T[u].read();
        G ? (T[n] = null, T[s] = null, T[i] = null, A(r(G, !1))) : (T[s] = A, T[i] = b);
      },
      writable: !0
    }), I));
    return T[n] = null, h(O, function(R) {
      if (R && R.code !== "ERR_STREAM_PREMATURE_CLOSE") {
        var A = T[i];
        A !== null && (T[n] = null, T[s] = null, T[i] = null, A(R)), T[d] = R;
        return;
      }
      var b = T[s];
      b !== null && (T[n] = null, T[s] = null, T[i] = null, b(r(void 0, !0))), T[e] = !0;
    }), O.on("readable", p.bind(null, T)), T;
  };
  return Go = w, Go;
}
var Wo, Td;
function Hv() {
  if (Td) return Wo;
  Td = 1;
  function t(n, l, u, r, f, p, v) {
    try {
      var m = n[p](v), g = m.value;
    } catch (w) {
      u(w);
      return;
    }
    m.done ? l(g) : Promise.resolve(g).then(r, f);
  }
  function a(n) {
    return function() {
      var l = this, u = arguments;
      return new Promise(function(r, f) {
        var p = n.apply(l, u);
        function v(g) {
          t(p, r, f, v, m, "next", g);
        }
        function m(g) {
          t(p, r, f, v, m, "throw", g);
        }
        v(void 0);
      });
    };
  }
  function c(n, l) {
    var u = Object.keys(n);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(n);
      l && (r = r.filter(function(f) {
        return Object.getOwnPropertyDescriptor(n, f).enumerable;
      })), u.push.apply(u, r);
    }
    return u;
  }
  function o(n) {
    for (var l = 1; l < arguments.length; l++) {
      var u = arguments[l] != null ? arguments[l] : {};
      l % 2 ? c(Object(u), !0).forEach(function(r) {
        h(n, r, u[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(n, Object.getOwnPropertyDescriptors(u)) : c(Object(u)).forEach(function(r) {
        Object.defineProperty(n, r, Object.getOwnPropertyDescriptor(u, r));
      });
    }
    return n;
  }
  function h(n, l, u) {
    return l = s(l), l in n ? Object.defineProperty(n, l, { value: u, enumerable: !0, configurable: !0, writable: !0 }) : n[l] = u, n;
  }
  function s(n) {
    var l = i(n, "string");
    return typeof l == "symbol" ? l : String(l);
  }
  function i(n, l) {
    if (typeof n != "object" || n === null) return n;
    var u = n[Symbol.toPrimitive];
    if (u !== void 0) {
      var r = u.call(n, l || "default");
      if (typeof r != "object") return r;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (l === "string" ? String : Number)(n);
  }
  var d = zr().codes.ERR_INVALID_ARG_TYPE;
  function e(n, l, u) {
    var r;
    if (l && typeof l.next == "function")
      r = l;
    else if (l && l[Symbol.asyncIterator]) r = l[Symbol.asyncIterator]();
    else if (l && l[Symbol.iterator]) r = l[Symbol.iterator]();
    else throw new d("iterable", ["Iterable"], l);
    var f = new n(o({
      objectMode: !0
    }, u)), p = !1;
    f._read = function() {
      p || (p = !0, v());
    };
    function v() {
      return m.apply(this, arguments);
    }
    function m() {
      return m = a(function* () {
        try {
          var g = yield r.next(), w = g.value, S = g.done;
          S ? f.push(null) : f.push(yield w) ? v() : p = !1;
        } catch (O) {
          f.destroy(O);
        }
      }), m.apply(this, arguments);
    }
    return f;
  }
  return Wo = e, Wo;
}
var zo, Ad;
function Vp() {
  if (Ad) return zo;
  Ad = 1, zo = b;
  var t;
  b.ReadableState = A, $s.EventEmitter;
  var a = function(P, z) {
    return P.listeners(z).length;
  }, c = Wp(), o = Yn.Buffer, h = (typeof Xe < "u" ? Xe : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array || function() {
  };
  function s(x) {
    return o.from(x);
  }
  function i(x) {
    return o.isBuffer(x) || x instanceof h;
  }
  var d = ur, e;
  d && d.debuglog ? e = d.debuglog("stream") : e = function() {
  };
  var n = Uv(), l = zp(), u = Yp(), r = u.getHighWaterMark, f = zr().codes, p = f.ERR_INVALID_ARG_TYPE, v = f.ERR_STREAM_PUSH_AFTER_EOF, m = f.ERR_METHOD_NOT_IMPLEMENTED, g = f.ERR_STREAM_UNSHIFT_AFTER_END_EVENT, w, S, O;
  Ht()(b, c);
  var I = l.errorOrDestroy, T = ["error", "close", "destroy", "pause", "resume"];
  function R(x, P, z) {
    if (typeof x.prependListener == "function") return x.prependListener(P, z);
    !x._events || !x._events[P] ? x.on(P, z) : Array.isArray(x._events[P]) ? x._events[P].unshift(z) : x._events[P] = [z, x._events[P]];
  }
  function A(x, P, z) {
    t = t || et(), x = x || {}, typeof z != "boolean" && (z = P instanceof t), this.objectMode = !!x.objectMode, z && (this.objectMode = this.objectMode || !!x.readableObjectMode), this.highWaterMark = r(this, x, "readableHighWaterMark", z), this.buffer = new n(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.paused = !0, this.emitClose = x.emitClose !== !1, this.autoDestroy = !!x.autoDestroy, this.destroyed = !1, this.defaultEncoding = x.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, x.encoding && (w || (w = bd().StringDecoder), this.decoder = new w(x.encoding), this.encoding = x.encoding);
  }
  function b(x) {
    if (t = t || et(), !(this instanceof b)) return new b(x);
    var P = this instanceof t;
    this._readableState = new A(x, this, P), this.readable = !0, x && (typeof x.read == "function" && (this._read = x.read), typeof x.destroy == "function" && (this._destroy = x.destroy)), c.call(this);
  }
  Object.defineProperty(b.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState === void 0 ? !1 : this._readableState.destroyed;
    },
    set: function(P) {
      this._readableState && (this._readableState.destroyed = P);
    }
  }), b.prototype.destroy = l.destroy, b.prototype._undestroy = l.undestroy, b.prototype._destroy = function(x, P) {
    P(x);
  }, b.prototype.push = function(x, P) {
    var z = this._readableState, te;
    return z.objectMode ? te = !0 : typeof x == "string" && (P = P || z.defaultEncoding, P !== z.encoding && (x = o.from(x, P), P = ""), te = !0), G(this, x, P, !1, te);
  }, b.prototype.unshift = function(x) {
    return G(this, x, null, !0, !1);
  };
  function G(x, P, z, te, he) {
    e("readableAddChunk", P);
    var we = x._readableState;
    if (P === null)
      we.reading = !1, D(x, we);
    else {
      var Ee;
      if (he || (Ee = U(we, P)), Ee)
        I(x, Ee);
      else if (we.objectMode || P && P.length > 0)
        if (typeof P != "string" && !we.objectMode && Object.getPrototypeOf(P) !== o.prototype && (P = s(P)), te)
          we.endEmitted ? I(x, new g()) : j(x, we, P, !0);
        else if (we.ended)
          I(x, new v());
        else {
          if (we.destroyed)
            return !1;
          we.reading = !1, we.decoder && !z ? (P = we.decoder.write(P), we.objectMode || P.length !== 0 ? j(x, we, P, !1) : W(x, we)) : j(x, we, P, !1);
        }
      else te || (we.reading = !1, W(x, we));
    }
    return !we.ended && (we.length < we.highWaterMark || we.length === 0);
  }
  function j(x, P, z, te) {
    P.flowing && P.length === 0 && !P.sync ? (P.awaitDrain = 0, x.emit("data", z)) : (P.length += P.objectMode ? 1 : z.length, te ? P.buffer.unshift(z) : P.buffer.push(z), P.needReadable && $(x)), W(x, P);
  }
  function U(x, P) {
    var z;
    return !i(P) && typeof P != "string" && P !== void 0 && !x.objectMode && (z = new p("chunk", ["string", "Buffer", "Uint8Array"], P)), z;
  }
  b.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  }, b.prototype.setEncoding = function(x) {
    w || (w = bd().StringDecoder);
    var P = new w(x);
    this._readableState.decoder = P, this._readableState.encoding = this._readableState.decoder.encoding;
    for (var z = this._readableState.buffer.head, te = ""; z !== null; )
      te += P.write(z.data), z = z.next;
    return this._readableState.buffer.clear(), te !== "" && this._readableState.buffer.push(te), this._readableState.length = te.length, this;
  };
  var H = 1073741824;
  function M(x) {
    return x >= H ? x = H : (x--, x |= x >>> 1, x |= x >>> 2, x |= x >>> 4, x |= x >>> 8, x |= x >>> 16, x++), x;
  }
  function F(x, P) {
    return x <= 0 || P.length === 0 && P.ended ? 0 : P.objectMode ? 1 : x !== x ? P.flowing && P.length ? P.buffer.head.data.length : P.length : (x > P.highWaterMark && (P.highWaterMark = M(x)), x <= P.length ? x : P.ended ? P.length : (P.needReadable = !0, 0));
  }
  b.prototype.read = function(x) {
    e("read", x), x = parseInt(x, 10);
    var P = this._readableState, z = x;
    if (x !== 0 && (P.emittedReadable = !1), x === 0 && P.needReadable && ((P.highWaterMark !== 0 ? P.length >= P.highWaterMark : P.length > 0) || P.ended))
      return e("read: emitReadable", P.length, P.ended), P.length === 0 && P.ended ? _(this) : $(this), null;
    if (x = F(x, P), x === 0 && P.ended)
      return P.length === 0 && _(this), null;
    var te = P.needReadable;
    e("need readable", te), (P.length === 0 || P.length - x < P.highWaterMark) && (te = !0, e("length less than watermark", te)), P.ended || P.reading ? (te = !1, e("reading or ended", te)) : te && (e("do read"), P.reading = !0, P.sync = !0, P.length === 0 && (P.needReadable = !0), this._read(P.highWaterMark), P.sync = !1, P.reading || (x = F(z, P)));
    var he;
    return x > 0 ? he = E(x, P) : he = null, he === null ? (P.needReadable = P.length <= P.highWaterMark, x = 0) : (P.length -= x, P.awaitDrain = 0), P.length === 0 && (P.ended || (P.needReadable = !0), z !== x && P.ended && _(this)), he !== null && this.emit("data", he), he;
  };
  function D(x, P) {
    if (e("onEofChunk"), !P.ended) {
      if (P.decoder) {
        var z = P.decoder.end();
        z && z.length && (P.buffer.push(z), P.length += P.objectMode ? 1 : z.length);
      }
      P.ended = !0, P.sync ? $(x) : (P.needReadable = !1, P.emittedReadable || (P.emittedReadable = !0, V(x)));
    }
  }
  function $(x) {
    var P = x._readableState;
    e("emitReadable", P.needReadable, P.emittedReadable), P.needReadable = !1, P.emittedReadable || (e("emitReadable", P.flowing), P.emittedReadable = !0, process.nextTick(V, x));
  }
  function V(x) {
    var P = x._readableState;
    e("emitReadable_", P.destroyed, P.length, P.ended), !P.destroyed && (P.length || P.ended) && (x.emit("readable"), P.emittedReadable = !1), P.needReadable = !P.flowing && !P.ended && P.length <= P.highWaterMark, q(x);
  }
  function W(x, P) {
    P.readingMore || (P.readingMore = !0, process.nextTick(re, x, P));
  }
  function re(x, P) {
    for (; !P.reading && !P.ended && (P.length < P.highWaterMark || P.flowing && P.length === 0); ) {
      var z = P.length;
      if (e("maybeReadMore read 0"), x.read(0), z === P.length)
        break;
    }
    P.readingMore = !1;
  }
  b.prototype._read = function(x) {
    I(this, new m("_read()"));
  }, b.prototype.pipe = function(x, P) {
    var z = this, te = this._readableState;
    switch (te.pipesCount) {
      case 0:
        te.pipes = x;
        break;
      case 1:
        te.pipes = [te.pipes, x];
        break;
      default:
        te.pipes.push(x);
        break;
    }
    te.pipesCount += 1, e("pipe count=%d opts=%j", te.pipesCount, P);
    var he = (!P || P.end !== !1) && x !== process.stdout && x !== process.stderr, we = he ? Ne : ce;
    te.endEmitted ? process.nextTick(we) : z.once("end", we), x.on("unpipe", Ee);
    function Ee(ae, de) {
      e("onunpipe"), ae === z && de && de.hasUnpiped === !1 && (de.hasUnpiped = !0, y());
    }
    function Ne() {
      e("onend"), x.end();
    }
    var ir = ee(z);
    x.on("drain", ir);
    var ar = !1;
    function y() {
      e("cleanup"), x.removeListener("close", fe), x.removeListener("finish", Q), x.removeListener("drain", ir), x.removeListener("error", J), x.removeListener("unpipe", Ee), z.removeListener("end", Ne), z.removeListener("end", ce), z.removeListener("data", Y), ar = !0, te.awaitDrain && (!x._writableState || x._writableState.needDrain) && ir();
    }
    z.on("data", Y);
    function Y(ae) {
      e("ondata");
      var de = x.write(ae);
      e("dest.write", de), de === !1 && ((te.pipesCount === 1 && te.pipes === x || te.pipesCount > 1 && L(te.pipes, x) !== -1) && !ar && (e("false write response, pause", te.awaitDrain), te.awaitDrain++), z.pause());
    }
    function J(ae) {
      e("onerror", ae), ce(), x.removeListener("error", J), a(x, "error") === 0 && I(x, ae);
    }
    R(x, "error", J);
    function fe() {
      x.removeListener("finish", Q), ce();
    }
    x.once("close", fe);
    function Q() {
      e("onfinish"), x.removeListener("close", fe), ce();
    }
    x.once("finish", Q);
    function ce() {
      e("unpipe"), z.unpipe(x);
    }
    return x.emit("pipe", z), te.flowing || (e("pipe resume"), z.resume()), x;
  };
  function ee(x) {
    return function() {
      var z = x._readableState;
      e("pipeOnDrain", z.awaitDrain), z.awaitDrain && z.awaitDrain--, z.awaitDrain === 0 && a(x, "data") && (z.flowing = !0, q(x));
    };
  }
  b.prototype.unpipe = function(x) {
    var P = this._readableState, z = {
      hasUnpiped: !1
    };
    if (P.pipesCount === 0) return this;
    if (P.pipesCount === 1)
      return x && x !== P.pipes ? this : (x || (x = P.pipes), P.pipes = null, P.pipesCount = 0, P.flowing = !1, x && x.emit("unpipe", this, z), this);
    if (!x) {
      var te = P.pipes, he = P.pipesCount;
      P.pipes = null, P.pipesCount = 0, P.flowing = !1;
      for (var we = 0; we < he; we++) te[we].emit("unpipe", this, {
        hasUnpiped: !1
      });
      return this;
    }
    var Ee = L(P.pipes, x);
    return Ee === -1 ? this : (P.pipes.splice(Ee, 1), P.pipesCount -= 1, P.pipesCount === 1 && (P.pipes = P.pipes[0]), x.emit("unpipe", this, z), this);
  }, b.prototype.on = function(x, P) {
    var z = c.prototype.on.call(this, x, P), te = this._readableState;
    return x === "data" ? (te.readableListening = this.listenerCount("readable") > 0, te.flowing !== !1 && this.resume()) : x === "readable" && !te.endEmitted && !te.readableListening && (te.readableListening = te.needReadable = !0, te.flowing = !1, te.emittedReadable = !1, e("on readable", te.length, te.reading), te.length ? $(this) : te.reading || process.nextTick(se, this)), z;
  }, b.prototype.addListener = b.prototype.on, b.prototype.removeListener = function(x, P) {
    var z = c.prototype.removeListener.call(this, x, P);
    return x === "readable" && process.nextTick(oe, this), z;
  }, b.prototype.removeAllListeners = function(x) {
    var P = c.prototype.removeAllListeners.apply(this, arguments);
    return (x === "readable" || x === void 0) && process.nextTick(oe, this), P;
  };
  function oe(x) {
    var P = x._readableState;
    P.readableListening = x.listenerCount("readable") > 0, P.resumeScheduled && !P.paused ? P.flowing = !0 : x.listenerCount("data") > 0 && x.resume();
  }
  function se(x) {
    e("readable nexttick read 0"), x.read(0);
  }
  b.prototype.resume = function() {
    var x = this._readableState;
    return x.flowing || (e("resume"), x.flowing = !x.readableListening, ye(this, x)), x.paused = !1, this;
  };
  function ye(x, P) {
    P.resumeScheduled || (P.resumeScheduled = !0, process.nextTick(X, x, P));
  }
  function X(x, P) {
    e("resume", P.reading), P.reading || x.read(0), P.resumeScheduled = !1, x.emit("resume"), q(x), P.flowing && !P.reading && x.read(0);
  }
  b.prototype.pause = function() {
    return e("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (e("pause"), this._readableState.flowing = !1, this.emit("pause")), this._readableState.paused = !0, this;
  };
  function q(x) {
    var P = x._readableState;
    for (e("flow", P.flowing); P.flowing && x.read() !== null; ) ;
  }
  b.prototype.wrap = function(x) {
    var P = this, z = this._readableState, te = !1;
    x.on("end", function() {
      if (e("wrapped end"), z.decoder && !z.ended) {
        var Ee = z.decoder.end();
        Ee && Ee.length && P.push(Ee);
      }
      P.push(null);
    }), x.on("data", function(Ee) {
      if (e("wrapped data"), z.decoder && (Ee = z.decoder.write(Ee)), !(z.objectMode && Ee == null) && !(!z.objectMode && (!Ee || !Ee.length))) {
        var Ne = P.push(Ee);
        Ne || (te = !0, x.pause());
      }
    });
    for (var he in x)
      this[he] === void 0 && typeof x[he] == "function" && (this[he] = /* @__PURE__ */ function(Ne) {
        return function() {
          return x[Ne].apply(x, arguments);
        };
      }(he));
    for (var we = 0; we < T.length; we++)
      x.on(T[we], this.emit.bind(this, T[we]));
    return this._read = function(Ee) {
      e("wrapped _read", Ee), te && (te = !1, x.resume());
    }, this;
  }, typeof Symbol == "function" && (b.prototype[Symbol.asyncIterator] = function() {
    return S === void 0 && (S = Bv()), S(this);
  }), Object.defineProperty(b.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState.highWaterMark;
    }
  }), Object.defineProperty(b.prototype, "readableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState && this._readableState.buffer;
    }
  }), Object.defineProperty(b.prototype, "readableFlowing", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState.flowing;
    },
    set: function(P) {
      this._readableState && (this._readableState.flowing = P);
    }
  }), b._fromList = E, Object.defineProperty(b.prototype, "readableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState.length;
    }
  });
  function E(x, P) {
    if (P.length === 0) return null;
    var z;
    return P.objectMode ? z = P.buffer.shift() : !x || x >= P.length ? (P.decoder ? z = P.buffer.join("") : P.buffer.length === 1 ? z = P.buffer.first() : z = P.buffer.concat(P.length), P.buffer.clear()) : z = P.buffer.consume(x, P.decoder), z;
  }
  function _(x) {
    var P = x._readableState;
    e("endReadable", P.endEmitted), P.endEmitted || (P.ended = !0, process.nextTick(k, P, x));
  }
  function k(x, P) {
    if (e("endReadableNT", x.endEmitted, x.length), !x.endEmitted && x.length === 0 && (x.endEmitted = !0, P.readable = !1, P.emit("end"), x.autoDestroy)) {
      var z = P._writableState;
      (!z || z.autoDestroy && z.finished) && P.destroy();
    }
  }
  typeof Symbol == "function" && (b.from = function(x, P) {
    return O === void 0 && (O = Hv()), O(b, x, P);
  });
  function L(x, P) {
    for (var z = 0, te = x.length; z < te; z++)
      if (x[z] === P) return z;
    return -1;
  }
  return zo;
}
var Yo, Od;
function et() {
  if (Od) return Yo;
  Od = 1;
  var t = Object.keys || function(n) {
    var l = [];
    for (var u in n) l.push(u);
    return l;
  };
  Yo = i;
  var a = Vp(), c = tu();
  Ht()(i, a);
  for (var o = t(c.prototype), h = 0; h < o.length; h++) {
    var s = o[h];
    i.prototype[s] || (i.prototype[s] = c.prototype[s]);
  }
  function i(n) {
    if (!(this instanceof i)) return new i(n);
    a.call(this, n), c.call(this, n), this.allowHalfOpen = !0, n && (n.readable === !1 && (this.readable = !1), n.writable === !1 && (this.writable = !1), n.allowHalfOpen === !1 && (this.allowHalfOpen = !1, this.once("end", d)));
  }
  Object.defineProperty(i.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.highWaterMark;
    }
  }), Object.defineProperty(i.prototype, "writableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState && this._writableState.getBuffer();
    }
  }), Object.defineProperty(i.prototype, "writableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.length;
    }
  });
  function d() {
    this._writableState.ended || process.nextTick(e, this);
  }
  function e(n) {
    n.end();
  }
  return Object.defineProperty(i.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    },
    set: function(l) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = l, this._writableState.destroyed = l);
    }
  }), Yo;
}
var Vo, Cd;
function tu() {
  if (Cd) return Vo;
  Cd = 1, Vo = A;
  function t(q) {
    var E = this;
    this.next = null, this.entry = null, this.finish = function() {
      X(E, q);
    };
  }
  var a;
  A.WritableState = T;
  var c = {
    deprecate: Mv()
  }, o = Wp(), h = Yn.Buffer, s = (typeof Xe < "u" ? Xe : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array || function() {
  };
  function i(q) {
    return h.from(q);
  }
  function d(q) {
    return h.isBuffer(q) || q instanceof s;
  }
  var e = zp(), n = Yp(), l = n.getHighWaterMark, u = zr().codes, r = u.ERR_INVALID_ARG_TYPE, f = u.ERR_METHOD_NOT_IMPLEMENTED, p = u.ERR_MULTIPLE_CALLBACK, v = u.ERR_STREAM_CANNOT_PIPE, m = u.ERR_STREAM_DESTROYED, g = u.ERR_STREAM_NULL_VALUES, w = u.ERR_STREAM_WRITE_AFTER_END, S = u.ERR_UNKNOWN_ENCODING, O = e.errorOrDestroy;
  Ht()(A, o);
  function I() {
  }
  function T(q, E, _) {
    a = a || et(), q = q || {}, typeof _ != "boolean" && (_ = E instanceof a), this.objectMode = !!q.objectMode, _ && (this.objectMode = this.objectMode || !!q.writableObjectMode), this.highWaterMark = l(this, q, "writableHighWaterMark", _), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
    var k = q.decodeStrings === !1;
    this.decodeStrings = !k, this.defaultEncoding = q.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(L) {
      D(E, L);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.emitClose = q.emitClose !== !1, this.autoDestroy = !!q.autoDestroy, this.bufferedRequestCount = 0, this.corkedRequestsFree = new t(this);
  }
  T.prototype.getBuffer = function() {
    for (var E = this.bufferedRequest, _ = []; E; )
      _.push(E), E = E.next;
    return _;
  }, function() {
    try {
      Object.defineProperty(T.prototype, "buffer", {
        get: c.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  }();
  var R;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (R = Function.prototype[Symbol.hasInstance], Object.defineProperty(A, Symbol.hasInstance, {
    value: function(E) {
      return R.call(this, E) ? !0 : this !== A ? !1 : E && E._writableState instanceof T;
    }
  })) : R = function(E) {
    return E instanceof this;
  };
  function A(q) {
    a = a || et();
    var E = this instanceof a;
    if (!E && !R.call(A, this)) return new A(q);
    this._writableState = new T(q, this, E), this.writable = !0, q && (typeof q.write == "function" && (this._write = q.write), typeof q.writev == "function" && (this._writev = q.writev), typeof q.destroy == "function" && (this._destroy = q.destroy), typeof q.final == "function" && (this._final = q.final)), o.call(this);
  }
  A.prototype.pipe = function() {
    O(this, new v());
  };
  function b(q, E) {
    var _ = new w();
    O(q, _), process.nextTick(E, _);
  }
  function G(q, E, _, k) {
    var L;
    return _ === null ? L = new g() : typeof _ != "string" && !E.objectMode && (L = new r("chunk", ["string", "Buffer"], _)), L ? (O(q, L), process.nextTick(k, L), !1) : !0;
  }
  A.prototype.write = function(q, E, _) {
    var k = this._writableState, L = !1, x = !k.objectMode && d(q);
    return x && !h.isBuffer(q) && (q = i(q)), typeof E == "function" && (_ = E, E = null), x ? E = "buffer" : E || (E = k.defaultEncoding), typeof _ != "function" && (_ = I), k.ending ? b(this, _) : (x || G(this, k, q, _)) && (k.pendingcb++, L = U(this, k, x, q, E, _)), L;
  }, A.prototype.cork = function() {
    this._writableState.corked++;
  }, A.prototype.uncork = function() {
    var q = this._writableState;
    q.corked && (q.corked--, !q.writing && !q.corked && !q.bufferProcessing && q.bufferedRequest && W(this, q));
  }, A.prototype.setDefaultEncoding = function(E) {
    if (typeof E == "string" && (E = E.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((E + "").toLowerCase()) > -1)) throw new S(E);
    return this._writableState.defaultEncoding = E, this;
  }, Object.defineProperty(A.prototype, "writableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState && this._writableState.getBuffer();
    }
  });
  function j(q, E, _) {
    return !q.objectMode && q.decodeStrings !== !1 && typeof E == "string" && (E = h.from(E, _)), E;
  }
  Object.defineProperty(A.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function U(q, E, _, k, L, x) {
    if (!_) {
      var P = j(E, k, L);
      k !== P && (_ = !0, L = "buffer", k = P);
    }
    var z = E.objectMode ? 1 : k.length;
    E.length += z;
    var te = E.length < E.highWaterMark;
    if (te || (E.needDrain = !0), E.writing || E.corked) {
      var he = E.lastBufferedRequest;
      E.lastBufferedRequest = {
        chunk: k,
        encoding: L,
        isBuf: _,
        callback: x,
        next: null
      }, he ? he.next = E.lastBufferedRequest : E.bufferedRequest = E.lastBufferedRequest, E.bufferedRequestCount += 1;
    } else
      H(q, E, !1, z, k, L, x);
    return te;
  }
  function H(q, E, _, k, L, x, P) {
    E.writelen = k, E.writecb = P, E.writing = !0, E.sync = !0, E.destroyed ? E.onwrite(new m("write")) : _ ? q._writev(L, E.onwrite) : q._write(L, x, E.onwrite), E.sync = !1;
  }
  function M(q, E, _, k, L) {
    --E.pendingcb, _ ? (process.nextTick(L, k), process.nextTick(se, q, E), q._writableState.errorEmitted = !0, O(q, k)) : (L(k), q._writableState.errorEmitted = !0, O(q, k), se(q, E));
  }
  function F(q) {
    q.writing = !1, q.writecb = null, q.length -= q.writelen, q.writelen = 0;
  }
  function D(q, E) {
    var _ = q._writableState, k = _.sync, L = _.writecb;
    if (typeof L != "function") throw new p();
    if (F(_), E) M(q, _, k, E, L);
    else {
      var x = re(_) || q.destroyed;
      !x && !_.corked && !_.bufferProcessing && _.bufferedRequest && W(q, _), k ? process.nextTick($, q, _, x, L) : $(q, _, x, L);
    }
  }
  function $(q, E, _, k) {
    _ || V(q, E), E.pendingcb--, k(), se(q, E);
  }
  function V(q, E) {
    E.length === 0 && E.needDrain && (E.needDrain = !1, q.emit("drain"));
  }
  function W(q, E) {
    E.bufferProcessing = !0;
    var _ = E.bufferedRequest;
    if (q._writev && _ && _.next) {
      var k = E.bufferedRequestCount, L = new Array(k), x = E.corkedRequestsFree;
      x.entry = _;
      for (var P = 0, z = !0; _; )
        L[P] = _, _.isBuf || (z = !1), _ = _.next, P += 1;
      L.allBuffers = z, H(q, E, !0, E.length, L, "", x.finish), E.pendingcb++, E.lastBufferedRequest = null, x.next ? (E.corkedRequestsFree = x.next, x.next = null) : E.corkedRequestsFree = new t(E), E.bufferedRequestCount = 0;
    } else {
      for (; _; ) {
        var te = _.chunk, he = _.encoding, we = _.callback, Ee = E.objectMode ? 1 : te.length;
        if (H(q, E, !1, Ee, te, he, we), _ = _.next, E.bufferedRequestCount--, E.writing)
          break;
      }
      _ === null && (E.lastBufferedRequest = null);
    }
    E.bufferedRequest = _, E.bufferProcessing = !1;
  }
  A.prototype._write = function(q, E, _) {
    _(new f("_write()"));
  }, A.prototype._writev = null, A.prototype.end = function(q, E, _) {
    var k = this._writableState;
    return typeof q == "function" ? (_ = q, q = null, E = null) : typeof E == "function" && (_ = E, E = null), q != null && this.write(q, E), k.corked && (k.corked = 1, this.uncork()), k.ending || ye(this, k, _), this;
  }, Object.defineProperty(A.prototype, "writableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.length;
    }
  });
  function re(q) {
    return q.ending && q.length === 0 && q.bufferedRequest === null && !q.finished && !q.writing;
  }
  function ee(q, E) {
    q._final(function(_) {
      E.pendingcb--, _ && O(q, _), E.prefinished = !0, q.emit("prefinish"), se(q, E);
    });
  }
  function oe(q, E) {
    !E.prefinished && !E.finalCalled && (typeof q._final == "function" && !E.destroyed ? (E.pendingcb++, E.finalCalled = !0, process.nextTick(ee, q, E)) : (E.prefinished = !0, q.emit("prefinish")));
  }
  function se(q, E) {
    var _ = re(E);
    if (_ && (oe(q, E), E.pendingcb === 0 && (E.finished = !0, q.emit("finish"), E.autoDestroy))) {
      var k = q._readableState;
      (!k || k.autoDestroy && k.endEmitted) && q.destroy();
    }
    return _;
  }
  function ye(q, E, _) {
    E.ending = !0, se(q, E), _ && (E.finished ? process.nextTick(_) : q.once("finish", _)), E.ended = !0, q.writable = !1;
  }
  function X(q, E, _) {
    var k = q.entry;
    for (q.entry = null; k; ) {
      var L = k.callback;
      E.pendingcb--, L(_), k = k.next;
    }
    E.corkedRequestsFree.next = q;
  }
  return Object.defineProperty(A.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    },
    set: function(E) {
      this._writableState && (this._writableState.destroyed = E);
    }
  }), A.prototype.destroy = e.destroy, A.prototype._undestroy = e.undestroy, A.prototype._destroy = function(q, E) {
    E(q);
  }, Vo;
}
var xd;
function Xp() {
  if (xd) return Fo.exports;
  xd = 1;
  const t = ur, a = tu(), { LEVEL: c } = Ue(), o = Fo.exports = function(s = {}) {
    a.call(this, { objectMode: !0, highWaterMark: s.highWaterMark }), this.format = s.format, this.level = s.level, this.handleExceptions = s.handleExceptions, this.handleRejections = s.handleRejections, this.silent = s.silent, s.log && (this.log = s.log), s.logv && (this.logv = s.logv), s.close && (this.close = s.close), this.once("pipe", (i) => {
      this.levels = i.levels, this.parent = i;
    }), this.once("unpipe", (i) => {
      i === this.parent && (this.parent = null, this.close && this.close());
    });
  };
  return t.inherits(o, a), o.prototype._write = function(s, i, d) {
    if (this.silent || s.exception === !0 && !this.handleExceptions)
      return d(null);
    const e = this.level || this.parent && this.parent.level;
    if (!e || this.levels[e] >= this.levels[s[c]]) {
      if (s && !this.format)
        return this.log(s, d);
      let n, l;
      try {
        l = this.format.transform(Object.assign({}, s), this.format.options);
      } catch (u) {
        n = u;
      }
      if (n || !l) {
        if (d(), n) throw n;
        return;
      }
      return this.log(l, d);
    }
    return this._writableState.sync = !1, d(null);
  }, o.prototype._writev = function(s, i) {
    if (this.logv) {
      const d = s.filter(this._accept, this);
      return d.length ? this.logv(d, i) : i(null);
    }
    for (let d = 0; d < s.length; d++) {
      if (!this._accept(s[d])) continue;
      if (s[d].chunk && !this.format) {
        this.log(s[d].chunk, s[d].callback);
        continue;
      }
      let e, n;
      try {
        n = this.format.transform(
          Object.assign({}, s[d].chunk),
          this.format.options
        );
      } catch (l) {
        e = l;
      }
      if (e || !n) {
        if (s[d].callback(), e)
          throw i(null), e;
      } else
        this.log(n, s[d].callback);
    }
    return i(null);
  }, o.prototype._accept = function(s) {
    const i = s.chunk;
    if (this.silent)
      return !1;
    const d = this.level || this.parent && this.parent.level;
    return !!((i.exception === !0 || !d || this.levels[d] >= this.levels[i[c]]) && (this.handleExceptions || i.exception !== !0));
  }, o.prototype._nop = function() {
  }, Fo.exports;
}
var Xo = { exports: {} }, Pd;
function Kp() {
  if (Pd) return Xo.exports;
  Pd = 1;
  const t = ur, { LEVEL: a } = Ue(), c = Xp(), o = Xo.exports = function(s = {}) {
    if (c.call(this, s), !s.transport || typeof s.transport.log != "function")
      throw new Error("Invalid transport, must be an object with a log method.");
    this.transport = s.transport, this.level = this.level || s.transport.level, this.handleExceptions = this.handleExceptions || s.transport.handleExceptions, this._deprecated();
    function i(d) {
      this.emit("error", d, this.transport);
    }
    this.transport.__winstonError || (this.transport.__winstonError = i.bind(this), this.transport.on("error", this.transport.__winstonError));
  };
  return t.inherits(o, c), o.prototype._write = function(s, i, d) {
    if (this.silent || s.exception === !0 && !this.handleExceptions)
      return d(null);
    (!this.level || this.levels[this.level] >= this.levels[s[a]]) && this.transport.log(s[a], s.message, s, this._nop), d(null);
  }, o.prototype._writev = function(s, i) {
    for (let d = 0; d < s.length; d++)
      this._accept(s[d]) && (this.transport.log(
        s[d].chunk[a],
        s[d].chunk.message,
        s[d].chunk,
        this._nop
      ), s[d].callback());
    return i(null);
  }, o.prototype._deprecated = function() {
    console.error([
      `${this.transport.name} is a legacy winston transport. Consider upgrading: `,
      "- Upgrade docs: https://github.com/winstonjs/winston/blob/master/UPGRADE-3.0.md"
    ].join(`
`));
  }, o.prototype.close = function() {
    this.transport.close && this.transport.close(), this.transport.__winstonError && (this.transport.removeListener("error", this.transport.__winstonError), this.transport.__winstonError = null);
  }, Xo.exports;
}
var Dd;
function Gt() {
  return Dd || (Dd = 1, wn.exports = Xp(), wn.exports.LegacyTransportStream = Kp()), wn.exports;
}
var Ko, Id;
function Gv() {
  if (Id) return Ko;
  Id = 1;
  const t = fr, { LEVEL: a, MESSAGE: c } = Ue(), o = Gt();
  return Ko = class extends o {
    /**
     * Constructor function for the Console transport object responsible for
     * persisting log messages and metadata to a terminal or TTY.
     * @param {!Object} [options={}] - Options for this instance.
     */
    constructor(s = {}) {
      super(s), this.name = s.name || "console", this.stderrLevels = this._stringArrayToSet(s.stderrLevels), this.consoleWarnLevels = this._stringArrayToSet(s.consoleWarnLevels), this.eol = typeof s.eol == "string" ? s.eol : t.EOL, this.forceConsole = s.forceConsole || !1, this._consoleLog = console.log.bind(console), this._consoleWarn = console.warn.bind(console), this._consoleError = console.error.bind(console), this.setMaxListeners(30);
    }
    /**
     * Core logging method exposed to Winston.
     * @param {Object} info - TODO: add param description.
     * @param {Function} callback - TODO: add param description.
     * @returns {undefined}
     */
    log(s, i) {
      if (setImmediate(() => this.emit("logged", s)), this.stderrLevels[s[a]]) {
        console._stderr && !this.forceConsole ? console._stderr.write(`${s[c]}${this.eol}`) : this._consoleError(s[c]), i && i();
        return;
      } else if (this.consoleWarnLevels[s[a]]) {
        console._stderr && !this.forceConsole ? console._stderr.write(`${s[c]}${this.eol}`) : this._consoleWarn(s[c]), i && i();
        return;
      }
      console._stdout && !this.forceConsole ? console._stdout.write(`${s[c]}${this.eol}`) : this._consoleLog(s[c]), i && i();
    }
    /**
     * Returns a Set-like object with strArray's elements as keys (each with the
     * value true).
     * @param {Array} strArray - Array of Set-elements as strings.
     * @param {?string} [errMsg] - Custom error message thrown on invalid input.
     * @returns {Object} - TODO: add return description.
     * @private
     */
    _stringArrayToSet(s, i) {
      if (!s) return {};
      if (i = i || "Cannot make set from type other than Array of string elements", !Array.isArray(s))
        throw new Error(i);
      return s.reduce((d, e) => {
        if (typeof e != "string")
          throw new Error(i);
        return d[e] = !0, d;
      }, {});
    }
  }, Ko;
}
var Sn = { exports: {} }, Rn = { exports: {} }, Tn = { exports: {} }, Nd;
function nu() {
  return Nd || (Nd = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    }), a.default = c;
    function c(o) {
      return o && typeof o.length == "number" && o.length >= 0 && o.length % 1 === 0;
    }
    t.exports = a.default;
  }(Tn, Tn.exports)), Tn.exports;
}
var mr = {}, An = { exports: {} }, On = { exports: {} }, Ld;
function Wv() {
  return Ld || (Ld = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    }), a.default = function(c) {
      return function(...o) {
        var h = o.pop();
        return c.call(this, o, h);
      };
    }, t.exports = a.default;
  }(On, On.exports)), On.exports;
}
var Er = {}, Fd;
function zv() {
  if (Fd) return Er;
  Fd = 1, Object.defineProperty(Er, "__esModule", {
    value: !0
  }), Er.fallback = o, Er.wrap = h;
  var t = Er.hasQueueMicrotask = typeof queueMicrotask == "function" && queueMicrotask, a = Er.hasSetImmediate = typeof setImmediate == "function" && setImmediate, c = Er.hasNextTick = typeof process == "object" && typeof process.nextTick == "function";
  function o(i) {
    setTimeout(i, 0);
  }
  function h(i) {
    return (d, ...e) => i(() => d(...e));
  }
  var s;
  return t ? s = queueMicrotask : a ? s = setImmediate : c ? s = process.nextTick : s = o, Er.default = h(s), Er;
}
var $d;
function Yv() {
  return $d || ($d = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    }), a.default = e;
    var c = Wv(), o = d(c), h = zv(), s = d(h), i = ot();
    function d(u) {
      return u && u.__esModule ? u : { default: u };
    }
    function e(u) {
      return (0, i.isAsync)(u) ? function(...r) {
        const f = r.pop(), p = u.apply(this, r);
        return n(p, f);
      } : (0, o.default)(function(r, f) {
        var p;
        try {
          p = u.apply(this, r);
        } catch (v) {
          return f(v);
        }
        if (p && typeof p.then == "function")
          return n(p, f);
        f(null, p);
      });
    }
    function n(u, r) {
      return u.then((f) => {
        l(r, null, f);
      }, (f) => {
        l(r, f && (f instanceof Error || f.message) ? f : new Error(f));
      });
    }
    function l(u, r, f) {
      try {
        u(r, f);
      } catch (p) {
        (0, s.default)((v) => {
          throw v;
        }, p);
      }
    }
    t.exports = a.default;
  }(An, An.exports)), An.exports;
}
var qd;
function ot() {
  if (qd) return mr;
  qd = 1, Object.defineProperty(mr, "__esModule", {
    value: !0
  }), mr.isAsyncIterable = mr.isAsyncGenerator = mr.isAsync = void 0;
  var t = Yv(), a = c(t);
  function c(d) {
    return d && d.__esModule ? d : { default: d };
  }
  function o(d) {
    return d[Symbol.toStringTag] === "AsyncFunction";
  }
  function h(d) {
    return d[Symbol.toStringTag] === "AsyncGenerator";
  }
  function s(d) {
    return typeof d[Symbol.asyncIterator] == "function";
  }
  function i(d) {
    if (typeof d != "function") throw new Error("expected a function");
    return o(d) ? (0, a.default)(d) : d;
  }
  return mr.default = i, mr.isAsync = o, mr.isAsyncGenerator = h, mr.isAsyncIterable = s, mr;
}
var Cn = { exports: {} }, Md;
function Wt() {
  return Md || (Md = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    }), a.default = c;
    function c(o, h) {
      if (h || (h = o.length), !h) throw new Error("arity is undefined");
      function s(...i) {
        return typeof i[h - 1] == "function" ? o.apply(this, i) : new Promise((d, e) => {
          i[h - 1] = (n, ...l) => {
            if (n) return e(n);
            d(l.length > 1 ? l : l[0]);
          }, o.apply(this, i);
        });
      }
      return s;
    }
    t.exports = a.default;
  }(Cn, Cn.exports)), Cn.exports;
}
var kd;
function Vv() {
  return kd || (kd = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    });
    var c = nu(), o = e(c), h = ot(), s = e(h), i = Wt(), d = e(i);
    function e(n) {
      return n && n.__esModule ? n : { default: n };
    }
    a.default = (0, d.default)((n, l, u) => {
      var r = (0, o.default)(l) ? [] : {};
      n(l, (f, p, v) => {
        (0, s.default)(f)((m, ...g) => {
          g.length < 2 && ([g] = g), r[p] = g, v(m);
        });
      }, (f) => u(f, r));
    }, 3), t.exports = a.default;
  }(Rn, Rn.exports)), Rn.exports;
}
var xn = { exports: {} }, Pn = { exports: {} }, Dn = { exports: {} }, In = { exports: {} }, Ud;
function Jp() {
  return Ud || (Ud = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    }), a.default = c;
    function c(o) {
      function h(...s) {
        if (o !== null) {
          var i = o;
          o = null, i.apply(this, s);
        }
      }
      return Object.assign(h, o), h;
    }
    t.exports = a.default;
  }(In, In.exports)), In.exports;
}
var Nn = { exports: {} }, Ln = { exports: {} }, jd;
function Xv() {
  return jd || (jd = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    }), a.default = function(c) {
      return c[Symbol.iterator] && c[Symbol.iterator]();
    }, t.exports = a.default;
  }(Ln, Ln.exports)), Ln.exports;
}
var Bd;
function Kv() {
  return Bd || (Bd = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    }), a.default = l;
    var c = nu(), o = i(c), h = Xv(), s = i(h);
    function i(u) {
      return u && u.__esModule ? u : { default: u };
    }
    function d(u) {
      var r = -1, f = u.length;
      return function() {
        return ++r < f ? { value: u[r], key: r } : null;
      };
    }
    function e(u) {
      var r = -1;
      return function() {
        var p = u.next();
        return p.done ? null : (r++, { value: p.value, key: r });
      };
    }
    function n(u) {
      var r = u ? Object.keys(u) : [], f = -1, p = r.length;
      return function v() {
        var m = r[++f];
        return m === "__proto__" ? v() : f < p ? { value: u[m], key: m } : null;
      };
    }
    function l(u) {
      if ((0, o.default)(u))
        return d(u);
      var r = (0, s.default)(u);
      return r ? e(r) : n(u);
    }
    t.exports = a.default;
  }(Nn, Nn.exports)), Nn.exports;
}
var Fn = { exports: {} }, Hd;
function Qp() {
  return Hd || (Hd = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    }), a.default = c;
    function c(o) {
      return function(...h) {
        if (o === null) throw new Error("Callback was already called.");
        var s = o;
        o = null, s.apply(this, h);
      };
    }
    t.exports = a.default;
  }(Fn, Fn.exports)), Fn.exports;
}
var $n = { exports: {} }, qn = { exports: {} }, Gd;
function iu() {
  return Gd || (Gd = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    });
    const c = {};
    a.default = c, t.exports = a.default;
  }(qn, qn.exports)), qn.exports;
}
var Wd;
function Jv() {
  return Wd || (Wd = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    }), a.default = s;
    var c = iu(), o = h(c);
    function h(i) {
      return i && i.__esModule ? i : { default: i };
    }
    function s(i, d, e, n) {
      let l = !1, u = !1, r = !1, f = 0, p = 0;
      function v() {
        f >= d || r || l || (r = !0, i.next().then(({ value: w, done: S }) => {
          if (!(u || l)) {
            if (r = !1, S) {
              l = !0, f <= 0 && n(null);
              return;
            }
            f++, e(w, p, m), p++, v();
          }
        }).catch(g));
      }
      function m(w, S) {
        if (f -= 1, !u) {
          if (w) return g(w);
          if (w === !1) {
            l = !0, u = !0;
            return;
          }
          if (S === o.default || l && f <= 0)
            return l = !0, n(null);
          v();
        }
      }
      function g(w) {
        u || (r = !1, l = !0, n(w));
      }
      v();
    }
    t.exports = a.default;
  }($n, $n.exports)), $n.exports;
}
var zd;
function Qv() {
  return zd || (zd = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    });
    var c = Jp(), o = f(c), h = Kv(), s = f(h), i = Qp(), d = f(i), e = ot(), n = Jv(), l = f(n), u = iu(), r = f(u);
    function f(p) {
      return p && p.__esModule ? p : { default: p };
    }
    a.default = (p) => (v, m, g) => {
      if (g = (0, o.default)(g), p <= 0)
        throw new RangeError("concurrency limit cannot be less than 1");
      if (!v)
        return g(null);
      if ((0, e.isAsyncGenerator)(v))
        return (0, l.default)(v, p, m, g);
      if ((0, e.isAsyncIterable)(v))
        return (0, l.default)(v[Symbol.asyncIterator](), p, m, g);
      var w = (0, s.default)(v), S = !1, O = !1, I = 0, T = !1;
      function R(b, G) {
        if (!O)
          if (I -= 1, b)
            S = !0, g(b);
          else if (b === !1)
            S = !0, O = !0;
          else {
            if (G === r.default || S && I <= 0)
              return S = !0, g(null);
            T || A();
          }
      }
      function A() {
        for (T = !0; I < p && !S; ) {
          var b = w();
          if (b === null) {
            S = !0, I <= 0 && g(null);
            return;
          }
          I += 1, m(b.value, b.key, (0, d.default)(R));
        }
        T = !1;
      }
      A();
    }, t.exports = a.default;
  }(Dn, Dn.exports)), Dn.exports;
}
var Yd;
function Zp() {
  return Yd || (Yd = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    });
    var c = Qv(), o = e(c), h = ot(), s = e(h), i = Wt(), d = e(i);
    function e(l) {
      return l && l.__esModule ? l : { default: l };
    }
    function n(l, u, r, f) {
      return (0, o.default)(u)(l, (0, s.default)(r), f);
    }
    a.default = (0, d.default)(n, 4), t.exports = a.default;
  }(Pn, Pn.exports)), Pn.exports;
}
var Vd;
function Zv() {
  return Vd || (Vd = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    });
    var c = Zp(), o = i(c), h = Wt(), s = i(h);
    function i(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function d(e, n, l) {
      return (0, o.default)(e, 1, n, l);
    }
    a.default = (0, s.default)(d, 3), t.exports = a.default;
  }(xn, xn.exports)), xn.exports;
}
var Xd;
function ey() {
  return Xd || (Xd = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    }), a.default = d;
    var c = Vv(), o = i(c), h = Zv(), s = i(h);
    function i(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function d(e, n) {
      return (0, o.default)(s.default, e, n);
    }
    t.exports = a.default;
  }(Sn, Sn.exports)), Sn.exports;
}
var Mn = { exports: {} }, Jo, Kd;
function em() {
  if (Kd) return Jo;
  Kd = 1, Jo = d;
  var t = zr().codes, a = t.ERR_METHOD_NOT_IMPLEMENTED, c = t.ERR_MULTIPLE_CALLBACK, o = t.ERR_TRANSFORM_ALREADY_TRANSFORMING, h = t.ERR_TRANSFORM_WITH_LENGTH_0, s = et();
  Ht()(d, s);
  function i(l, u) {
    var r = this._transformState;
    r.transforming = !1;
    var f = r.writecb;
    if (f === null)
      return this.emit("error", new c());
    r.writechunk = null, r.writecb = null, u != null && this.push(u), f(l);
    var p = this._readableState;
    p.reading = !1, (p.needReadable || p.length < p.highWaterMark) && this._read(p.highWaterMark);
  }
  function d(l) {
    if (!(this instanceof d)) return new d(l);
    s.call(this, l), this._transformState = {
      afterTransform: i.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, l && (typeof l.transform == "function" && (this._transform = l.transform), typeof l.flush == "function" && (this._flush = l.flush)), this.on("prefinish", e);
  }
  function e() {
    var l = this;
    typeof this._flush == "function" && !this._readableState.destroyed ? this._flush(function(u, r) {
      n(l, u, r);
    }) : n(this, null, null);
  }
  d.prototype.push = function(l, u) {
    return this._transformState.needTransform = !1, s.prototype.push.call(this, l, u);
  }, d.prototype._transform = function(l, u, r) {
    r(new a("_transform()"));
  }, d.prototype._write = function(l, u, r) {
    var f = this._transformState;
    if (f.writecb = r, f.writechunk = l, f.writeencoding = u, !f.transforming) {
      var p = this._readableState;
      (f.needTransform || p.needReadable || p.length < p.highWaterMark) && this._read(p.highWaterMark);
    }
  }, d.prototype._read = function(l) {
    var u = this._transformState;
    u.writechunk !== null && !u.transforming ? (u.transforming = !0, this._transform(u.writechunk, u.writeencoding, u.afterTransform)) : u.needTransform = !0;
  }, d.prototype._destroy = function(l, u) {
    s.prototype._destroy.call(this, l, function(r) {
      u(r);
    });
  };
  function n(l, u, r) {
    if (u) return l.emit("error", u);
    if (r != null && l.push(r), l._writableState.length) throw new h();
    if (l._transformState.transforming) throw new o();
    return l.push(null);
  }
  return Jo;
}
var Qo, Jd;
function ry() {
  if (Jd) return Qo;
  Jd = 1, Qo = a;
  var t = em();
  Ht()(a, t);
  function a(c) {
    if (!(this instanceof a)) return new a(c);
    t.call(this, c);
  }
  return a.prototype._transform = function(c, o, h) {
    h(null, c);
  }, Qo;
}
var Zo, Qd;
function ty() {
  if (Qd) return Zo;
  Qd = 1;
  var t;
  function a(r) {
    var f = !1;
    return function() {
      f || (f = !0, r.apply(void 0, arguments));
    };
  }
  var c = zr().codes, o = c.ERR_MISSING_ARGS, h = c.ERR_STREAM_DESTROYED;
  function s(r) {
    if (r) throw r;
  }
  function i(r) {
    return r.setHeader && typeof r.abort == "function";
  }
  function d(r, f, p, v) {
    v = a(v);
    var m = !1;
    r.on("close", function() {
      m = !0;
    }), t === void 0 && (t = ru()), t(r, {
      readable: f,
      writable: p
    }, function(w) {
      if (w) return v(w);
      m = !0, v();
    });
    var g = !1;
    return function(w) {
      if (!m && !g) {
        if (g = !0, i(r)) return r.abort();
        if (typeof r.destroy == "function") return r.destroy();
        v(w || new h("pipe"));
      }
    };
  }
  function e(r) {
    r();
  }
  function n(r, f) {
    return r.pipe(f);
  }
  function l(r) {
    return !r.length || typeof r[r.length - 1] != "function" ? s : r.pop();
  }
  function u() {
    for (var r = arguments.length, f = new Array(r), p = 0; p < r; p++)
      f[p] = arguments[p];
    var v = l(f);
    if (Array.isArray(f[0]) && (f = f[0]), f.length < 2)
      throw new o("streams");
    var m, g = f.map(function(w, S) {
      var O = S < f.length - 1, I = S > 0;
      return d(w, O, I, function(T) {
        m || (m = T), T && g.forEach(e), !O && (g.forEach(e), v(m));
      });
    });
    return f.reduce(n);
  }
  return Zo = u, Zo;
}
var Zd;
function st() {
  return Zd || (Zd = 1, function(t, a) {
    var c = Hr;
    process.env.READABLE_STREAM === "disable" && c ? (t.exports = c.Readable, Object.assign(t.exports, c), t.exports.Stream = c) : (a = t.exports = Vp(), a.Stream = c || a, a.Readable = a, a.Writable = tu(), a.Duplex = et(), a.Transform = em(), a.PassThrough = ry(), a.finished = ru(), a.pipeline = ty());
  }(Mn, Mn.exports)), Mn.exports;
}
var kn = { exports: {} }, es, eh;
function rm() {
  if (eh) return es;
  eh = 1;
  var t = [], a = [], c = function() {
  };
  function o(r) {
    return ~t.indexOf(r) ? !1 : (t.push(r), !0);
  }
  function h(r) {
    c = r;
  }
  function s(r) {
    for (var f = [], p = 0; p < t.length; p++) {
      if (t[p].async) {
        f.push(t[p]);
        continue;
      }
      if (t[p](r)) return !0;
    }
    return f.length ? new Promise(function(m) {
      Promise.all(
        f.map(function(w) {
          return w(r);
        })
      ).then(function(w) {
        m(w.some(Boolean));
      });
    }) : !1;
  }
  function i(r) {
    return ~a.indexOf(r) ? !1 : (a.push(r), !0);
  }
  function d() {
    c.apply(c, arguments);
  }
  function e(r) {
    for (var f = 0; f < a.length; f++)
      r = a[f].apply(a[f], arguments);
    return r;
  }
  function n(r, f) {
    var p = Object.prototype.hasOwnProperty;
    for (var v in f)
      p.call(f, v) && (r[v] = f[v]);
    return r;
  }
  function l(r) {
    return r.enabled = !1, r.modify = i, r.set = h, r.use = o, n(function() {
      return !1;
    }, r);
  }
  function u(r) {
    function f() {
      var p = Array.prototype.slice.call(arguments, 0);
      return d.call(d, r, e(p, r)), !0;
    }
    return r.enabled = !0, r.modify = i, r.set = h, r.use = o, n(f, r);
  }
  return es = function(f) {
    return f.introduce = n, f.enabled = s, f.process = e, f.modify = i, f.write = d, f.nope = l, f.yep = u, f.set = h, f.use = o, f;
  }, es;
}
var rs, rh;
function ny() {
  if (rh) return rs;
  rh = 1;
  var t = rm(), a = t(function c(o, h) {
    return h = h || {}, h.namespace = o, h.prod = !0, h.dev = !1, h.force || c.force ? c.yep(h) : c.nope(h);
  });
  return rs = a, rs;
}
var ts = { exports: {} }, ns, th;
function iy() {
  return th || (th = 1, ns = {
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 134, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 250, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    grey: [128, 128, 128],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 221],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    rebeccapurple: [102, 51, 153],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [112, 128, 144],
    slategrey: [112, 128, 144],
    snow: [255, 250, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 50]
  }), ns;
}
var is = { exports: {} }, as, nh;
function ay() {
  return nh || (nh = 1, as = function(a) {
    return !a || typeof a == "string" ? !1 : a instanceof Array || Array.isArray(a) || a.length >= 0 && (a.splice instanceof Function || Object.getOwnPropertyDescriptor(a, a.length - 1) && a.constructor.name !== "String");
  }), as;
}
var ih;
function oy() {
  if (ih) return is.exports;
  ih = 1;
  var t = ay(), a = Array.prototype.concat, c = Array.prototype.slice, o = is.exports = function(s) {
    for (var i = [], d = 0, e = s.length; d < e; d++) {
      var n = s[d];
      t(n) ? i = a.call(i, c.call(n)) : i.push(n);
    }
    return i;
  };
  return o.wrap = function(h) {
    return function() {
      return h(o(arguments));
    };
  }, is.exports;
}
var ah;
function sy() {
  if (ah) return ts.exports;
  ah = 1;
  var t = iy(), a = oy(), c = Object.hasOwnProperty, o = /* @__PURE__ */ Object.create(null);
  for (var h in t)
    c.call(t, h) && (o[t[h]] = h);
  var s = ts.exports = {
    to: {},
    get: {}
  };
  s.get = function(e) {
    var n = e.substring(0, 3).toLowerCase(), l, u;
    switch (n) {
      case "hsl":
        l = s.get.hsl(e), u = "hsl";
        break;
      case "hwb":
        l = s.get.hwb(e), u = "hwb";
        break;
      default:
        l = s.get.rgb(e), u = "rgb";
        break;
    }
    return l ? { model: u, value: l } : null;
  }, s.get.rgb = function(e) {
    if (!e)
      return null;
    var n = /^#([a-f0-9]{3,4})$/i, l = /^#([a-f0-9]{6})([a-f0-9]{2})?$/i, u = /^rgba?\(\s*([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/, r = /^rgba?\(\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/, f = /^(\w+)$/, p = [0, 0, 0, 1], v, m, g;
    if (v = e.match(l)) {
      for (g = v[2], v = v[1], m = 0; m < 3; m++) {
        var w = m * 2;
        p[m] = parseInt(v.slice(w, w + 2), 16);
      }
      g && (p[3] = parseInt(g, 16) / 255);
    } else if (v = e.match(n)) {
      for (v = v[1], g = v[3], m = 0; m < 3; m++)
        p[m] = parseInt(v[m] + v[m], 16);
      g && (p[3] = parseInt(g + g, 16) / 255);
    } else if (v = e.match(u)) {
      for (m = 0; m < 3; m++)
        p[m] = parseInt(v[m + 1], 0);
      v[4] && (v[5] ? p[3] = parseFloat(v[4]) * 0.01 : p[3] = parseFloat(v[4]));
    } else if (v = e.match(r)) {
      for (m = 0; m < 3; m++)
        p[m] = Math.round(parseFloat(v[m + 1]) * 2.55);
      v[4] && (v[5] ? p[3] = parseFloat(v[4]) * 0.01 : p[3] = parseFloat(v[4]));
    } else return (v = e.match(f)) ? v[1] === "transparent" ? [0, 0, 0, 0] : c.call(t, v[1]) ? (p = t[v[1]], p[3] = 1, p) : null : null;
    for (m = 0; m < 3; m++)
      p[m] = i(p[m], 0, 255);
    return p[3] = i(p[3], 0, 1), p;
  }, s.get.hsl = function(e) {
    if (!e)
      return null;
    var n = /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d\.]+)%\s*,?\s*([+-]?[\d\.]+)%\s*(?:[,|\/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/, l = e.match(n);
    if (l) {
      var u = parseFloat(l[4]), r = (parseFloat(l[1]) % 360 + 360) % 360, f = i(parseFloat(l[2]), 0, 100), p = i(parseFloat(l[3]), 0, 100), v = i(isNaN(u) ? 1 : u, 0, 1);
      return [r, f, p, v];
    }
    return null;
  }, s.get.hwb = function(e) {
    if (!e)
      return null;
    var n = /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/, l = e.match(n);
    if (l) {
      var u = parseFloat(l[4]), r = (parseFloat(l[1]) % 360 + 360) % 360, f = i(parseFloat(l[2]), 0, 100), p = i(parseFloat(l[3]), 0, 100), v = i(isNaN(u) ? 1 : u, 0, 1);
      return [r, f, p, v];
    }
    return null;
  }, s.to.hex = function() {
    var e = a(arguments);
    return "#" + d(e[0]) + d(e[1]) + d(e[2]) + (e[3] < 1 ? d(Math.round(e[3] * 255)) : "");
  }, s.to.rgb = function() {
    var e = a(arguments);
    return e.length < 4 || e[3] === 1 ? "rgb(" + Math.round(e[0]) + ", " + Math.round(e[1]) + ", " + Math.round(e[2]) + ")" : "rgba(" + Math.round(e[0]) + ", " + Math.round(e[1]) + ", " + Math.round(e[2]) + ", " + e[3] + ")";
  }, s.to.rgb.percent = function() {
    var e = a(arguments), n = Math.round(e[0] / 255 * 100), l = Math.round(e[1] / 255 * 100), u = Math.round(e[2] / 255 * 100);
    return e.length < 4 || e[3] === 1 ? "rgb(" + n + "%, " + l + "%, " + u + "%)" : "rgba(" + n + "%, " + l + "%, " + u + "%, " + e[3] + ")";
  }, s.to.hsl = function() {
    var e = a(arguments);
    return e.length < 4 || e[3] === 1 ? "hsl(" + e[0] + ", " + e[1] + "%, " + e[2] + "%)" : "hsla(" + e[0] + ", " + e[1] + "%, " + e[2] + "%, " + e[3] + ")";
  }, s.to.hwb = function() {
    var e = a(arguments), n = "";
    return e.length >= 4 && e[3] !== 1 && (n = ", " + e[3]), "hwb(" + e[0] + ", " + e[1] + "%, " + e[2] + "%" + n + ")";
  }, s.to.keyword = function(e) {
    return o[e.slice(0, 3)];
  };
  function i(e, n, l) {
    return Math.min(Math.max(n, e), l);
  }
  function d(e) {
    var n = Math.round(e).toString(16).toUpperCase();
    return n.length < 2 ? "0" + n : n;
  }
  return ts.exports;
}
var os = { exports: {} }, ss, oh;
function uy() {
  return oh || (oh = 1, ss = {
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 134, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 250, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    grey: [128, 128, 128],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 221],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    rebeccapurple: [102, 51, 153],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [112, 128, 144],
    slategrey: [112, 128, 144],
    snow: [255, 250, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 50]
  }), ss;
}
var sh;
function tm() {
  if (sh) return os.exports;
  sh = 1;
  var t = uy(), a = {};
  for (var c in t)
    t.hasOwnProperty(c) && (a[t[c]] = c);
  var o = os.exports = {
    rgb: { channels: 3, labels: "rgb" },
    hsl: { channels: 3, labels: "hsl" },
    hsv: { channels: 3, labels: "hsv" },
    hwb: { channels: 3, labels: "hwb" },
    cmyk: { channels: 4, labels: "cmyk" },
    xyz: { channels: 3, labels: "xyz" },
    lab: { channels: 3, labels: "lab" },
    lch: { channels: 3, labels: "lch" },
    hex: { channels: 1, labels: ["hex"] },
    keyword: { channels: 1, labels: ["keyword"] },
    ansi16: { channels: 1, labels: ["ansi16"] },
    ansi256: { channels: 1, labels: ["ansi256"] },
    hcg: { channels: 3, labels: ["h", "c", "g"] },
    apple: { channels: 3, labels: ["r16", "g16", "b16"] },
    gray: { channels: 1, labels: ["gray"] }
  };
  for (var h in o)
    if (o.hasOwnProperty(h)) {
      if (!("channels" in o[h]))
        throw new Error("missing channels property: " + h);
      if (!("labels" in o[h]))
        throw new Error("missing channel labels property: " + h);
      if (o[h].labels.length !== o[h].channels)
        throw new Error("channel and label counts mismatch: " + h);
      var s = o[h].channels, i = o[h].labels;
      delete o[h].channels, delete o[h].labels, Object.defineProperty(o[h], "channels", { value: s }), Object.defineProperty(o[h], "labels", { value: i });
    }
  o.rgb.hsl = function(e) {
    var n = e[0] / 255, l = e[1] / 255, u = e[2] / 255, r = Math.min(n, l, u), f = Math.max(n, l, u), p = f - r, v, m, g;
    return f === r ? v = 0 : n === f ? v = (l - u) / p : l === f ? v = 2 + (u - n) / p : u === f && (v = 4 + (n - l) / p), v = Math.min(v * 60, 360), v < 0 && (v += 360), g = (r + f) / 2, f === r ? m = 0 : g <= 0.5 ? m = p / (f + r) : m = p / (2 - f - r), [v, m * 100, g * 100];
  }, o.rgb.hsv = function(e) {
    var n, l, u, r, f, p = e[0] / 255, v = e[1] / 255, m = e[2] / 255, g = Math.max(p, v, m), w = g - Math.min(p, v, m), S = function(O) {
      return (g - O) / 6 / w + 1 / 2;
    };
    return w === 0 ? r = f = 0 : (f = w / g, n = S(p), l = S(v), u = S(m), p === g ? r = u - l : v === g ? r = 1 / 3 + n - u : m === g && (r = 2 / 3 + l - n), r < 0 ? r += 1 : r > 1 && (r -= 1)), [
      r * 360,
      f * 100,
      g * 100
    ];
  }, o.rgb.hwb = function(e) {
    var n = e[0], l = e[1], u = e[2], r = o.rgb.hsl(e)[0], f = 1 / 255 * Math.min(n, Math.min(l, u));
    return u = 1 - 1 / 255 * Math.max(n, Math.max(l, u)), [r, f * 100, u * 100];
  }, o.rgb.cmyk = function(e) {
    var n = e[0] / 255, l = e[1] / 255, u = e[2] / 255, r, f, p, v;
    return v = Math.min(1 - n, 1 - l, 1 - u), r = (1 - n - v) / (1 - v) || 0, f = (1 - l - v) / (1 - v) || 0, p = (1 - u - v) / (1 - v) || 0, [r * 100, f * 100, p * 100, v * 100];
  };
  function d(e, n) {
    return Math.pow(e[0] - n[0], 2) + Math.pow(e[1] - n[1], 2) + Math.pow(e[2] - n[2], 2);
  }
  return o.rgb.keyword = function(e) {
    var n = a[e];
    if (n)
      return n;
    var l = 1 / 0, u;
    for (var r in t)
      if (t.hasOwnProperty(r)) {
        var f = t[r], p = d(e, f);
        p < l && (l = p, u = r);
      }
    return u;
  }, o.keyword.rgb = function(e) {
    return t[e];
  }, o.rgb.xyz = function(e) {
    var n = e[0] / 255, l = e[1] / 255, u = e[2] / 255;
    n = n > 0.04045 ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92, l = l > 0.04045 ? Math.pow((l + 0.055) / 1.055, 2.4) : l / 12.92, u = u > 0.04045 ? Math.pow((u + 0.055) / 1.055, 2.4) : u / 12.92;
    var r = n * 0.4124 + l * 0.3576 + u * 0.1805, f = n * 0.2126 + l * 0.7152 + u * 0.0722, p = n * 0.0193 + l * 0.1192 + u * 0.9505;
    return [r * 100, f * 100, p * 100];
  }, o.rgb.lab = function(e) {
    var n = o.rgb.xyz(e), l = n[0], u = n[1], r = n[2], f, p, v;
    return l /= 95.047, u /= 100, r /= 108.883, l = l > 8856e-6 ? Math.pow(l, 1 / 3) : 7.787 * l + 16 / 116, u = u > 8856e-6 ? Math.pow(u, 1 / 3) : 7.787 * u + 16 / 116, r = r > 8856e-6 ? Math.pow(r, 1 / 3) : 7.787 * r + 16 / 116, f = 116 * u - 16, p = 500 * (l - u), v = 200 * (u - r), [f, p, v];
  }, o.hsl.rgb = function(e) {
    var n = e[0] / 360, l = e[1] / 100, u = e[2] / 100, r, f, p, v, m;
    if (l === 0)
      return m = u * 255, [m, m, m];
    u < 0.5 ? f = u * (1 + l) : f = u + l - u * l, r = 2 * u - f, v = [0, 0, 0];
    for (var g = 0; g < 3; g++)
      p = n + 1 / 3 * -(g - 1), p < 0 && p++, p > 1 && p--, 6 * p < 1 ? m = r + (f - r) * 6 * p : 2 * p < 1 ? m = f : 3 * p < 2 ? m = r + (f - r) * (2 / 3 - p) * 6 : m = r, v[g] = m * 255;
    return v;
  }, o.hsl.hsv = function(e) {
    var n = e[0], l = e[1] / 100, u = e[2] / 100, r = l, f = Math.max(u, 0.01), p, v;
    return u *= 2, l *= u <= 1 ? u : 2 - u, r *= f <= 1 ? f : 2 - f, v = (u + l) / 2, p = u === 0 ? 2 * r / (f + r) : 2 * l / (u + l), [n, p * 100, v * 100];
  }, o.hsv.rgb = function(e) {
    var n = e[0] / 60, l = e[1] / 100, u = e[2] / 100, r = Math.floor(n) % 6, f = n - Math.floor(n), p = 255 * u * (1 - l), v = 255 * u * (1 - l * f), m = 255 * u * (1 - l * (1 - f));
    switch (u *= 255, r) {
      case 0:
        return [u, m, p];
      case 1:
        return [v, u, p];
      case 2:
        return [p, u, m];
      case 3:
        return [p, v, u];
      case 4:
        return [m, p, u];
      case 5:
        return [u, p, v];
    }
  }, o.hsv.hsl = function(e) {
    var n = e[0], l = e[1] / 100, u = e[2] / 100, r = Math.max(u, 0.01), f, p, v;
    return v = (2 - l) * u, f = (2 - l) * r, p = l * r, p /= f <= 1 ? f : 2 - f, p = p || 0, v /= 2, [n, p * 100, v * 100];
  }, o.hwb.rgb = function(e) {
    var n = e[0] / 360, l = e[1] / 100, u = e[2] / 100, r = l + u, f, p, v, m;
    r > 1 && (l /= r, u /= r), f = Math.floor(6 * n), p = 1 - u, v = 6 * n - f, f & 1 && (v = 1 - v), m = l + v * (p - l);
    var g, w, S;
    switch (f) {
      default:
      case 6:
      case 0:
        g = p, w = m, S = l;
        break;
      case 1:
        g = m, w = p, S = l;
        break;
      case 2:
        g = l, w = p, S = m;
        break;
      case 3:
        g = l, w = m, S = p;
        break;
      case 4:
        g = m, w = l, S = p;
        break;
      case 5:
        g = p, w = l, S = m;
        break;
    }
    return [g * 255, w * 255, S * 255];
  }, o.cmyk.rgb = function(e) {
    var n = e[0] / 100, l = e[1] / 100, u = e[2] / 100, r = e[3] / 100, f, p, v;
    return f = 1 - Math.min(1, n * (1 - r) + r), p = 1 - Math.min(1, l * (1 - r) + r), v = 1 - Math.min(1, u * (1 - r) + r), [f * 255, p * 255, v * 255];
  }, o.xyz.rgb = function(e) {
    var n = e[0] / 100, l = e[1] / 100, u = e[2] / 100, r, f, p;
    return r = n * 3.2406 + l * -1.5372 + u * -0.4986, f = n * -0.9689 + l * 1.8758 + u * 0.0415, p = n * 0.0557 + l * -0.204 + u * 1.057, r = r > 31308e-7 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : r * 12.92, f = f > 31308e-7 ? 1.055 * Math.pow(f, 1 / 2.4) - 0.055 : f * 12.92, p = p > 31308e-7 ? 1.055 * Math.pow(p, 1 / 2.4) - 0.055 : p * 12.92, r = Math.min(Math.max(0, r), 1), f = Math.min(Math.max(0, f), 1), p = Math.min(Math.max(0, p), 1), [r * 255, f * 255, p * 255];
  }, o.xyz.lab = function(e) {
    var n = e[0], l = e[1], u = e[2], r, f, p;
    return n /= 95.047, l /= 100, u /= 108.883, n = n > 8856e-6 ? Math.pow(n, 1 / 3) : 7.787 * n + 16 / 116, l = l > 8856e-6 ? Math.pow(l, 1 / 3) : 7.787 * l + 16 / 116, u = u > 8856e-6 ? Math.pow(u, 1 / 3) : 7.787 * u + 16 / 116, r = 116 * l - 16, f = 500 * (n - l), p = 200 * (l - u), [r, f, p];
  }, o.lab.xyz = function(e) {
    var n = e[0], l = e[1], u = e[2], r, f, p;
    f = (n + 16) / 116, r = l / 500 + f, p = f - u / 200;
    var v = Math.pow(f, 3), m = Math.pow(r, 3), g = Math.pow(p, 3);
    return f = v > 8856e-6 ? v : (f - 16 / 116) / 7.787, r = m > 8856e-6 ? m : (r - 16 / 116) / 7.787, p = g > 8856e-6 ? g : (p - 16 / 116) / 7.787, r *= 95.047, f *= 100, p *= 108.883, [r, f, p];
  }, o.lab.lch = function(e) {
    var n = e[0], l = e[1], u = e[2], r, f, p;
    return r = Math.atan2(u, l), f = r * 360 / 2 / Math.PI, f < 0 && (f += 360), p = Math.sqrt(l * l + u * u), [n, p, f];
  }, o.lch.lab = function(e) {
    var n = e[0], l = e[1], u = e[2], r, f, p;
    return p = u / 360 * 2 * Math.PI, r = l * Math.cos(p), f = l * Math.sin(p), [n, r, f];
  }, o.rgb.ansi16 = function(e) {
    var n = e[0], l = e[1], u = e[2], r = 1 in arguments ? arguments[1] : o.rgb.hsv(e)[2];
    if (r = Math.round(r / 50), r === 0)
      return 30;
    var f = 30 + (Math.round(u / 255) << 2 | Math.round(l / 255) << 1 | Math.round(n / 255));
    return r === 2 && (f += 60), f;
  }, o.hsv.ansi16 = function(e) {
    return o.rgb.ansi16(o.hsv.rgb(e), e[2]);
  }, o.rgb.ansi256 = function(e) {
    var n = e[0], l = e[1], u = e[2];
    if (n === l && l === u)
      return n < 8 ? 16 : n > 248 ? 231 : Math.round((n - 8) / 247 * 24) + 232;
    var r = 16 + 36 * Math.round(n / 255 * 5) + 6 * Math.round(l / 255 * 5) + Math.round(u / 255 * 5);
    return r;
  }, o.ansi16.rgb = function(e) {
    var n = e % 10;
    if (n === 0 || n === 7)
      return e > 50 && (n += 3.5), n = n / 10.5 * 255, [n, n, n];
    var l = (~~(e > 50) + 1) * 0.5, u = (n & 1) * l * 255, r = (n >> 1 & 1) * l * 255, f = (n >> 2 & 1) * l * 255;
    return [u, r, f];
  }, o.ansi256.rgb = function(e) {
    if (e >= 232) {
      var n = (e - 232) * 10 + 8;
      return [n, n, n];
    }
    e -= 16;
    var l, u = Math.floor(e / 36) / 5 * 255, r = Math.floor((l = e % 36) / 6) / 5 * 255, f = l % 6 / 5 * 255;
    return [u, r, f];
  }, o.rgb.hex = function(e) {
    var n = ((Math.round(e[0]) & 255) << 16) + ((Math.round(e[1]) & 255) << 8) + (Math.round(e[2]) & 255), l = n.toString(16).toUpperCase();
    return "000000".substring(l.length) + l;
  }, o.hex.rgb = function(e) {
    var n = e.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
    if (!n)
      return [0, 0, 0];
    var l = n[0];
    n[0].length === 3 && (l = l.split("").map(function(v) {
      return v + v;
    }).join(""));
    var u = parseInt(l, 16), r = u >> 16 & 255, f = u >> 8 & 255, p = u & 255;
    return [r, f, p];
  }, o.rgb.hcg = function(e) {
    var n = e[0] / 255, l = e[1] / 255, u = e[2] / 255, r = Math.max(Math.max(n, l), u), f = Math.min(Math.min(n, l), u), p = r - f, v, m;
    return p < 1 ? v = f / (1 - p) : v = 0, p <= 0 ? m = 0 : r === n ? m = (l - u) / p % 6 : r === l ? m = 2 + (u - n) / p : m = 4 + (n - l) / p + 4, m /= 6, m %= 1, [m * 360, p * 100, v * 100];
  }, o.hsl.hcg = function(e) {
    var n = e[1] / 100, l = e[2] / 100, u = 1, r = 0;
    return l < 0.5 ? u = 2 * n * l : u = 2 * n * (1 - l), u < 1 && (r = (l - 0.5 * u) / (1 - u)), [e[0], u * 100, r * 100];
  }, o.hsv.hcg = function(e) {
    var n = e[1] / 100, l = e[2] / 100, u = n * l, r = 0;
    return u < 1 && (r = (l - u) / (1 - u)), [e[0], u * 100, r * 100];
  }, o.hcg.rgb = function(e) {
    var n = e[0] / 360, l = e[1] / 100, u = e[2] / 100;
    if (l === 0)
      return [u * 255, u * 255, u * 255];
    var r = [0, 0, 0], f = n % 1 * 6, p = f % 1, v = 1 - p, m = 0;
    switch (Math.floor(f)) {
      case 0:
        r[0] = 1, r[1] = p, r[2] = 0;
        break;
      case 1:
        r[0] = v, r[1] = 1, r[2] = 0;
        break;
      case 2:
        r[0] = 0, r[1] = 1, r[2] = p;
        break;
      case 3:
        r[0] = 0, r[1] = v, r[2] = 1;
        break;
      case 4:
        r[0] = p, r[1] = 0, r[2] = 1;
        break;
      default:
        r[0] = 1, r[1] = 0, r[2] = v;
    }
    return m = (1 - l) * u, [
      (l * r[0] + m) * 255,
      (l * r[1] + m) * 255,
      (l * r[2] + m) * 255
    ];
  }, o.hcg.hsv = function(e) {
    var n = e[1] / 100, l = e[2] / 100, u = n + l * (1 - n), r = 0;
    return u > 0 && (r = n / u), [e[0], r * 100, u * 100];
  }, o.hcg.hsl = function(e) {
    var n = e[1] / 100, l = e[2] / 100, u = l * (1 - n) + 0.5 * n, r = 0;
    return u > 0 && u < 0.5 ? r = n / (2 * u) : u >= 0.5 && u < 1 && (r = n / (2 * (1 - u))), [e[0], r * 100, u * 100];
  }, o.hcg.hwb = function(e) {
    var n = e[1] / 100, l = e[2] / 100, u = n + l * (1 - n);
    return [e[0], (u - n) * 100, (1 - u) * 100];
  }, o.hwb.hcg = function(e) {
    var n = e[1] / 100, l = e[2] / 100, u = 1 - l, r = u - n, f = 0;
    return r < 1 && (f = (u - r) / (1 - r)), [e[0], r * 100, f * 100];
  }, o.apple.rgb = function(e) {
    return [e[0] / 65535 * 255, e[1] / 65535 * 255, e[2] / 65535 * 255];
  }, o.rgb.apple = function(e) {
    return [e[0] / 255 * 65535, e[1] / 255 * 65535, e[2] / 255 * 65535];
  }, o.gray.rgb = function(e) {
    return [e[0] / 100 * 255, e[0] / 100 * 255, e[0] / 100 * 255];
  }, o.gray.hsl = o.gray.hsv = function(e) {
    return [0, 0, e[0]];
  }, o.gray.hwb = function(e) {
    return [0, 100, e[0]];
  }, o.gray.cmyk = function(e) {
    return [0, 0, 0, e[0]];
  }, o.gray.lab = function(e) {
    return [e[0], 0, 0];
  }, o.gray.hex = function(e) {
    var n = Math.round(e[0] / 100 * 255) & 255, l = (n << 16) + (n << 8) + n, u = l.toString(16).toUpperCase();
    return "000000".substring(u.length) + u;
  }, o.rgb.gray = function(e) {
    var n = (e[0] + e[1] + e[2]) / 3;
    return [n / 255 * 100];
  }, os.exports;
}
var us, uh;
function ly() {
  if (uh) return us;
  uh = 1;
  var t = tm();
  function a() {
    for (var s = {}, i = Object.keys(t), d = i.length, e = 0; e < d; e++)
      s[i[e]] = {
        // http://jsperf.com/1-vs-infinity
        // micro-opt, but this is simple.
        distance: -1,
        parent: null
      };
    return s;
  }
  function c(s) {
    var i = a(), d = [s];
    for (i[s].distance = 0; d.length; )
      for (var e = d.pop(), n = Object.keys(t[e]), l = n.length, u = 0; u < l; u++) {
        var r = n[u], f = i[r];
        f.distance === -1 && (f.distance = i[e].distance + 1, f.parent = e, d.unshift(r));
      }
    return i;
  }
  function o(s, i) {
    return function(d) {
      return i(s(d));
    };
  }
  function h(s, i) {
    for (var d = [i[s].parent, s], e = t[i[s].parent][s], n = i[s].parent; i[n].parent; )
      d.unshift(i[n].parent), e = o(t[i[n].parent][n], e), n = i[n].parent;
    return e.conversion = d, e;
  }
  return us = function(s) {
    for (var i = c(s), d = {}, e = Object.keys(i), n = e.length, l = 0; l < n; l++) {
      var u = e[l], r = i[u];
      r.parent !== null && (d[u] = h(u, i));
    }
    return d;
  }, us;
}
var ls, lh;
function cy() {
  if (lh) return ls;
  lh = 1;
  var t = tm(), a = ly(), c = {}, o = Object.keys(t);
  function h(i) {
    var d = function(e) {
      return e == null ? e : (arguments.length > 1 && (e = Array.prototype.slice.call(arguments)), i(e));
    };
    return "conversion" in i && (d.conversion = i.conversion), d;
  }
  function s(i) {
    var d = function(e) {
      if (e == null)
        return e;
      arguments.length > 1 && (e = Array.prototype.slice.call(arguments));
      var n = i(e);
      if (typeof n == "object")
        for (var l = n.length, u = 0; u < l; u++)
          n[u] = Math.round(n[u]);
      return n;
    };
    return "conversion" in i && (d.conversion = i.conversion), d;
  }
  return o.forEach(function(i) {
    c[i] = {}, Object.defineProperty(c[i], "channels", { value: t[i].channels }), Object.defineProperty(c[i], "labels", { value: t[i].labels });
    var d = a(i), e = Object.keys(d);
    e.forEach(function(n) {
      var l = d[n];
      c[i][n] = s(l), c[i][n].raw = h(l);
    });
  }), ls = c, ls;
}
var cs, ch;
function fy() {
  if (ch) return cs;
  ch = 1;
  var t = sy(), a = cy(), c = [].slice, o = [
    // to be honest, I don't really feel like keyword belongs in color convert, but eh.
    "keyword",
    // gray conflicts with some method names, and has its own method defined.
    "gray",
    // shouldn't really be in color-convert either...
    "hex"
  ], h = {};
  Object.keys(a).forEach(function(f) {
    h[c.call(a[f].labels).sort().join("")] = f;
  });
  var s = {};
  function i(f, p) {
    if (!(this instanceof i))
      return new i(f, p);
    if (p && p in o && (p = null), p && !(p in a))
      throw new Error("Unknown model: " + p);
    var v, m;
    if (f == null)
      this.model = "rgb", this.color = [0, 0, 0], this.valpha = 1;
    else if (f instanceof i)
      this.model = f.model, this.color = f.color.slice(), this.valpha = f.valpha;
    else if (typeof f == "string") {
      var g = t.get(f);
      if (g === null)
        throw new Error("Unable to parse color from string: " + f);
      this.model = g.model, m = a[this.model].channels, this.color = g.value.slice(0, m), this.valpha = typeof g.value[m] == "number" ? g.value[m] : 1;
    } else if (f.length) {
      this.model = p || "rgb", m = a[this.model].channels;
      var w = c.call(f, 0, m);
      this.color = r(w, m), this.valpha = typeof f[m] == "number" ? f[m] : 1;
    } else if (typeof f == "number")
      f &= 16777215, this.model = "rgb", this.color = [
        f >> 16 & 255,
        f >> 8 & 255,
        f & 255
      ], this.valpha = 1;
    else {
      this.valpha = 1;
      var S = Object.keys(f);
      "alpha" in f && (S.splice(S.indexOf("alpha"), 1), this.valpha = typeof f.alpha == "number" ? f.alpha : 0);
      var O = S.sort().join("");
      if (!(O in h))
        throw new Error("Unable to parse color from object: " + JSON.stringify(f));
      this.model = h[O];
      var I = a[this.model].labels, T = [];
      for (v = 0; v < I.length; v++)
        T.push(f[I[v]]);
      this.color = r(T);
    }
    if (s[this.model])
      for (m = a[this.model].channels, v = 0; v < m; v++) {
        var R = s[this.model][v];
        R && (this.color[v] = R(this.color[v]));
      }
    this.valpha = Math.max(0, Math.min(1, this.valpha)), Object.freeze && Object.freeze(this);
  }
  i.prototype = {
    toString: function() {
      return this.string();
    },
    toJSON: function() {
      return this[this.model]();
    },
    string: function(f) {
      var p = this.model in t.to ? this : this.rgb();
      p = p.round(typeof f == "number" ? f : 1);
      var v = p.valpha === 1 ? p.color : p.color.concat(this.valpha);
      return t.to[p.model](v);
    },
    percentString: function(f) {
      var p = this.rgb().round(typeof f == "number" ? f : 1), v = p.valpha === 1 ? p.color : p.color.concat(this.valpha);
      return t.to.rgb.percent(v);
    },
    array: function() {
      return this.valpha === 1 ? this.color.slice() : this.color.concat(this.valpha);
    },
    object: function() {
      for (var f = {}, p = a[this.model].channels, v = a[this.model].labels, m = 0; m < p; m++)
        f[v[m]] = this.color[m];
      return this.valpha !== 1 && (f.alpha = this.valpha), f;
    },
    unitArray: function() {
      var f = this.rgb().color;
      return f[0] /= 255, f[1] /= 255, f[2] /= 255, this.valpha !== 1 && f.push(this.valpha), f;
    },
    unitObject: function() {
      var f = this.rgb().object();
      return f.r /= 255, f.g /= 255, f.b /= 255, this.valpha !== 1 && (f.alpha = this.valpha), f;
    },
    round: function(f) {
      return f = Math.max(f || 0, 0), new i(this.color.map(e(f)).concat(this.valpha), this.model);
    },
    alpha: function(f) {
      return arguments.length ? new i(this.color.concat(Math.max(0, Math.min(1, f))), this.model) : this.valpha;
    },
    // rgb
    red: n("rgb", 0, l(255)),
    green: n("rgb", 1, l(255)),
    blue: n("rgb", 2, l(255)),
    hue: n(["hsl", "hsv", "hsl", "hwb", "hcg"], 0, function(f) {
      return (f % 360 + 360) % 360;
    }),
    // eslint-disable-line brace-style
    saturationl: n("hsl", 1, l(100)),
    lightness: n("hsl", 2, l(100)),
    saturationv: n("hsv", 1, l(100)),
    value: n("hsv", 2, l(100)),
    chroma: n("hcg", 1, l(100)),
    gray: n("hcg", 2, l(100)),
    white: n("hwb", 1, l(100)),
    wblack: n("hwb", 2, l(100)),
    cyan: n("cmyk", 0, l(100)),
    magenta: n("cmyk", 1, l(100)),
    yellow: n("cmyk", 2, l(100)),
    black: n("cmyk", 3, l(100)),
    x: n("xyz", 0, l(100)),
    y: n("xyz", 1, l(100)),
    z: n("xyz", 2, l(100)),
    l: n("lab", 0, l(100)),
    a: n("lab", 1),
    b: n("lab", 2),
    keyword: function(f) {
      return arguments.length ? new i(f) : a[this.model].keyword(this.color);
    },
    hex: function(f) {
      return arguments.length ? new i(f) : t.to.hex(this.rgb().round().color);
    },
    rgbNumber: function() {
      var f = this.rgb().color;
      return (f[0] & 255) << 16 | (f[1] & 255) << 8 | f[2] & 255;
    },
    luminosity: function() {
      for (var f = this.rgb().color, p = [], v = 0; v < f.length; v++) {
        var m = f[v] / 255;
        p[v] = m <= 0.03928 ? m / 12.92 : Math.pow((m + 0.055) / 1.055, 2.4);
      }
      return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
    },
    contrast: function(f) {
      var p = this.luminosity(), v = f.luminosity();
      return p > v ? (p + 0.05) / (v + 0.05) : (v + 0.05) / (p + 0.05);
    },
    level: function(f) {
      var p = this.contrast(f);
      return p >= 7.1 ? "AAA" : p >= 4.5 ? "AA" : "";
    },
    isDark: function() {
      var f = this.rgb().color, p = (f[0] * 299 + f[1] * 587 + f[2] * 114) / 1e3;
      return p < 128;
    },
    isLight: function() {
      return !this.isDark();
    },
    negate: function() {
      for (var f = this.rgb(), p = 0; p < 3; p++)
        f.color[p] = 255 - f.color[p];
      return f;
    },
    lighten: function(f) {
      var p = this.hsl();
      return p.color[2] += p.color[2] * f, p;
    },
    darken: function(f) {
      var p = this.hsl();
      return p.color[2] -= p.color[2] * f, p;
    },
    saturate: function(f) {
      var p = this.hsl();
      return p.color[1] += p.color[1] * f, p;
    },
    desaturate: function(f) {
      var p = this.hsl();
      return p.color[1] -= p.color[1] * f, p;
    },
    whiten: function(f) {
      var p = this.hwb();
      return p.color[1] += p.color[1] * f, p;
    },
    blacken: function(f) {
      var p = this.hwb();
      return p.color[2] += p.color[2] * f, p;
    },
    grayscale: function() {
      var f = this.rgb().color, p = f[0] * 0.3 + f[1] * 0.59 + f[2] * 0.11;
      return i.rgb(p, p, p);
    },
    fade: function(f) {
      return this.alpha(this.valpha - this.valpha * f);
    },
    opaquer: function(f) {
      return this.alpha(this.valpha + this.valpha * f);
    },
    rotate: function(f) {
      var p = this.hsl(), v = p.color[0];
      return v = (v + f) % 360, v = v < 0 ? 360 + v : v, p.color[0] = v, p;
    },
    mix: function(f, p) {
      if (!f || !f.rgb)
        throw new Error('Argument to "mix" was not a Color instance, but rather an instance of ' + typeof f);
      var v = f.rgb(), m = this.rgb(), g = p === void 0 ? 0.5 : p, w = 2 * g - 1, S = v.alpha() - m.alpha(), O = ((w * S === -1 ? w : (w + S) / (1 + w * S)) + 1) / 2, I = 1 - O;
      return i.rgb(
        O * v.red() + I * m.red(),
        O * v.green() + I * m.green(),
        O * v.blue() + I * m.blue(),
        v.alpha() * g + m.alpha() * (1 - g)
      );
    }
  }, Object.keys(a).forEach(function(f) {
    if (o.indexOf(f) === -1) {
      var p = a[f].channels;
      i.prototype[f] = function() {
        if (this.model === f)
          return new i(this);
        if (arguments.length)
          return new i(arguments, f);
        var v = typeof arguments[p] == "number" ? p : this.valpha;
        return new i(u(a[this.model][f].raw(this.color)).concat(v), f);
      }, i[f] = function(v) {
        return typeof v == "number" && (v = r(c.call(arguments), p)), new i(v, f);
      };
    }
  });
  function d(f, p) {
    return Number(f.toFixed(p));
  }
  function e(f) {
    return function(p) {
      return d(p, f);
    };
  }
  function n(f, p, v) {
    return f = Array.isArray(f) ? f : [f], f.forEach(function(m) {
      (s[m] || (s[m] = []))[p] = v;
    }), f = f[0], function(m) {
      var g;
      return arguments.length ? (v && (m = v(m)), g = this[f](), g.color[p] = m, g) : (g = this[f]().color[p], v && (g = v(g)), g);
    };
  }
  function l(f) {
    return function(p) {
      return Math.max(0, Math.min(f, p));
    };
  }
  function u(f) {
    return Array.isArray(f) ? f : [f];
  }
  function r(f, p) {
    for (var v = 0; v < p; v++)
      typeof f[v] != "number" && (f[v] = 0);
    return f;
  }
  return cs = i, cs;
}
var fs, fh;
function dy() {
  return fh || (fh = 1, fs = function(a) {
    for (var c = 0, o = 0; c < a.length; o = a.charCodeAt(c++) + ((o << 5) - o)) ;
    var h = Math.floor(
      Math.abs(
        Math.sin(o) * 1e4 % 1 * 16777216
      )
    ).toString(16);
    return "#" + Array(6 - h.length + 1).join("0") + h;
  }), fs;
}
var ds, dh;
function hy() {
  if (dh) return ds;
  dh = 1;
  var t = fy(), a = dy();
  return ds = function(o, h) {
    var s = o.split(h || ":"), i = a(s[0]);
    if (!s.length) return i;
    for (var d = 0, e = s.length - 1; d < e; d++)
      i = t(i).mix(t(a(s[d + 1]))).saturate(1).hex();
    return i;
  }, ds;
}
var hs, hh;
function py() {
  if (hh) return hs;
  hh = 1;
  function t(a, c) {
    if (c) return new t(a).style(c);
    if (!(this instanceof t)) return new t(a);
    this.text = a;
  }
  return t.prototype.prefix = "\x1B[", t.prototype.suffix = "m", t.prototype.hex = function(c) {
    c = c[0] === "#" ? c.substring(1) : c, c.length === 3 && (c = c.split(""), c[5] = c[2], c[4] = c[2], c[3] = c[1], c[2] = c[1], c[1] = c[0], c = c.join(""));
    var o = c.substring(0, 2), h = c.substring(2, 4), s = c.substring(4, 6);
    return [parseInt(o, 16), parseInt(h, 16), parseInt(s, 16)];
  }, t.prototype.rgb = function(c, o, h) {
    var s = c / 255 * 5, i = o / 255 * 5, d = h / 255 * 5;
    return this.ansi(s, i, d);
  }, t.prototype.ansi = function(c, o, h) {
    var s = Math.round(c), i = Math.round(o), d = Math.round(h);
    return 16 + s * 36 + i * 6 + d;
  }, t.prototype.reset = function() {
    return this.prefix + "39;49" + this.suffix;
  }, t.prototype.style = function(c) {
    return this.prefix + "38;5;" + this.rgb.apply(this, this.hex(c)) + this.suffix + this.text + this.reset();
  }, hs = t, hs;
}
var ps, ph;
function my() {
  if (ph) return ps;
  ph = 1;
  var t = hy(), a = py();
  return ps = function(o, h) {
    var s = h.namespace, i = h.colors !== !1 ? a(s + ":", t(s)) : s + ":";
    return o[0] = i + " " + o[0], o;
  }, ps;
}
var ms, mh;
function gy() {
  return mh || (mh = 1, ms = function(a, c) {
    if (!c) return !1;
    for (var o = c.split(/[\s,]+/), h = 0; h < o.length; h++) {
      if (c = o[h].replace("*", ".*?"), c.charAt(0) === "-") {
        if (new RegExp("^" + c.substr(1) + "$").test(a))
          return !1;
        continue;
      }
      if (new RegExp("^" + c + "$").test(a))
        return !0;
    }
    return !1;
  }), ms;
}
var gs, gh;
function vy() {
  if (gh) return gs;
  gh = 1;
  var t = gy();
  return gs = function(c) {
    return function(h) {
      try {
        return t(h, c());
      } catch {
      }
      return !1;
    };
  }, gs;
}
var vs, vh;
function yy() {
  if (vh) return vs;
  vh = 1;
  var t = vy();
  return vs = t(function() {
    return process.env.DEBUG || process.env.DIAGNOSTICS;
  }), vs;
}
var ys, yh;
function wy() {
  return yh || (yh = 1, ys = function(t, a) {
    try {
      Function.prototype.apply.call(console.log, console, a);
    } catch {
    }
  }), ys;
}
var ws, wh;
function Ey() {
  if (wh) return ws;
  wh = 1;
  var t = rm(), a = qs.isatty(1), c = t(function o(h, s) {
    return s = s || {}, s.colors = "colors" in s ? s.colors : a, s.namespace = h, s.prod = !1, s.dev = !0, !o.enabled(h) && !(s.force || o.force) ? o.nope(s) : o.yep(s);
  });
  return c.modify(my()), c.use(yy()), c.set(wy()), ws = c, ws;
}
var Eh;
function ti() {
  return Eh || (Eh = 1, process.env.NODE_ENV === "production" ? kn.exports = ny() : kn.exports = Ey()), kn.exports;
}
var Es, _h;
function _y() {
  if (_h) return Es;
  _h = 1;
  const t = He, { StringDecoder: a } = Kh, { Stream: c } = st();
  function o() {
  }
  return Es = (h, s) => {
    const i = Buffer.alloc(65536), d = new a("utf8"), e = new c();
    let n = "", l = 0, u = 0;
    return h.start === -1 && delete h.start, e.readable = !0, e.destroy = () => {
      e.destroyed = !0, e.emit("end"), e.emit("close");
    }, t.open(h.file, "a+", "0644", (r, f) => {
      if (r) {
        s ? s(r) : e.emit("error", r), e.destroy();
        return;
      }
      (function p() {
        if (e.destroyed) {
          t.close(f, o);
          return;
        }
        return t.read(f, i, 0, i.length, l, (v, m) => {
          if (v) {
            s ? s(v) : e.emit("error", v), e.destroy();
            return;
          }
          if (!m)
            return n && ((h.start == null || u > h.start) && (s ? s(null, n) : e.emit("line", n)), u++, n = ""), setTimeout(p, 1e3);
          let g = d.write(i.slice(0, m));
          s || e.emit("data", g), g = (n + g).split(/\n+/);
          const w = g.length - 1;
          let S = 0;
          for (; S < w; S++)
            (h.start == null || u > h.start) && (s ? s(null, g[S]) : e.emit("line", g[S])), u++;
          return n = g[w], l += m, p();
        });
      })();
    }), s ? e.destroy : e;
  }, Es;
}
var _s, bh;
function by() {
  if (bh) return _s;
  bh = 1;
  const t = He, a = Ae, c = ey(), o = Ms, { MESSAGE: h } = Ue(), { Stream: s, PassThrough: i } = st(), d = Gt(), e = ti()("winston:file"), n = fr, l = _y();
  return _s = class extends d {
    /**
     * Constructor function for the File transport object responsible for
     * persisting log messages and metadata to one or more files.
     * @param {Object} options - Options for this instance.
     */
    constructor(r = {}) {
      super(r), this.name = r.name || "file";
      function f(p, ...v) {
        v.slice(1).forEach((m) => {
          if (r[m])
            throw new Error(`Cannot set ${m} and ${p} together`);
        });
      }
      if (this._stream = new i(), this._stream.setMaxListeners(30), this._onError = this._onError.bind(this), r.filename || r.dirname)
        f("filename or dirname", "stream"), this._basename = this.filename = r.filename ? a.basename(r.filename) : "winston.log", this.dirname = r.dirname || a.dirname(r.filename), this.options = r.options || { flags: "a" };
      else if (r.stream)
        console.warn("options.stream will be removed in winston@4. Use winston.transports.Stream"), f("stream", "filename", "maxsize"), this._dest = this._stream.pipe(this._setupStream(r.stream)), this.dirname = a.dirname(this._dest.path);
      else
        throw new Error("Cannot log to file without filename or stream.");
      this.maxsize = r.maxsize || null, this.rotationFormat = r.rotationFormat || !1, this.zippedArchive = r.zippedArchive || !1, this.maxFiles = r.maxFiles || null, this.eol = typeof r.eol == "string" ? r.eol : n.EOL, this.tailable = r.tailable || !1, this.lazy = r.lazy || !1, this._size = 0, this._pendingSize = 0, this._created = 0, this._drain = !1, this._opening = !1, this._ending = !1, this._fileExist = !1, this.dirname && this._createLogDirIfNotExist(this.dirname), this.lazy || this.open();
    }
    finishIfEnding() {
      this._ending && (this._opening ? this.once("open", () => {
        this._stream.once("finish", () => this.emit("finish")), setImmediate(() => this._stream.end());
      }) : (this._stream.once("finish", () => this.emit("finish")), setImmediate(() => this._stream.end())));
    }
    /**
     * Core logging method exposed to Winston. Metadata is optional.
     * @param {Object} info - TODO: add param description.
     * @param {Function} callback - TODO: add param description.
     * @returns {undefined}
     */
    log(r, f = () => {
    }) {
      if (this.silent)
        return f(), !0;
      if (this._drain) {
        this._stream.once("drain", () => {
          this._drain = !1, this.log(r, f);
        });
        return;
      }
      if (this._rotate) {
        this._stream.once("rotate", () => {
          this._rotate = !1, this.log(r, f);
        });
        return;
      }
      if (this.lazy) {
        if (!this._fileExist) {
          this._opening || this.open(), this.once("open", () => {
            this._fileExist = !0, this.log(r, f);
          });
          return;
        }
        if (this._needsNewFile(this._pendingSize)) {
          this._dest.once("close", () => {
            this._opening || this.open(), this.once("open", () => {
              this.log(r, f);
            });
          });
          return;
        }
      }
      const p = `${r[h]}${this.eol}`, v = Buffer.byteLength(p);
      function m() {
        if (this._size += v, this._pendingSize -= v, e("logged %s %s", this._size, p), this.emit("logged", r), !this._rotate && !this._opening && this._needsNewFile()) {
          if (this.lazy) {
            this._endStream(() => {
              this.emit("fileclosed");
            });
            return;
          }
          this._rotate = !0, this._endStream(() => this._rotateFile());
        }
      }
      this._pendingSize += v, this._opening && !this.rotatedWhileOpening && this._needsNewFile(this._size + this._pendingSize) && (this.rotatedWhileOpening = !0);
      const g = this._stream.write(p, m.bind(this));
      return g ? f() : (this._drain = !0, this._stream.once("drain", () => {
        this._drain = !1, f();
      })), e("written", g, this._drain), this.finishIfEnding(), g;
    }
    /**
     * Query the transport. Options object is optional.
     * @param {Object} options - Loggly-like query options for this instance.
     * @param {function} callback - Continuation to respond to when complete.
     * TODO: Refactor me.
     */
    query(r, f) {
      typeof r == "function" && (f = r, r = {}), r = T(r);
      const p = a.join(this.dirname, this.filename);
      let v = "", m = [], g = 0;
      const w = t.createReadStream(p, {
        encoding: "utf8"
      });
      w.on("error", (R) => {
        if (w.readable && w.destroy(), !!f)
          return R.code !== "ENOENT" ? f(R) : f(null, m);
      }), w.on("data", (R) => {
        R = (v + R).split(/\n+/);
        const A = R.length - 1;
        let b = 0;
        for (; b < A; b++)
          (!r.start || g >= r.start) && S(R[b]), g++;
        v = R[A];
      }), w.on("close", () => {
        v && S(v, !0), r.order === "desc" && (m = m.reverse()), f && f(null, m);
      });
      function S(R, A) {
        try {
          const b = JSON.parse(R);
          I(b) && O(b);
        } catch (b) {
          A || w.emit("error", b);
        }
      }
      function O(R) {
        if (r.rows && m.length >= r.rows && r.order !== "desc") {
          w.readable && w.destroy();
          return;
        }
        r.fields && (R = r.fields.reduce((A, b) => (A[b] = R[b], A), {})), r.order === "desc" && m.length >= r.rows && m.shift(), m.push(R);
      }
      function I(R) {
        if (!R || typeof R != "object")
          return;
        const A = new Date(R.timestamp);
        if (!(r.from && A < r.from || r.until && A > r.until || r.level && r.level !== R.level))
          return !0;
      }
      function T(R) {
        return R = R || {}, R.rows = R.rows || R.limit || 10, R.start = R.start || 0, R.until = R.until || /* @__PURE__ */ new Date(), typeof R.until != "object" && (R.until = new Date(R.until)), R.from = R.from || R.until - 24 * 60 * 60 * 1e3, typeof R.from != "object" && (R.from = new Date(R.from)), R.order = R.order || "desc", R;
      }
    }
    /**
     * Returns a log stream for this transport. Options object is optional.
     * @param {Object} options - Stream options for this instance.
     * @returns {Stream} - TODO: add return description.
     * TODO: Refactor me.
     */
    stream(r = {}) {
      const f = a.join(this.dirname, this.filename), p = new s(), v = {
        file: f,
        start: r.start
      };
      return p.destroy = l(v, (m, g) => {
        if (m)
          return p.emit("error", m);
        try {
          p.emit("data", g), g = JSON.parse(g), p.emit("log", g);
        } catch (w) {
          p.emit("error", w);
        }
      }), p;
    }
    /**
     * Checks to see the filesize of.
     * @returns {undefined}
     */
    open() {
      this.filename && (this._opening || (this._opening = !0, this.stat((r, f) => {
        if (r)
          return this.emit("error", r);
        e("stat done: %s { size: %s }", this.filename, f), this._size = f, this._dest = this._createStream(this._stream), this._opening = !1, this.once("open", () => {
          this._stream.emit("rotate") || (this._rotate = !1);
        });
      })));
    }
    /**
     * Stat the file and assess information in order to create the proper stream.
     * @param {function} callback - TODO: add param description.
     * @returns {undefined}
     */
    stat(r) {
      const f = this._getFile(), p = a.join(this.dirname, f);
      t.stat(p, (v, m) => {
        if (v && v.code === "ENOENT")
          return e("ENOENT ok", p), this.filename = f, r(null, 0);
        if (v)
          return e(`err ${v.code} ${p}`), r(v);
        if (!m || this._needsNewFile(m.size))
          return this._incFile(() => this.stat(r));
        this.filename = f, r(null, m.size);
      });
    }
    /**
     * Closes the stream associated with this instance.
     * @param {function} cb - TODO: add param description.
     * @returns {undefined}
     */
    close(r) {
      this._stream && this._stream.end(() => {
        r && r(), this.emit("flush"), this.emit("closed");
      });
    }
    /**
     * TODO: add method description.
     * @param {number} size - TODO: add param description.
     * @returns {undefined}
     */
    _needsNewFile(r) {
      return r = r || this._size, this.maxsize && r >= this.maxsize;
    }
    /**
     * TODO: add method description.
     * @param {Error} err - TODO: add param description.
     * @returns {undefined}
     */
    _onError(r) {
      this.emit("error", r);
    }
    /**
     * TODO: add method description.
     * @param {Stream} stream - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     */
    _setupStream(r) {
      return r.on("error", this._onError), r;
    }
    /**
     * TODO: add method description.
     * @param {Stream} stream - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     */
    _cleanupStream(r) {
      return r.removeListener("error", this._onError), r.destroy(), r;
    }
    /**
     * TODO: add method description.
     */
    _rotateFile() {
      this._incFile(() => this.open());
    }
    /**
     * Unpipe from the stream that has been marked as full and end it so it
     * flushes to disk.
     *
     * @param {function} callback - Callback for when the current file has closed.
     * @private
     */
    _endStream(r = () => {
    }) {
      this._dest ? (this._stream.unpipe(this._dest), this._dest.end(() => {
        this._cleanupStream(this._dest), r();
      })) : r();
    }
    /**
     * Returns the WritableStream for the active file on this instance. If we
     * should gzip the file then a zlib stream is returned.
     *
     * @param {ReadableStream} source –PassThrough to pipe to the file when open.
     * @returns {WritableStream} Stream that writes to disk for the active file.
     */
    _createStream(r) {
      const f = a.join(this.dirname, this.filename);
      e("create stream start", f, this.options);
      const p = t.createWriteStream(f, this.options).on("error", (v) => e(v)).on("close", () => e("close", p.path, p.bytesWritten)).on("open", () => {
        e("file open ok", f), this.emit("open", f), r.pipe(p), this.rotatedWhileOpening && (this._stream = new i(), this._stream.setMaxListeners(30), this._rotateFile(), this.rotatedWhileOpening = !1, this._cleanupStream(p), r.end());
      });
      return e("create stream ok", f), p;
    }
    /**
     * TODO: add method description.
     * @param {function} callback - TODO: add param description.
     * @returns {undefined}
     */
    _incFile(r) {
      e("_incFile", this.filename);
      const f = a.extname(this._basename), p = a.basename(this._basename, f), v = [];
      this.zippedArchive && v.push(
        (function(m) {
          const g = this._created > 0 && !this.tailable ? this._created : "";
          this._compressFile(
            a.join(this.dirname, `${p}${g}${f}`),
            a.join(this.dirname, `${p}${g}${f}.gz`),
            m
          );
        }).bind(this)
      ), v.push(
        (function(m) {
          this.tailable ? this._checkMaxFilesTailable(f, p, m) : (this._created += 1, this._checkMaxFilesIncrementing(f, p, m));
        }).bind(this)
      ), c(v, r);
    }
    /**
     * Gets the next filename to use for this instance in the case that log
     * filesizes are being capped.
     * @returns {string} - TODO: add return description.
     * @private
     */
    _getFile() {
      const r = a.extname(this._basename), f = a.basename(this._basename, r), p = this.rotationFormat ? this.rotationFormat() : this._created;
      return !this.tailable && this._created ? `${f}${p}${r}` : `${f}${r}`;
    }
    /**
     * Increment the number of files created or checked by this instance.
     * @param {mixed} ext - TODO: add param description.
     * @param {mixed} basename - TODO: add param description.
     * @param {mixed} callback - TODO: add param description.
     * @returns {undefined}
     * @private
     */
    _checkMaxFilesIncrementing(r, f, p) {
      if (!this.maxFiles || this._created < this.maxFiles)
        return setImmediate(p);
      const v = this._created - this.maxFiles, m = v !== 0 ? v : "", g = this.zippedArchive ? ".gz" : "", w = `${f}${m}${r}${g}`, S = a.join(this.dirname, w);
      t.unlink(S, p);
    }
    /**
     * Roll files forward based on integer, up to maxFiles. e.g. if base if
     * file.log and it becomes oversized, roll to file1.log, and allow file.log
     * to be re-used. If file is oversized again, roll file1.log to file2.log,
     * roll file.log to file1.log, and so on.
     * @param {mixed} ext - TODO: add param description.
     * @param {mixed} basename - TODO: add param description.
     * @param {mixed} callback - TODO: add param description.
     * @returns {undefined}
     * @private
     */
    _checkMaxFilesTailable(r, f, p) {
      const v = [];
      if (!this.maxFiles)
        return;
      const m = this.zippedArchive ? ".gz" : "";
      for (let g = this.maxFiles - 1; g > 1; g--)
        v.push((function(w, S) {
          let O = `${f}${w - 1}${r}${m}`;
          const I = a.join(this.dirname, O);
          t.exists(I, (T) => {
            if (!T)
              return S(null);
            O = `${f}${w}${r}${m}`, t.rename(I, a.join(this.dirname, O), S);
          });
        }).bind(this, g));
      c(v, () => {
        t.rename(
          a.join(this.dirname, `${f}${r}${m}`),
          a.join(this.dirname, `${f}1${r}${m}`),
          p
        );
      });
    }
    /**
     * Compresses src to dest with gzip and unlinks src
     * @param {string} src - path to source file.
     * @param {string} dest - path to zipped destination file.
     * @param {Function} callback - callback called after file has been compressed.
     * @returns {undefined}
     * @private
     */
    _compressFile(r, f, p) {
      t.access(r, t.F_OK, (v) => {
        if (v)
          return p();
        var m = o.createGzip(), g = t.createReadStream(r), w = t.createWriteStream(f);
        w.on("finish", () => {
          t.unlink(r, p);
        }), g.pipe(m).pipe(w);
      });
    }
    _createLogDirIfNotExist(r) {
      t.existsSync(r) || t.mkdirSync(r, { recursive: !0 });
    }
  }, _s;
}
var bs, Sh;
function Sy() {
  if (Sh) return bs;
  Sh = 1;
  const t = Qh, a = lg, { Stream: c } = st(), o = Gt(), { configure: h } = ri();
  return bs = class extends o {
    /**
     * Constructor function for the Http transport object responsible for
     * persisting log messages and metadata to a terminal or TTY.
     * @param {!Object} [options={}] - Options for this instance.
     */
    // eslint-disable-next-line max-statements
    constructor(i = {}) {
      super(i), this.options = i, this.name = i.name || "http", this.ssl = !!i.ssl, this.host = i.host || "localhost", this.port = i.port, this.auth = i.auth, this.path = i.path || "", this.maximumDepth = i.maximumDepth, this.agent = i.agent, this.headers = i.headers || {}, this.headers["content-type"] = "application/json", this.batch = i.batch || !1, this.batchInterval = i.batchInterval || 5e3, this.batchCount = i.batchCount || 10, this.batchOptions = [], this.batchTimeoutID = -1, this.batchCallback = {}, this.port || (this.port = this.ssl ? 443 : 80);
    }
    /**
     * Core logging method exposed to Winston.
     * @param {Object} info - TODO: add param description.
     * @param {function} callback - TODO: add param description.
     * @returns {undefined}
     */
    log(i, d) {
      this._request(i, null, null, (e, n) => {
        n && n.statusCode !== 200 && (e = new Error(`Invalid HTTP Status Code: ${n.statusCode}`)), e ? this.emit("warn", e) : this.emit("logged", i);
      }), d && setImmediate(d);
    }
    /**
     * Query the transport. Options object is optional.
     * @param {Object} options -  Loggly-like query options for this instance.
     * @param {function} callback - Continuation to respond to when complete.
     * @returns {undefined}
     */
    query(i, d) {
      typeof i == "function" && (d = i, i = {}), i = {
        method: "query",
        params: this.normalizeQuery(i)
      };
      const e = i.params.auth || null;
      delete i.params.auth;
      const n = i.params.path || null;
      delete i.params.path, this._request(i, e, n, (l, u, r) => {
        if (u && u.statusCode !== 200 && (l = new Error(`Invalid HTTP Status Code: ${u.statusCode}`)), l)
          return d(l);
        if (typeof r == "string")
          try {
            r = JSON.parse(r);
          } catch (f) {
            return d(f);
          }
        d(null, r);
      });
    }
    /**
     * Returns a log stream for this transport. Options object is optional.
     * @param {Object} options - Stream options for this instance.
     * @returns {Stream} - TODO: add return description
     */
    stream(i = {}) {
      const d = new c();
      i = {
        method: "stream",
        params: i
      };
      const e = i.params.path || null;
      delete i.params.path;
      const n = i.params.auth || null;
      delete i.params.auth;
      let l = "";
      const u = this._request(i, n, e);
      return d.destroy = () => u.destroy(), u.on("data", (r) => {
        r = (l + r).split(/\n+/);
        const f = r.length - 1;
        let p = 0;
        for (; p < f; p++)
          try {
            d.emit("log", JSON.parse(r[p]));
          } catch (v) {
            d.emit("error", v);
          }
        l = r[f];
      }), u.on("error", (r) => d.emit("error", r)), d;
    }
    /**
     * Make a request to a winstond server or any http server which can
     * handle json-rpc.
     * @param {function} options - Options to sent the request.
     * @param {Object?} auth - authentication options
     * @param {string} path - request path
     * @param {function} callback - Continuation to respond to when complete.
     */
    _request(i, d, e, n) {
      i = i || {}, d = d || this.auth, e = e || this.path || "", this.batch ? this._doBatch(i, n, d, e) : this._doRequest(i, n, d, e);
    }
    /**
     * Send or memorize the options according to batch configuration
     * @param {function} options - Options to sent the request.
     * @param {function} callback - Continuation to respond to when complete.
     * @param {Object?} auth - authentication options
     * @param {string} path - request path
     */
    _doBatch(i, d, e, n) {
      if (this.batchOptions.push(i), this.batchOptions.length === 1) {
        const l = this;
        this.batchCallback = d, this.batchTimeoutID = setTimeout(function() {
          l.batchTimeoutID = -1, l._doBatchRequest(l.batchCallback, e, n);
        }, this.batchInterval);
      }
      this.batchOptions.length === this.batchCount && this._doBatchRequest(this.batchCallback, e, n);
    }
    /**
     * Initiate a request with the memorized batch options, stop the batch timeout
     * @param {function} callback - Continuation to respond to when complete.
     * @param {Object?} auth - authentication options
     * @param {string} path - request path
     */
    _doBatchRequest(i, d, e) {
      this.batchTimeoutID > 0 && (clearTimeout(this.batchTimeoutID), this.batchTimeoutID = -1);
      const n = this.batchOptions.slice();
      this.batchOptions = [], this._doRequest(n, i, d, e);
    }
    /**
     * Make a request to a winstond server or any http server which can
     * handle json-rpc.
     * @param {function} options - Options to sent the request.
     * @param {function} callback - Continuation to respond to when complete.
     * @param {Object?} auth - authentication options
     * @param {string} path - request path
     */
    _doRequest(i, d, e, n) {
      const l = Object.assign({}, this.headers);
      e && e.bearer && (l.Authorization = `Bearer ${e.bearer}`);
      const u = (this.ssl ? a : t).request({
        ...this.options,
        method: "POST",
        host: this.host,
        port: this.port,
        path: `/${n.replace(/^\//, "")}`,
        headers: l,
        auth: e && e.username && e.password ? `${e.username}:${e.password}` : "",
        agent: this.agent
      });
      u.on("error", d), u.on("response", (f) => f.on("end", () => d(null, f)).resume());
      const r = h({
        ...this.maximumDepth && { maximumDepth: this.maximumDepth }
      });
      u.end(Buffer.from(r(i, this.options.replacer), "utf8"));
    }
  }, bs;
}
var Ss, Rh;
function nm() {
  if (Rh) return Ss;
  Rh = 1;
  const t = (a) => a !== null && typeof a == "object" && typeof a.pipe == "function";
  return t.writable = (a) => t(a) && a.writable !== !1 && typeof a._write == "function" && typeof a._writableState == "object", t.readable = (a) => t(a) && a.readable !== !1 && typeof a._read == "function" && typeof a._readableState == "object", t.duplex = (a) => t.writable(a) && t.readable(a), t.transform = (a) => t.duplex(a) && typeof a._transform == "function", Ss = t, Ss;
}
var Rs, Th;
function Ry() {
  if (Th) return Rs;
  Th = 1;
  const t = nm(), { MESSAGE: a } = Ue(), c = fr, o = Gt();
  return Rs = class extends o {
    /**
     * Constructor function for the Console transport object responsible for
     * persisting log messages and metadata to a terminal or TTY.
     * @param {!Object} [options={}] - Options for this instance.
     */
    constructor(s = {}) {
      if (super(s), !s.stream || !t(s.stream))
        throw new Error("options.stream is required.");
      this._stream = s.stream, this._stream.setMaxListeners(1 / 0), this.isObjectMode = s.stream._writableState.objectMode, this.eol = typeof s.eol == "string" ? s.eol : c.EOL;
    }
    /**
     * Core logging method exposed to Winston.
     * @param {Object} info - TODO: add param description.
     * @param {Function} callback - TODO: add param description.
     * @returns {undefined}
     */
    log(s, i) {
      if (setImmediate(() => this.emit("logged", s)), this.isObjectMode) {
        this._stream.write(s), i && i();
        return;
      }
      this._stream.write(`${s[a]}${this.eol}`), i && i();
    }
  }, Rs;
}
var Ah;
function Ty() {
  return Ah || (Ah = 1, function(t) {
    Object.defineProperty(t, "Console", {
      configurable: !0,
      enumerable: !0,
      get() {
        return Gv();
      }
    }), Object.defineProperty(t, "File", {
      configurable: !0,
      enumerable: !0,
      get() {
        return by();
      }
    }), Object.defineProperty(t, "Http", {
      configurable: !0,
      enumerable: !0,
      get() {
        return Sy();
      }
    }), Object.defineProperty(t, "Stream", {
      configurable: !0,
      enumerable: !0,
      get() {
        return Ry();
      }
    });
  }(Lo)), Lo;
}
var Zr = {}, Oh;
function au() {
  if (Oh) return Zr;
  Oh = 1;
  const t = Hp(), { configs: a } = Ue();
  return Zr.cli = t.levels(a.cli), Zr.npm = t.levels(a.npm), Zr.syslog = t.levels(a.syslog), Zr.addColors = t.levels, Zr;
}
var Un = { exports: {} }, jn = { exports: {} }, Ch;
function Ay() {
  return Ch || (Ch = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    });
    var c = nu(), o = m(c), h = iu(), s = m(h), i = Zp(), d = m(i), e = Jp(), n = m(e), l = Qp(), u = m(l), r = ot(), f = m(r), p = Wt(), v = m(p);
    function m(O) {
      return O && O.__esModule ? O : { default: O };
    }
    function g(O, I, T) {
      T = (0, n.default)(T);
      var R = 0, A = 0, { length: b } = O, G = !1;
      b === 0 && T(null);
      function j(U, H) {
        U === !1 && (G = !0), G !== !0 && (U ? T(U) : (++A === b || H === s.default) && T(null));
      }
      for (; R < b; R++)
        I(O[R], R, (0, u.default)(j));
    }
    function w(O, I, T) {
      return (0, d.default)(O, 1 / 0, I, T);
    }
    function S(O, I, T) {
      var R = (0, o.default)(O) ? g : w;
      return R(O, (0, f.default)(I), T);
    }
    a.default = (0, v.default)(S, 3), t.exports = a.default;
  }(jn, jn.exports)), jn.exports;
}
var Bn = { exports: {} }, xh;
function Oy() {
  return xh || (xh = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    }), a.default = c;
    function c(o) {
      return (h, s, i) => o(h, i);
    }
    t.exports = a.default;
  }(Bn, Bn.exports)), Bn.exports;
}
var Ph;
function ou() {
  return Ph || (Ph = 1, function(t, a) {
    Object.defineProperty(a, "__esModule", {
      value: !0
    });
    var c = Ay(), o = l(c), h = Oy(), s = l(h), i = ot(), d = l(i), e = Wt(), n = l(e);
    function l(r) {
      return r && r.__esModule ? r : { default: r };
    }
    function u(r, f, p) {
      return (0, o.default)(r, (0, s.default)((0, d.default)(f)), p);
    }
    a.default = (0, n.default)(u, 3), t.exports = a.default;
  }(Un, Un.exports)), Un.exports;
}
var Ts, Dh;
function Cy() {
  if (Dh) return Ts;
  Dh = 1;
  var t = Object.prototype.toString;
  return Ts = function(c) {
    if (typeof c.displayName == "string" && c.constructor.name)
      return c.displayName;
    if (typeof c.name == "string" && c.name)
      return c.name;
    if (typeof c == "object" && c.constructor && typeof c.constructor.name == "string") return c.constructor.name;
    var o = c.toString(), h = t.call(c).slice(8, -1);
    return h === "Function" ? o = o.substring(o.indexOf("(") + 1, o.indexOf(")")) : o = h, o || "anonymous";
  }, Ts;
}
var As, Ih;
function im() {
  if (Ih) return As;
  Ih = 1;
  var t = Cy();
  return As = function(c) {
    var o = 0, h;
    function s() {
      return o || (o = 1, h = c.apply(this, arguments), c = null), h;
    }
    return s.displayName = t(c), s;
  }, As;
}
var Os = {}, Nh;
function am() {
  return Nh || (Nh = 1, function(t) {
    t.get = function(h) {
      var s = Error.stackTraceLimit;
      Error.stackTraceLimit = 1 / 0;
      var i = {}, d = Error.prepareStackTrace;
      Error.prepareStackTrace = function(n, l) {
        return l;
      }, Error.captureStackTrace(i, h || t.get);
      var e = i.stack;
      return Error.prepareStackTrace = d, Error.stackTraceLimit = s, e;
    }, t.parse = function(h) {
      if (!h.stack)
        return [];
      var s = this, i = h.stack.split(`
`).slice(1);
      return i.map(function(d) {
        if (d.match(/^\s*[-]{4,}$/))
          return s._createParsedCallSite({
            fileName: d,
            lineNumber: null,
            functionName: null,
            typeName: null,
            methodName: null,
            columnNumber: null,
            native: null
          });
        var e = d.match(/at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);
        if (e) {
          var n = null, l = null, u = null, r = null, f = null, p = e[5] === "native";
          if (e[1]) {
            u = e[1];
            var v = u.lastIndexOf(".");
            if (u[v - 1] == "." && v--, v > 0) {
              n = u.substr(0, v), l = u.substr(v + 1);
              var m = n.indexOf(".Module");
              m > 0 && (u = u.substr(m + 1), n = n.substr(0, m));
            }
            r = null;
          }
          l && (r = n, f = l), l === "<anonymous>" && (f = null, u = null);
          var g = {
            fileName: e[2] || null,
            lineNumber: parseInt(e[3], 10) || null,
            functionName: u,
            typeName: r,
            methodName: f,
            columnNumber: parseInt(e[4], 10) || null,
            native: p
          };
          return s._createParsedCallSite(g);
        }
      }).filter(function(d) {
        return !!d;
      });
    };
    function a(h) {
      for (var s in h)
        this[s] = h[s];
    }
    var c = [
      "this",
      "typeName",
      "functionName",
      "methodName",
      "fileName",
      "lineNumber",
      "columnNumber",
      "function",
      "evalOrigin"
    ], o = [
      "topLevel",
      "eval",
      "native",
      "constructor"
    ];
    c.forEach(function(h) {
      a.prototype[h] = null, a.prototype["get" + h[0].toUpperCase() + h.substr(1)] = function() {
        return this[h];
      };
    }), o.forEach(function(h) {
      a.prototype[h] = !1, a.prototype["is" + h[0].toUpperCase() + h.substr(1)] = function() {
        return this[h];
      };
    }), t._createParsedCallSite = function(h) {
      return new a(h);
    };
  }(Os)), Os;
}
var Cs, Lh;
function xy() {
  if (Lh) return Cs;
  Lh = 1;
  const { Writable: t } = st();
  return Cs = class extends t {
    /**
     * Constructor function for the ExceptionStream responsible for wrapping a
     * TransportStream; only allowing writes of `info` objects with
     * `info.exception` set to true.
     * @param {!TransportStream} transport - Stream to filter to exceptions
     */
    constructor(c) {
      if (super({ objectMode: !0 }), !c)
        throw new Error("ExceptionStream requires a TransportStream instance.");
      this.handleExceptions = !0, this.transport = c;
    }
    /**
     * Writes the info object to our transport instance if (and only if) the
     * `exception` property is set on the info.
     * @param {mixed} info - TODO: add param description.
     * @param {mixed} enc - TODO: add param description.
     * @param {mixed} callback - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     * @private
     */
    _write(c, o, h) {
      return c.exception ? this.transport.log(c, h) : (h(), !0);
    }
  }, Cs;
}
var xs, Fh;
function om() {
  if (Fh) return xs;
  Fh = 1;
  const t = fr, a = ou(), c = ti()("winston:exception"), o = im(), h = am(), s = xy();
  return xs = class {
    /**
     * TODO: add contructor description
     * @param {!Logger} logger - TODO: add param description
     */
    constructor(d) {
      if (!d)
        throw new Error("Logger is required to handle exceptions");
      this.logger = d, this.handlers = /* @__PURE__ */ new Map();
    }
    /**
     * Handles `uncaughtException` events for the current process by adding any
     * handlers passed in.
     * @returns {undefined}
     */
    handle(...d) {
      d.forEach((e) => {
        if (Array.isArray(e))
          return e.forEach((n) => this._addHandler(n));
        this._addHandler(e);
      }), this.catcher || (this.catcher = this._uncaughtException.bind(this), process.on("uncaughtException", this.catcher));
    }
    /**
     * Removes any handlers to `uncaughtException` events for the current
     * process. This does not modify the state of the `this.handlers` set.
     * @returns {undefined}
     */
    unhandle() {
      this.catcher && (process.removeListener("uncaughtException", this.catcher), this.catcher = !1, Array.from(this.handlers.values()).forEach((d) => this.logger.unpipe(d)));
    }
    /**
     * TODO: add method description
     * @param {Error} err - Error to get information about.
     * @returns {mixed} - TODO: add return description.
     */
    getAllInfo(d) {
      let e = null;
      return d && (e = typeof d == "string" ? d : d.message), {
        error: d,
        // TODO (indexzero): how do we configure this?
        level: "error",
        message: [
          `uncaughtException: ${e || "(no error message)"}`,
          d && d.stack || "  No stack trace"
        ].join(`
`),
        stack: d && d.stack,
        exception: !0,
        date: (/* @__PURE__ */ new Date()).toString(),
        process: this.getProcessInfo(),
        os: this.getOsInfo(),
        trace: this.getTrace(d)
      };
    }
    /**
     * Gets all relevant process information for the currently running process.
     * @returns {mixed} - TODO: add return description.
     */
    getProcessInfo() {
      return {
        pid: process.pid,
        uid: process.getuid ? process.getuid() : null,
        gid: process.getgid ? process.getgid() : null,
        cwd: process.cwd(),
        execPath: process.execPath,
        version: process.version,
        argv: process.argv,
        memoryUsage: process.memoryUsage()
      };
    }
    /**
     * Gets all relevant OS information for the currently running process.
     * @returns {mixed} - TODO: add return description.
     */
    getOsInfo() {
      return {
        loadavg: t.loadavg(),
        uptime: t.uptime()
      };
    }
    /**
     * Gets a stack trace for the specified error.
     * @param {mixed} err - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     */
    getTrace(d) {
      return (d ? h.parse(d) : h.get()).map((n) => ({
        column: n.getColumnNumber(),
        file: n.getFileName(),
        function: n.getFunctionName(),
        line: n.getLineNumber(),
        method: n.getMethodName(),
        native: n.isNative()
      }));
    }
    /**
     * Helper method to add a transport as an exception handler.
     * @param {Transport} handler - The transport to add as an exception handler.
     * @returns {void}
     */
    _addHandler(d) {
      if (!this.handlers.has(d)) {
        d.handleExceptions = !0;
        const e = new s(d);
        this.handlers.set(d, e), this.logger.pipe(e);
      }
    }
    /**
     * Logs all relevant information around the `err` and exits the current
     * process.
     * @param {Error} err - Error to handle
     * @returns {mixed} - TODO: add return description.
     * @private
     */
    _uncaughtException(d) {
      const e = this.getAllInfo(d), n = this._getExceptionHandlers();
      let l = typeof this.logger.exitOnError == "function" ? this.logger.exitOnError(d) : this.logger.exitOnError, u;
      !n.length && l && (console.warn("winston: exitOnError cannot be true with no exception handlers."), console.warn("winston: not exiting process."), l = !1);
      function r() {
        c("doExit", l), c("process._exiting", process._exiting), l && !process._exiting && (u && clearTimeout(u), process.exit(1));
      }
      if (!n || n.length === 0)
        return process.nextTick(r);
      a(n, (f, p) => {
        const v = o(p), m = f.transport || f;
        function g(w) {
          return () => {
            c(w), v();
          };
        }
        m._ending = !0, m.once("finish", g("finished")), m.once("error", g("error"));
      }, () => l && r()), this.logger.log(e), l && (u = setTimeout(r, 3e3));
    }
    /**
     * Returns the list of transports and exceptionHandlers for this instance.
     * @returns {Array} - List of transports and exceptionHandlers for this
     * instance.
     * @private
     */
    _getExceptionHandlers() {
      return this.logger.transports.filter((d) => (d.transport || d).handleExceptions);
    }
  }, xs;
}
var Ps, $h;
function Py() {
  if ($h) return Ps;
  $h = 1;
  const { Writable: t } = st();
  return Ps = class extends t {
    /**
     * Constructor function for the RejectionStream responsible for wrapping a
     * TransportStream; only allowing writes of `info` objects with
     * `info.rejection` set to true.
     * @param {!TransportStream} transport - Stream to filter to rejections
     */
    constructor(c) {
      if (super({ objectMode: !0 }), !c)
        throw new Error("RejectionStream requires a TransportStream instance.");
      this.handleRejections = !0, this.transport = c;
    }
    /**
     * Writes the info object to our transport instance if (and only if) the
     * `rejection` property is set on the info.
     * @param {mixed} info - TODO: add param description.
     * @param {mixed} enc - TODO: add param description.
     * @param {mixed} callback - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     * @private
     */
    _write(c, o, h) {
      return c.rejection ? this.transport.log(c, h) : (h(), !0);
    }
  }, Ps;
}
var Ds, qh;
function sm() {
  if (qh) return Ds;
  qh = 1;
  const t = fr, a = ou(), c = ti()("winston:rejection"), o = im(), h = am(), s = Py();
  return Ds = class {
    /**
     * TODO: add contructor description
     * @param {!Logger} logger - TODO: add param description
     */
    constructor(d) {
      if (!d)
        throw new Error("Logger is required to handle rejections");
      this.logger = d, this.handlers = /* @__PURE__ */ new Map();
    }
    /**
     * Handles `unhandledRejection` events for the current process by adding any
     * handlers passed in.
     * @returns {undefined}
     */
    handle(...d) {
      d.forEach((e) => {
        if (Array.isArray(e))
          return e.forEach((n) => this._addHandler(n));
        this._addHandler(e);
      }), this.catcher || (this.catcher = this._unhandledRejection.bind(this), process.on("unhandledRejection", this.catcher));
    }
    /**
     * Removes any handlers to `unhandledRejection` events for the current
     * process. This does not modify the state of the `this.handlers` set.
     * @returns {undefined}
     */
    unhandle() {
      this.catcher && (process.removeListener("unhandledRejection", this.catcher), this.catcher = !1, Array.from(this.handlers.values()).forEach(
        (d) => this.logger.unpipe(d)
      ));
    }
    /**
     * TODO: add method description
     * @param {Error} err - Error to get information about.
     * @returns {mixed} - TODO: add return description.
     */
    getAllInfo(d) {
      let e = null;
      return d && (e = typeof d == "string" ? d : d.message), {
        error: d,
        // TODO (indexzero): how do we configure this?
        level: "error",
        message: [
          `unhandledRejection: ${e || "(no error message)"}`,
          d && d.stack || "  No stack trace"
        ].join(`
`),
        stack: d && d.stack,
        rejection: !0,
        date: (/* @__PURE__ */ new Date()).toString(),
        process: this.getProcessInfo(),
        os: this.getOsInfo(),
        trace: this.getTrace(d)
      };
    }
    /**
     * Gets all relevant process information for the currently running process.
     * @returns {mixed} - TODO: add return description.
     */
    getProcessInfo() {
      return {
        pid: process.pid,
        uid: process.getuid ? process.getuid() : null,
        gid: process.getgid ? process.getgid() : null,
        cwd: process.cwd(),
        execPath: process.execPath,
        version: process.version,
        argv: process.argv,
        memoryUsage: process.memoryUsage()
      };
    }
    /**
     * Gets all relevant OS information for the currently running process.
     * @returns {mixed} - TODO: add return description.
     */
    getOsInfo() {
      return {
        loadavg: t.loadavg(),
        uptime: t.uptime()
      };
    }
    /**
     * Gets a stack trace for the specified error.
     * @param {mixed} err - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     */
    getTrace(d) {
      return (d ? h.parse(d) : h.get()).map((n) => ({
        column: n.getColumnNumber(),
        file: n.getFileName(),
        function: n.getFunctionName(),
        line: n.getLineNumber(),
        method: n.getMethodName(),
        native: n.isNative()
      }));
    }
    /**
     * Helper method to add a transport as an exception handler.
     * @param {Transport} handler - The transport to add as an exception handler.
     * @returns {void}
     */
    _addHandler(d) {
      if (!this.handlers.has(d)) {
        d.handleRejections = !0;
        const e = new s(d);
        this.handlers.set(d, e), this.logger.pipe(e);
      }
    }
    /**
     * Logs all relevant information around the `err` and exits the current
     * process.
     * @param {Error} err - Error to handle
     * @returns {mixed} - TODO: add return description.
     * @private
     */
    _unhandledRejection(d) {
      const e = this.getAllInfo(d), n = this._getRejectionHandlers();
      let l = typeof this.logger.exitOnError == "function" ? this.logger.exitOnError(d) : this.logger.exitOnError, u;
      !n.length && l && (console.warn("winston: exitOnError cannot be true with no rejection handlers."), console.warn("winston: not exiting process."), l = !1);
      function r() {
        c("doExit", l), c("process._exiting", process._exiting), l && !process._exiting && (u && clearTimeout(u), process.exit(1));
      }
      if (!n || n.length === 0)
        return process.nextTick(r);
      a(
        n,
        (f, p) => {
          const v = o(p), m = f.transport || f;
          function g(w) {
            return () => {
              c(w), v();
            };
          }
          m._ending = !0, m.once("finish", g("finished")), m.once("error", g("error"));
        },
        () => l && r()
      ), this.logger.log(e), l && (u = setTimeout(r, 3e3));
    }
    /**
     * Returns the list of transports and exceptionHandlers for this instance.
     * @returns {Array} - List of transports and exceptionHandlers for this
     * instance.
     * @private
     */
    _getRejectionHandlers() {
      return this.logger.transports.filter((d) => (d.transport || d).handleRejections);
    }
  }, Ds;
}
var Is, Mh;
function Dy() {
  if (Mh) return Is;
  Mh = 1;
  class t {
    /**
     * Constructor function for the Profiler instance used by
     * `Logger.prototype.startTimer`. When done is called the timer will finish
     * and log the duration.
     * @param {!Logger} logger - TODO: add param description.
     * @private
     */
    constructor(c) {
      const o = su();
      if (typeof c != "object" || Array.isArray(c) || !(c instanceof o))
        throw new Error("Logger is required for profiling");
      this.logger = c, this.start = Date.now();
    }
    /**
     * Ends the current timer (i.e. Profiler) instance and logs the `msg` along
     * with the duration since creation.
     * @returns {mixed} - TODO: add return description.
     * @private
     */
    done(...c) {
      typeof c[c.length - 1] == "function" && (console.warn("Callback function no longer supported as of winston@3.0.0"), c.pop());
      const o = typeof c[c.length - 1] == "object" ? c.pop() : {};
      return o.level = o.level || "info", o.durationMs = Date.now() - this.start, this.logger.write(o);
    }
  }
  return Is = t, Is;
}
var Ns, kh;
function su() {
  if (kh) return Ns;
  kh = 1;
  const { Stream: t, Transform: a } = st(), c = ou(), { LEVEL: o, SPLAT: h } = Ue(), s = nm(), i = om(), d = sm(), e = Kp(), n = Dy(), { warn: l } = Gp(), u = au(), r = /%[scdjifoO%]/g;
  class f extends a {
    /**
     * Constructor function for the Logger object responsible for persisting log
     * messages and metadata to one or more transports.
     * @param {!Object} options - foo
     */
    constructor(m) {
      super({ objectMode: !0 }), this.configure(m);
    }
    child(m) {
      const g = this;
      return Object.create(g, {
        write: {
          value: function(w) {
            const S = Object.assign(
              {},
              m,
              w
            );
            w instanceof Error && (S.stack = w.stack, S.message = w.message), g.write(S);
          }
        }
      });
    }
    /**
     * This will wholesale reconfigure this instance by:
     * 1. Resetting all transports. Older transports will be removed implicitly.
     * 2. Set all other options including levels, colors, rewriters, filters,
     *    exceptionHandlers, etc.
     * @param {!Object} options - TODO: add param description.
     * @returns {undefined}
     */
    configure({
      silent: m,
      format: g,
      defaultMeta: w,
      levels: S,
      level: O = "info",
      exitOnError: I = !0,
      transports: T,
      colors: R,
      emitErrs: A,
      formatters: b,
      padLevels: G,
      rewriters: j,
      stripColors: U,
      exceptionHandlers: H,
      rejectionHandlers: M
    } = {}) {
      if (this.transports.length && this.clear(), this.silent = m, this.format = g || this.format || Np()(), this.defaultMeta = w || null, this.levels = S || this.levels || u.npm.levels, this.level = O, this.exceptions && this.exceptions.unhandle(), this.rejections && this.rejections.unhandle(), this.exceptions = new i(this), this.rejections = new d(this), this.profilers = {}, this.exitOnError = I, T && (T = Array.isArray(T) ? T : [T], T.forEach((F) => this.add(F))), R || A || b || G || j || U)
        throw new Error(
          [
            "{ colors, emitErrs, formatters, padLevels, rewriters, stripColors } were removed in winston@3.0.0.",
            "Use a custom winston.format(function) instead.",
            "See: https://github.com/winstonjs/winston/tree/master/UPGRADE-3.0.md"
          ].join(`
`)
        );
      H && this.exceptions.handle(H), M && this.rejections.handle(M);
    }
    isLevelEnabled(m) {
      const g = p(this.levels, m);
      if (g === null)
        return !1;
      const w = p(this.levels, this.level);
      return w === null ? !1 : !this.transports || this.transports.length === 0 ? w >= g : this.transports.findIndex((O) => {
        let I = p(this.levels, O.level);
        return I === null && (I = w), I >= g;
      }) !== -1;
    }
    /* eslint-disable valid-jsdoc */
    /**
     * Ensure backwards compatibility with a `log` method
     * @param {mixed} level - Level the log message is written at.
     * @param {mixed} msg - TODO: add param description.
     * @param {mixed} meta - TODO: add param description.
     * @returns {Logger} - TODO: add return description.
     *
     * @example
     *    // Supports the existing API:
     *    logger.log('info', 'Hello world', { custom: true });
     *    logger.log('info', new Error('Yo, it\'s on fire'));
     *
     *    // Requires winston.format.splat()
     *    logger.log('info', '%s %d%%', 'A string', 50, { thisIsMeta: true });
     *
     *    // And the new API with a single JSON literal:
     *    logger.log({ level: 'info', message: 'Hello world', custom: true });
     *    logger.log({ level: 'info', message: new Error('Yo, it\'s on fire') });
     *
     *    // Also requires winston.format.splat()
     *    logger.log({
     *      level: 'info',
     *      message: '%s %d%%',
     *      [SPLAT]: ['A string', 50],
     *      meta: { thisIsMeta: true }
     *    });
     *
     */
    /* eslint-enable valid-jsdoc */
    log(m, g, ...w) {
      if (arguments.length === 1)
        return m[o] = m.level, this._addDefaultMeta(m), this.write(m), this;
      if (arguments.length === 2)
        return g && typeof g == "object" ? (g[o] = g.level = m, this._addDefaultMeta(g), this.write(g), this) : (g = { [o]: m, level: m, message: g }, this._addDefaultMeta(g), this.write(g), this);
      const [S] = w;
      if (typeof S == "object" && S !== null && !(g && g.match && g.match(r))) {
        const I = Object.assign({}, this.defaultMeta, S, {
          [o]: m,
          [h]: w,
          level: m,
          message: g
        });
        return S.message && (I.message = `${I.message} ${S.message}`), S.stack && (I.stack = S.stack), S.cause && (I.cause = S.cause), this.write(I), this;
      }
      return this.write(Object.assign({}, this.defaultMeta, {
        [o]: m,
        [h]: w,
        level: m,
        message: g
      })), this;
    }
    /**
     * Pushes data so that it can be picked up by all of our pipe targets.
     * @param {mixed} info - TODO: add param description.
     * @param {mixed} enc - TODO: add param description.
     * @param {mixed} callback - Continues stream processing.
     * @returns {undefined}
     * @private
     */
    _transform(m, g, w) {
      if (this.silent)
        return w();
      m[o] || (m[o] = m.level), !this.levels[m[o]] && this.levels[m[o]] !== 0 && console.error("[winston] Unknown logger level: %s", m[o]), this._readableState.pipes || console.error(
        "[winston] Attempt to write logs with no transports, which can increase memory usage: %j",
        m
      );
      try {
        this.push(this.format.transform(m, this.format.options));
      } finally {
        this._writableState.sync = !1, w();
      }
    }
    /**
     * Delays the 'finish' event until all transport pipe targets have
     * also emitted 'finish' or are already finished.
     * @param {mixed} callback - Continues stream processing.
     */
    _final(m) {
      const g = this.transports.slice();
      c(
        g,
        (w, S) => {
          if (!w || w.finished) return setImmediate(S);
          w.once("finish", S), w.end();
        },
        m
      );
    }
    /**
     * Adds the transport to this logger instance by piping to it.
     * @param {mixed} transport - TODO: add param description.
     * @returns {Logger} - TODO: add return description.
     */
    add(m) {
      const g = !s(m) || m.log.length > 2 ? new e({ transport: m }) : m;
      if (!g._writableState || !g._writableState.objectMode)
        throw new Error(
          "Transports must WritableStreams in objectMode. Set { objectMode: true }."
        );
      return this._onEvent("error", g), this._onEvent("warn", g), this.pipe(g), m.handleExceptions && this.exceptions.handle(), m.handleRejections && this.rejections.handle(), this;
    }
    /**
     * Removes the transport from this logger instance by unpiping from it.
     * @param {mixed} transport - TODO: add param description.
     * @returns {Logger} - TODO: add return description.
     */
    remove(m) {
      if (!m) return this;
      let g = m;
      return (!s(m) || m.log.length > 2) && (g = this.transports.filter(
        (w) => w.transport === m
      )[0]), g && this.unpipe(g), this;
    }
    /**
     * Removes all transports from this logger instance.
     * @returns {Logger} - TODO: add return description.
     */
    clear() {
      return this.unpipe(), this;
    }
    /**
     * Cleans up resources (streams, event listeners) for all transports
     * associated with this instance (if necessary).
     * @returns {Logger} - TODO: add return description.
     */
    close() {
      return this.exceptions.unhandle(), this.rejections.unhandle(), this.clear(), this.emit("close"), this;
    }
    /**
     * Sets the `target` levels specified on this instance.
     * @param {Object} Target levels to use on this instance.
     */
    setLevels() {
      l.deprecated("setLevels");
    }
    /**
     * Queries the all transports for this instance with the specified `options`.
     * This will aggregate each transport's results into one object containing
     * a property per transport.
     * @param {Object} options - Query options for this instance.
     * @param {function} callback - Continuation to respond to when complete.
     */
    query(m, g) {
      typeof m == "function" && (g = m, m = {}), m = m || {};
      const w = {}, S = Object.assign({}, m.query || {});
      function O(T, R) {
        m.query && typeof T.formatQuery == "function" && (m.query = T.formatQuery(S)), T.query(m, (A, b) => {
          if (A)
            return R(A);
          typeof T.formatResults == "function" && (b = T.formatResults(b, m.format)), R(null, b);
        });
      }
      function I(T, R) {
        O(T, (A, b) => {
          R && (b = A || b, b && (w[T.name] = b), R()), R = null;
        });
      }
      c(
        this.transports.filter((T) => !!T.query),
        I,
        () => g(null, w)
      );
    }
    /**
     * Returns a log stream for all transports. Options object is optional.
     * @param{Object} options={} - Stream options for this instance.
     * @returns {Stream} - TODO: add return description.
     */
    stream(m = {}) {
      const g = new t(), w = [];
      return g._streams = w, g.destroy = () => {
        let S = w.length;
        for (; S--; )
          w[S].destroy();
      }, this.transports.filter((S) => !!S.stream).forEach((S) => {
        const O = S.stream(m);
        O && (w.push(O), O.on("log", (I) => {
          I.transport = I.transport || [], I.transport.push(S.name), g.emit("log", I);
        }), O.on("error", (I) => {
          I.transport = I.transport || [], I.transport.push(S.name), g.emit("error", I);
        }));
      }), g;
    }
    /**
     * Returns an object corresponding to a specific timing. When done is called
     * the timer will finish and log the duration. e.g.:
     * @returns {Profile} - TODO: add return description.
     * @example
     *    const timer = winston.startTimer()
     *    setTimeout(() => {
     *      timer.done({
     *        message: 'Logging message'
     *      });
     *    }, 1000);
     */
    startTimer() {
      return new n(this);
    }
    /**
     * Tracks the time inbetween subsequent calls to this method with the same
     * `id` parameter. The second call to this method will log the difference in
     * milliseconds along with the message.
     * @param {string} id Unique id of the profiler
     * @returns {Logger} - TODO: add return description.
     */
    profile(m, ...g) {
      const w = Date.now();
      if (this.profilers[m]) {
        const S = this.profilers[m];
        delete this.profilers[m], typeof g[g.length - 2] == "function" && (console.warn(
          "Callback function no longer supported as of winston@3.0.0"
        ), g.pop());
        const O = typeof g[g.length - 1] == "object" ? g.pop() : {};
        return O.level = O.level || "info", O.durationMs = w - S, O.message = O.message || m, this.write(O);
      }
      return this.profilers[m] = w, this;
    }
    /**
     * Backwards compatibility to `exceptions.handle` in winston < 3.0.0.
     * @returns {undefined}
     * @deprecated
     */
    handleExceptions(...m) {
      console.warn(
        "Deprecated: .handleExceptions() will be removed in winston@4. Use .exceptions.handle()"
      ), this.exceptions.handle(...m);
    }
    /**
     * Backwards compatibility to `exceptions.handle` in winston < 3.0.0.
     * @returns {undefined}
     * @deprecated
     */
    unhandleExceptions(...m) {
      console.warn(
        "Deprecated: .unhandleExceptions() will be removed in winston@4. Use .exceptions.unhandle()"
      ), this.exceptions.unhandle(...m);
    }
    /**
     * Throw a more meaningful deprecation notice
     * @throws {Error} - TODO: add throws description.
     */
    cli() {
      throw new Error(
        [
          "Logger.cli() was removed in winston@3.0.0",
          "Use a custom winston.formats.cli() instead.",
          "See: https://github.com/winstonjs/winston/tree/master/UPGRADE-3.0.md"
        ].join(`
`)
      );
    }
    /**
     * Bubbles the `event` that occured on the specified `transport` up
     * from this instance.
     * @param {string} event - The event that occured
     * @param {Object} transport - Transport on which the event occured
     * @private
     */
    _onEvent(m, g) {
      function w(S) {
        m === "error" && !this.transports.includes(g) && this.add(g), this.emit(m, S, g);
      }
      g["__winston" + m] || (g["__winston" + m] = w.bind(this), g.on(m, g["__winston" + m]));
    }
    _addDefaultMeta(m) {
      this.defaultMeta && Object.assign(m, this.defaultMeta);
    }
  }
  function p(v, m) {
    const g = v[m];
    return !g && g !== 0 ? null : g;
  }
  return Object.defineProperty(f.prototype, "transports", {
    configurable: !1,
    enumerable: !0,
    get() {
      const { pipes: v } = this._readableState;
      return Array.isArray(v) ? v : [v].filter(Boolean);
    }
  }), Ns = f, Ns;
}
var Ls, Uh;
function um() {
  if (Uh) return Ls;
  Uh = 1;
  const { LEVEL: t } = Ue(), a = au(), c = su(), o = ti()("winston:create-logger");
  function h(s) {
    return "is" + s.charAt(0).toUpperCase() + s.slice(1) + "Enabled";
  }
  return Ls = function(s = {}) {
    s.levels = s.levels || a.npm.levels;
    class i extends c {
      /**
       * Create a new class derived logger for which the levels can be attached to
       * the prototype of. This is a V8 optimization that is well know to increase
       * performance of prototype functions.
       * @param {!Object} options - Options for the created logger.
       */
      constructor(n) {
        super(n);
      }
    }
    const d = new i(s);
    return Object.keys(s.levels).forEach(function(e) {
      if (o('Define prototype method for "%s"', e), e === "log") {
        console.warn('Level "log" not defined: conflicts with the method "log". Use a different level name.');
        return;
      }
      i.prototype[e] = function(...n) {
        const l = this || d;
        if (n.length === 1) {
          const [u] = n, r = u && u.message && u || { message: u };
          return r.level = r[t] = e, l._addDefaultMeta(r), l.write(r), this || d;
        }
        return n.length === 0 ? (l.log(e, ""), l) : l.log(e, ...n);
      }, i.prototype[h(e)] = function() {
        return (this || d).isLevelEnabled(e);
      };
    }), d;
  }, Ls;
}
var Fs, jh;
function Iy() {
  if (jh) return Fs;
  jh = 1;
  const t = um();
  return Fs = class {
    /**
     * Constructor function for the Container object responsible for managing a
     * set of `winston.Logger` instances based on string ids.
     * @param {!Object} [options={}] - Default pass-thru options for Loggers.
     */
    constructor(c = {}) {
      this.loggers = /* @__PURE__ */ new Map(), this.options = c;
    }
    /**
     * Retrieves a `winston.Logger` instance for the specified `id`. If an
     * instance does not exist, one is created.
     * @param {!string} id - The id of the Logger to get.
     * @param {?Object} [options] - Options for the Logger instance.
     * @returns {Logger} - A configured Logger instance with a specified id.
     */
    add(c, o) {
      if (!this.loggers.has(c)) {
        o = Object.assign({}, o || this.options);
        const h = o.transports || this.options.transports;
        h ? o.transports = Array.isArray(h) ? h.slice() : [h] : o.transports = [];
        const s = t(o);
        s.on("close", () => this._delete(c)), this.loggers.set(c, s);
      }
      return this.loggers.get(c);
    }
    /**
     * Retreives a `winston.Logger` instance for the specified `id`. If
     * an instance does not exist, one is created.
     * @param {!string} id - The id of the Logger to get.
     * @param {?Object} [options] - Options for the Logger instance.
     * @returns {Logger} - A configured Logger instance with a specified id.
     */
    get(c, o) {
      return this.add(c, o);
    }
    /**
     * Check if the container has a logger with the id.
     * @param {?string} id - The id of the Logger instance to find.
     * @returns {boolean} - Boolean value indicating if this instance has a
     * logger with the specified `id`.
     */
    has(c) {
      return !!this.loggers.has(c);
    }
    /**
     * Closes a `Logger` instance with the specified `id` if it exists.
     * If no `id` is supplied then all Loggers are closed.
     * @param {?string} id - The id of the Logger instance to close.
     * @returns {undefined}
     */
    close(c) {
      if (c)
        return this._removeLogger(c);
      this.loggers.forEach((o, h) => this._removeLogger(h));
    }
    /**
     * Remove a logger based on the id.
     * @param {!string} id - The id of the logger to remove.
     * @returns {undefined}
     * @private
     */
    _removeLogger(c) {
      if (!this.loggers.has(c))
        return;
      this.loggers.get(c).close(), this._delete(c);
    }
    /**
     * Deletes a `Logger` instance with the specified `id`.
     * @param {!string} id - The id of the Logger instance to delete from
     * container.
     * @returns {undefined}
     * @private
     */
    _delete(c) {
      this.loggers.delete(c);
    }
  }, Fs;
}
var Bh;
function Ny() {
  return Bh || (Bh = 1, function(t) {
    const a = Hp(), { warn: c } = Gp();
    t.version = qv.version, t.transports = Ty(), t.config = au(), t.addColors = a.levels, t.format = a.format, t.createLogger = um(), t.Logger = su(), t.ExceptionHandler = om(), t.RejectionHandler = sm(), t.Container = Iy(), t.Transport = Gt(), t.loggers = new t.Container();
    const o = t.createLogger();
    Object.keys(t.config.npm.levels).concat([
      "log",
      "query",
      "stream",
      "add",
      "remove",
      "clear",
      "profile",
      "startTimer",
      "handleExceptions",
      "unhandleExceptions",
      "handleRejections",
      "unhandleRejections",
      "configure",
      "child"
    ]).forEach(
      (h) => t[h] = (...s) => o[h](...s)
    ), Object.defineProperty(t, "level", {
      get() {
        return o.level;
      },
      set(h) {
        o.level = h;
      }
    }), Object.defineProperty(t, "exceptions", {
      get() {
        return o.exceptions;
      }
    }), Object.defineProperty(t, "rejections", {
      get() {
        return o.rejections;
      }
    }), ["exitOnError"].forEach((h) => {
      Object.defineProperty(t, h, {
        get() {
          return o[h];
        },
        set(s) {
          o[h] = s;
        }
      });
    }), Object.defineProperty(t, "default", {
      get() {
        return {
          exceptionHandlers: o.exceptionHandlers,
          rejectionHandlers: o.rejectionHandlers,
          transports: o.transports
        };
      }
    }), c.deprecated(t, "setLevels"), c.forFunctions(t, "useFormat", ["cli"]), c.forProperties(t, "useFormat", ["padLevels", "stripColors"]), c.forFunctions(t, "deprecated", [
      "addRewriter",
      "addFilter",
      "clone",
      "extend"
    ]), c.forProperties(t, "deprecated", ["emitErrs", "levelLength"]);
  }(io)), io;
}
var Ft = Ny();
const Ly = Xh(import.meta.url), Fy = Ae.dirname(Ly), $y = Ae.join(Fy, "../package.json"), qy = JSON.parse(He.readFileSync($y, "utf-8")), { combine: Hh, timestamp: My, printf: ky, errors: Uy } = Ft.format, Gh = ky(({ level: t, message: a, timestamp: c, stack: o, label: h }) => `${c} [${h}] [${t}]: ${o || a}`), uu = qy.logFilePath, Wh = Ae.dirname(uu);
He.existsSync(Wh) || He.mkdirSync(Wh, { recursive: !0 });
He.writeFileSync(uu, "");
const Ur = Ft.createLogger({
  format: Hh(My({ format: "YYYY-MM-DD HH:mm:ss" }), Uy({ stack: !0 }), Gh),
  transports: [
    new Ft.transports.Console({
      level: "info",
      format: Hh(Ft.format.colorize(), Gh)
    }),
    new Ft.transports.File({
      filename: uu,
      level: "silly",
      maxsize: 5242880,
      // 5MB
      maxFiles: 5
    })
  ]
});
function jy(t) {
  return {
    log: (a, c, o = {}) => {
      Ur.log(a, c, { ...o, label: t });
    },
    error: (a, c) => Ur.error(a, { ...c, label: t }),
    warn: (a, c) => Ur.warn(a, { ...c, label: t }),
    info: (a, c) => Ur.info(a, { ...c, label: t }),
    verbose: (a, c) => Ur.verbose(a, { ...c, label: t }),
    debug: (a, c) => Ur.debug(a, { ...c, label: t }),
    silly: (a, c) => Ur.silly(a, { ...c, label: t })
  };
}
function By(t) {
  process.on("uncaughtException", (a) => {
    t.error("Uncaught Exception:", a), process.exit(1);
  }), process.on("unhandledRejection", (a, c) => {
    t.error("Unhandled Rejection at:", c, "reason:", a);
  });
}
const { autoUpdater: rr } = q0, lu = process.env.NODE_ENV === "development", Hy = "http://localhost:4000", Gy = Xh(import.meta.url), Cr = Ae.dirname(Gy), Wy = Ae.join(Cr, "../package.json"), zy = JSON.parse(He.readFileSync(Wy, "utf-8")), Oe = jy("main.js");
By();
process.defaultApp ? process.argv.length >= 2 && Me.setAsDefaultProtocolClient("titan", process.execPath, [Ae.resolve(process.argv[1])]) : Me.setAsDefaultProtocolClient("titan");
const Yy = Me.requestSingleInstanceLock();
Me.commandLine.appendSwitch("js-flags", "--max-old-space-size=4096");
Me.commandLine.appendSwitch("enable-features", "V8CodeCache");
let Pe, qe, Br = !1, lm = !1;
function cm() {
  const t = ig.getPrimaryDisplay(), { width: a, height: c } = t.workAreaSize;
  Pe = new Vh({
    width: a,
    height: c,
    backgroundColor: "#1A202C",
    frame: !1,
    show: !1,
    resizable: !0,
    autoHideMenuBar: !0,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      preload: He.existsSync(Ae.join(Cr, "preload.mjs")) ? Ae.join(Cr, "preload.mjs") : Ae.join(Cr, "preload.js"),
      sandbox: !0
    }
  }), Pe.loadFile(Ae.join(Cr, "../splash.html")), $t.defaultSession.webRequest.onHeadersReceived((o, h) => {
    const s = lu ? [
      "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' http://localhost:4000 http://localhost:5173 ws://localhost:4000 ws://localhost:5173",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com"
    ].join("; ") : ["default-src 'self'", "connect-src 'self' http://localhost:4000 ws://localhost:4000", "img-src 'self' data:", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' data: https://fonts.gstatic.com"].join("; ");
    h({
      responseHeaders: {
        ...o.responseHeaders,
        "Content-Security-Policy": [s]
      }
    });
  }), $t.defaultSession.setPermissionRequestHandler((o, h, s) => {
    const i = o.getURL();
    i.startsWith("https://trello.com") || i.includes(".trello.com") || h === "clipboard-sanitized-write" ? s(!0) : s(!1);
  }), $t.defaultSession.webRequest.onHeadersReceived((o, h) => {
    h({
      responseHeaders: {
        ...o.responseHeaders,
        "X-Frame-Options": ["ALLOWALL"]
      }
    });
  }), Pe.once("ready-to-show", () => {
    Pe.show(), Pe.focus();
  }), Pe.on("close", function(o) {
    Br || (o.preventDefault(), Pe.webContents.send("app-closing"));
  }), Pe.webContents.setWindowOpenHandler(({ url: o }) => (ag.openExternal(o), { action: "deny" }));
}
function Vy() {
  var a, c;
  const t = Ae.join(Cr, "../server/server.mjs");
  Oe.info("Firing up the server..."), Oe.info("Using server file path: " + t), qe = sg(t, {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    stdio: ["pipe", "pipe", "pipe", "ipc"]
  }), qe.on("message", (o) => {
    o === "server-ready" && (lu ? Pe.loadURL(process.env.VITE_DEV_SERVER_URL) : Pe.loadURL(Hy));
  }), (a = qe.stdout) == null || a.on("data", (o) => {
    Oe.info(`[server.mjs] stdout: ${o}`);
  }), (c = qe.stderr) == null || c.on("data", (o) => {
    Oe.error(`[server.mjs] stderr: ${o}`);
  }), qe.on("error", (o) => {
    Oe.error("Server process error:"), Oe.error(o);
  }), qe.on("exit", (o, h) => {
    Oe.info(`Server process exited with code ${o} and signal ${h}`), Br || Me.quit();
  });
}
async function Xy() {
  const t = await process.getProcessMemoryInfo(), a = process.getSystemMemoryInfo(), c = (i) => {
    const d = i / 1024 / 1024;
    return d < 1024 ? `${d.toFixed(2)} MB` : `${(d / 1024).toFixed(2)} GB`;
  }, o = c(t.private), h = c(a.total * 1024), s = c(a.free * 1024);
  return {
    appUsage: `This app is currently using ${o} of memory`,
    systemMemory: `Your system has ${h} total memory, with ${s} currently available`
  };
}
function Ky() {
  const t = setInterval(async () => {
    const a = await Xy();
    Oe.debug("App Memory Usage:", a.appUsage), Oe.debug("System Memory:", a.systemMemory);
  }, 12e4);
  Me.on("will-quit", () => clearInterval(t));
}
function Jy() {
  rr.setFeedURL({
    provider: "github",
    owner: "ArrushC",
    repo: "Titan"
  }), rr.autoDownload = !1, rr.autoInstallOnAppQuit = !0, rr.autoRunAppAfterInstall = !0, rr.checkForUpdates(), setInterval(() => {
    rr.checkForUpdates();
  }, 1e3 * 60 * 60 * 2), rr.on("update-available", () => {
    Oe.info("Update available"), Pe.webContents.send("update-available");
  }), rr.on("update-downloaded", () => {
    Oe.info("Update downloaded"), Pe.webContents.send("update-downloaded"), lm = !0, rr.quitAndInstall();
  }), rr.on("update-not-available", () => {
    Oe.info("No updates available"), Pe.webContents.send("update-not-available");
  }), rr.on("error", (t) => {
    Oe.error("AutoUpdater error:", t), Pe.webContents.send("update-error", t);
  });
}
Yy ? (Me.on("second-instance", (t, a, c) => {
  Pe && (Pe.isMinimized() && Pe.restore(), Pe.focus()), Yh.showMessageBox(Pe, {
    title: "Titan",
    message: "Titan is already running",
    detail: "Another instance of Titan is already running, please close it before starting a new one.",
    icon: Ae.join(Cr, "../icons/Titan.ico")
  });
}), Me.on("ready", async () => {
  cm(), Vy(), Ky(), Jy();
})) : Me.quit();
Me.on("window-all-closed", function() {
  process.platform !== "darwin" && Me.quit();
});
Me.on("activate", function() {
  Pe === null && cm();
});
Me.on("before-quit", (t) => {
  Br || (t.preventDefault(), cu());
});
function cu() {
  if (Br) return;
  Br = !0, Oe.info("Starting graceful shutdown"), lm || new Vh({
    width: 400,
    height: 400,
    frame: !1,
    transparent: !0,
    alwaysOnTop: !0,
    skipTaskbar: !0,
    resizable: !1
  }).loadFile(Ae.join(Cr, "../shutdown.html")), Pe && !Pe.isDestroyed() && Pe.webContents.send("app-closing");
  const t = new Promise((c) => {
    Ve.once("renderer-shutdown-complete", () => {
      Oe.info("Renderer process reported shutdown complete"), c();
    }), setTimeout(() => {
      Oe.warn("Renderer shutdown timed out"), c();
    }, 5e3);
  }), a = Qy();
  Promise.all([t, a]).then(() => {
    zh();
  }).catch((c) => {
    Oe.error("Error during shutdown:", c), zh();
  });
}
function Qy() {
  return (
    /** @type {Promise<void>} */
    new Promise((t, a) => {
      if (qe && !qe.killed && !qe.exited && qe.connected) {
        Oe.info("Sending shutdown signal to server"), qe.send("shutdown");
        const c = () => {
          Oe.info("Server process reported shutdown complete"), s(), t();
        }, o = (e, n) => {
          Oe.info(`Server process exited with code ${e} and signal ${n}`), s(), t();
        }, h = (e) => {
          Oe.error("Server process error during shutdown:", e), s(), a(e);
        }, s = () => {
          clearTimeout(d), qe.removeListener("message", i), qe.removeListener("exit", o), qe.removeListener("error", h);
        }, i = (e) => {
          e === "shutdown-complete" && c();
        };
        qe.once("message", i), qe.once("exit", o), qe.once("error", h);
        const d = setTimeout(() => {
          qe && !qe.killed && (Oe.warn("Server shutdown timed out, forcing termination"), qe.kill()), s(), t();
        }, 5e3);
      } else
        t();
    })
  );
}
function zh() {
  Oe.info("Terminating application"), Me.quit();
}
function Zy(t) {
  try {
    return ug(`${t} --version`), !0;
  } catch {
    return !1;
  }
}
process.on("uncaughtException", (t) => {
  Oe.error("Uncaught Exception:", t), Br || cu();
});
Me.commandLine.appendSwitch("disable-renderer-backgrounding");
Ve.handle("app-version", () => Me.getVersion());
Ve.handle("open-tortoisesvn-diff", async (t, a) => {
  const { fullPath: c, branchFolder: o, branchVersion: h } = a;
  Oe.info(`Opening TortoiseSVN diff for: ${c} (${o} ${h})`);
  const s = `TortoiseProc.exe /command:diff /ignoreprops /path:"${c}" /revision1:HEAD /revision2:BASE`;
  return new Promise((i, d) => {
    zn(s, (e, n, l) => {
      e ? (console.error(`Error: ${e.message}`), d({ success: !1, error: e.message })) : l ? (console.error(`Stderr: ${l}`), d({ success: !1, error: l })) : (console.log(`Stdout: ${n}`), i({ success: !0 }));
    });
  });
});
Ve.handle("fetch-custom-scripts", async () => {
  const { configFolderPath: t } = zy, a = [];
  try {
    He.readdirSync(t).forEach((o) => {
      const h = Ae.extname(o);
      if ([".bat", ".ps1"].includes(h.toLowerCase())) {
        const s = Ae.join(t, o);
        a.push({
          fileName: Ae.parse(o).name,
          path: s,
          type: h.toLowerCase() === ".bat" ? "batch" : "powershell"
        });
      }
    });
  } catch (c) {
    return Oe.error(`Error reading the config folder: ${c.message}`), { success: !1, error: c.message };
  }
  return { success: !0, scripts: a };
});
Ve.handle("open-svn-resolve", async (t, a) => {
  const { fullPath: c } = a, o = c.replace(/\\/g, "/");
  Oe.info(`Opening TortoiseSVN resolve for: ${o}`);
  const h = `TortoiseProc.exe /command:resolve /path:"${o}"`;
  return new Promise((s, i) => {
    zn(h, (d, e, n) => {
      d ? (Oe.error(`Error: ${d.message}`), Oe.warn("This error might be just caused by the TortoiseSVN window being closed by the user.")) : n ? Oe.error(`Stderr: ${n}`) : Oe.debug(`Stdout: ${e}`), s({ success: !0 });
    });
  });
});
Ve.handle("open-svn-diff", async (t, a) => {
  const { fullPath: c, revision: o } = a, h = `TortoiseProc.exe /command:diff /path:"${c}" /startrev:${Number(o) - 1} /endrev:${o}`;
  return new Promise((s, i) => {
    zn(h, (d, e, n) => {
      d ? (console.error(`Error: ${d.message}`), i({ success: !1, error: d.message })) : n ? (console.error(`Stderr: ${n}`), i({ success: !1, error: n })) : (console.log(`Stdout: ${e}`), s({ success: !0 }));
    });
  });
});
Ve.handle("select-folder", async (t, a) => {
  const c = await Yh.showOpenDialog(Pe, {
    defaultPath: (a == null ? void 0 : a.defaultPath) || fr.homedir(),
    properties: ["openDirectory"]
  });
  return c.canceled ? null : c.filePaths[0];
});
Ve.handle("run-custom-script", async (t, a) => {
  const { scriptType: c, scriptPath: o, branchData: h } = a;
  return Oe.info(`Running custom script: ${o} (${c}) with branch data: ${JSON.stringify(h)}`), new Promise((s, i) => {
    let d = "";
    const { id: e, "Branch Folder": n, "Branch Version": l, "SVN Branch": u } = h, r = `"${e}" "${n}" "${l}" "${u}"`;
    if (c === "batch")
      d = `start cmd /k "${o}" ${r}`;
    else if (c === "powershell") {
      let f = "powershell";
      Zy("pwsh") && (f = "pwsh"), d = `start ${f} -ExecutionPolicy Bypass -Command "& {& '${o}' -id '${e}' -branchFolder '${n}' -branchVersion '${l}' -svnBranch '${u}'}"`;
    }
    zn(d, (f, p, v) => {
      f ? (console.error(`Error: ${f.message}`), i({ success: !1, error: f.message })) : v ? (console.error(`Stderr: ${v}`), i({ success: !1, error: v })) : (console.log(`Stdout: ${p}`), s({ success: !0 }));
    });
  });
});
Ve.handle("download-update", () => rr.downloadUpdate());
Ve.handle("check-for-updates", () => rr.checkForUpdates());
Ve.handle("app-minimize", () => {
  Pe.minimize();
});
Ve.handle("app-maximize", () => {
  Pe.isMaximized() ? Pe.unmaximize() : Pe.maximize();
});
Ve.on("renderer-shutdown-complete", () => {
  Oe.info("Received renderer shutdown acknowledgment");
});
Ve.handle("app-close", () => {
  Br || cu();
});
Ve.handle("app-restart", () => {
  Me.relaunch(), Me.quit();
});
Me.on("will-quit", () => {
  Ve.removeAllListeners(), qe && qe.removeAllListeners(), lu && $t.defaultSession.getAllExtensions().forEach((t) => {
    $t.defaultSession.removeExtension(t.id);
  });
});
