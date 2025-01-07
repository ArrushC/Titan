import { c as createToaster, j as jsxRuntimeExports, P as Portal, T as Toaster$1, a as ToastRoot, S as Spinner, b as ToastIndicator, d as Stack, e as ToastTitle, f as ToastDescription, g as ToastActionTrigger, h as ToastCloseTrigger, i as createContext, u as useContextSelector, r as reactExports, l as lookup, k as reactDomExports, m as TooltipRoot, n as TooltipTrigger, o as TooltipPositioner, p as TooltipContent, q as TooltipArrow, s as TooltipArrowTip, I as IconButton, C as ClientOnly, t as Skeleton, z, F as FaSun, v as FaMoon, J, B as Button$1, A as AbsoluteCenter, w as Span, L as LuX, x as PopoverPositioner, y as PopoverContent$1, D as PopoverArrow$1, E as PopoverArrowTip, G as PopoverCloseTrigger, H as PopoverTitle$1, K as PopoverRoot$1, M as PopoverBody$1, N as PopoverTrigger$1, O as HStack, Q as Flex, R as Heading, U as LuFileCog, V as LiaToiletSolid, W as MdBrowserUpdated, X as IoReload, Y as CheckboxRoot, Z as CheckboxHiddenInput, _ as CheckboxControl, $ as CheckboxIndicator, a0 as CheckboxLabel, a1 as DialogBackdrop$1, a2 as DialogPositioner, a3 as DialogContent$1, a4 as DialogCloseTrigger$1, a5 as DialogRoot$1, a6 as DialogFooter$1, a7 as DialogHeader$1, a8 as DialogBody$1, a9 as DialogTitle$1, aa as DialogActionTrigger$1, ab as TbAsterisk, ac as TbLetterZ, ad as TbLetterY, ae as TbLetterX, af as TbLetterW, ag as TbLetterV, ah as TbLetterU, ai as TbLetterT, aj as TbLetterS, ak as TbLetterR, al as TbLetterQ, am as TbLetterP, an as TbLetterO, ao as TbLetterN, ap as TbLetterM, aq as TbLetterL, ar as TbLetterK, as as TbLetterJ, at as TbLetterI, au as TbLetterH, av as TbLetterG, aw as TbLetterF, ax as TbLetterE, ay as TbLetterD, az as TbLetterC, aA as TbLetterB, aB as TbLetterA, aC as Input, aD as keyframes, aE as chroma, aF as Text, aG as TableRow, aH as TableCell, aI as FaFolderOpen, aJ as MdAutoFixHigh, aK as ActionBarPositioner, aL as ActionBarContent$1, aM as ActionBarCloseTrigger, aN as ActionBarRoot$1, aO as ActionBarSelectionTrigger$1, aP as ActionBarSeparator$1, aQ as Kbd, aR as IoMdClose, aS as Group, aT as InputElement, aU as React, aV as FaChevronDown, aW as FaChevronRight, aX as Box, aY as TableRoot, aZ as TableColumnGroup, a_ as TableColumn, a$ as TableHeader, b0 as TableColumnHeader, b1 as TableBody, b2 as VscDiffSingle, b3 as SiSubversion, b4 as LuSearch, b5 as TableFooter, b6 as IoMdAdd, b7 as MdUpdate, b8 as AccordionItemTrigger$1, b9 as AccordionItemIndicator, ba as AccordionItemContent$1, bb as AccordionItemBody, bc as AccordionRoot$1, bd as AccordionItem$1, be as FieldRoot, bf as FieldLabel, bg as FieldRequiredIndicator, bh as FieldHelperText, bi as FieldErrorText, bj as NumberInputRoot$1, bk as NumberInputControl, bl as NumberInputIncrementTrigger, bm as NumberInputDecrementTrigger, bn as NumberInputInput, bo as chakra, bp as index, bq as FaTrello, br as MdKeyboardReturn, bs as TableScrollArea, bt as Link, bu as LuExternalLink, bv as FaChevronUp, bw as Code, bx as MdError, by as BiMessageDetail, bz as IoWarning, bA as FiHelpCircle, bB as FiEdit, bC as HiOutlineInformationCircle, bD as ProgressTrack, bE as ProgressRange, bF as ProgressLabel$1, bG as ProgressRoot$1, bH as ProgressValueText$1, bI as LuCheck, bJ as LuClipboard, bK as ListRoot, bL as ListItem, bM as ListIndicator, bN as FaCircleCheck, bO as CheckboxGroup, bP as FaCheck, bQ as CollapsibleRoot, bR as CollapsibleContent, bS as Image, bT as VscChromeMinimize, bU as FaRegSquare, bV as ChakraProvider, bW as defaultSystem, bX as clientExports } from "./vendor.js";
import { l as lodashExports } from "./lodash.js";
/* empty css                  */
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const URL_SOCKET_CLIENT = "http://localhost:4000";
function createToastConfig(description, type = "info", duration = 3e3) {
  return {
    variant: "solid",
    description,
    type,
    duration,
    isClosable: true
    // containerStyle: TOAST_CONTAINER_STYLE
  };
}
function _optionalChain(ops) {
  let lastAccessLHS = void 0;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return void 0;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = void 0;
    }
  }
  return value;
}
const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: true,
  overlap: true
});
const Toaster = () => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster$1, { toaster, insetInline: { mdDown: "4" }, children: (toast) => /* @__PURE__ */ jsxRuntimeExports.jsxs(ToastRoot, { width: { md: "sm" }, children: [
    toast.type === "loading" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "sm", color: "blue.solid" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ToastIndicator, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { gap: "1", flex: "1", maxWidth: "100%", children: [
      toast.title && /* @__PURE__ */ jsxRuntimeExports.jsx(ToastTitle, { children: toast.title }),
      toast.description && /* @__PURE__ */ jsxRuntimeExports.jsx(ToastDescription, { children: toast.description })
    ] }),
    toast.action && /* @__PURE__ */ jsxRuntimeExports.jsx(ToastActionTrigger, { children: toast.action.label }),
    _optionalChain([toast, "access", (_) => _.meta, "optionalAccess", (_2) => _2.closable]) && /* @__PURE__ */ jsxRuntimeExports.jsx(ToastCloseTrigger, {})
  ] }) }) });
};
const initialState$2 = {
  appClosing: false,
  setAppClosing: (_) => {
  },
  socket: null,
  config: null,
  updateConfig: (_) => {
  },
  emitSocketEvent: (_) => {
  },
  configurableRowData: [],
  selectedBranchesData: [],
  selectedBranchPaths: /* @__PURE__ */ new Set(),
  selectedBranchProps: {},
  selectedBranches: {},
  setSelectedBranches: (_) => {
  },
  svnLogs: {},
  setSvnLogs: (_) => {
  },
  logsData: [],
  appMode: "app",
  setAppMode: (_) => {
  }
};
const ContextApp = createContext(initialState$2);
const useApp = (selector) => {
  const context = useContextSelector(ContextApp, selector);
  return context;
};
const AppProvider = ({ children }) => {
  const [appClosing, setAppClosing] = reactExports.useState(false);
  const [socket, setSocket] = reactExports.useState(null);
  const [config, setConfig] = reactExports.useState({});
  const [selectedBranches, setSelectedBranches] = reactExports.useState({});
  const [svnLogs, setSvnLogs] = reactExports.useState({});
  const [appMode, setAppMode] = reactExports.useState("app");
  reactExports.useEffect(() => {
    const newSocket = lookup(URL_SOCKET_CLIENT);
    setSocket(newSocket);
    const onConnect = () => {
      console.debug("=== CONECTED TO SERVER ===");
    };
    const onDisconnect = () => {
      toaster.create(createToastConfig("Server Disconnected", "warning", 0));
    };
    const onReconnect = () => {
      toaster.create(createToastConfig("Server Reconnected", "success", 2e3));
    };
    const onNotification = (data) => {
      toaster.create(createToastConfig(data.description, data.type, data.duration));
    };
    newSocket.on("connect", onConnect);
    newSocket.on("disconnect", onDisconnect);
    newSocket.on("reconnect", onReconnect);
    newSocket.on("notification", onNotification);
    const onTitanConfigGet = (response) => {
      if (!response) {
        toaster.create(createToastConfig("Couldn't load data from the server", "error", 0));
        return;
      }
      setConfig(response.config);
    };
    newSocket.once("titan-config-get", onTitanConfigGet);
    return () => {
      newSocket.off("connect", onConnect);
      newSocket.off("disconnect", onDisconnect);
      newSocket.off("reconnect", onReconnect);
      newSocket.off("notification", onNotification);
      newSocket.off("titan-config-get", onTitanConfigGet);
      newSocket.disconnect();
    };
  }, []);
  const updateConfig = reactExports.useCallback(
    (updateFunction) => {
      setConfig((currentConfig) => {
        const newConfig = updateFunction(currentConfig);
        if (lodashExports.isEqual(currentConfig, newConfig)) return currentConfig;
        socket == null ? void 0 : socket.emit("titan-config-set", newConfig);
        return newConfig;
      });
    },
    [socket]
  );
  const emitSocketEvent = reactExports.useCallback(
    (eventName, data) => {
      if (!socket.connected) {
        toaster.create(createToastConfig("Socket not connected", "error", 2e3));
        return;
      }
      socket == null ? void 0 : socket.emit(eventName, data);
    },
    [socket]
  );
  const handleBranchSelection = reactExports.useCallback((branchPath, isSelected) => {
    reactDomExports.flushSync(() => {
      setSelectedBranches((prev) => {
        const newState = { ...prev };
        if (isSelected) newState[branchPath] = true;
        else delete newState[branchPath];
        return newState;
      });
    });
  }, []);
  const handleBulkSelection = reactExports.useCallback((branchPaths, isSelected) => {
    reactDomExports.flushSync(() => {
      setSelectedBranches((prev) => {
        const newState = { ...prev };
        branchPaths.forEach((path) => {
          if (isSelected) newState[path] = true;
          else delete newState[path];
        });
        return newState;
      });
    });
  }, []);
  const configurableRowData = reactExports.useMemo(() => (config == null ? void 0 : config.branches) || [], [config]);
  const selectedBranchesData = reactExports.useMemo(() => configurableRowData.filter((branchRow) => selectedBranches[branchRow["SVN Branch"]]), [configurableRowData, selectedBranches]);
  const selectedBranchPaths = reactExports.useMemo(() => new Set(Object.keys(selectedBranches)), [selectedBranches]);
  const selectedBranchProps = reactExports.useMemo(() => Object.fromEntries(selectedBranchesData.map((branchRow) => [branchRow["SVN Branch"], {
    folder: branchRow["Branch Folder"],
    version: branchRow["Branch Version"]
  }])), [selectedBranchesData]);
  const selectedBranchFolders = reactExports.useMemo(() => {
    return Array.from(selectedBranchesData.reduce((acc, branchRow) => acc.add(branchRow["Branch Folder"]), /* @__PURE__ */ new Set()));
  }, [selectedBranchesData]);
  reactExports.useEffect(() => {
    if ((configurableRowData == null ? void 0 : configurableRowData.length) < 1 || Object.keys(selectedBranches).length < 1) return;
    console.debug("Emitting svn-logs-selected event in DialogBranchesLog component in background");
    socket == null ? void 0 : socket.emit("svn-logs-selected", { selectedBranches: selectedBranchesData });
  }, [selectedBranches, configurableRowData, selectedBranchesData, socket]);
  reactExports.useEffect(() => {
    const socketCallback = (data) => {
      console.debug("Received svn-log-result from socket in DialogBranchesLog component in background");
      setSvnLogs((prevData) => {
        const newData = {};
        Object.entries(prevData).forEach(([branch, logs]) => {
          if (selectedBranches[branch]) {
            newData[branch] = logs;
          }
        });
        newData[data["SVN Branch"]] = data.logs;
        return newData;
      });
    };
    socket == null ? void 0 : socket.on("svn-log-result", socketCallback);
    return () => socket == null ? void 0 : socket.off("svn-log-result", socketCallback);
  }, [socket, selectedBranches]);
  reactExports.useEffect(() => {
    socket == null ? void 0 : socket.emit("watcher-branches-update", { selectedBranchPaths: Array.from(selectedBranchPaths), ignoredUnknownPaths: config == null ? void 0 : config.ignoredUnknownPaths, ignoredModifiedPaths: config == null ? void 0 : config.ignoredModifiedPaths });
  }, [socket, config == null ? void 0 : config.ignoredUnknownPaths, config == null ? void 0 : config.ignoredModifiedPaths, selectedBranchPaths]);
  const logsData = reactExports.useMemo(() => {
    const allLogs = Object.values(svnLogs || {}).flat();
    return allLogs.filter((log) => !!log.revision).sort((a, b) => parseInt(b.revision, 10) - parseInt(a.revision, 10));
  }, [svnLogs]);
  const value = reactExports.useMemo(
    () => ({
      appClosing,
      setAppClosing,
      socket,
      config,
      updateConfig,
      emitSocketEvent,
      configurableRowData,
      selectedBranches,
      selectedBranchesData,
      selectedBranchPaths,
      selectedBranchProps,
      selectedBranchFolders,
      setSelectedBranches,
      svnLogs,
      setSvnLogs,
      logsData,
      appMode,
      setAppMode,
      handleBranchSelection,
      handleBulkSelection
    }),
    [appClosing, socket, config, updateConfig, emitSocketEvent, configurableRowData, selectedBranches, selectedBranchesData, selectedBranchPaths, selectedBranchProps, selectedBranchFolders, svnLogs, logsData, appMode, handleBranchSelection, handleBulkSelection]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ContextApp.Provider, { value, children });
};
function useSocketEmits() {
  const socket = useApp((ctx) => ctx.socket);
  const emitOpenConfig = reactExports.useCallback(() => {
    socket == null ? void 0 : socket.emit("titan-config-open", {});
  }, [socket]);
  const emitUpdateSingle = reactExports.useCallback(
    (branchId, svnBranch, branchVersion, branchFolder, callback) => {
      socket == null ? void 0 : socket.emit("svn-update-single", { id: branchId, branch: svnBranch, version: branchVersion, folder: branchFolder }, callback);
    },
    [socket]
  );
  const emitInfoSingle = reactExports.useCallback(
    (branchId, svnBranch, branchVersion, branchFolder) => {
      socket == null ? void 0 : socket.emit("svn-info-single", { id: branchId, branch: svnBranch, version: branchVersion, folder: branchFolder });
    },
    [socket]
  );
  const emitStatusSingle = reactExports.useCallback(
    (selectedBranch) => {
      socket == null ? void 0 : socket.emit("svn-status-single", { selectedBranch });
    },
    [socket]
  );
  const emitCommitPayload = reactExports.useCallback(
    (commitPayload) => {
      socket == null ? void 0 : socket.emit("svn-commit", commitPayload);
    },
    [socket]
  );
  const emitFlushSvnLogs = reactExports.useCallback(() => {
    socket == null ? void 0 : socket.emit("svn-logs-flush", {});
  }, [socket]);
  const emitFilesRevert = reactExports.useCallback(
    (filesToProcess) => {
      socket == null ? void 0 : socket.emit("svn-files-revert", { filesToProcess });
    },
    [socket]
  );
  const emitFilesAddDelete = reactExports.useCallback(
    (filesToProcess) => {
      socket == null ? void 0 : socket.emit("svn-files-add-delete", { filesToProcess });
    },
    [socket]
  );
  const emitTrelloCardNamesSearch = reactExports.useCallback(
    (key, token, query, limit = null, callback = null) => {
      socket == null ? void 0 : socket.emit("trello-search-names-card", { key, token, query, limit }, callback);
    },
    [socket]
  );
  const emitTrelloCardUpdate = reactExports.useCallback(
    (trelloData, commitResponses, commitMessage) => {
      socket == null ? void 0 : socket.emit("trello-update-card", { trelloData, commitResponses, commitMessage });
    },
    [socket]
  );
  return {
    emitOpenConfig,
    emitUpdateSingle,
    emitInfoSingle,
    emitStatusSingle,
    emitCommitPayload,
    emitFlushSvnLogs,
    emitFilesRevert,
    emitFilesAddDelete,
    emitTrelloCardNamesSearch,
    emitTrelloCardUpdate
  };
}
function useNotifications() {
  const RaiseClientNotificaiton = reactExports.useCallback(
    (description = "", type = "info", duration = 3e3, manualToast = null) => {
      const toastConfig = createToastConfig(description, type, duration);
      if (toaster) return toaster.create(toastConfig);
      else if (manualToast) return manualToast(toastConfig);
    },
    [toaster]
  );
  const RaisePromisedClientNotification = reactExports.useCallback(
    ({ title, totalItems, onProgress, onError = null, successMessage = (count) => `Successfully processed ${count} items`, errorMessage = (id) => `Failed to process item ${id}`, loadingMessage = (current, total) => `${current} of ${total} items processed` }) => {
      let toastId;
      let processedCount = 0;
      const updateToastProgress = (current) => {
        if (toaster && toastId) {
          toaster.update(toastId, {
            description: loadingMessage(current, totalItems)
          });
        }
      };
      const markToastSuccess = () => {
        if (toaster && toastId) {
          toaster.update(toastId, {
            description: successMessage(processedCount),
            type: "success",
            duration: 5e3,
            isClosable: true
          });
        }
      };
      const markToastError = (itemId) => {
        if (toaster && toastId) {
          toaster.update(toastId, {
            description: errorMessage(itemId),
            type: "error",
            duration: 5e3,
            isClosable: true
          });
        }
      };
      return new Promise((resolve, reject) => {
        toastId = toaster == null ? void 0 : toaster.create({
          title,
          description: loadingMessage(0, totalItems),
          type: "loading"
        });
        const processItem = async (index2) => {
          if (index2 >= totalItems) {
            markToastSuccess();
            resolve(processedCount);
            return;
          }
          try {
            await onProgress(index2, {
              onSuccess: () => {
                processedCount++;
                updateToastProgress(processedCount);
              },
              onError: (error) => {
                markToastError(error.itemId || index2);
                throw error;
              }
            });
            processItem(index2 + 1);
          } catch (error) {
            reject(error);
          }
        };
        processItem(0);
      });
    },
    [toaster]
  );
  return {
    toaster,
    RaiseClientNotificaiton,
    RaisePromisedClientNotification
  };
}
const Tooltip = reactExports.forwardRef(function Tooltip2(props, ref) {
  const { showArrow, children, disabled, portalled, content, contentProps, portalRef, ...rest } = props;
  if (disabled) return children;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(TooltipRoot, { openDelay: 250, closeDelay: 250, ...rest, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { disabled: !portalled, container: portalRef, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipPositioner, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TooltipContent, { ref, ...contentProps, children: [
      showArrow && /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipArrow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipArrowTip, {}) }),
      content
    ] }) }) })
  ] });
});
function ButtonElectron(props) {
  const { icon, onClick, colorPalette, label, size, variant = "solid" } = props;
  const handleClick = reactExports.useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: window.electron ? label : "Feature must be used in desktop application", showArrow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { "aria-label": label, size, onClick: handleClick, colorPalette, variant, disabled: !window.electron, children: icon }) });
}
function ButtonIconTooltip(props) {
  const { icon, onClick, colorPalette, label, size, placement, variant = "solid", disabled = false } = props;
  const handleClick = reactExports.useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);
  const iconButton = /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { "aria-label": label || "", size, onClick: handleClick, colorPalette, variant, disabled, children: icon });
  return label && placement ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: label, showArrow: true, positioning: { placement }, children: iconButton }) : iconButton;
}
function ColorModeProvider(props) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(J, { attribute: "class", disableTransitionOnChange: true, ...props });
}
function useColorMode() {
  const { resolvedTheme, setTheme } = z();
  const toggleColorMode = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };
  return {
    colorMode: resolvedTheme,
    setColorMode: setTheme,
    toggleColorMode
  };
}
function useColorModeValue(light, dark) {
  const { colorMode } = useColorMode();
  return colorMode === "light" ? light : dark;
}
function ColorModeIcon() {
  const { colorMode } = useColorMode();
  return colorMode === "light" ? /* @__PURE__ */ jsxRuntimeExports.jsx(FaSun, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(FaMoon, {});
}
const ColorModeButton = reactExports.forwardRef(function ColorModeButton2(props, ref) {
  const { toggleColorMode } = useColorMode();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ClientOnly, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { boxSize: "8" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: "Toggle light/dark mode", showArrow: true, positioning: { placement: "bottom-start" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    IconButton,
    {
      onClick: toggleColorMode,
      colorPalette: "yellow",
      variant: "subtle",
      "aria-label": "Toggle light/dark mode",
      size: "md",
      ref,
      ...props,
      css: {
        _icon: {
          width: "5",
          height: "5"
        }
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ColorModeIcon, {})
    }
  ) }) });
});
const Button = reactExports.forwardRef(function Button2(props, ref) {
  const { loading, disabled, loadingText, children, ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { focusRing: "none", focusVisibleRing: "none", disabled: loading || disabled, ref, ...rest, children: loading && !loadingText ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AbsoluteCenter, { display: "inline-flex", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "inherit", color: "inherit" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Span, { opacity: 0, children })
  ] }) : loading && loadingText ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "inherit", color: "inherit" }),
    loadingText
  ] }) : children });
});
function _nullishCoalesce(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  } else {
    return rhsFn();
  }
}
const CloseButton = reactExports.forwardRef(function CloseButton2(props, ref) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { variant: "ghost", "aria-label": "Close", ref, ...props, children: _nullishCoalesce(props.children, () => /* @__PURE__ */ jsxRuntimeExports.jsx(LuX, {})) });
});
const PopoverContent = reactExports.forwardRef(function PopoverContent2(props, ref) {
  const { portalled = true, portalRef, ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { disabled: !portalled, container: portalRef, children: /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverPositioner, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverContent$1, { ref, ...rest }) }) });
});
const PopoverArrow = reactExports.forwardRef(function PopoverArrow2(props, ref) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverArrow$1, { ...props, ref, children: /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverArrowTip, {}) });
});
reactExports.forwardRef(function PopoverCloseTrigger2(props, ref) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverCloseTrigger, { position: "absolute", top: "1", insetEnd: "1", ...props, asChild: true, ref, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseButton, { size: "sm" }) });
});
const PopoverTitle = PopoverTitle$1;
const PopoverRoot = PopoverRoot$1;
const PopoverBody = PopoverBody$1;
const PopoverTrigger = PopoverTrigger$1;
function Header() {
  const configurableRowData = useApp((ctx) => ctx.configurableRowData);
  const setAppClosing = useApp((ctx) => ctx.setAppClosing);
  const { emitOpenConfig, emitFlushSvnLogs } = useSocketEmits();
  const { RaiseClientNotificaiton } = useNotifications();
  const [reloadPopover, setReloadPopover] = reactExports.useState(false);
  const handleReload = reactExports.useCallback((isAppRestart = false) => {
    if (isAppRestart) {
      window.electron.restartApp();
      setAppClosing(true);
      return;
    }
    window.location.reload();
  }, []);
  const handleCheckForUpdates = reactExports.useCallback(() => {
    window.electron.checkForUpdates().then((result) => {
      console.debug("Check for updates result: ", result);
    });
    window.electron.on("update-not-available", () => {
      RaiseClientNotificaiton("Titan is up to date", "info", 3e3);
      window.electron.removeAllListeners("update-not-available");
    });
  }, [RaiseClientNotificaiton]);
  const handleOpenConfig = reactExports.useCallback(() => {
    emitOpenConfig();
  }, [emitOpenConfig]);
  const handleFlushSvnLogs = reactExports.useCallback(() => {
    emitFlushSvnLogs();
  }, [emitFlushSvnLogs]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { wrap: "wrap", my: 5, gapY: 5, justify: "space-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { align: "flex-start", alignItems: "center", className: "notMono", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Heading, { as: "h2", size: "2xl", lineClamp: 1, lineHeight: "1.4", className: "animation-fadein-forward", userSelect: "none", children: [
      "You have ",
      configurableRowData.length,
      " branch",
      configurableRowData.length > 1 ? "es" : "",
      ":"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { align: "flex-start", alignItems: "center", columnGap: 2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ColorModeButton, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonIconTooltip, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LuFileCog, {}), onClick: handleOpenConfig, colorPalette: "yellow", variant: "subtle", label: "Open Config File", placement: "bottom-start", size: "md" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonIconTooltip, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LiaToiletSolid, {}), onClick: handleFlushSvnLogs, colorPalette: "yellow", variant: "subtle", label: "Flush SVN Logs", placement: "bottom-start", size: "md" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonElectron, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MdBrowserUpdated, {}), onClick: handleCheckForUpdates, colorPalette: "yellow", variant: "subtle", label: "Check For Updates", size: "md" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverRoot, { open: window.electron && reloadPopover, onOpenChange: (e) => setReloadPopover(e.open), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { as: "div", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonIconTooltip, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(IoReload, {}), onClick: () => setReloadPopover((prev) => !prev), colorPalette: "yellow", label: "Reload", variant: "subtle", size: "md" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverArrow, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverBody, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { gap: 8, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { colorPalette: "yellow", variant: "subtle", onClick: (e) => handleReload(false), children: "Refresh" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { colorPalette: "yellow", variant: "subtle", onClick: (e) => handleReload(true), children: "Restart" })
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
const Checkbox = reactExports.forwardRef(function Checkbox2(props, ref) {
  const { icon, children, inputProps, rootRef, ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(CheckboxRoot, { ref: rootRef, ...rest, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxHiddenInput, { ref, ...inputProps }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxControl, { children: icon || /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxIndicator, {}) }),
    children != null && /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxLabel, { children })
  ] });
});
const DialogContent = reactExports.forwardRef(function DialogContent2(props, ref) {
  const { children, portalled = true, portalRef, backdrop = true, ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Portal, { disabled: !portalled, container: portalRef, children: [
    backdrop && /* @__PURE__ */ jsxRuntimeExports.jsx(DialogBackdrop$1, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogPositioner, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent$1, { ref, ...rest, asChild: false, children }) })
  ] });
});
const DialogCloseTrigger = reactExports.forwardRef(function DialogCloseTrigger2(props, ref) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DialogCloseTrigger$1, { position: "absolute", top: "2", insetEnd: "2", ...props, asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseButton, { size: "sm", ref, children: props.children }) });
});
const DialogRoot = DialogRoot$1;
const DialogFooter = DialogFooter$1;
const DialogHeader = DialogHeader$1;
const DialogBody = DialogBody$1;
const DialogBackdrop = DialogBackdrop$1;
const DialogTitle = DialogTitle$1;
const DialogActionTrigger = DialogActionTrigger$1;
function DialogRowDeletion({ selectedCount, isDialogOpen, closeDialog, fireDialogAction }) {
  const deleteButtonRef = reactExports.useRef(null);
  const processDialogAction = reactExports.useCallback(() => {
    fireDialogAction();
    closeDialog();
  }, [fireDialogAction, closeDialog]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogRoot, { role: "alertdialog", open: isDialogOpen, onOpenChange: closeDialog, closeOnEscape: true, initialFocusEl: () => deleteButtonRef.current, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogBackdrop, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { fontSize: "lg", fontWeight: "bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Delete Selected Branches" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogBody, { children: [
        "Are you sure you want to delete ",
        selectedCount,
        " branch",
        selectedCount == "1" ? "" : "es",
        "? This action cannot be undone."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActionTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { children: "Cancel" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogCloseTrigger, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { ref: deleteButtonRef, colorPalette: "red", onClick: processDialogAction, ml: 3, children: "Delete" })
      ] })
    ] })
  ] });
}
function ButtonCustomScripts(props) {
  const { onClick, colorPalette, label, size, disabled = false } = props;
  const handleClick = reactExports.useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);
  const icon = reactExports.useMemo(() => {
    const firstChar = label.charAt(0).toUpperCase();
    switch (firstChar) {
      case "A":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterA, {});
      case "B":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterB, {});
      case "C":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterC, {});
      case "D":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterD, {});
      case "E":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterE, {});
      case "F":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterF, {});
      case "G":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterG, {});
      case "H":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterH, {});
      case "I":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterI, {});
      case "J":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterJ, {});
      case "K":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterK, {});
      case "L":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterL, {});
      case "M":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterM, {});
      case "N":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterN, {});
      case "O":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterO, {});
      case "P":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterP, {});
      case "Q":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterQ, {});
      case "R":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterR, {});
      case "S":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterS, {});
      case "T":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterT, {});
      case "U":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterU, {});
      case "V":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterV, {});
      case "W":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterW, {});
      case "X":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterX, {});
      case "Y":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterY, {});
      case "Z":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbLetterZ, {});
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TbAsterisk, {});
    }
  }, [label]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: window.electron ? label : "Feature must be used in desktop application", showArrow: true, disabled: !window.electron || disabled, children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { "aria-label": label, size, onClick: handleClick, colorPalette, variant: "subtle", disabled: !window.electron || disabled, children: icon }) });
}
function EditableBranchesRow({ branchId, dataColumn, dataValue, handleDataChange, bgLightColorValue, bgDarkColorValue }) {
  const configurableRowData = useApp((ctx) => ctx.configurableRowData);
  const updateConfig = useApp((ctx) => ctx.updateConfig);
  const [cellData, setCellData] = reactExports.useState(dataValue);
  const debouncedUpdate = reactExports.useMemo(
    () => lodashExports.debounce((value) => {
      handleDataChange(branchId, dataColumn, value);
    }, 500),
    [configurableRowData, branchId, dataColumn, updateConfig]
  );
  reactExports.useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);
  const onEditableChange = reactExports.useCallback(
    (e) => {
      setCellData(e.target.value);
      debouncedUpdate(e.target.value);
    },
    [debouncedUpdate]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { variant: "subtle", value: cellData, onChange: onEditableChange, h: 7, _light: { bgColor: bgLightColorValue }, _dark: { bgColor: bgDarkColorValue } });
}
const initialState$1 = {
  branchInfos: {},
  setBranchInfos: (_) => {
  },
  branchTableGridRef: null,
  selectedBranches: {},
  setSelectedBranches: (_) => {
  },
  isDialogSBLogOpen: false,
  setIsDialogSBLogOpen: (_) => {
  },
  showSelectedBranchesLog: false,
  setShowSelectedBranchesLog: (_) => {
  },
  customScripts: [],
  setCustomScripts: (_) => {
  }
};
const ContextBranches = createContext(initialState$1);
const useBranches = (selector) => {
  const context = useContextSelector(ContextBranches, selector);
  return context;
};
const BranchesProvider = ({ children }) => {
  const configurableRowData = useApp((ctx) => ctx.configurableRowData);
  const selectedBranches = useApp((ctx) => ctx.selectedBranches);
  const setSelectedBranches = useApp((ctx) => ctx.setSelectedBranches);
  const [isDialogSBLogOpen, setIsDialogSBLogOpen] = reactExports.useState(false);
  const [customScripts, setCustomScripts] = reactExports.useState([]);
  const selectionMetrics = reactExports.useMemo(() => {
    const selectedCount = Object.keys(selectedBranches).length;
    return {
      selectedBranchesCount: selectedCount,
      indeterminate: selectedCount > 0 && selectedCount < configurableRowData.length,
      hasSelection: selectedCount > 0
    };
  }, [selectedBranches, configurableRowData]);
  reactExports.useEffect(() => {
    if (!window.electron) return;
    window.electron.fetchCustomScripts().then((data) => {
      if (data.success) {
        setCustomScripts(data.scripts);
        return;
      }
      toaster.create(createToastConfig(data.error, "error", 0));
    });
  }, [configurableRowData]);
  reactExports.useEffect(() => {
    const validBranchPaths = new Set(configurableRowData.map((branch) => branch["SVN Branch"]));
    const selectedBranchPaths = Object.keys(selectedBranches).filter((path) => selectedBranches[path]);
    const hasInvalidSelections = selectedBranchPaths.some((path) => !validBranchPaths.has(path));
    if (hasInvalidSelections) {
      const validSelectedBranches = Object.entries(selectedBranches).reduce((acc, [path, isSelected]) => {
        if (isSelected && validBranchPaths.has(path)) {
          acc[path] = true;
        }
        return acc;
      }, {});
      setSelectedBranches(validSelectedBranches);
    }
  }, [configurableRowData, selectedBranches, setSelectedBranches]);
  const value = reactExports.useMemo(
    () => ({
      isDialogSBLogOpen,
      setIsDialogSBLogOpen,
      customScripts,
      setCustomScripts,
      selectionMetrics
    }),
    [isDialogSBLogOpen, customScripts, selectionMetrics]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ContextBranches.Provider, { value, children });
};
const SectionBranchesRow = reactExports.memo(({ branchRow, isSelected }) => {
  const socket = useApp((ctx) => ctx.socket);
  const config = useApp((ctx) => ctx.config);
  const configurableRowData = useApp((ctx) => ctx.configurableRowData);
  const handleBranchSelection = useApp((ctx) => ctx.handleBranchSelection);
  const updateConfig = useApp((ctx) => ctx.updateConfig);
  const customScripts = useBranches((ctx) => ctx.customScripts);
  const { emitInfoSingle } = useSocketEmits();
  const branchId = branchRow == null ? void 0 : branchRow.id;
  const branchFolder = branchRow == null ? void 0 : branchRow["Branch Folder"];
  const branchVersion = branchRow == null ? void 0 : branchRow["Branch Version"];
  const branchPath = branchRow == null ? void 0 : branchRow["SVN Branch"];
  const [branchInfo, setBranchInfo] = reactExports.useState((branchRow == null ? void 0 : branchRow["Branch Info"]) || "Refreshing...");
  const themedBgColor = (config == null ? void 0 : config.branchFolderColours[branchFolder]) || "transparent";
  const paddingValue = "0.25rem";
  const gradientAnimation = keyframes`
			0% { background-position: 0% 50%; }
			50% { background-position: 100% 50%; }
			100% { background-position: 0% 50%; }
		`;
  const gradientStyle = reactExports.useMemo(() => {
    let gradientFrom = "";
    let gradientTo = "";
    let animation = "";
    let revisionCount = 0;
    if (branchInfo.toLowerCase().includes("🤬") || branchInfo == "Not Found" || branchInfo == "Connection Error") {
      gradientFrom = "#800080";
      gradientTo = "#FF00FF";
      animation = `${gradientAnimation} 0.5s linear infinite`;
    } else if (branchInfo.trim().toLowerCase() !== "latest") {
      const regex = /-([0-9]+) Revisions{0,1}/;
      const match = branchInfo.match(regex);
      if (match) {
        revisionCount = parseInt(match[1], 10);
        gradientFrom = "#FFFF00";
        if (revisionCount >= 4) {
          gradientFrom = "#FFA500";
        }
        const maxRevisions = 10;
        const colorScale = chroma.scale([revisionCount >= 4 ? "orange" : "yellow", "red"]).domain([0, maxRevisions]);
        gradientTo = colorScale(Math.min(revisionCount, maxRevisions)).hex();
        const duration = `${Math.max(1, maxRevisions - revisionCount)}s`;
        animation = `${gradientAnimation} ${duration} linear infinite`;
      }
    }
    return {
      backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
      backgroundSize: "200% 200%",
      backgroundPosition: "0% 50%",
      animation,
      color: revisionCount == 0 || revisionCount > 10 ? "white" : "black"
    };
  }, [branchInfo, gradientAnimation]);
  const handleSelectFolder = reactExports.useCallback(
    async (defaultPath) => {
      const path = await window.electron.selectFolder({ defaultPath });
      if (path) updateConfig((currentConfig) => ({ ...currentConfig, branches: configurableRowData.map((row) => ({ ...row, "SVN Branch": row.id === branchId ? path : row["SVN Branch"] })) }));
    },
    [configurableRowData, updateConfig]
  );
  const handleDataChange = reactExports.useCallback(
    (branchId2, dataColumn, newValue) => {
      updateConfig((currentConfig) => ({
        ...currentConfig,
        branches: currentConfig.branches.map((branch) => {
          if (branch.id === branchId2) {
            return { ...branch, [dataColumn]: newValue };
          }
          return branch;
        })
      }));
    },
    [updateConfig]
  );
  const refreshRow = reactExports.useCallback(() => {
    emitInfoSingle(branchId, branchPath, branchVersion, branchFolder);
  }, [emitInfoSingle, branchId, branchPath, branchVersion, branchFolder]);
  const resolveConflicts = reactExports.useCallback(() => {
    window.electron.openSvnResolve({ fullPath: branchPath }).then((result) => {
      refreshRow();
    });
  }, [configurableRowData, refreshRow]);
  const executeCustomScript = reactExports.useCallback((scriptType, scriptPath, branchData) => {
    window.electron.runCustomScript({ scriptType, scriptPath, branchData }).then((result) => {
      console.log("Custom Script Result: ", JSON.stringify(result, null, 4));
    }).catch((err) => {
      console.error("Custom Script error: " + JSON.stringify(err, null, 4));
    });
  }, []);
  reactExports.useEffect(() => {
    if (!branchPath) return;
    refreshRow();
    const interval = setInterval(() => {
      refreshRow();
    }, 6e4 * 2);
    return () => clearInterval(interval);
  }, [branchPath]);
  reactExports.useEffect(() => {
    const socketCallback = (data) => {
      if (data.id != branchId) return;
      setBranchInfo(data.info);
    };
    socket == null ? void 0 : socket.on("branch-info-single", socketCallback);
    return () => socket == null ? void 0 : socket.off("branch-info-single", socketCallback);
  }, [socket]);
  const renderedBranchInfo = reactExports.useMemo(() => {
    if (branchInfo === "Latest" || branchInfo === "Refreshing...") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { as: "span", children: branchInfo });
    }
    const regex = /(-\d+)( Revisions{0,1}.*)/;
    const match = branchInfo.match(regex);
    if (match) {
      const [_, number, text] = match;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { as: "span", fontWeight: "normal", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { as: "span", fontWeight: "bold", fontSize: 18, me: 1, children: number }),
        text
      ] });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { as: "span", children: branchInfo });
  }, [branchInfo]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { display: "flex", alignItems: "center", py: paddingValue, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { top: "5px", "aria-label": "Select row", variant: "subtle", colorPalette: "yellow", checked: isSelected, onCheckedChange: (e) => handleBranchSelection(branchPath, e.checked) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { py: paddingValue, children: /* @__PURE__ */ jsxRuntimeExports.jsx(EditableBranchesRow, { branchId, dataColumn: "Branch Folder", dataValue: branchFolder, handleDataChange, bgLightColorValue: themedBgColor == "transparent" ? "transparent" : `${themedBgColor}30`, bgDarkColorValue: themedBgColor == "transparent" ? "transparent" : `${themedBgColor}80` }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { py: paddingValue, children: /* @__PURE__ */ jsxRuntimeExports.jsx(EditableBranchesRow, { branchId, dataColumn: "Branch Version", dataValue: branchVersion, handleDataChange, bgLightColorValue: themedBgColor == "transparent" ? "transparent" : `${themedBgColor}30`, bgDarkColorValue: themedBgColor == "transparent" ? "transparent" : `${themedBgColor}80` }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { py: paddingValue, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gapX: 3, alignItems: "center", onDoubleClick: () => handleSelectFolder(branchPath), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: window.electron ? "Select folder" : "Feature must be used in desktop application", showArrow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { colorPalette: "yellow", variant: "subtle", size: "xs", onClick: () => handleSelectFolder(), disabled: !window.electron, children: /* @__PURE__ */ jsxRuntimeExports.jsx(FaFolderOpen, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { children: branchPath })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { ...gradientStyle, bgColor: "green.focusRing", textAlign: "center", py: paddingValue, children: renderedBranchInfo }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { py: paddingValue, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { columnGap: 1, children: [
      branchInfo.toLowerCase().includes("🤬") && /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonElectron, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MdAutoFixHigh, {}), onClick: () => resolveConflicts(), colorPalette: "yellow", variant: "subtle", label: "Resolve Conflicts", size: "xs" }),
      customScripts.map((script, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonCustomScripts, { onClick: () => executeCustomScript(script.type, script.path, branchRow), colorPalette: "yellow", label: script.fileName, size: "xs", disabled: branchInfo === "Not Found" }, i))
    ] }) })
  ] });
});
SectionBranchesRow.displayName = "SectionBranchesRow";
const ActionBarContent = reactExports.forwardRef(function ActionBarContent2(props, ref) {
  const { children, portalled = true, portalRef, ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { disabled: !portalled, container: portalRef, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBarPositioner, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBarContent$1, { ref, ...rest, asChild: false, children }) }) });
});
reactExports.forwardRef(function ActionBarCloseTrigger2(props, ref) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBarCloseTrigger, { ...props, asChild: true, ref, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseButton, { size: "sm" }) });
});
const ActionBarRoot = ActionBarRoot$1;
const ActionBarSelectionTrigger = ActionBarSelectionTrigger$1;
const ActionBarSeparator = ActionBarSeparator$1;
const ActionBarSelection = reactExports.memo(({ selectedCount, onDelete, onRefresh, onUpdate, onCommit, onLogs, onClear }) => {
  if (selectedCount === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBarRoot, { open: true, closeOnEscape: false, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ActionBarContent, { colorPalette: "yellow", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(ActionBarSelectionTrigger, { children: [
      selectedCount,
      " Selected"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBarSeparator, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { wrap: "wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button$1, { variant: "subtle", size: "sm", onClick: onDelete, children: [
        "Delete ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Kbd, { variant: "subtle", wordSpacing: 0, children: "Alt+Del" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button$1, { variant: "subtle", size: "sm", onClick: onRefresh, children: [
        "Refresh ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Kbd, { variant: "subtle", wordSpacing: 0, children: "Alt+R" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button$1, { variant: "subtle", size: "sm", onClick: onUpdate, children: [
        "Update ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Kbd, { variant: "subtle", wordSpacing: 0, children: "Alt+U" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button$1, { variant: "subtle", size: "sm", onClick: onCommit, children: [
        "Commit ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Kbd, { variant: "subtle", wordSpacing: 0, children: "Alt+C" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button$1, { variant: "subtle", size: "sm", onClick: onLogs, children: [
        "Logs ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Kbd, { variant: "subtle", wordSpacing: 0, children: "Alt+L" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBarSeparator, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { variant: "ghost", size: "sm", onClick: onClear, disabled: !window.electron, children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoMdClose, {}) })
  ] }) });
});
ActionBarSelection.displayName = "SelectionActionBar";
const InputGroup = reactExports.forwardRef(function InputGroup2(props, ref) {
  const { startElement, startElementProps, endElement, endElementProps, children, startOffset = "6px", endOffset = "6px", ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Group, { ref, ...rest, children: [
    startElement && /* @__PURE__ */ jsxRuntimeExports.jsx(InputElement, { pointerEvents: "none", ...startElementProps, children: startElement }),
    reactExports.cloneElement(children, {
      ...startElement && {
        ps: `calc(var(--input-height) - ${startOffset})`
      },
      ...endElement && { pe: `calc(var(--input-height) - ${endOffset})` },
      ...children.props
    }),
    endElement && /* @__PURE__ */ jsxRuntimeExports.jsx(InputElement, { placement: "end", ...endElementProps, children: endElement })
  ] });
});
const ROW_HEIGHT$1 = 40;
const OVERSCAN$1 = 10;
const getPathActionolour$1 = (action) => {
  switch (action) {
    case "A":
      return "green.500";
    case "M":
      return "cyan.500";
    case "D":
      return "red.500";
    default:
      return "gray";
  }
};
const LogRow$1 = React.memo(function LogRow2({ entry, isExpanded, onToggleExpand }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { height: `${ROW_HEIGHT$1}px`, _light: { bgColor: "yellow.fg", color: "white" }, _dark: { bgColor: "yellow.800" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { "aria-label": "Expand/Collapse", size: "2xs", onClick: () => onToggleExpand(entry.revision), variant: "subtle", children: isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(FaChevronDown, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(FaChevronRight, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { fontWeight: 900, children: entry.revision }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: entry.date }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: entry.author }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TableCell,
        {
          style: {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "500px"
          },
          children: entry.message
        }
      )
    ] }),
    isExpanded && entry.filesChanged && entry.filesChanged.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { bgColor: "gray.subtle", height: `${ROW_HEIGHT$1}px`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 5, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { p: 3, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { alignItems: "center", mb: 1, gap: 3, p: 2, children: [
        "Commit Message: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { color: "yellow.fg", children: entry.message })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { variant: "simple", size: "sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnGroup, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Action" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Path" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, {})
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: entry.filesChanged.map((file, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { height: `${ROW_HEIGHT$1}px`, color: getPathActionolour$1(file.action.toUpperCase()), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: file.action.toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { children: [
            file.path,
            " (",
            file.kind === "dir" ? "Directory" : "File",
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { variant: "subtle", size: "xs", disabled: !window.electron, "aria-label": "Diff", onClick: () => window.electron.openSvnDiff({ fullPath: `${entry.repositoryRoot}${file.path}`, revision: entry.revision, action: file.action.toUpperCase() }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(VscDiffSingle, {}) }) })
        ] }, `${entry.revision}-file-${idx}`)) })
      ] })
    ] }) }) })
  ] });
});
function DialogBranchesLog() {
  const logsData = useApp((ctx) => ctx.logsData);
  const isDialogSBLogOpen = useBranches((ctx) => ctx.isDialogSBLogOpen);
  const setIsDialogSBLogOpen = useBranches((ctx) => ctx.setIsDialogSBLogOpen);
  const [expandedRows, setExpandedRows] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const closeDialog = reactExports.useCallback(() => {
    setIsDialogSBLogOpen(false);
  }, [setIsDialogSBLogOpen]);
  const toggleExpand = reactExports.useCallback((revision) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(revision)) {
        newSet.delete(revision);
      } else {
        newSet.add(revision);
      }
      return newSet;
    });
  }, []);
  const filteredData = reactExports.useMemo(() => {
    if (!searchTerm) return logsData;
    const lowerSearch = searchTerm.toLowerCase();
    return logsData.filter((entry) => {
      const mainFields = [entry.revision, entry.date, entry.author, entry.message, entry.branchFolder, entry.branchVersion];
      const mainMatch = mainFields.some((field) => field == null ? void 0 : field.toString().toLowerCase().includes(lowerSearch));
      const filesMatch = entry.filesChanged && entry.filesChanged.some((file) => [file.action, file.path, file.kind].some((field) => field == null ? void 0 : field.toString().toLowerCase().includes(lowerSearch)));
      return mainMatch || filesMatch;
    });
  }, [logsData, searchTerm]);
  const containerRef = reactExports.useRef(null);
  const [containerHeight, setContainerHeight] = reactExports.useState(0);
  const [scrollTop, setScrollTop] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const onScroll = reactExports.useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);
  const totalRows = filteredData.length;
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT$1) + OVERSCAN$1 * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT$1) - OVERSCAN$1);
  const endIndex = Math.min(totalRows, startIndex + visibleCount);
  const offsetY = startIndex * ROW_HEIGHT$1;
  const visibleRows = filteredData.slice(startIndex, endIndex);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogRoot, { role: "dialog", size: "cover", placement: "center", open: isDialogSBLogOpen, onOpenChange: closeDialog, closeOnEscape: false, initialFocusEl: void 0, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogBackdrop, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { fontSize: "lg", fontWeight: "bold", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { display: "flex", alignItems: "center", gap: 4, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SiSubversion, { size: "32px" }),
        "Selected Branches: SVN Logs (All Time)"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogBody, { display: "flex", flexDirection: "column", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HStack, { gap: "6", mb: 4, width: "full", colorPalette: "yellow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(InputGroup, { flex: "1", startElement: /* @__PURE__ */ jsxRuntimeExports.jsx(LuSearch, {}), startElementProps: { color: "colorPalette.fg" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Quick search...", variant: "flushed", borderColor: "colorPalette.fg", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { size: "sm", variant: "outline", colorPalette: "yellow", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnGroup, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "5%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "15%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "60%" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { height: `${ROW_HEIGHT$1}px`, bgColor: "colorPalette.400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { color: "black", fontWeight: 900 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { color: "black", fontWeight: 900, children: "Revision" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { color: "black", fontWeight: 900, children: "Date" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { color: "black", fontWeight: 900, children: "Author" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { color: "black", fontWeight: 900, ms: 0, children: "Message" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { ref: containerRef, overflowY: "auto", flex: "1", colorPalette: "yellow", onScroll, position: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { position: "relative", height: `xl`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { position: "absolute", width: "100%", top: `${offsetY}px`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { size: "sm", variant: "outline", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnGroup, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "5%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "15%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "60%" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: visibleRows.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsx(LogRow$1, { entry, isExpanded: expandedRows.has(entry.revision), onToggleExpand: toggleExpand }, `${entry.branchFolder}-${entry.branchVersion}-${entry.revision}`)) })
        ] }) }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActionTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { children: "Cancel" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogCloseTrigger, {})
      ] })
    ] })
  ] });
}
function SectionBranches() {
  const updateConfig = useApp((ctx) => ctx.updateConfig);
  const configurableRowData = useApp((ctx) => ctx.configurableRowData);
  const selectedBranchesData = useApp((ctx) => ctx.selectedBranchesData);
  const selectedBranches = useApp((ctx) => ctx.selectedBranches);
  const setSelectedBranches = useApp((ctx) => ctx.setSelectedBranches);
  const setAppMode = useApp((ctx) => ctx.setAppMode);
  const handleBulkSelection = useApp((ctx) => ctx.handleBulkSelection);
  const setIsDialogSBLogOpen = useBranches((ctx) => ctx.setIsDialogSBLogOpen);
  const selectionMetrics = useBranches((ctx) => ctx.selectionMetrics);
  const { RaisePromisedClientNotification } = useNotifications();
  const { emitInfoSingle, emitUpdateSingle } = useSocketEmits();
  const [isRowDialogOpen, setIsRowDialogOpen] = reactExports.useState(false);
  const fireRowDialogAction = reactExports.useCallback(() => {
    updateConfig((currentConfig) => {
      const newBranches = configurableRowData.filter((branch) => !selectedBranches[branch["SVN Branch"]]);
      return { ...currentConfig, branches: newBranches };
    });
  }, [updateConfig, configurableRowData, selectedBranches]);
  const updateAll = reactExports.useCallback(() => {
    RaisePromisedClientNotification({
      title: "Updating Branches",
      totalItems: configurableRowData.length,
      onProgress: async (index2, { onSuccess }) => {
        const branchRow = configurableRowData[index2];
        await new Promise((resolveUpdate) => {
          emitUpdateSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], (response) => {
            if (response.success) {
              onSuccess();
              emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"]);
              if (window.electron)
                window.electron.runCustomScript({
                  scriptType: "powershell",
                  scriptPath: "C:\\Titan\\Titan_PostUpdate_BranchSingle.ps1",
                  branchData: branchRow
                }).then((result) => {
                  console.log("Custom Script Result: ", JSON.stringify(result, null, 4));
                }).catch((err) => {
                  console.error("Custom Script error: " + JSON.stringify(err, null, 4));
                });
            }
            resolveUpdate();
          });
        });
      },
      successMessage: (count) => `${count} branches successfully updated`,
      errorMessage: (id) => `Failed to update branch ${id}`,
      loadingMessage: (current, total) => `Updating ${current} of ${total} branches`
    }).catch(console.error);
  }, [RaisePromisedClientNotification, configurableRowData, emitUpdateSingle, emitInfoSingle]);
  const addRow = reactExports.useCallback(() => {
    updateConfig((currentConfig) => {
      const newBranch = {
        id: `${Date.now()}`,
        "Branch Folder": "",
        "Branch Version": "",
        "SVN Branch": "",
        "Branch Info": "Please add branch path"
      };
      return { ...currentConfig, branches: [...configurableRowData, newBranch] };
    });
  }, [updateConfig, configurableRowData]);
  const refreshSelectedBranches = reactExports.useCallback(() => {
    configurableRowData.filter((branchRow) => selectedBranches[branchRow["SVN Branch"]]).forEach((branchRow) => {
      emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"]);
    });
  }, [configurableRowData, selectedBranches]);
  const updateSelectedBranches = reactExports.useCallback(() => {
    const selectedBranchRows = selectedBranchesData;
    RaisePromisedClientNotification({
      title: "Updating Selected Branches",
      totalItems: selectedBranchRows.length,
      onProgress: async (index2, { onSuccess }) => {
        const branchRow = selectedBranchRows[index2];
        await new Promise((resolveUpdate) => {
          emitUpdateSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], (response) => {
            if (response.success) {
              onSuccess();
              emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"]);
              if (window.electron)
                window.electron.runCustomScript({
                  scriptType: "powershell",
                  scriptPath: "C:\\Titan\\Titan_PostUpdate_BranchSingle.ps1",
                  branchData: branchRow
                }).then((result) => {
                  console.log("Custom Script Result: ", JSON.stringify(result, null, 4));
                }).catch((err) => {
                  console.error("Custom Script error: " + JSON.stringify(err, null, 4));
                });
            }
            resolveUpdate();
          });
        });
      },
      successMessage: (count) => `Successfully updated ${count} branches`,
      errorMessage: (id) => `Failed to update branch ${id}`,
      loadingMessage: (current, total) => `Updating ${current} of ${total} branches`
    }).catch(console.error);
  }, [RaisePromisedClientNotification, selectedBranchesData, emitUpdateSingle, emitInfoSingle]);
  const commitSelectedBranches = reactExports.useCallback(() => {
    setAppMode((current) => current == "commit" ? "branches" : "commit");
  }, [setAppMode]);
  const logsSelectedBranches = reactExports.useCallback(() => {
    setIsDialogSBLogOpen((prev) => !prev);
  }, [setIsDialogSBLogOpen]);
  reactExports.useEffect(() => {
    if (!selectionMetrics.hasSelection) return;
    const handleKeyDown = (event) => {
      if (!event.altKey) return;
      if (event.key === "Delete") {
        setIsRowDialogOpen(true);
      } else if (event.key === "r") {
        refreshSelectedBranches();
      } else if (event.key === "u") {
        updateSelectedBranches();
      } else if (event.key === "c") {
        commitSelectedBranches();
      } else if (event.key === "l") {
        logsSelectedBranches();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectionMetrics.hasSelection, refreshSelectedBranches, updateSelectedBranches]);
  const selectAllBranches = reactExports.useCallback(
    (checked) => {
      const paths = configurableRowData.map((row) => row["SVN Branch"]);
      handleBulkSelection(paths, checked);
    },
    [configurableRowData, setSelectedBranches]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { size: "sm", variant: "outline", transition: "backgrounds", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnGroup, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "1%" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "12%" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "12%" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, {})
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { w: "6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { top: "0", "aria-label": "Select all rows", variant: "subtle", colorPalette: "yellow", checked: selectionMetrics.indeterminate ? "indeterminate" : selectionMetrics.selectedBranchesCount === configurableRowData.length, onCheckedChange: (e) => selectAllBranches(e.checked) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Branch Folder" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Branch Version" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "SVN Branch" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Branch Info" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Custom Scripts" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: configurableRowData.map((branchRow) => /* @__PURE__ */ jsxRuntimeExports.jsx(SectionBranchesRow, { branchRow, isSelected: !!selectedBranches[branchRow["SVN Branch"]] }, branchRow.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { justifyContent: "start", p: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gapX: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonIconTooltip, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(IoMdAdd, {}), colorPalette: "yellow", variant: "subtle", label: "Add Row", placement: "bottom-end", onClick: addRow }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonIconTooltip, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MdUpdate, {}), colorPalette: "yellow", variant: "subtle", label: "Update All", placement: "bottom-end", onClick: updateAll, disabled: configurableRowData.length < 1 })
      ] }) }) }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBarSelection, { selectedCount: selectionMetrics.selectedBranchesCount, onDelete: () => setIsRowDialogOpen(true), onRefresh: refreshSelectedBranches, onUpdate: updateSelectedBranches, onCommit: commitSelectedBranches, onLogs: logsSelectedBranches, onClear: () => setSelectedBranches({}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogRowDeletion, { selectedCount: selectionMetrics.selectedBranchesCount, isDialogOpen: isRowDialogOpen, closeDialog: () => setIsRowDialogOpen(false), fireDialogAction: fireRowDialogAction }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogBranchesLog, {})
  ] });
}
const AccordionItemTrigger = reactExports.forwardRef(function AccordionItemTrigger2(props, ref) {
  const { children, indicatorPlacement = "end", ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AccordionItemTrigger$1, { ...rest, ref, children: [
    indicatorPlacement === "start" && /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionItemIndicator, { rotate: { base: "-90deg", _open: "0deg" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { color: "colorPalette.fg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FaChevronDown, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(HStack, { gap: "4", flex: "1", textAlign: "start", width: "full", children }),
    indicatorPlacement === "end" && /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionItemIndicator, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { color: "colorPalette.fg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FaChevronDown, {}) }) })
  ] });
});
const AccordionItemContent = reactExports.forwardRef(function AccordionItemContent2(props, ref) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionItemContent$1, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionItemBody, { ...props, ref }) });
});
const AccordionRoot = AccordionRoot$1;
const AccordionItem = AccordionItem$1;
const Field = reactExports.forwardRef(function Field2(props, ref) {
  const { label, labelFlex = void 0, children, helperText, errorText, optionalText, ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FieldRoot, { ref, ...rest, children: [
    label && /* @__PURE__ */ jsxRuntimeExports.jsxs(FieldLabel, { flex: labelFlex, children: [
      label,
      /* @__PURE__ */ jsxRuntimeExports.jsx(FieldRequiredIndicator, { fallback: optionalText, ms: 1 })
    ] }),
    children,
    helperText && /* @__PURE__ */ jsxRuntimeExports.jsx(FieldHelperText, { children: helperText }),
    errorText && /* @__PURE__ */ jsxRuntimeExports.jsx(FieldErrorText, { children: errorText })
  ] });
});
const NumberInputRoot = reactExports.forwardRef(function NumberInput(props, ref) {
  const { children, ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(NumberInputRoot$1, { ref, variant: "outline", ...rest, children: [
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsxs(NumberInputControl, { borderColor: "colorPalette.fg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(NumberInputIncrementTrigger, { color: "colorPalette.fg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(NumberInputDecrementTrigger, { color: "colorPalette.fg" })
    ] })
  ] });
});
const NumberInputField = NumberInputInput;
function FieldIssueNumber({ branchFolder }) {
  const issueNumber = useCommit((ctx) => ctx.issueNumber);
  const setIssueNumber = useCommit((ctx) => ctx.setIssueNumber);
  const handleIssueNumberChange = reactExports.useCallback((value) => {
    setIssueNumber((currIssueNumber) => ({
      ...currIssueNumber,
      [branchFolder]: value
    }));
  }, [branchFolder]);
  reactExports.useEffect(() => {
    if (branchFolder) {
      setIssueNumber((currIssueNumber) => ({
        ...currIssueNumber,
        [branchFolder]: ""
      }));
    }
    return () => {
      setIssueNumber((currIssueNumber) => {
        const { [branchFolder]: _, ...rest } = currIssueNumber;
        return rest;
      });
    };
  }, [branchFolder]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { orientation: "horizontal", label: `Issue Number (${branchFolder})`, labelFlex: "0.3", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(NumberInputRoot, { variant: "flushed", min: "0", ms: 4, flex: "0.95", size: "sm", value: issueNumber[branchFolder], onValueChange: (e) => handleIssueNumberChange(e.value), children: /* @__PURE__ */ jsxRuntimeExports.jsx(NumberInputField, { placeholder: `The issue that your ${branchFolder} changes belongs to`, borderColor: "colorPalette.fg" }) }) });
}
const FieldIssueNumber$1 = reactExports.memo(FieldIssueNumber);
function FieldSourceBranch() {
  const sourceBranch = useCommit((ctx) => ctx.sourceBranch);
  const setSourceBranch = useCommit((ctx) => ctx.setSourceBranch);
  const sourceIssueNumber = useCommit((ctx) => ctx.sourceIssueNumber);
  const setSourceIssueNumber = useCommit((ctx) => ctx.setSourceIssueNumber);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { orientation: "horizontal", label: "Source branch", labelFlex: "0.3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "The branch where your changes originated from", ms: 4, flex: "0.95", size: "sm", variant: "flushed", borderColor: "colorPalette.fg", value: sourceBranch, onChange: (e) => setSourceBranch(e.target.value) }) }),
    sourceBranch.trim() !== "" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { orientation: "horizontal", label: `Source Issue Number`, labelFlex: "0.3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NumberInputRoot, { variant: "flushed", min: "0", ms: 4, flex: "0.95", size: "sm", value: sourceIssueNumber, onValueChange: (e) => setSourceIssueNumber(e.value), children: /* @__PURE__ */ jsxRuntimeExports.jsx(NumberInputField, { placeholder: `The issue that your source branch changes belongs to`, borderColor: "colorPalette.fg" }) }) }) : null
  ] });
}
const ChakraAutoResize = chakra(index);
function FieldCommitMessage() {
  const commitMessage = useCommit((ctx) => ctx.commitMessage);
  const setCommitMessage = useCommit((ctx) => ctx.setCommitMessage);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { orientation: "vertical", label: "Commit Message", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    ChakraAutoResize,
    {
      placeholder: "Main body of the commit message",
      variant: "outline",
      size: "sm",
      width: "100%",
      rows: 8,
      borderColor: "colorPalette.fg",
      value: commitMessage,
      onChange: (e) => setCommitMessage(e.target.value),
      resize: "none",
      minH: "initial",
      overflow: "hidden",
      borderWidth: "1px",
      px: 2.5,
      py: 2,
      lineHeight: "1.25rem",
      focusRingColor: "colorPalette.focusRing",
      _hover: { borderColor: "colorPalette.focusRing", outlineColor: "colorPalette.focusRing" },
      className: "chakra-textarea",
      rounded: "sm"
    }
  ) });
}
function useTrelloIntegration() {
  const config = useApp((ctx) => ctx.config);
  const { emitTrelloCardNamesSearch, emitTrelloCardUpdate } = useSocketEmits();
  const configTrelloIntegration = config == null ? void 0 : config.trelloIntegration;
  const key = (configTrelloIntegration == null ? void 0 : configTrelloIntegration.key) || null;
  const token = (configTrelloIntegration == null ? void 0 : configTrelloIntegration.token) || null;
  const isTrelloIntegrationSupported = key && token && key.trim() !== "" && token.trim() !== "" && key.toUpperCase() !== "TRELLO_API_KEY" && token.toUpperCase !== "TRELLO_TOKEN";
  return {
    key,
    token,
    isTrelloIntegrationSupported,
    emitTrelloCardNamesSearch,
    emitTrelloCardUpdate
  };
}
const shineAnimation$2 = keyframes`
	from { background-position: 200% center; }
	to { background-position: -200% center; }
`;
function DialogLookupTrello({ fireDialogAction }) {
  const isLookupTrelloOn = useCommit((ctx) => ctx.isLookupTrelloOn);
  const setIsLookupTrelloOn = useCommit((ctx) => ctx.setIsLookupTrelloOn);
  const { key, token, emitTrelloCardNamesSearch } = useTrelloIntegration();
  const textColor = useColorModeValue("black", "white");
  const [trelloQuery, setTrelloQuery] = reactExports.useState("");
  const [fetchedCards, setFetchedCards] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [searchPerformed, setSearchPerformed] = reactExports.useState(false);
  const [sortConfig, setSortConfig] = reactExports.useState({ column: null, direction: null });
  const processDialogAction = reactExports.useCallback(
    (card) => {
      fireDialogAction({
        ...card,
        key,
        token
      });
      setIsLookupTrelloOn(false);
    },
    [fireDialogAction, key, token, setIsLookupTrelloOn]
  );
  const handleSearch = reactExports.useCallback(() => {
    if (!trelloQuery.trim()) return;
    setSearchPerformed(true);
    setLoading(true);
    emitTrelloCardNamesSearch(key, token, trelloQuery, null, (response) => {
      setFetchedCards(response.cards || []);
      setLoading(false);
      setSortConfig({ column: null, direction: null });
    });
  }, [trelloQuery, key, token, emitTrelloCardNamesSearch]);
  const handleKeyPress = reactExports.useCallback(
    (event) => {
      if (event.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );
  reactExports.useEffect(() => {
    if (trelloQuery.trim().length === 0) {
      setFetchedCards([]);
    }
  }, [trelloQuery]);
  const sortedCards = reactExports.useMemo(() => {
    if (!sortConfig.column || !sortConfig.direction) {
      return fetchedCards;
    }
    let sorted = [...fetchedCards];
    if (sortConfig.column === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortConfig.column === "lastActivityDate") {
      sorted.sort((a, b) => new Date(a.lastActivityDate) - new Date(b.lastActivityDate));
    }
    if (sortConfig.direction === "desc") {
      sorted.reverse();
    }
    return sorted;
  }, [fetchedCards, sortConfig]);
  const toggleSort = (column) => {
    setSortConfig((prev) => {
      if (prev.column !== column) {
        return { column, direction: "asc" };
      } else {
        if (prev.direction === "asc") return { column, direction: "desc" };
        if (prev.direction === "desc") return { column: null, direction: null };
        return { column, direction: "asc" };
      }
    });
  };
  const renderSortIcon = (column) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === "asc" ? /* @__PURE__ */ jsxRuntimeExports.jsx(FaChevronUp, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(FaChevronDown, {});
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogRoot, { role: "dialog", size: "cover", open: isLookupTrelloOn, onOpenChange: () => setIsLookupTrelloOn(false), closeOnEscape: true, initialFocusEl: null, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogBackdrop, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { fontSize: "lg", fontWeight: "bold", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { display: "flex", alignItems: "center", gap: 4, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FaTrello, { size: "32px" }),
        "Lookup Trello Card"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogBody, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { mb: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { gap: "6", width: "full", colorPalette: "yellow", onKeyDown: handleKeyPress, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(InputGroup, { flex: "1", startElement: /* @__PURE__ */ jsxRuntimeExports.jsx(LuSearch, {}), startElementProps: { color: "colorPalette.fg" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Type a card title and press Enter", variant: "flushed", borderColor: "colorPalette.fg", value: trelloQuery, onChange: (e) => setTrelloQuery(e.target.value) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button$1, { onClick: handleSearch, isDisabled: !trelloQuery.trim(), children: [
            "Search",
            /* @__PURE__ */ jsxRuntimeExports.jsx(Kbd, { variant: "subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MdKeyboardReturn, {}) })
          ] })
        ] }) }),
        loading && /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { justifyContent: "center", alignItems: "center", py: 4, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "lg", color: "yellow.fg", borderWidth: "4px" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { ml: 2, children: "Searching..." })
        ] }),
        !loading && !searchPerformed && fetchedCards.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { textAlign: "center", fontSize: "md", color: "gray.500", py: 4, children: 'Enter a card title above and press Enter or click "Search".' }),
        searchPerformed && !loading && sortedCards.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { textAlign: "center", fontSize: "lg", color: "whiteAlpha", py: 4, children: "No results found. Try a different query." }),
        !loading && sortedCards.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { fontSize: "sm", mb: 2, fontWeight: 900, bgGradient: "to-r", gradientFrom: textColor, gradientVia: "yellow.500", gradientTo: textColor, backgroundSize: "200% auto", bgClip: "text", animation: `${shineAnimation$2} 7s ease-in infinite`, children: "Double-click a card to select it." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableScrollArea, { borderWidth: "1px", maxH: "60vh", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { size: "sm", variant: "outline", stickyHeader: true, showColumnBorder: true, interactive: true, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnGroup, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "30%" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { bgColor: "yellow.400", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { onClick: () => toggleSort("name"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(chakra.span, { color: "black", fontWeight: 900, me: 1, children: "Card Title" }),
                renderSortIcon("name")
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { onClick: () => toggleSort("lastActivityDate"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(chakra.span, { color: "black", fontWeight: 900, me: 1, children: "Last Activity" }),
                renderSortIcon("lastActivityDate")
              ] }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: sortedCards.map((card) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { onDoubleClick: () => processDialogAction(card), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { onClick: () => window.open(card.url), display: "flex", alignItems: "center", width: "fit-content", children: [
                card.name,
                /* @__PURE__ */ jsxRuntimeExports.jsx(chakra.span, { color: "yellow.fg", fontSize: "16px", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LuExternalLink, {}) })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: card.lastActivityDate })
            ] }, card.id)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { bgColor: "yellow.400", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { colSpan: 2, fontWeight: 900, children: [
              sortedCards.length,
              " ",
              sortedCards.length === 1 ? "card" : "cards",
              " found from Trello"
            ] }) }) })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActionTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { children: "Cancel" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogCloseTrigger, {})
      ] })
    ] })
  ] });
}
const shineAnimation$1 = keyframes`
	from { background-position: 200% center; }
	to { background-position: -200% center; }
`;
const ROW_HEIGHT = 40;
const OVERSCAN = 10;
const getPathActionolour = (action) => {
  switch (action) {
    case "A":
      return "green.500";
    case "M":
      return "cyan.500";
    case "D":
      return "red.500";
    default:
      return "gray";
  }
};
const LogRow = React.memo(function LogRow22({ entry, isExpanded, onToggleExpand, processDialogAction }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { height: `${ROW_HEIGHT}px`, _light: { bgColor: "yellow.fg", color: "white" }, _dark: { bgColor: "yellow.800" }, onDoubleClick: () => processDialogAction(entry), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { "aria-label": "Expand/Collapse", size: "2xs", onClick: () => onToggleExpand(entry.revision), variant: "subtle", children: isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(FaChevronDown, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(FaChevronRight, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { fontWeight: 900, children: entry.revision }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: entry.date }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: entry.author }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TableCell,
        {
          style: {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "500px"
          },
          children: entry.message
        }
      )
    ] }),
    isExpanded && entry.filesChanged && entry.filesChanged.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { bgColor: "gray.subtle", height: `${ROW_HEIGHT}px`, onDoubleClick: () => processDialogAction(entry), children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 5, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { p: 3, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { alignItems: "center", mb: 1, gap: 3, p: 2, children: [
        "Commit Message: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { color: "yellow.fg", children: entry.message })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { variant: "simple", size: "sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnGroup, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Action" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Path" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, {})
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: entry.filesChanged.map((file, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { height: `${ROW_HEIGHT}px`, color: getPathActionolour(file.action.toUpperCase()), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: file.action.toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { children: [
            file.path,
            " (",
            file.kind === "dir" ? "Directory" : "File",
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { variant: "subtle", size: "xs", disabled: !window.electron, "aria-label": "Diff", onClick: () => window.electron.openSvnDiff({ fullPath: `${entry.repositoryRoot}${file.path}`, revision: entry.revision, action: file.action.toUpperCase() }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(VscDiffSingle, {}) }) })
        ] }, `${entry.revision}-file-${idx}`)) })
      ] })
    ] }) }) })
  ] });
});
function DialogLookupSVNLogs({ fireDialogAction }) {
  const logsData = useApp((ctx) => ctx.logsData);
  const isLookupSLogsOn = useCommit((ctx) => ctx.isLookupSLogsOn);
  const setIsLookupSLogsOn = useCommit((ctx) => ctx.setIsLookupSLogsOn);
  const textColor = useColorModeValue("black", "white");
  const [expandedRows, setExpandedRows] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const closeDialog = reactExports.useCallback(() => {
    setIsLookupSLogsOn(false);
  }, [setIsLookupSLogsOn]);
  const processDialogAction = reactExports.useCallback(
    (entry) => {
      fireDialogAction(entry);
      setIsLookupSLogsOn(false);
    },
    [fireDialogAction, setIsLookupSLogsOn]
  );
  const toggleExpand = reactExports.useCallback((revision) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(revision)) {
        newSet.delete(revision);
      } else {
        newSet.add(revision);
      }
      return newSet;
    });
  }, []);
  const filteredData = reactExports.useMemo(() => {
    if (!searchTerm) return logsData;
    const lowerSearch = searchTerm.toLowerCase();
    return logsData.filter((entry) => {
      const mainFields = [entry.revision, entry.date, entry.author, entry.message, entry.branchFolder, entry.branchVersion];
      const mainMatch = mainFields.some((field) => field == null ? void 0 : field.toString().toLowerCase().includes(lowerSearch));
      const filesMatch = entry.filesChanged && entry.filesChanged.some((file) => [file.action, file.path, file.kind].some((field) => field == null ? void 0 : field.toString().toLowerCase().includes(lowerSearch)));
      return mainMatch || filesMatch;
    });
  }, [logsData, searchTerm]);
  const containerRef = reactExports.useRef(null);
  const [containerHeight, setContainerHeight] = reactExports.useState(0);
  const [scrollTop, setScrollTop] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const onScroll = reactExports.useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);
  const totalRows = filteredData.length;
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(totalRows, startIndex + visibleCount);
  const offsetY = startIndex * ROW_HEIGHT;
  const visibleRows = filteredData.slice(startIndex, endIndex);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogRoot, { role: "dialog", size: "cover", placement: "center", open: isLookupSLogsOn, onOpenChange: closeDialog, closeOnEscape: false, initialFocusEl: void 0, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogBackdrop, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { fontSize: "lg", fontWeight: "bold", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { display: "flex", alignItems: "center", gap: 4, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SiSubversion, { size: "32px" }),
        "Lookup SVN Logs"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogBody, { display: "flex", flexDirection: "column", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HStack, { gap: "6", mb: 4, width: "full", colorPalette: "yellow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(InputGroup, { flex: "1", startElement: /* @__PURE__ */ jsxRuntimeExports.jsx(LuSearch, {}), startElementProps: { color: "colorPalette.fg" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Quick search...", variant: "flushed", borderColor: "colorPalette.fg", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { fontSize: "sm", mb: 2, fontWeight: 900, bgGradient: "to-r", gradientFrom: textColor, gradientVia: "yellow.500", gradientTo: textColor, backgroundSize: "200% auto", bgClip: "text", animation: `${shineAnimation$1} 7s ease-in infinite`, children: "Double-click a SVN revision row to select it." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { size: "sm", variant: "outline", colorPalette: "yellow", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnGroup, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "5%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "15%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "60%" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { height: `${ROW_HEIGHT}px`, bgColor: "colorPalette.400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { color: "black", fontWeight: 900 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { color: "black", fontWeight: 900, children: "Revision" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { color: "black", fontWeight: 900, children: "Date" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { color: "black", fontWeight: 900, children: "Author" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { color: "black", fontWeight: 900, ms: 0, children: "Message" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { ref: containerRef, overflowY: "auto", flex: "1", colorPalette: "yellow", onScroll, position: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { position: "relative", height: `${totalRows * ROW_HEIGHT}px`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { position: "absolute", width: "100%", top: `${offsetY}px`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { size: "sm", variant: "outline", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnGroup, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "5%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "15%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "10%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "60%" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: visibleRows.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsx(LogRow, { entry, isExpanded: expandedRows.has(entry.revision), onToggleExpand: toggleExpand, processDialogAction }, `${entry.branchFolder}-${entry.branchVersion}-${entry.revision}`)) })
        ] }) }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActionTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { children: "Cancel" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogCloseTrigger, {})
      ] })
    ] })
  ] });
}
const shineAnimation = keyframes`
    from { background-position: 200% center; }
    to { background-position: -200% center; }
`;
const FieldLookup = reactExports.memo(() => {
  const setIssueNumber = useCommit((ctx) => ctx.setIssueNumber);
  const setCommitMessage = useCommit((ctx) => ctx.setCommitMessage);
  const setTrelloData = useCommit((ctx) => ctx.setTrelloData);
  const setIsLookupTrelloOn = useCommit((ctx) => ctx.setIsLookupTrelloOn);
  const setIsLookupSLogsOn = useCommit((ctx) => ctx.setIsLookupSLogsOn);
  const { isTrelloIntegrationSupported } = useTrelloIntegration();
  const textColor = useColorModeValue("black", "white");
  const [trelloPopover, setTrelloPopover] = reactExports.useState(false);
  const handleSelectedSvnRevision = reactExports.useCallback((entry) => {
    console.log("Selected SVN Revision", entry);
    const message = entry.message;
    const issueNumMatch = message.match(/\s*(Issue)*\s*(\d+)\s*/);
    const issueNumber = issueNumMatch ? issueNumMatch[2] : null;
    const formattedMessage = message.replace(/\s*(Issue)*\s*(\d+)?\s*(\([^\)]+\))*\s?:?\s*/, "");
    if (issueNumber) setIssueNumber((currIssueNumber) => Object.fromEntries(Object.keys(currIssueNumber).map((key) => [key, currIssueNumber[key] || issueNumber])));
    if (formattedMessage.trim() !== "") setCommitMessage((prevMessage) => prevMessage || formattedMessage);
  }, []);
  const handleSelectedTrelloCard = reactExports.useCallback((card) => {
    console.log("Selected Trello Card", card);
    const cardName = card.name;
    const issueNumMatch = cardName.match(/\s*(Issue)*\s*\#*(\d+)\s*/);
    const issueNumber = issueNumMatch ? issueNumMatch[2] : null;
    const formattedMessage = cardName.replace(/\s*(Issue)*\s*\#*(\d+)/, "");
    if (issueNumber) setIssueNumber((currIssueNumber) => Object.fromEntries(Object.keys(currIssueNumber).map((key) => [key, currIssueNumber[key] || issueNumber])));
    if (formattedMessage.trim() !== "") setCommitMessage((prevMessage) => prevMessage || formattedMessage);
    setTrelloData(card);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { colorPalette: "yellow", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { fontWeight: 900, bgGradient: "to-r", gradientFrom: textColor, gradientVia: "colorPalette.500", gradientTo: textColor, backgroundSize: "200% auto", bgClip: "text", animation: `${shineAnimation} 7s ease-in infinite`, children: "You can lookup and automatically fill in the following commit details using the options below:" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { my: 4 }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gapX: 2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "subtle", onClick: () => setIsLookupSLogsOn(true), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SiSubversion, {}),
        "Use SVN Logs"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverRoot, { open: !isTrelloIntegrationSupported && trelloPopover, onOpenChange: (e) => setTrelloPopover(e.open), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "subtle", onClick: () => setIsLookupTrelloOn(isTrelloIntegrationSupported), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FaTrello, {}),
          "Use Trello"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverArrow, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverBody, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverTitle, { fontWeight: 900, color: "yellow.500", display: "flex", alignItems: "center", gapX: 2, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FaTrello, {}),
              " Trello Integration Not Set Up"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { my: 4, children: "It seems you haven't set up the Trello integration yet. To use this feature, link your Trello account by following the guide below." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { colorPalette: "yellow", variant: "outline", onClick: (e) => window.open("https://help.merge.dev/en/articles/8757597-trello-how-do-i-link-my-account"), children: "Setup Guide" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogLookupSVNLogs, { fireDialogAction: handleSelectedSvnRevision }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogLookupTrello, { fireDialogAction: handleSelectedTrelloCard })
  ] });
});
function SubSectionCommitDetails() {
  var _a, _b, _c, _d;
  const selectedBranchFolders = useApp((ctx) => ctx.selectedBranchFolders);
  const sourceBranch = useCommit((ctx) => ctx.sourceBranch);
  const sourceIssueNumber = useCommit((ctx) => ctx.sourceIssueNumber);
  const commitMessage = useCommit((ctx) => ctx.commitMessage);
  const trelloData = useCommit((ctx) => ctx.trelloData);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { ms: 9, flexDirection: "column", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { gap: "6", maxW: "8xl", css: { "--field-label-width": "96px" }, flex: 1, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLookup, {}),
      selectedBranchFolders.map((branchFolder, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(FieldIssueNumber$1, { branchFolder }, branchFolder)),
      /* @__PURE__ */ jsxRuntimeExports.jsx(FieldSourceBranch, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(FieldCommitMessage, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { flexDirection: "column", mt: 6, gap: 2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gap: 3, children: [
        "Your final commit message:",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Code, { children: [
          "Issue XYZ",
          sourceBranch.trim() !== "" ? ` (${sourceBranch.trim()}${sourceIssueNumber !== "" ? " #" + String(sourceIssueNumber) : ""})` : "",
          ":",
          " ",
          commitMessage.trim() == "" ? "Enter commit message above" : commitMessage.trim().replace(/\s*\n+\s*/g, "; ").replace(/[;\s]+$/, "").trim()
        ] })
      ] }),
      (trelloData == null ? void 0 : trelloData.name) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gap: 3, children: [
        "Your selected Trello card:",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { onClick: () => window.open(trelloData.url), display: "flex", alignItems: "center", width: "fit-content", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(chakra.span, { color: "yellow.fg", fontSize: "16px", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FaTrello, {}) }),
          trelloData.name
        ] })
      ] }) : null,
      (trelloData == null ? void 0 : trelloData.id) && (!((_a = trelloData.checklistIds) == null ? void 0 : _a.length) || !((_b = trelloData.checklists) == null ? void 0 : _b.length) || !((_c = trelloData.checklists) == null ? void 0 : _c.every((cl) => cl == null ? void 0 : cl.id)) || !((_d = trelloData.checklistIds) == null ? void 0 : _d.every((id) => id))) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { color: "red.focusRing", alignItems: "center", gap: 3, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(chakra.span, { color: "yellow.fg", fontSize: "16px", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MdError, {}) }),
        " ",
        "Your trello card is missing checklists, please try again."
      ] }) : null
    ] })
  ] });
}
function ButtonDiff({ fullPath, branchFolder, branchVersion, onDiffResult }) {
  const handleDiff = reactExports.useCallback(async () => {
    try {
      const result = await window.electron.openTortoiseSVNDiff({
        fullPath,
        branchFolder,
        branchVersion
      });
      onDiffResult(result);
    } catch (error) {
      onDiffResult({ success: false, error: error.message });
    }
  }, [fullPath, branchFolder, branchVersion, onDiffResult]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { "aria-label": "Diff", size: "xs", onClick: handleDiff, colorPalette: "yellow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VscDiffSingle, {}) });
}
function DialogModifiedChangesRevert({ selectedCount, isDialogOpen, closeDialog, fireDialogAction }) {
  const deleteButtonRef = reactExports.useRef(null);
  const processDialogAction = reactExports.useCallback(() => {
    fireDialogAction();
    closeDialog();
  }, [fireDialogAction, closeDialog]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogRoot, { role: "alertdialog", open: isDialogOpen, onOpenChange: closeDialog, closeOnEscape: true, initialFocusEl: () => deleteButtonRef.current, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogBackdrop, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { fontSize: "lg", fontWeight: "bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Revert Selected Paths" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogBody, { children: [
        "Are you sure you want to revert ",
        selectedCount,
        " path",
        selectedCount == "1" ? "" : "s",
        "? This action cannot be undone."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActionTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { children: "Cancel" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogCloseTrigger, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { ref: deleteButtonRef, colorPalette: "red", onClick: processDialogAction, ml: 3, children: "Revert" })
      ] })
    ] })
  ] });
}
function sortByStack$2(rows, sortStack) {
  return [...rows].sort((a, b) => {
    var _a, _b;
    for (const sortItem of sortStack) {
      let aVal, bVal;
      switch (sortItem.column) {
        case "branch":
          aVal = a.branchString.toLowerCase();
          bVal = b.branchString.toLowerCase();
          break;
        case "path":
          aVal = a.file.pathDisplay.toLowerCase();
          bVal = b.file.pathDisplay.toLowerCase();
          break;
        case "remote":
          aVal = (_a = a.file.reposStatus) == null ? void 0 : _a.toLowerCase();
          bVal = (_b = b.file.reposStatus) == null ? void 0 : _b.toLowerCase();
          break;
        case "status":
          aVal = a.file.wcStatus.toLowerCase();
          bVal = b.file.wcStatus.toLowerCase();
          break;
        default:
          aVal = 0;
          bVal = 0;
      }
      if (aVal < bVal) return sortItem.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortItem.direction === "asc" ? 1 : -1;
    }
    return 0;
  });
}
function getSortIndicator$2(columnKey, sortStack) {
  const itemIndex = sortStack.findIndex((s) => s.column === columnKey);
  if (itemIndex === -1) return null;
  return sortStack[itemIndex].direction === "asc" ? "↑" : "↓";
}
function SubSectionConflictingChanges() {
  const { emitFilesRevert } = useSocketEmits();
  const { RaiseClientNotificaiton } = useNotifications();
  const conflictingChanges = useCommit((ctx) => ctx.conflictingChanges);
  const selectedConflictingChanges = useCommit((ctx) => ctx.selectedConflictingChanges);
  const setSelectedConflictingChanges = useCommit((ctx) => ctx.setSelectedConflictingChanges);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [isRevertDialogOpen, setIsRevertDialogOpen] = reactExports.useState(false);
  const [sortStack, setSortStack] = reactExports.useState([
    { column: "status", direction: "asc" },
    { column: "remote", direction: "desc" }
  ]);
  const getStatusColor = reactExports.useCallback((status) => {
    switch (status) {
      case "modified":
        return "cyan.500";
      case "deleted":
      case "missing":
        return "red.500";
      case "added":
      case "unversioned":
        return "green.500";
      default:
        return "purple.600";
    }
  }, []);
  const handleSort = reactExports.useCallback((columnKey) => {
    setSortStack((prev) => {
      const existingIndex = prev.findIndex((s) => s.column === columnKey);
      if (existingIndex === -1) {
        return [{ column: columnKey, direction: "asc" }, ...prev];
      }
      const updatedSort = { ...prev[existingIndex] };
      updatedSort.direction = updatedSort.direction === "asc" ? "desc" : "asc";
      const newStack = [...prev];
      newStack.splice(existingIndex, 1);
      newStack.unshift(updatedSort);
      return newStack;
    });
  }, []);
  const handlePathSelection = reactExports.useCallback(
    (file, checked) => {
      setSelectedConflictingChanges((currentSelection) => {
        if (checked) return { ...currentSelection, [file.path]: file };
        const { [file.path]: _, ...newSelection } = currentSelection;
        return newSelection;
      });
    },
    [setSelectedConflictingChanges]
  );
  const handleDiffResult = reactExports.useCallback(
    (result) => {
      if (result.success) RaiseClientNotificaiton("TortoiseSVN diff opened successfully", "success", 3e3);
      else RaiseClientNotificaiton(`Error opening TortoiseSVN diff: ${JSON.stringify(result.error, null, 4)}`, "error", 0);
    },
    [RaiseClientNotificaiton]
  );
  const filteredUnknownChanges = reactExports.useMemo(() => {
    if (!searchTerm) return conflictingChanges;
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = {};
    Object.keys(conflictingChanges).forEach((branchPath) => {
      const branchData = conflictingChanges[branchPath];
      const { branchString, filesToUpdate, "Branch Folder": branchFolder, "Branch Version": branchVersion } = branchData;
      const filteredFiles = filesToUpdate.filter((file) => {
        const fieldsToCheck = [branchString, branchFolder, branchVersion, branchPath, file.pathDisplay, file.wcStatus, file.reposStatus];
        return fieldsToCheck.some((field, i) => field == null ? void 0 : field.toString().toLowerCase().includes(i === 4 ? lowerSearch.replace(/\//g, "\\") : lowerSearch));
      });
      if (filteredFiles.length > 0) {
        filtered[branchPath] = {
          ...branchData,
          filesToUpdate: filteredFiles
        };
      }
    });
    return filtered;
  }, [conflictingChanges, searchTerm]);
  const allFilteredRows = reactExports.useMemo(() => {
    const rows = [];
    Object.keys(filteredUnknownChanges).forEach((branchPath) => {
      const { branchString, branchFolder, branchVersion, filesToUpdate } = filteredUnknownChanges[branchPath];
      filesToUpdate.forEach((file) => {
        rows.push({
          branchPath,
          branchString,
          branchFolder,
          branchVersion,
          file
        });
      });
    });
    return rows;
  }, [filteredUnknownChanges]);
  const sortedRows = reactExports.useMemo(() => {
    return sortByStack$2(allFilteredRows, sortStack);
  }, [allFilteredRows, sortStack]);
  const allFilteredPaths = reactExports.useMemo(() => {
    return sortedRows.map((row) => row.file.path);
  }, [sortedRows]);
  const { allSelected, someSelected } = reactExports.useMemo(() => {
    if (allFilteredPaths.length === 0) {
      return { allSelected: false, someSelected: false };
    }
    const selectedCount = allFilteredPaths.filter((p) => selectedConflictingChanges[p]).length;
    return {
      allSelected: selectedCount === allFilteredPaths.length,
      someSelected: selectedCount > 0 && selectedCount < allFilteredPaths.length
    };
  }, [allFilteredPaths, selectedConflictingChanges]);
  const handleHeaderCheckboxChange = reactExports.useCallback(
    (checked) => {
      if (checked) {
        setSelectedConflictingChanges((currentSelection) => {
          const newSelection = { ...currentSelection };
          for (const path of allFilteredPaths) {
            newSelection[path] = allFilteredRows.find((p) => p.file.path === path).file;
          }
          return newSelection;
        });
      } else {
        setSelectedConflictingChanges((currentSelection) => {
          const newSelection = { ...currentSelection };
          for (const path of allFilteredPaths) {
            delete newSelection[path];
          }
          return newSelection;
        });
      }
    },
    [allFilteredPaths, allFilteredRows, setSelectedConflictingChanges]
  );
  const handleRevertFileViewFiles = reactExports.useCallback(() => {
    console.debug("Reverting selected files: ", selectedConflictingChanges);
    emitFilesRevert(selectedConflictingChanges);
    setSelectedConflictingChanges({});
  }, [selectedConflictingChanges, setSelectedConflictingChanges]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { ms: 9, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(HStack, { gap: "6", mb: 4, width: "full", colorPalette: "yellow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(InputGroup, { flex: "1", startElement: /* @__PURE__ */ jsxRuntimeExports.jsx(LuSearch, {}), startElementProps: { color: "colorPalette.fg" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Quick search...", variant: "flushed", borderColor: "colorPalette.fg", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableScrollArea, { borderWidth: "1px", maxH: "xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { size: "sm", variant: "outline", colorPalette: "yellow", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { bgColor: "colorPalette.400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { "aria-label": "Select Filtered", variant: "subtle", colorPalette: "yellow", checked: someSelected && !allSelected ? "indeterminate" : allSelected, onCheckedChange: (e) => handleHeaderCheckboxChange(e.checked) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("branch"), children: [
          "Branch ",
          getSortIndicator$2("branch", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("path"), children: [
          "Path ",
          getSortIndicator$2("path", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("status"), children: [
          "Status ",
          getSortIndicator$2("status", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("remote"), children: [
          "Remote ",
          getSortIndicator$2("remote", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, {})
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: Object.keys(sortedRows).length == 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 6, textAlign: "center", children: "No results found" }) }) : sortedRows.map((row) => {
        const { branchPath, branchString, branchFolder, branchVersion, file } = row;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { "aria-label": "Select path", variant: "subtle", colorPalette: "yellow", checked: !!selectedConflictingChanges[file.path], onCheckedChange: (e) => handlePathSelection(file, e.checked) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.wcStatus), children: branchString }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.wcStatus), children: `${branchPath.split("\\").at(-1)}\\${file.pathDisplay}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.wcStatus), children: file.wcStatus }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.reposStatus), children: file.reposStatus }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonDiff, { fullPath: file.path, branchFolder, branchVersion, onDiffResult: handleDiffResult }) })
        ] }, file.path);
      }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gap: "6", mt: 4, justifyContent: "space-between", alignItems: "center", colorPalette: "yellow", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gap: 2, alignItems: "center", children: [
        "Selected paths:",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { bgColor: "yellow.subtle", color: "yellow.fg", rounded: "md", px: 3, py: "auto", children: Object.keys(selectedConflictingChanges).length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { color: "yellow.fg", children: "Revert them or update the branch and resolve potential conflicts" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(HStack, { gap: 3, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setIsRevertDialogOpen(true), colorPalette: "red", disabled: Object.keys(selectedConflictingChanges).length < 1, children: "Revert" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogModifiedChangesRevert, { selectedCount: Object.keys(selectedConflictingChanges).length, isDialogOpen: isRevertDialogOpen, closeDialog: () => setIsRevertDialogOpen(false), fireDialogAction: handleRevertFileViewFiles })
  ] });
}
function ButtonProcessCommit() {
  const selectedBranchProps = useApp((ctx) => ctx.selectedBranchProps);
  const isCommitMode = useCommit((ctx) => ctx.isCommitMode);
  const issueNumber = useCommit((ctx) => ctx.issueNumber);
  const sourceBranch = useCommit((ctx) => ctx.sourceBranch);
  const sourceIssueNumber = useCommit((ctx) => ctx.sourceIssueNumber);
  const commitMessage = useCommit((ctx) => ctx.commitMessage);
  const trelloData = useCommit((ctx) => ctx.trelloData);
  const selectedModifiedChanges = useCommit((ctx) => ctx.selectedModifiedChanges);
  const isProcessCommit = useCommit((ctx) => ctx.isProcessCommit);
  const setIsProcessCommit = useCommit((ctx) => ctx.setIsProcessCommit);
  const setCommitPayload = useCommit((ctx) => ctx.setCommitPayload);
  const { emitCommitPayload } = useSocketEmits();
  const { RaiseClientNotificaiton } = useNotifications();
  const handleProcessCommit = reactExports.useCallback(() => {
    console.debug("Processing commit for selected files: ", selectedModifiedChanges);
    const hasFilledIssueNumbers = Object.values(issueNumber).every((issue) => issue && issue !== "");
    const hasFilledCommitMessage = commitMessage && commitMessage.trim() !== "";
    if (!hasFilledIssueNumbers || !hasFilledCommitMessage) {
      const messageString = !hasFilledIssueNumbers && !hasFilledCommitMessage ? "issue number and commit message" : !hasFilledIssueNumbers ? "issue number" : "commit message";
      RaiseClientNotificaiton(`Please provide the ${messageString} to proceed!`, "error");
      return;
    }
    setIsProcessCommit(true);
    const commitPayload = {
      issueNumber,
      sourceBranch,
      sourceIssueNumber,
      commitMessage,
      selectedModifiedChanges,
      selectedBranchProps
    };
    setCommitPayload({
      ...commitPayload,
      trelloData
    });
    emitCommitPayload(commitPayload);
  }, [selectedModifiedChanges, issueNumber, sourceBranch, sourceIssueNumber, commitMessage, selectedBranchProps, RaiseClientNotificaiton]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleProcessCommit(), colorPalette: "yellow", disabled: Object.keys(selectedModifiedChanges).length < 1 || isCommitMode && isProcessCommit, children: "Commit" });
}
function sortByStack$1(rows, sortStack) {
  return [...rows].sort((a, b) => {
    for (const sortItem of sortStack) {
      let aVal, bVal;
      switch (sortItem.column) {
        case "branch":
          aVal = a.branchString.toLowerCase();
          bVal = b.branchString.toLowerCase();
          break;
        case "path":
          aVal = a.file.pathDisplay.toLowerCase();
          bVal = b.file.pathDisplay.toLowerCase();
          break;
        case "lastModified":
          aVal = new Date(a.file.lastModified).getTime();
          bVal = new Date(b.file.lastModified).getTime();
          break;
        case "status":
          aVal = a.file.wcStatus.toLowerCase();
          bVal = b.file.wcStatus.toLowerCase();
          break;
        default:
          aVal = 0;
          bVal = 0;
      }
      if (aVal < bVal) return sortItem.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortItem.direction === "asc" ? 1 : -1;
    }
    return 0;
  });
}
function getSortIndicator$1(columnKey, sortStack) {
  const itemIndex = sortStack.findIndex((s) => s.column === columnKey);
  if (itemIndex === -1) return null;
  return sortStack[itemIndex].direction === "asc" ? "↑" : "↓";
}
function SubSectionModifiedChanges() {
  const { emitFilesRevert } = useSocketEmits();
  const { RaiseClientNotificaiton } = useNotifications();
  const modifiedChanges = useCommit((ctx) => ctx.modifiedChanges);
  const selectedModifiedChanges = useCommit((ctx) => ctx.selectedModifiedChanges);
  const setSelectedModifiedChanges = useCommit((ctx) => ctx.setSelectedModifiedChanges);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [isRevertDialogOpen, setIsRevertDialogOpen] = reactExports.useState(false);
  const [sortStack, setSortStack] = reactExports.useState([
    { column: "status", direction: "asc" },
    { column: "lastModified", direction: "desc" }
  ]);
  const getStatusColor = reactExports.useCallback((status) => {
    switch (status) {
      case "modified":
        return "cyan.500";
      case "deleted":
      case "missing":
        return "red.500";
      case "added":
      case "unversioned":
        return "green.500";
      default:
        return "purple.600";
    }
  }, []);
  const handleSort = reactExports.useCallback((columnKey) => {
    setSortStack((prev) => {
      const existingIndex = prev.findIndex((s) => s.column === columnKey);
      if (existingIndex === -1) {
        return [{ column: columnKey, direction: "asc" }, ...prev];
      }
      const updatedSort = { ...prev[existingIndex] };
      updatedSort.direction = updatedSort.direction === "asc" ? "desc" : "asc";
      const newStack = [...prev];
      newStack.splice(existingIndex, 1);
      newStack.unshift(updatedSort);
      return newStack;
    });
  }, []);
  const handlePathSelection = reactExports.useCallback(
    (file, checked) => {
      setSelectedModifiedChanges((currentSelection) => {
        if (checked) return { ...currentSelection, [file.path]: file };
        const { [file.path]: _, ...newSelection } = currentSelection;
        return newSelection;
      });
    },
    [setSelectedModifiedChanges]
  );
  const handleDiffResult = reactExports.useCallback(
    (result) => {
      if (result.success) RaiseClientNotificaiton("TortoiseSVN diff opened successfully", "success", 3e3);
      else RaiseClientNotificaiton(`Error opening TortoiseSVN diff: ${JSON.stringify(result.error, null, 4)}`, "error", 0);
    },
    [RaiseClientNotificaiton]
  );
  const filteredModifiedChanges = reactExports.useMemo(() => {
    if (!searchTerm) return modifiedChanges;
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = {};
    Object.keys(modifiedChanges).forEach((branchPath) => {
      const branchData = modifiedChanges[branchPath];
      const { branchString, filesToCommit, "Branch Folder": branchFolder, "Branch Version": branchVersion } = branchData;
      const filteredFiles = filesToCommit.filter((file) => {
        const fieldsToCheck = [branchString, branchFolder, branchVersion, branchPath, file.pathDisplay, file.wcStatus, file.lastModified];
        return fieldsToCheck.some(
          (field, i) => field == null ? void 0 : field.toString().toLowerCase().includes(i === 4 ? lowerSearch.replace(/\//g, "\\") : lowerSearch)
        );
      });
      if (filteredFiles.length > 0) {
        filtered[branchPath] = {
          ...branchData,
          filesToCommit: filteredFiles
        };
      }
    });
    return filtered;
  }, [modifiedChanges, searchTerm]);
  const allFilteredRows = reactExports.useMemo(() => {
    const rows = [];
    Object.keys(filteredModifiedChanges).forEach((branchPath) => {
      const { branchString, branchFolder, branchVersion, filesToCommit } = filteredModifiedChanges[branchPath];
      filesToCommit.forEach((file) => {
        rows.push({
          branchPath,
          branchString,
          branchFolder,
          branchVersion,
          file
        });
      });
    });
    return rows;
  }, [filteredModifiedChanges]);
  const sortedRows = reactExports.useMemo(() => {
    return sortByStack$1(allFilteredRows, sortStack);
  }, [allFilteredRows, sortStack]);
  const allFilteredPaths = reactExports.useMemo(() => {
    return sortedRows.map((row) => row.file.path);
  }, [sortedRows]);
  const { allSelected, someSelected } = reactExports.useMemo(() => {
    if (allFilteredPaths.length === 0) {
      return { allSelected: false, someSelected: false };
    }
    const selectedCount = allFilteredPaths.filter((p) => selectedModifiedChanges[p]).length;
    return {
      allSelected: selectedCount === allFilteredPaths.length,
      someSelected: selectedCount > 0 && selectedCount < allFilteredPaths.length
    };
  }, [allFilteredPaths, selectedModifiedChanges]);
  const handleHeaderCheckboxChange = reactExports.useCallback(
    (checked) => {
      if (checked) {
        setSelectedModifiedChanges((currentSelection) => {
          const newSelection = { ...currentSelection };
          for (const path of allFilteredPaths) {
            newSelection[path] = allFilteredRows.find((p) => p.file.path === path).file;
          }
          return newSelection;
        });
      } else {
        setSelectedModifiedChanges((currentSelection) => {
          const newSelection = { ...currentSelection };
          for (const path of allFilteredPaths) {
            delete newSelection[path];
          }
          return newSelection;
        });
      }
    },
    [allFilteredPaths, allFilteredRows, setSelectedModifiedChanges]
  );
  const handleRevertFileViewFiles = reactExports.useCallback(() => {
    console.debug("Reverting selected files: ", selectedModifiedChanges);
    emitFilesRevert(selectedModifiedChanges);
    setSelectedModifiedChanges({});
  }, [selectedModifiedChanges, setSelectedModifiedChanges]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { ms: 9, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(HStack, { gap: "6", mb: 4, width: "full", colorPalette: "yellow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(InputGroup, { flex: "1", startElement: /* @__PURE__ */ jsxRuntimeExports.jsx(LuSearch, {}), startElementProps: { color: "colorPalette.fg" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Quick search...", variant: "flushed", borderColor: "colorPalette.fg", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableScrollArea, { borderWidth: "1px", maxH: "xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { size: "sm", variant: "outline", colorPalette: "yellow", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { bgColor: "colorPalette.400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { "aria-label": "Select Filtered", variant: "subtle", colorPalette: "yellow", checked: someSelected && !allSelected ? "indeterminate" : allSelected, onCheckedChange: (e) => handleHeaderCheckboxChange(e.checked) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("branch"), children: [
          "Branch ",
          getSortIndicator$1("branch", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("path"), children: [
          "Path ",
          getSortIndicator$1("path", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("lastModified"), children: [
          "Last Modified ",
          getSortIndicator$1("lastModified", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("status"), children: [
          "Status ",
          getSortIndicator$1("status", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, {})
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: Object.keys(sortedRows).length == 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 6, textAlign: "center", children: "No results found" }) }) : sortedRows.map((row) => {
        const { branchPath, branchString, branchFolder, branchVersion, file } = row;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { "aria-label": "Select path", variant: "subtle", colorPalette: "yellow", checked: !!selectedModifiedChanges[file.path], onCheckedChange: (e) => handlePathSelection(file, e.checked) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.wcStatus), children: branchString }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.wcStatus), children: `${branchPath.split("\\").at(-1)}\\${file.pathDisplay}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.wcStatus), children: file.lastModified }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.wcStatus), children: file.wcStatus }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonDiff, { fullPath: file.path, branchFolder, branchVersion, onDiffResult: handleDiffResult }) })
        ] }, file.path);
      }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gap: "6", mt: 4, justifyContent: "space-between", alignItems: "center", colorPalette: "yellow", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gap: 2, alignItems: "center", children: [
        "Selected paths:",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { bgColor: "yellow.subtle", color: "yellow.fg", rounded: "md", px: 3, children: Object.keys(selectedModifiedChanges).length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { gap: 3, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setIsRevertDialogOpen(true), colorPalette: "red", disabled: Object.keys(selectedModifiedChanges).length < 1, children: "Revert" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonProcessCommit, {})
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogModifiedChangesRevert, { selectedCount: Object.keys(selectedModifiedChanges).length, isDialogOpen: isRevertDialogOpen, closeDialog: () => setIsRevertDialogOpen(false), fireDialogAction: handleRevertFileViewFiles })
  ] });
}
function sortByStack(rows, sortStack) {
  return [...rows].sort((a, b) => {
    for (const sortItem of sortStack) {
      let aVal, bVal;
      switch (sortItem.column) {
        case "branch":
          aVal = a.branchString.toLowerCase();
          bVal = b.branchString.toLowerCase();
          break;
        case "path":
          aVal = a.file.pathDisplay.toLowerCase();
          bVal = b.file.pathDisplay.toLowerCase();
          break;
        case "lastModified":
          aVal = new Date(a.file.lastModified).getTime();
          bVal = new Date(b.file.lastModified).getTime();
          break;
        case "status":
          aVal = a.file.wcStatus.toLowerCase();
          bVal = b.file.wcStatus.toLowerCase();
          break;
        default:
          aVal = 0;
          bVal = 0;
      }
      if (aVal < bVal) return sortItem.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortItem.direction === "asc" ? 1 : -1;
    }
    return 0;
  });
}
function getSortIndicator(columnKey, sortStack) {
  const itemIndex = sortStack.findIndex((s) => s.column === columnKey);
  if (itemIndex === -1) return null;
  return sortStack[itemIndex].direction === "asc" ? "↑" : "↓";
}
function SubSectionUnknownChanges() {
  const { emitFilesRevert, emitFilesAddDelete } = useSocketEmits();
  const { RaiseClientNotificaiton } = useNotifications();
  const unknownChanges = useCommit((ctx) => ctx.unknownChanges);
  const selectedUnknownChanges = useCommit((ctx) => ctx.selectedUnknownChanges);
  const setSelectedUnknownChanges = useCommit((ctx) => ctx.setSelectedUnknownChanges);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [isRevertDialogOpen, setIsRevertDialogOpen] = reactExports.useState(false);
  const [sortStack, setSortStack] = reactExports.useState([
    { column: "status", direction: "asc" },
    { column: "lastModified", direction: "desc" }
  ]);
  const getStatusColor = reactExports.useCallback((status) => {
    switch (status) {
      case "modified":
        return "cyan.500";
      case "deleted":
      case "missing":
        return "red.500";
      case "added":
      case "unversioned":
        return "green.500";
      default:
        return "purple.600";
    }
  }, []);
  const handleSort = reactExports.useCallback((columnKey) => {
    setSortStack((prev) => {
      const existingIndex = prev.findIndex((s) => s.column === columnKey);
      if (existingIndex === -1) {
        return [{ column: columnKey, direction: "asc" }, ...prev];
      }
      const updatedSort = { ...prev[existingIndex] };
      updatedSort.direction = updatedSort.direction === "asc" ? "desc" : "asc";
      const newStack = [...prev];
      newStack.splice(existingIndex, 1);
      newStack.unshift(updatedSort);
      return newStack;
    });
  }, []);
  const handlePathSelection = reactExports.useCallback(
    (file, checked) => {
      setSelectedUnknownChanges((currentSelection) => {
        if (checked) return { ...currentSelection, [file.path]: file };
        const { [file.path]: _, ...newSelection } = currentSelection;
        return newSelection;
      });
    },
    [setSelectedUnknownChanges]
  );
  const handleDiffResult = reactExports.useCallback(
    (result) => {
      if (result.success) RaiseClientNotificaiton("TortoiseSVN diff opened successfully", "success", 3e3);
      else RaiseClientNotificaiton(`Error opening TortoiseSVN diff: ${JSON.stringify(result.error, null, 4)}`, "error", 0);
    },
    [RaiseClientNotificaiton]
  );
  const filteredUnknownChanges = reactExports.useMemo(() => {
    if (!searchTerm) return unknownChanges;
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = {};
    Object.keys(unknownChanges).forEach((branchPath) => {
      const branchData = unknownChanges[branchPath];
      const { branchString, filesToTrack, "Branch Folder": branchFolder, "Branch Version": branchVersion } = branchData;
      const filteredFiles = filesToTrack.filter((file) => {
        const fieldsToCheck = [branchString, branchFolder, branchVersion, branchPath, file.pathDisplay, file.wcStatus, file.lastModified];
        return fieldsToCheck.some(
          (field, i) => field == null ? void 0 : field.toString().toLowerCase().includes(i === 4 ? lowerSearch.replace(/\//g, "\\") : lowerSearch)
        );
      });
      if (filteredFiles.length > 0) {
        filtered[branchPath] = {
          ...branchData,
          filesToTrack: filteredFiles
        };
      }
    });
    return filtered;
  }, [unknownChanges, searchTerm]);
  const allFilteredRows = reactExports.useMemo(() => {
    const rows = [];
    Object.keys(filteredUnknownChanges).forEach((branchPath) => {
      const { branchString, branchFolder, branchVersion, filesToTrack } = filteredUnknownChanges[branchPath];
      filesToTrack.forEach((file) => {
        rows.push({
          branchPath,
          branchString,
          branchFolder,
          branchVersion,
          file
        });
      });
    });
    return rows;
  }, [filteredUnknownChanges]);
  const sortedRows = reactExports.useMemo(() => {
    return sortByStack(allFilteredRows, sortStack);
  }, [allFilteredRows, sortStack]);
  const allFilteredPaths = reactExports.useMemo(() => {
    return sortedRows.map((row) => row.file.path);
  }, [sortedRows]);
  const { allSelected, someSelected } = reactExports.useMemo(() => {
    if (allFilteredPaths.length === 0) {
      return { allSelected: false, someSelected: false };
    }
    const selectedCount = allFilteredPaths.filter((p) => selectedUnknownChanges[p]).length;
    return {
      allSelected: selectedCount === allFilteredPaths.length,
      someSelected: selectedCount > 0 && selectedCount < allFilteredPaths.length
    };
  }, [allFilteredPaths, selectedUnknownChanges]);
  const handleHeaderCheckboxChange = reactExports.useCallback(
    (checked) => {
      if (checked) {
        setSelectedUnknownChanges((currentSelection) => {
          const newSelection = { ...currentSelection };
          for (const path of allFilteredPaths) {
            newSelection[path] = allFilteredRows.find((p) => p.file.path === path).file;
          }
          return newSelection;
        });
      } else {
        setSelectedUnknownChanges((currentSelection) => {
          const newSelection = { ...currentSelection };
          for (const path of allFilteredPaths) {
            delete newSelection[path];
          }
          return newSelection;
        });
      }
    },
    [allFilteredPaths, allFilteredRows, setSelectedUnknownChanges]
  );
  const handleRevertFiles = reactExports.useCallback(() => {
    console.debug("Reverting selected files: ", selectedUnknownChanges);
    emitFilesRevert(selectedUnknownChanges);
    setSelectedUnknownChanges({});
  }, [selectedUnknownChanges]);
  const handleTrackFiles = reactExports.useCallback(() => {
    console.debug("Tracking selected files: ", selectedUnknownChanges);
    emitFilesAddDelete(selectedUnknownChanges);
    setSelectedUnknownChanges({});
  }, [selectedUnknownChanges]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { ms: 9, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(HStack, { gap: "6", mb: 4, width: "full", colorPalette: "yellow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(InputGroup, { flex: "1", startElement: /* @__PURE__ */ jsxRuntimeExports.jsx(LuSearch, {}), startElementProps: { color: "colorPalette.fg" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Quick search...", variant: "flushed", borderColor: "colorPalette.fg", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableScrollArea, { borderWidth: "1px", maxH: "xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { size: "sm", variant: "outline", colorPalette: "yellow", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { bgColor: "colorPalette.400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { "aria-label": "Select Filtered", variant: "subtle", colorPalette: "yellow", checked: someSelected && !allSelected ? "indeterminate" : allSelected, onCheckedChange: (e) => handleHeaderCheckboxChange(e.checked) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("branch"), children: [
          "Branch ",
          getSortIndicator("branch", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("path"), children: [
          "Path ",
          getSortIndicator("path", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("lastModified"), children: [
          "Last Modified ",
          getSortIndicator("lastModified", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnHeader, { color: "black", fontWeight: 900, cursor: "pointer", onClick: () => handleSort("status"), children: [
          "Status ",
          getSortIndicator("status", sortStack)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, {})
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: Object.keys(sortedRows).length == 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 6, textAlign: "center", children: "No results found" }) }) : sortedRows.map((row) => {
        const { branchPath, branchString, branchFolder, branchVersion, file } = row;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { "aria-label": "Select path", variant: "subtle", colorPalette: "yellow", checked: !!selectedUnknownChanges[file.path], onCheckedChange: (e) => handlePathSelection(file, e.checked) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.wcStatus), children: branchString }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.wcStatus), children: `${branchPath.split("\\").at(-1)}\\${file.pathDisplay}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.wcStatus), children: file.lastModified }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { color: getStatusColor(file.wcStatus), children: file.wcStatus }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonDiff, { fullPath: file.path, branchFolder, branchVersion, onDiffResult: handleDiffResult }) })
        ] }, file.path);
      }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gap: "6", mt: 4, justifyContent: "space-between", alignItems: "center", colorPalette: "yellow", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gap: 2, alignItems: "center", children: [
        "Selected paths:",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { bgColor: "yellow.subtle", color: "yellow.fg", rounded: "md", px: 3, children: Object.keys(selectedUnknownChanges).length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { gap: 3, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setIsRevertDialogOpen(true), colorPalette: "red", disabled: Object.keys(selectedUnknownChanges).length < 1, children: "Revert" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleTrackFiles(), colorPalette: "green", disabled: Object.keys(selectedUnknownChanges).length < 1, children: "Add/Delete" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogModifiedChangesRevert, { selectedCount: Object.keys(selectedUnknownChanges).length, isDialogOpen: isRevertDialogOpen, closeDialog: () => setIsRevertDialogOpen(false), fireDialogAction: handleRevertFiles })
  ] });
}
function toBranchString(branchFolder, branchVersion, branch) {
  return `${branchFolder == "" ? "Uncategorised" : branchFolder} ${branchVersion == "" ? "Unversioned" : branchVersion} ${String(branch).split("\\").at(-1)}`;
}
function branchPathFolder(branch) {
  return String(branch).split("\\").at(-1);
}
const initialState = {
  isLookupSLogsOn: false,
  setIsLookupSLogsOn: (_) => {
  },
  isLookupTrelloOn: false,
  setIsLookupTrelloOn: (_) => {
  },
  sourceBranch: "",
  setSourceBranch: (_) => {
  },
  sourceIssueNumber: "",
  setSourceIssueNumber: (_) => {
  },
  issueNumber: {},
  setIssueNumber: (_) => {
  },
  commitMessage: "",
  setCommitMessage: (_) => {
  },
  conflictingChanges: {},
  unknownChanges: {},
  modifiedChanges: {},
  selectedConflictingChanges: {},
  setSelectedConflictingChanges: (_) => {
  },
  selectedUnknownChanges: {},
  setSelectedUnknownChanges: (_) => {
  },
  selectedModifiedChanges: {},
  setSelectedModifiedChanges: (_) => {
  },
  trelloData: {},
  commitPayload: {},
  setCommitPayload: (_) => {
  },
  setTrelloData: (_) => {
  },
  isCommitMode: false,
  selectedBranchesCount: 0,
  accordionSection: [],
  commitStage: [],
  setCommitStage: (_) => {
  },
  isProcessCommit: false,
  setIsProcessCommit: (_) => {
  }
};
const ContextCommit = createContext(initialState);
const useCommit = (selector) => {
  const context = useContextSelector(ContextCommit, selector);
  return context;
};
const CommitProvider = ({ children }) => {
  const config = useApp((ctx) => ctx.config);
  const socket = useApp((ctx) => ctx.socket);
  const configurableRowData = useApp((ctx) => ctx.configurableRowData);
  const selectedBranches = useApp((ctx) => ctx.selectedBranches);
  const selectedBrachesData = useApp((ctx) => ctx.selectedBranchesData);
  const selectedBranchPaths = useApp((ctx) => ctx.selectedBranchPaths);
  const selectedBranchFolders = useApp((ctx) => ctx.selectedBranchFolders);
  const appMode = useApp((ctx) => ctx.appMode);
  const { emitStatusSingle } = useSocketEmits();
  const isCommitMode = reactExports.useMemo(() => appMode === "commit", [appMode]);
  const selectedBranchesCount = reactExports.useMemo(() => Object.keys(selectedBranches).length, [selectedBranches]);
  const [isLookupSLogsOn, setIsLookupSLogsOn] = reactExports.useState(false);
  const [isLookupTrelloOn, setIsLookupTrelloOn] = reactExports.useState(false);
  const [sourceBranch, setSourceBranch] = reactExports.useState("");
  const [sourceIssueNumber, setSourceIssueNumber] = reactExports.useState("");
  const [issueNumber, setIssueNumber] = reactExports.useState({});
  const [commitMessage, setCommitMessage] = reactExports.useState("");
  const [conflictingChanges, setConflictingChanges] = reactExports.useState({});
  const [unknownChanges, setUnknownChanges] = reactExports.useState({});
  const [modifiedChanges, setModifiedChanges] = reactExports.useState({});
  const [selectedConflictingChanges, setSelectedConflictingChanges] = reactExports.useState({});
  const [selectedUnknownChanges, setSelectedUnknownChanges] = reactExports.useState({});
  const [selectedModifiedChanges, setSelectedModifiedChanges] = reactExports.useState({});
  const [trelloData, setTrelloData] = reactExports.useState({});
  const [commitPayload, setCommitPayload] = reactExports.useState({});
  const [commitStage, setCommitStage] = reactExports.useState(["commitDetails"]);
  const accordionSections = reactExports.useMemo(
    () => [
      {
        value: "commitDetails",
        icon: BiMessageDetail,
        title: "Commit Details",
        description: "Enter issue, branch and message details",
        component: SubSectionCommitDetails
      },
      {
        value: "conflictingChanges",
        icon: IoWarning,
        title: "Conflicting Changes",
        description: "Modified changes that will conflict with the remote version",
        component: SubSectionConflictingChanges
      },
      {
        value: "unknownChanges",
        icon: FiHelpCircle,
        title: "Unknown Changes",
        description: "Added and deleted files currently not tracked by SVN",
        component: SubSectionUnknownChanges
      },
      {
        value: "modifiedChanges",
        icon: FiEdit,
        title: "Modified Changes",
        description: "Files and directories listed for committing",
        component: SubSectionModifiedChanges
      }
    ],
    []
  );
  const accordionSection = reactExports.useMemo(
    () => accordionSections.map((accSection, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(AccordionItem, { value: accSection.value, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AccordionItemTrigger, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { fontSize: "lg", color: "colorPalette.fg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(accSection.icon, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { gap: "1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { children: accSection.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { fontSize: "xs", color: "fg.muted", children: accSection.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionItemContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(accSection.component, {}) })
    ] }, i)),
    [accordionSections]
  );
  const [isProcessCommit, setIsProcessCommit] = reactExports.useState(false);
  const value = reactExports.useMemo(
    () => ({
      isLookupSLogsOn,
      setIsLookupSLogsOn,
      isLookupTrelloOn,
      setIsLookupTrelloOn,
      sourceBranch,
      setSourceBranch,
      sourceIssueNumber,
      setSourceIssueNumber,
      issueNumber,
      setIssueNumber,
      commitMessage,
      setCommitMessage,
      conflictingChanges,
      unknownChanges,
      modifiedChanges,
      selectedConflictingChanges,
      setSelectedConflictingChanges,
      selectedUnknownChanges,
      setSelectedUnknownChanges,
      selectedModifiedChanges,
      setSelectedModifiedChanges,
      trelloData,
      setTrelloData,
      commitPayload,
      setCommitPayload,
      isCommitMode,
      selectedBranchesCount,
      accordionSection,
      commitStage,
      setCommitStage,
      isProcessCommit,
      setIsProcessCommit
    }),
    [
      isLookupSLogsOn,
      isLookupTrelloOn,
      sourceBranch,
      sourceIssueNumber,
      issueNumber,
      commitMessage,
      conflictingChanges,
      unknownChanges,
      modifiedChanges,
      selectedConflictingChanges,
      selectedUnknownChanges,
      selectedModifiedChanges,
      trelloData,
      commitPayload,
      isCommitMode,
      selectedBranchesCount,
      accordionSection,
      commitStage,
      isProcessCommit
    ]
  );
  reactExports.useEffect(() => {
    if (!isCommitMode) return;
    setTimeout(() => {
      var _a;
      return (_a = document.getElementById("sectionCommit")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }, 400);
  }, [isCommitMode]);
  reactExports.useEffect(() => {
    if (!isCommitMode) return;
    selectedBrachesData.forEach((branchRow) => {
      console.log("Emitting status single for branch", branchRow["SVN Branch"]);
      emitStatusSingle(branchRow);
    });
  }, [isCommitMode, selectedBrachesData]);
  reactExports.useEffect(() => {
    if (!isCommitMode || selectedBranchesCount < 1) return;
    const socketCallback = (data) => {
      console.log("Received status single from socket in ContextCommit component in background", data);
      const branchId = data.id;
      const { branch: branchPath, filesToUpdate, filesToTrack, filesToCommit } = data.status;
      const matchedSelectedRow = configurableRowData.find((branchRow) => branchRow.id === branchId);
      const matchedBranchString = toBranchString(matchedSelectedRow["Branch Folder"], matchedSelectedRow["Branch Version"], matchedSelectedRow["SVN Branch"]);
      setConflictingChanges((prevData) => {
        const newData = {};
        Object.entries(prevData).forEach(([branchPath2, branchData]) => {
          if (selectedBranchPaths.has(branchPath2)) {
            newData[branchPath2] = branchData;
          }
        });
        if ((filesToUpdate == null ? void 0 : filesToUpdate.length) > 0)
          newData[branchPath] = {
            branchString: matchedBranchString,
            "Branch Folder": matchedSelectedRow["Branch Folder"],
            "Branch Version": matchedSelectedRow["Branch Version"],
            "SVN Branch": branchPath,
            filesToUpdate
          };
        else delete newData[branchPath];
        return newData;
      });
      setUnknownChanges((prevData) => {
        const newData = {};
        Object.entries(prevData).forEach(([branchPath2, branchData]) => {
          if (selectedBranchPaths.has(branchPath2)) {
            newData[branchPath2] = branchData;
          }
        });
        if ((filesToTrack == null ? void 0 : filesToTrack.length) > 0)
          newData[branchPath] = {
            branchString: matchedBranchString,
            "Branch Folder": matchedSelectedRow["Branch Folder"],
            "Branch Version": matchedSelectedRow["Branch Version"],
            "SVN Branch": branchPath,
            filesToTrack: filesToTrack.filter((f) => !(config == null ? void 0 : config.ignoredUnknownPaths.some((p) => new RegExp(p).test(f.path))))
          };
        else delete newData[branchPath];
        return newData;
      });
      setModifiedChanges((prevData) => {
        const newData = {};
        Object.entries(prevData).forEach(([branchPath2, branchData]) => {
          if (selectedBranchPaths.has(branchPath2)) {
            newData[branchPath2] = branchData;
          }
        });
        if ((filesToCommit == null ? void 0 : filesToCommit.length) > 0)
          newData[branchPath] = {
            branchString: matchedBranchString,
            "Branch Folder": matchedSelectedRow["Branch Folder"],
            "Branch Version": matchedSelectedRow["Branch Version"],
            "SVN Branch": branchPath,
            filesToCommit: filesToCommit.filter((f) => !(config == null ? void 0 : config.ignoredModifiedPaths.some((p) => new RegExp(p).test(f.path))))
          };
        else delete newData[branchPath];
        return newData;
      });
    };
    socket == null ? void 0 : socket.on("branch-status-single", socketCallback);
    return () => socket == null ? void 0 : socket.off("branch-status-single", socketCallback);
  }, [socket, isCommitMode, selectedBranchesCount, configurableRowData, selectedBranchPaths, config == null ? void 0 : config.ignoredUnknownPaths, config == null ? void 0 : config.ignoredModifiedPaths]);
  reactExports.useEffect(() => {
    console.debug("branch paths update logic has been re-rendered");
    if (!isCommitMode || selectedBranchesCount < 1) return;
    const socketCallback = (data) => {
      console.log("Received branch-paths-update from socket in ContextCommit component in background", data);
      const { paths } = data;
      const addedPaths = paths.filter((path) => path.action === "add");
      const deletedPaths = paths.filter((path) => path.action === "delete");
      const untrackedPaths = paths.filter((path) => path.action === "untrack");
      const revertedPaths = paths.filter((path) => path.action === "revert");
      const modifiedPaths = paths.filter((path) => path.action === "modify");
      const conflictingPaths = paths.filter((path) => path.action === "conflict");
      setConflictingChanges((prevData) => {
        const newData = {};
        for (const [branchPath, branchData] of Object.entries(prevData)) {
          if (selectedBranchPaths.has(branchPath)) {
            newData[branchPath] = {
              ...branchData,
              filesToUpdate: [...branchData.filesToUpdate]
            };
          }
        }
        for (const path of conflictingPaths) {
          const { branchPath } = path;
          if (!selectedBranchPaths.has(branchPath)) continue;
          if (!newData[branchPath]) {
            newData[branchPath] = {
              branchString: path.branchString || "",
              "Branch Folder": path["Branch Folder"] || "",
              "Branch Version": path["Branch Version"] || "",
              "SVN Branch": branchPath,
              filesToUpdate: []
            };
          }
        }
        for (const branchPath of Object.keys(newData)) {
          let { filesToUpdate } = newData[branchPath];
          filesToUpdate = filesToUpdate.filter((f) => {
            const updated = paths.find((p) => p.path === f.path);
            return !updated || updated.action === "conflict";
          });
          for (const path of conflictingPaths) {
            if (path.branchPath !== branchPath) continue;
            const idx = filesToUpdate.findIndex((f) => f.path === path.path);
            if (idx === -1) {
              const { action, ...rest } = path;
              filesToUpdate.push({ ...rest });
            }
          }
          newData[branchPath].filesToUpdate = filesToUpdate;
        }
        return newData;
      });
      setUnknownChanges((prevData) => {
        const newData = {};
        for (const [branchPath, branchData] of Object.entries(prevData)) {
          if (selectedBranchPaths.has(branchPath)) {
            newData[branchPath] = {
              ...branchData,
              filesToTrack: [...branchData.filesToTrack]
            };
          }
        }
        for (const path of [...untrackedPaths, ...revertedPaths]) {
          const { branchPath } = path;
          if (!selectedBranchPaths.has(branchPath)) continue;
          if (!newData[branchPath]) {
            newData[branchPath] = {
              branchString: path.branchString || "",
              "Branch Folder": path["Branch Folder"] || "",
              "Branch Version": path["Branch Version"] || "",
              "SVN Branch": branchPath,
              filesToTrack: []
            };
          }
        }
        for (const branchPath of Object.keys(newData)) {
          let { filesToTrack } = newData[branchPath];
          filesToTrack = filesToTrack.filter((f) => {
            const updated = paths.find((p) => p.path === f.path);
            return !updated || updated.action === "untrack";
          });
          for (const path of [...untrackedPaths, ...revertedPaths.filter((p) => ["unversioned", "missing"].includes(p.wcStatus))]) {
            if (path.branchPath !== branchPath) continue;
            const idx = filesToTrack.findIndex((f) => f.path === path.path);
            if (idx === -1) {
              const { action, ...rest } = path;
              filesToTrack.push({ ...rest });
            }
          }
          newData[branchPath].filesToTrack = filesToTrack;
        }
        return newData;
      });
      setModifiedChanges((prevData) => {
        const newData = {};
        for (const [branchPath, branchData] of Object.entries(prevData)) {
          if (selectedBranchPaths.has(branchPath)) {
            newData[branchPath] = {
              ...branchData,
              filesToCommit: [...branchData.filesToCommit]
            };
          }
        }
        for (const path of [...addedPaths, ...deletedPaths, ...modifiedPaths]) {
          const { branchPath } = path;
          if (!selectedBranchPaths.has(branchPath)) continue;
          if (!newData[branchPath]) {
            newData[branchPath] = {
              branchString: path.branchString || "",
              "Branch Folder": path["Branch Folder"] || "",
              "Branch Version": path["Branch Version"] || "",
              "SVN Branch": branchPath,
              filesToCommit: []
            };
          }
        }
        for (const branchPath of Object.keys(newData)) {
          let { filesToCommit } = newData[branchPath];
          filesToCommit = filesToCommit.filter((f) => {
            const updated = paths.find((p) => p.path === f.path);
            return !updated || ["add", "delete", "modify"].includes(updated.action);
          });
          for (const path of [...addedPaths, ...deletedPaths, ...modifiedPaths]) {
            if (path.branchPath !== branchPath) continue;
            const idx = filesToCommit.findIndex((f) => f.path === path.path);
            if (idx === -1) {
              const { action, ...rest } = path;
              filesToCommit.push({ ...rest });
            }
          }
          newData[branchPath].filesToCommit = filesToCommit;
        }
        return newData;
      });
    };
    socket == null ? void 0 : socket.on("branch-paths-update", socketCallback);
    return () => socket == null ? void 0 : socket.off("branch-paths-update", socketCallback);
  }, [socket, isCommitMode, selectedBranchesCount, configurableRowData, selectedBranchPaths]);
  reactExports.useEffect(() => {
    if (!isCommitMode || selectedBranchesCount < 1) return;
    const socketCallback = (data) => {
      setIssueNumber((prevIssueNums) => {
        const updatedEntries = selectedBranchFolders.reduce((acc, fol) => {
          if (!prevIssueNums[fol]) {
            acc[fol] = data[fol];
          }
          return acc;
        }, {});
        return {
          ...prevIssueNums,
          ...updatedEntries
        };
      });
    };
    socket == null ? void 0 : socket.on("external-autofill-issue-numbers", socketCallback);
    return () => socket == null ? void 0 : socket.off("external-autofill-issue-numbers", socketCallback);
  }, [socket, isCommitMode, selectedBranchesCount, selectedBranchFolders]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ContextCommit.Provider, { value, children });
};
const ToggleTip = reactExports.forwardRef(function ToggleTip2(props, ref) {
  const {
    showArrow,
    children,
    portalled = true,
    content,
    portalRef,
    ...rest
  } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    PopoverRoot$1,
    {
      ...rest,
      positioning: { ...rest.positioning, gutter: 4 },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger$1, { asChild: true, children }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { disabled: !portalled, container: portalRef, children: /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverPositioner, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          PopoverContent$1,
          {
            width: "auto",
            px: "2",
            py: "1",
            textStyle: "xs",
            rounded: "sm",
            ref,
            children: [
              showArrow && /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverArrow$1, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverArrowTip, {}) }),
              content
            ]
          }
        ) }) })
      ]
    }
  );
});
const InfoTip = reactExports.forwardRef(function InfoTip2(props, ref) {
  const { children, ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleTip, { content: children, ...rest, ref, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    IconButton,
    {
      variant: "ghost",
      "aria-label": "info",
      size: "2xs",
      colorPalette: "gray",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(HiOutlineInformationCircle, {})
    }
  ) });
});
const ProgressBar = reactExports.forwardRef(function ProgressBar2(props, ref) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressTrack, { ...props, ref, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressRange, {}) });
});
const ProgressLabel = reactExports.forwardRef(function ProgressLabel2(props, ref) {
  const { children, info, ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ProgressLabel$1, { ...rest, ref, children: [
    children,
    info && /* @__PURE__ */ jsxRuntimeExports.jsx(InfoTip, { children: info })
  ] });
});
const ProgressRoot = ProgressRoot$1;
const ProgressValueText = ProgressValueText$1;
function ButtonClipboard({ size = "md", value }) {
  const [isCopied, setIsCopied] = reactExports.useState(false);
  const handleCopyValue = reactExports.useCallback(() => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    });
  }, [value]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { colorPalette: "yellow", variant: "subtle", onClick: handleCopyValue, size, children: isCopied ? /* @__PURE__ */ jsxRuntimeExports.jsx(LuCheck, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(LuClipboard, {}) });
}
function ProcessCommit() {
  const socket = useApp((ctx) => ctx.socket);
  const commitPayload = useCommit((ctx) => ctx.commitPayload);
  const { commitMessage, selectedModifiedChanges, selectedBranchProps, trelloData } = commitPayload;
  const isProcessCommit = useCommit((ctx) => ctx.isProcessCommit);
  const setIsProcessCommit = useCommit((ctx) => ctx.setIsProcessCommit);
  const { emitTrelloCardUpdate } = useSocketEmits();
  const finalCommitMessage = reactExports.useMemo(
    () => commitMessage == null ? void 0 : commitMessage.trim().replace(/\s*\n+\s*/g, "; ").replace(/[;\s]+$/, "").trim(),
    [commitMessage]
  );
  const [liveCommits, setLiveCommits] = reactExports.useState([]);
  const selectedBranchesCount = reactExports.useMemo(() => {
    const uniqueBranches = /* @__PURE__ */ new Set();
    if (!selectedModifiedChanges) return 0;
    for (const { branchPath } of Object.values(selectedModifiedChanges)) {
      uniqueBranches.add(branchPath);
    }
    return uniqueBranches.size;
  }, [selectedModifiedChanges]);
  const progressValue = selectedBranchesCount > 0 ? liveCommits.length / selectedBranchesCount * 100 : 0;
  const [clipboardOptions, setClipboardOptions] = reactExports.useState(["BranchFolder", "BranchVersion"]);
  const [revisionsText, setRevisionsText] = reactExports.useState("");
  const formatForClipboard = reactExports.useCallback(() => {
    const newline = clipboardOptions.includes("MarkupSupport") ? `\r

${"​".repeat(7)}` : "\r\n";
    const sortedCommits = [...liveCommits];
    const copiedCommitMsg = clipboardOptions.includes("CommitMsg") ? `${finalCommitMessage}
` : "";
    const lines = sortedCommits.map((commit) => {
      var _a, _b;
      const parts = [];
      if (clipboardOptions.includes("BranchFolder")) {
        parts.push((_a = selectedBranchProps[commit.svnBranch]) == null ? void 0 : _a.folder);
      }
      if (clipboardOptions.includes("BranchVersion")) {
        parts.push((_b = selectedBranchProps[commit.svnBranch]) == null ? void 0 : _b.version);
      }
      if (clipboardOptions.includes("SVNBranch")) {
        parts.push(branchPathFolder(commit.svnBranch) || "[SVN-branch-unknown]");
      }
      if (clipboardOptions.includes("IssueNumber")) {
        parts.push(`Issue [${commit.branchIssueNumber || "??"}]`);
      }
      const revisionOrError = commit.revision ? `Revision [${commit.revision}]` : `Error: ${commit.errorMessage || "Unknown"}`;
      parts.push(revisionOrError);
      return parts.join(" ").trim();
    });
    return copiedCommitMsg + lines.join(newline);
  }, [liveCommits, clipboardOptions, finalCommitMessage, selectedBranchProps, branchPathFolder]);
  reactExports.useEffect(() => {
    const socketCallback = (data) => {
      setLiveCommits((currentCommits) => [...currentCommits, data]);
    };
    socket == null ? void 0 : socket.on("svn-commit-live", socketCallback);
    return () => socket == null ? void 0 : socket.off("svn-commit-live", socketCallback);
  }, [socket]);
  reactExports.useEffect(() => {
    const newText = formatForClipboard();
    setRevisionsText(newText);
  }, [formatForClipboard]);
  reactExports.useEffect(() => {
    if (isProcessCommit) return;
    setLiveCommits([]);
    setRevisionsText("");
    setClipboardOptions(["BranchFolder", "BranchVersion"]);
  }, [isProcessCommit]);
  const handleCheckboxOption = reactExports.useCallback((newValues) => {
    setClipboardOptions(newValues);
  }, []);
  const handleCompleteCommit = reactExports.useCallback(() => {
    setIsProcessCommit(false);
  }, []);
  const handleUpdateTrelloCard = reactExports.useCallback(() => {
    const newline = clipboardOptions.includes("MarkupSupport") ? `\r

${"​".repeat(7)}` : "\r\n";
    emitTrelloCardUpdate(trelloData, revisionsText.split(newline), finalCommitMessage);
  }, [trelloData, liveCommits, finalCommitMessage, clipboardOptions, emitTrelloCardUpdate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { as: "h2", size: "lg", lineClamp: 1, mb: 4, className: "animation-pulse", lineHeight: "1.4", children: "Processing commit..." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { mt: 6, colorPalette: "yellow", children: liveCommits.length < selectedBranchesCount ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressRoot, { value: progressValue, size: "lg", colorPalette: "yellow", variant: "subtle", striped: true, animated: true, mb: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { gap: 5, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressLabel, { children: "Committed" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressBar, { flex: "0.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ProgressValueText, { children: [
          liveCommits.length,
          " / ",
          selectedBranchesCount
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ListRoot, { gap: "2", variant: "plain", align: "center", colorPalette: "yellow", children: liveCommits.map((commit, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(ListItem, { alignItems: "center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ListIndicator, { color: commit.revision ? "colorPalette.fg" : "red.500", display: "flex", alignItems: "center", children: commit.revision ? /* @__PURE__ */ jsxRuntimeExports.jsx(FaCircleCheck, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(MdError, {}) }),
        commit.branchString,
        "  →  ",
        commit.revision ? commit.revision : commit.errorMessage
      ] }, i)) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { mb: 3, color: "colorPalette.inverted", children: [
        "The commit process has been ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(chakra.span, { color: "colorPalette.fg", children: "completed" }),
        "! Please see he commit details below:"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { direction: "row", gap: 3, alignItems: "center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { children: "Commit message:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { color: "colorPalette.fg", children: finalCommitMessage || "Commit message not found. This is a fatal error!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonClipboard, { value: finalCommitMessage || "Commit message not found. This is a fatal error!" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { my: 4, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { fontWeight: "bold", children: "Choose fields to include in your revision text:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxGroup, { defaultValue: clipboardOptions, onValueChange: handleCheckboxOption, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { spacing: 4, mt: 2, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { value: "BranchFolder", children: "Branch Folder" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { value: "BranchVersion", children: "Branch Version" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { value: "SVNBranch", children: "SVN Branch" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { value: "IssueNumber", children: "Issue Number" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { value: "CommitMsg", children: "Commit Message" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { value: "MarkupSupport", children: "Markup Support" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { my: 4, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { children: "Your Revisions:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { alignItems: "center", gap: 3, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { my: 2, p: 2, bg: "yellow.subtle", color: "yellow.fg", borderRadius: "md", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", children: revisionsText || "Commit message not displayed. This is a fatal error!" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonClipboard, { value: revisionsText || "Commit message not copied. This is a fatal error!" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { gap: 3, colorPalette: "yellow", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleCompleteCommit, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FaCheck, {}),
          "Complete"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleUpdateTrelloCard, disabled: (trelloData == null ? void 0 : trelloData.name) && (trelloData == null ? void 0 : trelloData.name.trim()) != "", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FaTrello, {}),
          "Update Card"
        ] })
      ] })
    ] }) })
  ] });
}
function SectionCommit() {
  const isCommitMode = useCommit((ctx) => ctx.isCommitMode);
  const selectedBranchesCount = useCommit((ctx) => ctx.selectedBranchesCount);
  const commitStage = useCommit((ctx) => ctx.commitStage);
  const accordionSection = useCommit((ctx) => ctx.accordionSection);
  const setCommitStage = useCommit((ctx) => ctx.setCommitStage);
  const isProcessCommit = useCommit((ctx) => ctx.isProcessCommit);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleRoot, { open: isCommitMode && selectedBranchesCount > 0, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { id: "sectionCommit", mb: 40, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Heading, { as: "h2", size: "2xl", lineClamp: 1, mb: 4, className: "animation-pulse", lineHeight: "1.4", children: [
      "Committing to ",
      selectedBranchesCount,
      " branch",
      selectedBranchesCount > 1 ? "es" : "",
      ":"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { my: 6, fontSize: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionRoot, { size: "sm", variant: "enclosed", colorPalette: "yellow", value: commitStage, collapsible: true, multiple: true, onValueChange: (e) => setCommitStage(e.value), lazyMount: false, children: accordionSection }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleRoot, { open: isProcessCommit, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProcessCommit, {}) }) })
  ] }) }) });
}
function DialogTitanUpdate() {
  const { toast, RaiseClientNotificaiton } = useNotifications();
  const [open, setOpen] = reactExports.useState(false);
  const cancelRef = reactExports.useRef(null);
  const [updateInProgress, setUpdateInProgress] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!window.electron) {
      RaiseClientNotificaiton("Electron context is not available. Updates cannot be checked.", "warning", 5e3);
      return;
    }
    window.electron.on("update-available", () => {
      toast.closeAll();
      setOpen(true);
    });
    window.electron.on("update-error", (error) => {
      RaiseClientNotificaiton(`An error occurred while checking for updates: ${error}`, "error", 5e3);
      setUpdateInProgress(false);
    });
    return () => {
      window.electron.removeAllListeners("update-available");
      window.electron.removeAllListeners("update-error");
    };
  }, [toast, setOpen]);
  const handleCancel = reactExports.useCallback(() => {
    setOpen(false);
    RaiseClientNotificaiton("You may update the application later by manually triggering an update check or wait until Titan does this", "info", 5e3);
  }, [setOpen, RaiseClientNotificaiton]);
  const handleStartUpdate = reactExports.useCallback(() => {
    if (updateInProgress) {
      RaiseClientNotificaiton("Update is already in progress. Please wait.", "info", 5e3);
      return;
    }
    if (window.electron) {
      setUpdateInProgress(true);
      window.electron.downloadUpdate().catch((error) => {
        setUpdateInProgress(false);
        RaiseClientNotificaiton(`An error occurred while downloading the update: ${error}`, "error", 5e3);
      });
      window.electron.on("update-downloaded", () => {
        RaiseClientNotificaiton("Update has been downloaded successfully. Titan will now restart to apply the update.", "info", 5e3);
        window.electron.removeAllListeners("update-downloaded");
        setOpen(false);
      });
      window.electron.on("update-not-available", () => {
        RaiseClientNotificaiton("Titan is up to date", "info", 3e3);
        window.electron.removeAllListeners("update-not-available");
        setUpdateInProgress(false);
        setOpen(false);
      });
    } else {
      RaiseClientNotificaiton("Cannot update Titan in a non-desktop application environment", "error", 5e3);
    }
  }, [updateInProgress, RaiseClientNotificaiton, setUpdateInProgress, setOpen]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DialogRoot, { role: "alertdialog", open, leastDestructiveRef: cancelRef, onOpenChange: (e) => setOpen(e.open), motionPreset: "slide-in-bottom", closeOnOverlayClick: !updateInProgress, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { fontSize: "lg", fontWeight: "bold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Update Available" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogCloseTrigger, { disabled: updateInProgress })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogBody, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: updateInProgress ? "Downloading the update. Please wait..." : "A new version of Titan is available. Would you like to download and install the update?" }),
      updateInProgress ? /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { justify: "center", mt: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "xl", thickness: "4px", speed: "0.65s", color: "yellow.500", ml: 4 }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { colorPalette: "red", ref: cancelRef, onClick: handleCancel, disabled: updateInProgress, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { colorPalette: "yellow", onClick: handleStartUpdate, ml: 3, disabled: updateInProgress, children: "Confirm" })
    ] })
  ] }) });
}
const Logo = "" + new URL("Titan.png", import.meta.url).href;
function HeaderApp() {
  if (!window.electron) return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, {});
  const setAppClosing = useApp((ctx) => ctx.setAppClosing);
  const [appVersion, setAppVersion] = reactExports.useState("");
  reactExports.useEffect(() => {
    window.electron.getAppVersion().then((version) => {
      setAppVersion(`v${version}`);
    });
  });
  const handleMinimizeWindow = reactExports.useCallback(() => {
    window.electron.minimizeWindow();
  }, []);
  const handleMaximizeWindow = reactExports.useCallback(() => {
    window.electron.maximizeWindow();
  }, []);
  const handleCloseWindow = reactExports.useCallback(() => {
    window.electron.closeWindow();
    setAppClosing(true);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(chakra.header, { w: "100%", position: "fixed", bgColor: "yellow.400", className: "titanHead notMono", zIndex: 9999999, top: 0, overflow: "none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { justifyContent: "space-between", alignItems: "center", p: 0, position: "static", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { alignItems: "center", gapX: 1, ms: 1, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { src: Logo, alt: "Titan Logo", boxSize: "20px", borderRadius: "full", userSelect: "none" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Heading, { as: "h6", size: "sm", fontWeight: 700, lineClamp: 1, p: 1, className: "animation-fadein-left-forward", userSelect: "none", color: "black", children: [
        "Titan ",
        appVersion
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { alignItems: "center", columnGap: 2, flexWrap: "nowrap", wrap: "nowrap", h: "28px", className: "titanHeadButtons", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        IconButton,
        {
          "aria-label": "Minimize",
          onClick: handleMinimizeWindow,
          variant: "ghost",
          _hover: { bg: "yellow.300", color: "black" },
          color: "black",
          h: "28px",
          rounded: "none",
          focusRing: "none",
          focusVisibleRing: "none",
          css: {
            _icon: {
              width: "5",
              height: "5"
            }
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(VscChromeMinimize, {})
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        IconButton,
        {
          "aria-label": "Maximize",
          onClick: handleMaximizeWindow,
          variant: "ghost",
          _hover: { bg: "yellow.300", color: "black" },
          color: "black",
          h: "28px",
          rounded: "none",
          focusRing: "none",
          focusVisibleRing: "none",
          css: {
            _icon: {
              width: "3",
              height: "5"
            }
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(FaRegSquare, {})
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        IconButton,
        {
          "aria-label": "Close",
          onClick: handleCloseWindow,
          variant: "ghost",
          _hover: { bg: "red.500", color: "white" },
          color: "black",
          h: "28px",
          rounded: "none",
          focusRing: "none",
          focusVisibleRing: "none",
          css: {
            _icon: {
              width: "5",
              height: "5"
            }
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoMdClose, {})
        }
      )
    ] })
  ] }) });
}
function App() {
  const appClosing = useApp((ctx) => ctx.appClosing);
  const { RaiseClientNotificaiton } = useNotifications();
  reactExports.useEffect(() => {
    if (window.electron) {
      window.electron.onAppClosing(() => {
        RaiseClientNotificaiton("App is closing, performing cleanup...", "warning", 0);
        window.electron.fireShutdownComplete();
      });
      return () => {
        window.electron.removeAppClosingListener();
      };
    } else {
      console.warn("Electron specific logic is not available in browser mode.");
    }
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { className: "titanContainer", h: "calc(100vh)", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(HeaderApp, {}),
    !appClosing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { p: 10, overflowY: "auto", className: "titanBody", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitanUpdate, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { rowGap: 8, flexDirection: "column", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(BranchesProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionBranches, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CommitProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCommit, {}) }) })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { alignItems: "center", justifyContent: "center", className: "titanBody", h: "100%", flexDirection: "column", gap: 60, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { src: Logo, alt: "Titan Logo", boxSize: "256px", borderRadius: "full", userSelect: "none", boxShadowColor: "yellow.fg", boxShadow: "0px 0px 256px 24px var(--shadow-color)", filter: "auto", brightness: "110%", saturate: "120%" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Heading, { as: "h1", size: "4xl", className: "animation-pulse", lineHeight: "1.4", fontWeight: 900, color: "yellow.fg", textAlign: "center", children: [
        "App is closing...",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "Please wait."
      ] })
    ] })
  ] });
}
function Provider(props) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ChakraProvider, { value: defaultSystem, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ColorModeProvider, { ...props }) });
}
clientExports.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Provider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AppProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) }) }) })
);
