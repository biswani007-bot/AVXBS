import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { sleep, waitFor } from './test-env.mjs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export function getBrowserPath() {
  if (fs.existsSync(CHROME_PATH)) return CHROME_PATH;
  if (fs.existsSync(EDGE_PATH)) return EDGE_PATH;
  throw new Error('Neither Chrome nor Edge was found at standard Windows paths');
}

let portCounter = 9400;

export class CDPBrowser {
  constructor() {
    this.port = portCounter++;
    this.process = null;
    this.tempDir = null;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.consoleErrors = [];
    this.pageExceptions = [];
  }

  async launch(initialUrl = 'about:blank') {
    this.tempDir = path.join(os.tmpdir(), `cdp-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    fs.mkdirSync(this.tempDir, { recursive: true });

    const executable = getBrowserPath();
    this.process = spawn(executable, [
      '--headless=new',
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.tempDir}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--mute-audio',
      '--window-size=1440,900',
      initialUrl
    ], { stdio: 'ignore' });

    // Poll until DevTools is responsive
    await waitFor(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/version`);
        return res.ok;
      } catch {
        return false;
      }
    }, 10000, 200, 'DevTools port readiness');

    // Find page target
    const target = await waitFor(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const list = await res.json();
        const page = list.find((t) => t.type === 'page');
        return page && page.webSocketDebuggerUrl ? page : null;
      } catch {
        return null;
      }
    }, 8000, 200, 'Page target resolution');

    this.ws = new WebSocket(target.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          if (msg.params.type === 'error') {
            const text = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
            this.consoleErrors.push(text);
          }
        } else if (msg.method === 'Runtime.exceptionThrown') {
          const text = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || 'Uncaught page exception';
          this.pageExceptions.push(text);
        }
      } catch (err) {
        // Ignored unparsable CDP frame
      }
    };

    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('DOM.enable');
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      try {
        this.ws.send(JSON.stringify({ id: msgId, method, params }));
      } catch (e) {
        this.callbacks.delete(msgId);
        reject(e);
      }
    });
  }

  async navigate(url, waitAfterMs = 1200) {
    this.consoleErrors = [];
    this.pageExceptions = [];
    await this.send('Page.navigate', { url });
    await sleep(waitAfterMs);
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile,
    });
    await sleep(250);
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${res.exceptionDetails.text || JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async querySelector(selector) {
    return this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          tagName: el.tagName.toLowerCase(),
          id: el.id,
          className: el.className,
          textContent: el.textContent?.trim(),
          innerText: el.innerText?.trim(),
          rect: {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
          }
        };
      })()
    `);
  }

  async querySelectorAll(selector) {
    return this.evaluate(`
      (() => {
        const els = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
        return els.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            tagName: el.tagName.toLowerCase(),
            className: el.className,
            textContent: el.textContent?.trim(),
            rect: {
              top: rect.top,
              left: rect.left,
              right: rect.right,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height
            }
          };
        });
      })()
    `);
  }

  async getBoundingClientRect(selector) {
    return this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          top: r.top,
          left: r.left,
          right: r.right,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
          x: r.x,
          y: r.y
        };
      })()
    `);
  }

  async getComputedStyle(selector, property) {
    return this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return ${JSON.stringify(property)} ? cs.getPropertyValue(${JSON.stringify(property)}) : null;
      })()
    `);
  }

  async click(selector) {
    return this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error("Element not found for click: " + ${JSON.stringify(selector)});
        el.click();
        return true;
      })()
    `);
  }

  async hover(selector) {
    return this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error("Element not found for hover: " + ${JSON.stringify(selector)});
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        return true;
      })()
    `);
  }

  async mouseLeave(selector) {
    return this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return false;
        el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
        return true;
      })()
    `);
  }

  getConsoleErrors() {
    return [...this.consoleErrors, ...this.pageExceptions];
  }

  async close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    if (this.process) {
      try {
        this.process.kill();
      } catch {}
      this.process = null;
    }
    if (this.tempDir) {
      try {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      } catch {}
      this.tempDir = null;
    }
  }
}
