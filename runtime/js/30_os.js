// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { core, primordials } from "ext:core/mod.js";
const {
  op_delete_env,
  op_env,
  op_exec_path,
  op_exit,
  op_get_env,
  op_gid,
  op_hostname,
  op_loadavg,
  op_network_interfaces,
  op_os_release,
  op_os_uptime,
  op_set_env,
  op_system_memory_info,
  op_uid,
} = core.ensureFastOps();
const {
  op_set_exit_code,
} = core.ensureFastOps(true);
const {
  Error,
  FunctionPrototypeBind,
  SymbolFor,
} = primordials;

import { Event, EventTarget } from "ext:deno_web/02_event.js";

const windowDispatchEvent = FunctionPrototypeBind(
  EventTarget.prototype.dispatchEvent,
  globalThis,
);

function loadavg() {
  return op_loadavg();
}

function hostname() {
  return op_hostname();
}

function osRelease() {
  return op_os_release();
}

function osUptime() {
  return op_os_uptime();
}

function systemMemoryInfo() {
  return op_system_memory_info();
}

function networkInterfaces() {
  return op_network_interfaces();
}

function gid() {
  return op_gid();
}

function uid() {
  return op_uid();
}

// This is an internal only method used by the test harness to override the
// behavior of exit when the exit sanitizer is enabled.
let exitHandler = null;
function setExitHandler(fn) {
  exitHandler = fn;
}

function exit(code) {
  // Set exit code first so unload event listeners can override it.
  if (typeof code === "number") {
    op_set_exit_code(code);
  } else {
    code = 0;
  }

  // Dispatches `unload` only when it's not dispatched yet.
  if (!globalThis[SymbolFor("Deno.isUnloadDispatched")]) {
    // Invokes the `unload` hooks before exiting
    // ref: https://github.com/denoland/deno/issues/3603
    windowDispatchEvent(new Event("unload"));
  }

  if (exitHandler) {
    exitHandler(code);
    return;
  }

  op_exit();
  throw new Error("Code not reachable");
}

function setEnv(key, value) {
  op_set_env(key, value);
}

function getEnv(key) {
  return op_get_env(key) ?? undefined;
}

function deleteEnv(key) {
  op_delete_env(key);
}

const env = {
  get: getEnv,
  toObject() {
    return op_env();
  },
  set: setEnv,
  has(key) {
    return getEnv(key) !== undefined;
  },
  delete: deleteEnv,
};

function execPath() {
  return op_exec_path();
}

export {
  env,
  execPath,
  exit,
  gid,
  hostname,
  loadavg,
  networkInterfaces,
  osRelease,
  osUptime,
  setExitHandler,
  systemMemoryInfo,
  uid,
};
