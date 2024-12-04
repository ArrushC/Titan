import { c as createToaster, j as jsxRuntimeExports, P as Portal, T as Toaster$1, a as ToastRoot, S as Spinner, b as ToastIndicator, d as Stack, e as ToastTitle, f as ToastDescription, g as ToastActionTrigger, h as ToastCloseTrigger, r as reactExports, l as lookup, i as TooltipRoot, k as TooltipTrigger, m as TooltipPositioner, n as TooltipContent, o as TooltipArrow, p as TooltipArrowTip, I as IconButton, C as ClientOnly, q as Skeleton, z, F as FaSun, s as FaMoon, J, H as HStack, t as Flex, u as Heading, L as LuFileCog, M as MdBrowserUpdated, v as IoReload, w as CheckboxRoot, x as CheckboxHiddenInput, y as CheckboxControl, A as CheckboxIndicator, B as CheckboxLabel, D as LuX, E as ActionBarPositioner, G as ActionBarContent$1, K as ActionBarCloseTrigger, N as ActionBarRoot$1, O as ActionBarSelectionTrigger$1, Q as ActionBarSeparator$1, R as DialogBackdrop$1, U as DialogPositioner, V as DialogContent$1, W as DialogCloseTrigger$1, X as DialogRoot$1, Y as DialogFooter$1, Z as DialogHeader$1, _ as DialogBody$1, $ as DialogTitle$1, a0 as DialogActionTrigger$1, a1 as Button$1, a2 as TbAsterisk, a3 as TbLetterZ, a4 as TbLetterY, a5 as TbLetterX, a6 as TbLetterW, a7 as TbLetterV, a8 as TbLetterU, a9 as TbLetterT, aa as TbLetterS, ab as TbLetterR, ac as TbLetterQ, ad as TbLetterP, ae as TbLetterO, af as TbLetterN, ag as TbLetterM, ah as TbLetterL, ai as TbLetterK, aj as TbLetterJ, ak as TbLetterI, al as TbLetterH, am as TbLetterG, an as TbLetterF, ao as TbLetterE, ap as TbLetterD, aq as TbLetterC, ar as TbLetterB, as as TbLetterA, at as Input, au as keyframes, av as chroma, aw as Text, ax as TableRow, ay as TableCell, az as FaFolderOpen, aA as Box, aB as MdAutoFixHigh, aC as TableRoot, aD as TableColumnGroup, aE as TableColumn, aF as TableHeader, aG as TableColumnHeader, aH as TableBody, aI as TableFooter, aJ as IoMdAdd, aK as MdUpdate, aL as Kbd, aM as IoMdClose, aN as React, aO as Em, aP as AccordionItemTrigger$1, aQ as AccordionItemIndicator, aR as FaChevronDown, aS as AccordionItemContent$1, aT as AccordionItemBody, aU as AccordionRoot$1, aV as AccordionItem$1, aW as FieldRoot, aX as FieldLabel, aY as FieldRequiredIndicator, aZ as FieldHelperText, a_ as FieldErrorText, a$ as NumberInputRoot$1, b0 as NumberInputControl, b1 as NumberInputIncrementTrigger, b2 as NumberInputDecrementTrigger, b3 as NumberInputInput, b4 as Textarea, b5 as BiMessageDetail, b6 as IoWarning, b7 as FiEdit, b8 as FiHelpCircle, b9 as CollapsibleRoot, ba as CollapsibleContent, bb as Code, bc as AbsoluteCenter, bd as Span, be as createRecipeContext, bf as createContext, bg as PaginationRoot$1, bh as PaginationEllipsis$1, bi as HiMiniEllipsisHorizontal, bj as usePaginationContext, bk as PaginationItem$1, bl as HiChevronLeft, bm as PaginationPrevTrigger$1, bn as HiChevronRight, bo as PaginationNextTrigger$1, bp as PaginationContext, bq as useDisclosure, br as chakra, bs as Image, bt as VscChromeMinimize, bu as FaRegSquare, bv as ChakraProvider, bw as defaultSystem, bx as ReactDOM } from "./vendor.js";
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
const initialState$1 = {
  socket: null,
  config: null,
  updateConfig: () => {
  },
  emitSocketEvent: () => {
  },
  configurableRowData: [],
  selectedBranches: {},
  setSelectedBranches: () => {
  },
  logData: [],
  setLogData: () => {
  },
  appMode: "app",
  setAppMode: () => {
  }
};
const ContextApp = reactExports.createContext(initialState$1);
const useApp = () => {
  const context = reactExports.useContext(ContextApp);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
const AppProvider = ({ children }) => {
  const [socket, setSocket] = reactExports.useState(null);
  const [config, setConfig] = reactExports.useState({});
  const [selectedBranches, setSelectedBranches] = reactExports.useState({});
  const [logData, setLogData] = reactExports.useState([]);
  const [appMode, setAppMode] = reactExports.useState("app");
  reactExports.useEffect(() => {
    const newSocket = lookup(URL_SOCKET_CLIENT);
    setSocket(newSocket);
    const onConnect = () => {
      newSocket.emit("titan-config-get", (response) => {
        if (!response) {
          toaster.create(createToastConfig("Couldn't load data from the server", "error", 0));
          return;
        }
        setConfig(response.config);
      });
    };
    const onDisconnect = () => {
      toaster.create(createToastConfig("Server Has Been Disconnected", "warning", 0));
    };
    const onReconnect = () => {
      toaster.create(createToastConfig("Server Has Been Reconnected", "success", 2e3));
    };
    const onNotification = (data) => {
      toaster.create(createToastConfig(data.description, data.type, data.duration));
    };
    newSocket.on("connect", onConnect);
    newSocket.on("disconnect", onDisconnect);
    newSocket.on("reconnect", onReconnect);
    newSocket.on("notification", onNotification);
    return () => {
      newSocket.off("connect", onConnect);
      newSocket.off("disconnect", onDisconnect);
      newSocket.off("reconnect", onReconnect);
      newSocket.off("notification", onNotification);
      newSocket.disconnect();
    };
  }, []);
  const updateConfig = reactExports.useCallback((updateFunction) => {
    setConfig((currentConfig) => {
      const newConfig = updateFunction(currentConfig);
      if (lodashExports.isEqual(currentConfig, newConfig)) return currentConfig;
      socket == null ? void 0 : socket.emit("titan-config-set", newConfig);
      return newConfig;
    });
  }, [socket]);
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
  const configurableRowData = reactExports.useMemo(() => (config == null ? void 0 : config.branches) || [], [config == null ? void 0 : config.branches]);
  const value = reactExports.useMemo(
    () => ({
      socket,
      config,
      updateConfig,
      emitSocketEvent,
      configurableRowData,
      selectedBranches,
      setSelectedBranches,
      logData,
      setLogData,
      appMode,
      setAppMode
    }),
    [socket, config, updateConfig, emitSocketEvent, configurableRowData, selectedBranches, logData, appMode]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ContextApp.Provider, { value, children });
};
function useSocketEmits() {
  const { socket } = useApp();
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
    (branchId, svnBranch, branchVersion, branchFolder, callback) => {
      socket == null ? void 0 : socket.emit("svn-info-single", { id: branchId, branch: svnBranch, version: branchVersion, folder: branchFolder }, callback);
    },
    [socket]
  );
  const emitCommitPayload = reactExports.useCallback(
    (commitPayload) => {
      socket == null ? void 0 : socket.emit("svn-commit", commitPayload);
    },
    [socket]
  );
  const emitFilesRevert = reactExports.useCallback(
    (filesToProcess) => {
      socket == null ? void 0 : socket.emit("svn-files-revert", { filesToProcess });
    },
    [socket]
  );
  const emitFilesAddRemove = reactExports.useCallback(
    (filesToProcess) => {
      socket == null ? void 0 : socket.emit("svn-files-add-remove", { filesToProcess });
    },
    [socket]
  );
  const emitLogsSelected = reactExports.useCallback(
    (selectedBranches) => {
      socket == null ? void 0 : socket.emit("svn-logs-selected", { selectedBranches });
    },
    [socket]
  );
  const emitTrelloCardNamesSearch = reactExports.useCallback(
    (key, token, query, limit = null) => {
      socket == null ? void 0 : socket.emit("trello-search-names-card", { key, token, query, limit });
    },
    [socket]
  );
  const emitTrelloCardUpdate = reactExports.useCallback(
    (key, token, trelloData, commitResponses) => {
      socket == null ? void 0 : socket.emit("trello-update-card", { key, token, trelloData, commitResponses });
    },
    [socket]
  );
  return {
    emitOpenConfig,
    emitUpdateSingle,
    emitInfoSingle,
    emitCommitPayload,
    emitFilesRevert,
    emitFilesAddRemove,
    emitLogsSelected,
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
        const processItem = async (index) => {
          if (index >= totalItems) {
            markToastSuccess();
            resolve(processedCount);
            return;
          }
          try {
            await onProgress(index, {
              onSuccess: () => {
                processedCount++;
                updateToastProgress(processedCount);
              },
              onError: (error) => {
                markToastError(error.itemId || index);
                throw error;
              }
            });
            processItem(index + 1);
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
  const iconButton = /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { "aria-label": label, size, onClick: handleClick, colorPalette, variant, disabled, children: icon });
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
function Header() {
  const { emitOpenConfig } = useSocketEmits();
  const { RaiseClientNotificaiton } = useNotifications();
  const [username, setUsername] = reactExports.useState("User");
  reactExports.useEffect(() => {
    if (window.electron) {
      window.electron.fetchUsername().then((username2) => {
        setUsername(username2.firstName);
      });
    }
  }, []);
  const handleReload = reactExports.useCallback(() => {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { wrap: "wrap", my: 5, gapY: 5, justify: "space-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { align: "flex-start", alignItems: "center", className: "notMono", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Heading, { as: "h1", size: "4xl", fontWeight: 700, lineClamp: 1, className: "animation-fadein-forward", userSelect: "none", children: [
        "Hello, ",
        username,
        "!"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { as: "h1", size: "4xl", lineClamp: 1, ms: 3, p: 2, className: "animation-handwave", userSelect: "none", children: "👋" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { align: "flex-start", alignItems: "center", columnGap: 2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ColorModeButton, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonIconTooltip, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LuFileCog, {}), onClick: handleOpenConfig, colorPalette: "yellow", variant: "subtle", label: "Open Config File", placement: "bottom-start", size: "md" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonElectron, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MdBrowserUpdated, {}), onClick: handleCheckForUpdates, colorPalette: "yellow", variant: "subtle", label: "Check For Updates", size: "md" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonIconTooltip, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(IoReload, {}), onClick: handleReload, colorPalette: "yellow", variant: "subtle", label: "Reload", placement: "bottom-start", size: "md" })
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
function DialogRowDeletion({ isDialogOpen, closeDialog, fireDialogAction }) {
  const deleteButtonRef = reactExports.useRef(null);
  const processDialogAction = reactExports.useCallback(() => {
    fireDialogAction();
    closeDialog();
  }, [fireDialogAction, closeDialog]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogRoot, { role: "alertdialog", open: isDialogOpen, onOpenChange: closeDialog, closeOnEscape: true, initialFocusEl: () => deleteButtonRef.current, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogBackdrop, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { fontSize: "lg", fontWeight: "bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Delete Selected Rows" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogBody, { children: "Are you sure you want to delete the selected rows? This action cannot be undone." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActionTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { children: "Cancel" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogCloseTrigger, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { ref: deleteButtonRef, colorPalette: "red", onClick: processDialogAction, ml: 3, children: "Delete" })
      ] })
    ] })
  ] });
}
function ButtonCustomScripts(props) {
  const { onClick, colorPalette, label, size } = props;
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: window.electron ? label : "Feature must be used in desktop application", showArrow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { "aria-label": label, size, onClick: handleClick, colorPalette, variant: "subtle", disabled: !window.electron, children: icon }) });
}
function EditableBranchesRow({ branchId, dataColumn, dataValue, handleDataChange }) {
  const { configurableRowData, updateConfig } = useApp();
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Input,
    {
      colorPalette: "yellow",
      variant: "subtle",
      value: cellData,
      onChange: onEditableChange
    }
  );
}
const initialState = {
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
const ContextBranches = reactExports.createContext(initialState);
const useBranches = () => {
  const context = reactExports.useContext(ContextBranches);
  if (!context) throw new Error("useApp must be used within a BranchesProvider");
  return context;
};
const BranchesProvider = ({ children }) => {
  const { configurableRowData, socket, config, updateConfig } = useApp();
  const [branchInfos, setBranchInfos] = reactExports.useState({});
  const branchTableGridRef = reactExports.useRef(null);
  const [selectedBranches, setSelectedBranches] = reactExports.useState({});
  const [isDialogSBLogOpen, setIsDialogSBLogOpen] = reactExports.useState(false);
  const [showSelectedBranchesLog, setShowSelectedBranchesLog] = reactExports.useState(false);
  const [customScripts, setCustomScripts] = reactExports.useState([]);
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
  const memoizedProps = reactExports.useMemo(
    () => ({
      branchInfos,
      setBranchInfos,
      branchTableGridRef,
      selectedBranches,
      setSelectedBranches,
      isDialogSBLogOpen,
      setIsDialogSBLogOpen,
      showSelectedBranchesLog,
      setShowSelectedBranchesLog,
      customScripts,
      setCustomScripts
    }),
    [
      socket,
      config,
      updateConfig,
      configurableRowData,
      branchInfos,
      selectedBranches,
      isDialogSBLogOpen,
      showSelectedBranchesLog,
      customScripts
    ]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ContextBranches.Provider, { value: memoizedProps, children });
};
const SectionBranchesRow = reactExports.memo(({ branchRow }) => {
  const { socket, config, configurableRowData, updateConfig } = useApp();
  const { selectedBranches, setSelectedBranches, customScripts } = useBranches();
  const { emitInfoSingle } = useSocketEmits();
  const branchId = branchRow == null ? void 0 : branchRow.id;
  const branchFolder = branchRow == null ? void 0 : branchRow["Branch Folder"];
  const branchVersion = branchRow == null ? void 0 : branchRow["Branch Version"];
  const branchPath = branchRow == null ? void 0 : branchRow["SVN Branch"];
  const [branchInfo, setBranchInfo] = reactExports.useState((branchRow == null ? void 0 : branchRow["Branch Info"]) || "Refreshing...");
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
    if (branchInfo.toLowerCase().includes("🤬")) {
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
  const rowStyle = reactExports.useMemo(() => {
    const color = config == null ? void 0 : config.branchFolderColours[branchFolder];
    return {
      backgroundColor: color ? `${color}20` : "transparent"
    };
  }, [branchFolder, config == null ? void 0 : config.branchFolderColours]);
  const handleSelectRow = reactExports.useCallback(
    (checked) => {
      setSelectedBranches((prev) => {
        const newState = { ...prev };
        if (checked) {
          newState[branchId] = true;
        } else {
          delete newState[branchId];
        }
        return newState;
      });
    },
    [setSelectedBranches]
  );
  const handleSelectFolder = reactExports.useCallback(async () => {
    const path = await window.electron.selectFolder();
    if (path) updateConfig((currentConfig) => ({ ...currentConfig, branches: configurableRowData.map((row) => ({ ...row, "SVN Branch": row.id === branchId ? path : row["SVN Branch"] })) }));
  }, [configurableRowData, updateConfig]);
  const handleDataChange = reactExports.useCallback((branchId2, dataColumn, newValue) => {
    updateConfig((currentConfig) => ({
      ...currentConfig,
      branches: currentConfig.branches.map((branch) => {
        if (branch.id === branchId2) {
          return { ...branch, [dataColumn]: newValue };
        }
        return branch;
      })
    }));
  }, [updateConfig]);
  const refreshRow = reactExports.useCallback(() => {
    emitInfoSingle(branchId, branchPath, branchVersion, branchFolder, (response) => {
      if (response.id != branchId) return;
      setBranchInfo(response.info);
    });
  }, [emitInfoSingle, branchId, branchPath, branchVersion, branchFolder]);
  const resolveConflicts = reactExports.useCallback(() => {
    window.electron.openSvnResolve({ fullPath: branchPath }).then((result) => {
      refreshRow();
    });
  }, [configurableRowData, refreshRow]);
  const executeCustomScript = reactExports.useCallback((scriptType, scriptPath, branchData) => {
    window.electron.runCustomScript({ scriptType, scriptPath, branchData }).then((result) => {
      console.log("Custom Script Result: ", JSON.stringify(result, null, 4));
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { bgColor: rowStyle.backgroundColor, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { display: "flex", alignItems: "center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { top: "2", "aria-label": "Select row", variant: "subtle", colorPalette: "yellow", checked: !!selectedBranches[branchId], onCheckedChange: (e) => handleSelectRow(e.checked) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(EditableBranchesRow, { branchId, dataColumn: "Branch Folder", dataValue: branchFolder, handleDataChange }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(EditableBranchesRow, { branchId, dataColumn: "Branch Version", dataValue: branchVersion, handleDataChange }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gapX: 3, alignItems: "center", onDoubleClick: () => handleSelectFolder(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: window.electron ? "Select folder" : "Feature must be used in desktop application", showArrow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { colorPalette: "yellow", variant: "subtle", size: "xs", onClick: () => handleSelectFolder(), disabled: !window.electron, children: /* @__PURE__ */ jsxRuntimeExports.jsx(FaFolderOpen, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { children: branchPath })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { ...gradientStyle, bgColor: "green.focusRing", rounded: "xl", textAlign: "center", py: "6px", px: 2, children: renderedBranchInfo }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { columnGap: 1, children: [
      branchInfo.toLowerCase().includes("🤬") && /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonElectron, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MdAutoFixHigh, {}), onClick: () => resolveConflicts(), colorPalette: "yellow", variant: "subtle", label: "Resolve Conflicts", size: "xs" }),
      customScripts.map((script, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonCustomScripts, { onClick: () => executeCustomScript(script.type, script.path, branchRow), colorPalette: "yellow", label: script.fileName, size: "xs" }, i))
    ] }) })
  ] });
});
SectionBranchesRow.displayName = "SectionBranchesRow";
function SectionBranches() {
  const { updateConfig, configurableRowData, selectedBranches, setSelectedBranches, setIsDialogSBLogOpen, setIsCommitMode } = useApp();
  const { RaisePromisedClientNotification } = useNotifications();
  const { emitInfoSingle, emitUpdateSingle } = useSocketEmits();
  const [selectionMetrics, setSelectionMetrics] = reactExports.useState({
    selectedBranchesCount: 0,
    indeterminate: false,
    hasSelection: false
  });
  reactExports.useEffect(() => {
    const validBranchIds = new Set(configurableRowData.map((branch) => branch.id));
    const selectedBranchIds = Object.keys(selectedBranches).filter((id) => selectedBranches[id]);
    const hasInvalidSelections = selectedBranchIds.some((id) => !validBranchIds.has(id));
    if (hasInvalidSelections) {
      const validSelectedBranches = Object.entries(selectedBranches).reduce((acc, [id, isSelected]) => {
        if (isSelected && validBranchIds.has(id)) {
          acc[id] = true;
        }
        return acc;
      }, {});
      setSelectedBranches(validSelectedBranches);
    }
  }, [configurableRowData, selectedBranches, setSelectedBranches]);
  reactExports.useEffect(() => {
    const selectedCount = Object.keys(selectedBranches).filter((key) => selectedBranches[key]).length;
    setSelectionMetrics({
      selectedBranchesCount: selectedCount,
      indeterminate: selectedCount > 0 && selectedCount < configurableRowData.length,
      hasSelection: selectedCount > 0
    });
  }, [selectedBranches, configurableRowData]);
  const [isRowDialogOpen, setIsRowDialogOpen] = reactExports.useState(false);
  const fireRowDialogAction = reactExports.useCallback(() => {
    updateConfig((currentConfig) => {
      const newBranches = configurableRowData.filter((branch) => !selectedBranches[branch.id]);
      return { ...currentConfig, branches: newBranches };
    });
  }, [updateConfig, configurableRowData, selectedBranches]);
  const updateAll = reactExports.useCallback(() => {
    RaisePromisedClientNotification({
      title: "Updating Branches",
      totalItems: configurableRowData.length,
      onProgress: async (index, { onSuccess }) => {
        const branchRow = configurableRowData[index];
        await new Promise((resolveUpdate) => {
          emitUpdateSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], (response) => {
            if (response.success) {
              onSuccess();
              emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], null);
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
    configurableRowData.filter((branchRow) => selectedBranches[branchRow.id]).forEach((branchRow) => {
      emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], null);
    });
  }, [configurableRowData, selectedBranches]);
  const updateSelectedBranches = reactExports.useCallback(() => {
    const selectedBranchRows = configurableRowData.filter((branchRow) => selectedBranches[branchRow.id]);
    RaisePromisedClientNotification({
      title: "Updating Selected Branches",
      totalItems: selectedBranchRows.length,
      onProgress: async (index, { onSuccess }) => {
        const branchRow = selectedBranchRows[index];
        await new Promise((resolveUpdate) => {
          emitUpdateSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], (response) => {
            if (response.success) {
              onSuccess();
              emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], null);
            }
            resolveUpdate();
          });
        });
      },
      successMessage: (count) => `Successfully updated ${count} branches`,
      errorMessage: (id) => `Failed to update branch ${id}`,
      loadingMessage: (current, total) => `Updating ${current} of ${total} branches`
    }).catch(console.error);
  }, [RaisePromisedClientNotification, configurableRowData, selectedBranches, emitUpdateSingle, emitInfoSingle]);
  const commitSelectedBranches = reactExports.useCallback(() => {
    setIsCommitMode((current) => !current);
  }, [setIsCommitMode]);
  const logsSelectedBranches = reactExports.useCallback(() => {
    setIsDialogSBLogOpen(true);
  }, [setIsDialogSBLogOpen]);
  reactExports.useEffect(() => {
    if (!selectionMetrics.hasSelection) return;
    const handleKeyDown = (event) => {
      if (event.key === "Delete") {
        setIsRowDialogOpen(true);
      } else if (event.key === "r" && event.altKey) {
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
  }, [selectionMetrics.hasSelection, setIsRowDialogOpen, refreshSelectedBranches, updateSelectedBranches]);
  const selectAllBranches = reactExports.useCallback(
    (checked) => {
      console.log("Select All: ", checked);
      if (checked) {
        const newSelection = configurableRowData.reduce((acc, branch) => {
          acc[branch.id] = true;
          return acc;
        }, {});
        setSelectedBranches(newSelection);
      } else {
        setSelectedBranches({});
      }
    },
    [configurableRowData, setSelectedBranches]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Heading, { as: "h2", size: "2xl", lineClamp: 1, mb: 4, lineHeight: "1.4", children: [
      "You have ",
      configurableRowData.length,
      " branch",
      configurableRowData.length > 1 ? "es" : "",
      ":"
    ] }),
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
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: configurableRowData && configurableRowData.length > 0 ? configurableRowData.map((branchRow) => /* @__PURE__ */ jsxRuntimeExports.jsx(SectionBranchesRow, { branchRow }, branchRow.id)) : null }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { justifyContent: "start", p: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { gapX: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonIconTooltip, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(IoMdAdd, {}), colorPalette: "yellow", variant: "subtle", label: "Add Row", placement: "bottom-end", onClick: addRow }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ButtonIconTooltip, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MdUpdate, {}), colorPalette: "yellow", variant: "subtle", label: "Update All", placement: "bottom-end", onClick: updateAll, disabled: configurableRowData.length < 1 })
      ] }) }) }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBarRoot, { open: selectionMetrics.hasSelection, closeOnEscape: false, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ActionBarContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ActionBarSelectionTrigger, { children: [
        selectionMetrics.selectedBranchesCount,
        " Selected"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBarSeparator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { wrap: "wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button$1, { variant: "outline", size: "sm", onClick: () => setIsRowDialogOpen(true), children: [
          "Delete ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Kbd, { wordSpacing: 0, children: "Del" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button$1, { variant: "outline", size: "sm", onClick: () => refreshSelectedBranches(), children: [
          "Refresh ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Kbd, { wordSpacing: 0, children: "Alt + R" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button$1, { variant: "outline", size: "sm", onClick: () => updateSelectedBranches(), children: [
          "Update ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Kbd, { wordSpacing: 0, children: "U" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button$1, { variant: "outline", size: "sm", onClick: () => commitSelectedBranches(), children: [
          "Commit ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Kbd, { wordSpacing: 0, children: "C" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button$1, { variant: "outline", size: "sm", onClick: () => logsSelectedBranches(), children: [
          "Logs ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Kbd, { wordSpacing: 0, children: "L" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBarSeparator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { variant: "ghost", size: "sm", onClick: () => setSelectedBranches({}), disabled: !window.electron, children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoMdClose, {}) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogRowDeletion, { isDialogOpen: isRowDialogOpen, closeDialog: () => setIsRowDialogOpen(false), fireDialogAction: fireRowDialogAction })
  ] });
}
function branchString(branchFolder, branchVersion, branch) {
  return `${branchFolder == "" ? "Uncategorised" : branchFolder} ${branchVersion == "" ? "Unversioned" : branchVersion} ${String(branch).split("\\").at(-1)}`;
}
const ContextCommit = reactExports.createContext({
  socket: null,
  toaster: null,
  config: null,
  updateConfig: (_) => {
  },
  configurableRowData: [],
  setConfigurableRowData: (_) => {
  },
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
  },
  isCommitMode: false,
  setIsCommitMode: (_) => {
  },
  selectedBranchStatuses: [],
  setSelectedBranchStatuses: (_) => {
  },
  localChangesGridRef: null,
  untrackedChangesGridRef: null,
  showCommitView: false,
  setShowCommitView: (_) => {
  },
  sourceBranch: null,
  setSourceBranch: (_) => {
  },
  branchOptions: [],
  issueNumber: {},
  setIssueNumber: (_) => {
  },
  commitMessage: "",
  setCommitMessage: (_) => {
  },
  selectedLocalChanges: [],
  setSelectedLocalChanges: (_) => {
  },
  selectedUntrackedChanges: [],
  setSelectedUntrackedChanges: (_) => {
  },
  socketPayload: null,
  setSocketPayload: (_) => {
  },
  postCommitData: {},
  setPostCommitData: (_) => {
  },
  logData: [],
  setLogData: (_) => {
  }
});
const useCommit = () => {
  return reactExports.useContext(ContextCommit);
};
const CommitProvider = ({ children }) => {
  const [config, setConfig] = reactExports.useState(null);
  const [socket, setSocket] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const newSocket = lookup(URL_SOCKET_CLIENT);
    setSocket(newSocket);
    newSocket.on("connect", () => {
      newSocket.emit("titan-config-get", "fetch");
      newSocket.once("titan-config-get", (data) => {
        setConfig(data);
        if (!data) toaster.create(createToastConfig("Couldn't load data from the server", "error", 0));
      });
    });
    newSocket.on("notification", (data) => {
      toaster.create(createToastConfig(data.description, data.type, data.duration));
    });
    newSocket.on("disconnect", () => {
      toaster.create(createToastConfig("Server Has Been Disconnected", "warning", 0));
    });
    newSocket.on("reconnect", () => {
      toaster.create(createToastConfig("Server Has Been Reconnected", "success", 2e3));
    });
    return () => {
      newSocket.disconnect();
    };
  }, []);
  const saveConfig = reactExports.useCallback(
    (configToSave) => {
      if (configToSave === null || configToSave === void 0) return;
      console.debug("Saving config:", configToSave);
      socket == null ? void 0 : socket.emit("titan-config-set", configToSave);
    },
    [socket]
  );
  const updateConfig = reactExports.useCallback(
    (updateFunction) => {
      setConfig((currentConfig) => {
        const newConfig = updateFunction(currentConfig);
        if (lodashExports.isEqual(currentConfig, newConfig)) return currentConfig;
        saveConfig(newConfig);
        return newConfig;
      });
    },
    [setConfig, saveConfig]
  );
  const [configurableRowData, setConfigurableRowData] = reactExports.useState([]);
  const [branchInfos, setBranchInfos] = reactExports.useState({});
  const branchTableGridRef = reactExports.useRef(null);
  const [selectedBranches, setSelectedBranches] = reactExports.useState({});
  const [isDialogSBLogOpen, setIsDialogSBLogOpen] = reactExports.useState(false);
  const [showSelectedBranchesLog, setShowSelectedBranchesLog] = reactExports.useState(false);
  const [customScripts, setCustomScripts] = reactExports.useState([]);
  const [isCommitMode, setIsCommitMode] = reactExports.useState(false);
  const [selectedBranchStatuses, setSelectedBranchStatuses] = reactExports.useState([]);
  const localChangesGridRef = reactExports.useRef(null);
  const untrackedChangesGridRef = reactExports.useRef(null);
  const [showCommitView, setShowCommitView] = reactExports.useState(false);
  const [sourceBranch, setSourceBranch] = reactExports.useState(null);
  const branchOptions = reactExports.useMemo(() => {
    let isFolderOnlySource = config && config.commitOptions && config.commitOptions.useFolderOnlySource;
    let filteredBranches = configurableRowData.filter((row) => row["Branch Folder"] && row["Branch Version"] && row["SVN Branch"] && row["Branch Folder"] !== "" && row["Branch Version"] !== "" && row["SVN Branch"] !== "");
    if (isFolderOnlySource) {
      filteredBranches = filteredBranches.reduce((acc, row) => {
        if (!acc.some((item) => item["Branch Folder"] === row["Branch Folder"])) {
          acc.push(row);
        }
        return acc;
      }, []);
    }
    return filteredBranches.map((row) => ({
      value: row.id,
      label: isFolderOnlySource ? row["Branch Folder"] : branchString(row["Branch Folder"], row["Branch Version"], row["SVN Branch"])
    }));
  }, [config, selectedBranches, configurableRowData]);
  const [issueNumber, setIssueNumber] = reactExports.useState({});
  const [commitMessage, setCommitMessage] = reactExports.useState("");
  const [selectedLocalChanges, setSelectedLocalChanges] = reactExports.useState([]);
  const [selectedUntrackedChanges, setSelectedUntrackedChanges] = reactExports.useState([]);
  const [socketPayload, setSocketPayload] = reactExports.useState(null);
  const [postCommitData, setPostCommitData] = reactExports.useState({});
  const [logData, setLogData] = React.useState([]);
  reactExports.useEffect(() => {
    setConfigurableRowData((currentData) => {
      if (config && config.branches && !lodashExports.isEqual(config.branches, currentData)) return config.branches;
      return currentData;
    });
  }, [config]);
  reactExports.useEffect(() => {
    setSelectedBranchStatuses([]);
    setShowCommitView(false);
  }, [configurableRowData]);
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
    if (!isCommitMode || !showCommitView) return;
    const hookTimeoutCallback = setTimeout(() => {
      var _a;
      (_a = document.getElementById("sectionCommit")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }, 100);
    return () => clearTimeout(hookTimeoutCallback);
  }, [isCommitMode, showCommitView]);
  reactExports.useEffect(() => {
    const socketCallback = () => {
      setShowCommitView(false);
    };
    socket == null ? void 0 : socket.on("branch-refresh-unseen", socketCallback);
    return () => socket == null ? void 0 : socket.off("branch-refresh-unseen", socketCallback);
  }, [socket]);
  reactExports.useEffect(() => {
    const socketCallback = (data) => {
      setSelectedBranchStatuses((prev) => [...prev, data]);
    };
    socket == null ? void 0 : socket.on("branch-status-single", socketCallback);
    return () => socket == null ? void 0 : socket.off("branch-status-single", socketCallback);
  }, [socket]);
  reactExports.useEffect(() => {
    setLogData([]);
  }, [selectedBranches]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ContextCommit.Provider,
    {
      value: {
        socket,
        toaster,
        config,
        updateConfig,
        configurableRowData,
        setConfigurableRowData,
        branchInfos,
        setBranchInfos,
        branchTableGridRef,
        selectedBranches,
        setSelectedBranches,
        isDialogSBLogOpen,
        setIsDialogSBLogOpen,
        showSelectedBranchesLog,
        setShowSelectedBranchesLog,
        customScripts,
        setCustomScripts,
        isCommitMode,
        setIsCommitMode,
        selectedBranchStatuses,
        setSelectedBranchStatuses,
        localChangesGridRef,
        untrackedChangesGridRef,
        showCommitView,
        setShowCommitView,
        sourceBranch,
        setSourceBranch,
        branchOptions,
        issueNumber,
        setIssueNumber,
        commitMessage,
        setCommitMessage,
        selectedLocalChanges,
        setSelectedLocalChanges,
        selectedUntrackedChanges,
        setSelectedUntrackedChanges,
        socketPayload,
        setSocketPayload,
        postCommitData,
        setPostCommitData,
        logData,
        setLogData
      },
      children
    }
  );
};
function OptionsCommit() {
  const { config, updateConfig } = useApp();
  const { setSourceBranch, setIssueNumber } = useCommit();
  const [commitOptions, setCommitOptions] = reactExports.useState({});
  const handleOptionChange = reactExports.useCallback(
    (optionName, checked) => {
      setCommitOptions((currentOptions) => ({
        ...currentOptions,
        [optionName]: checked
      }));
    },
    [setCommitOptions]
  );
  reactExports.useEffect(() => {
    if (!config || lodashExports.isEmpty(config)) return;
    if (!config.commitOptions) {
      updateConfig((currentConfig) => ({
        ...currentConfig,
        commitOptions: {
          useFolderOnlySource: false,
          useIssuePerFolder: false
        }
      }));
    } else {
      setCommitOptions(config.commitOptions);
    }
  }, [config]);
  reactExports.useEffect(() => {
    if (lodashExports.isEmpty(commitOptions)) return;
    updateConfig((currentConfig) => {
      if (!lodashExports.isEqual(currentConfig.commitOptions, commitOptions)) {
        return {
          ...currentConfig,
          commitOptions
        };
      }
      return currentConfig;
    });
  }, [commitOptions]);
  reactExports.useEffect(() => {
    setSourceBranch(null);
  }, [commitOptions == null ? void 0 : commitOptions.useFolderOnlySource, setSourceBranch]);
  reactExports.useEffect(() => {
    setIssueNumber({});
  }, [commitOptions == null ? void 0 : commitOptions.useIssuePerFolder, setIssueNumber]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { colorPalette: "yellow", bgColor: "colorPalette.subtle", rounded: "md", p: 4, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { as: "h6", size: "sm", fontWeight: 700, mb: 3, children: "Commit Options" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { direction: "column", gap: 4, mt: 2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Checkbox, { variant: "subtle", checked: commitOptions.useFolderOnlySource, onCheckedChange: (e) => handleOptionChange("useFolderOnlySource", e.checked), children: [
        "Use Folder Only Source Branch? ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Em, { color: "colorPalette.fg", children: " - Removes extra branch details from source branch" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Checkbox, { variant: "subtle", checked: commitOptions.useIssuePerFolder, onCheckedChange: (e) => handleOptionChange("useIssuePerFolder", e.checked), children: [
        "Use 1 Issue Per Folder? ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Em, { color: "colorPalette.fg", children: " - Allows users to input issue number for each branch folder" })
      ] })
    ] })
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
function useCommitOptions() {
  const { config } = useApp();
  return config && config.commitOptions ? config.commitOptions : null;
}
function FieldIssueNumber({ branchFolder }) {
  const { setIssueNumber } = useApp();
  const commitOptions = useCommitOptions();
  const [fieldIssueNumber, setFieldIssueNumber] = reactExports.useState("");
  const handleIssueNumChange = reactExports.useCallback(
    (e) => {
      setFieldIssueNumber(e.value);
    },
    [branchFolder, setIssueNumber]
  );
  const isFieldDisabled = !branchFolder;
  const isFieldRequired = !branchFolder || !(commitOptions == null ? void 0 : commitOptions.useIssuePerFolder);
  reactExports.useEffect(() => {
    if (!branchFolder) return;
    setIssueNumber((currIssueNumber) => ({
      ...currIssueNumber,
      [branchFolder]: fieldIssueNumber
    }));
    return () => {
      setIssueNumber((currIssueNumber) => {
        const { [branchFolder]: _, ...rest } = currIssueNumber;
        return rest;
      });
    };
  }, [branchFolder, fieldIssueNumber, setIssueNumber]);
  console.log("FieldIssueNumber rendered");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { orientation: "horizontal", label: `Issue Number (${branchFolder})`, labelFlex: "0.4", required: isFieldRequired, disabled: isFieldDisabled, children: /* @__PURE__ */ jsxRuntimeExports.jsx(NumberInputRoot, { variant: "flushed", min: "0", ms: 4, flex: "0.95", size: "sm", value: fieldIssueNumber, onValueChange: handleIssueNumChange, children: /* @__PURE__ */ jsxRuntimeExports.jsx(NumberInputField, { placeholder: "The issue that your changes are linked to", borderColor: "colorPalette.fg" }) }) });
}
const SourceBranchField = reactExports.memo(() => /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { orientation: "horizontal", label: "Source branch", labelFlex: "0.4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Where your changes came from", ms: 4, flex: "0.95", size: "sm", variant: "flushed", borderColor: "colorPalette.fg" }) }));
const CommitMessageField = reactExports.memo(() => /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { orientation: "vertical", label: "Commit Message", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { placeholder: "Main body of the commit message", variant: "outline", size: "sm", rows: 8, borderColor: "colorPalette.fg" }) }));
function SubSectionCommitDetails() {
  const { selectedBranches, configurableRowData } = useApp();
  const selectedFolders = reactExports.useMemo(
    () => configurableRowData.filter((branchRow) => selectedBranches[branchRow.id]).map((branchRow) => branchRow["Branch Folder"]),
    [configurableRowData, selectedBranches]
  );
  console.log("SubSectionCommitDetails");
  console.warn("Maybe create two separate contexts, one for branches and one for commits, and create a universal context for the app");
  reactExports.useEffect(() => {
    console.log("SubSectionCommitDetails rendered");
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { ms: 9, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { gap: "6", maxW: "5xl", css: { "--field-label-width": "96px" }, flex: 1, children: [
    selectedFolders.map((branchFolder, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(FieldIssueNumber, { branchFolder }, i)),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SourceBranchField, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CommitMessageField, {})
  ] }) });
}
function SubSectionConflictingChanges() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { ms: 9, children: "You don't have any files to update!" });
}
function SubSectionModifiedChanges() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { ms: 9, children: "You don't have any files to update!" });
}
function SubSectionUnknownChanges() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { ms: 9, children: "You don't have any files to update!" });
}
function SectionCommit() {
  const { selectedBranches, isCommitMode } = useApp();
  const selectedBranchesCount = Object.keys(selectedBranches).length;
  reactExports.useEffect(() => {
    if (!isCommitMode) return;
    setTimeout(() => {
      var _a;
      return (_a = document.getElementById("sectionCommit")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }, 400);
  }, [isCommitMode]);
  const [commitStage, setCommitStage] = reactExports.useState(["commitDetails"]);
  const accordionSections = reactExports.useMemo(() => [
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
      value: "modifiedChanges",
      icon: FiEdit,
      title: "Modified Changes",
      description: "Files and directories listed for committing",
      component: SubSectionModifiedChanges
    },
    {
      value: "unknownChanges",
      icon: FiHelpCircle,
      title: "Unknown Changes",
      description: "Added and deleted files currently not tracked by SVN",
      component: SubSectionUnknownChanges
    }
  ], []);
  const accordionSection = reactExports.useMemo(() => accordionSections.map((accSection, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(AccordionItem, { value: accSection.value, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(AccordionItemTrigger, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { fontSize: "lg", color: "colorPalette.fg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(accSection.icon, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { gap: "1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { children: accSection.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { fontSize: "xs", color: "fg.muted", children: accSection.description })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionItemContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(accSection.component, {}) })
  ] }, i)), [accordionSections]);
  console.log("SectionCommit");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleRoot, { open: isCommitMode, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { id: "sectionCommit", mb: 40, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Heading, { as: "h2", size: "2xl", lineClamp: 1, mb: 4, className: "animation-pulse", lineHeight: "1.4", children: [
      "Committing to ",
      selectedBranchesCount,
      " branch",
      selectedBranchesCount > 1 ? "es" : "",
      ":"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(OptionsCommit, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { my: 6, fontSize: "sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionRoot, { size: "sm", variant: "enclosed", colorPalette: "yellow", value: commitStage, collapsible: true, multiple: true, onValueChange: (e) => setCommitStage(e.value), lazyMount: true, children: accordionSection }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { mt: 6, children: [
        "Your final commit message: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { children: "Issue XXXX (YYY): ZZZZ" })
      ] })
    ] })
  ] }) }) });
}
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
const { withContext } = createRecipeContext({ key: "button" });
const LinkButton = withContext("a");
const [RootPropsProvider, useRootProps] = createContext({
  name: "RootPropsProvider"
});
const variantMap = {
  outline: { default: "ghost", ellipsis: "plain", current: "outline" },
  solid: { default: "outline", ellipsis: "outline", current: "solid" },
  subtle: { default: "ghost", ellipsis: "plain", current: "subtle" }
};
const PaginationRoot = reactExports.forwardRef(function PaginationRoot2(props, ref) {
  const { size = "sm", variant = "outline", getHref, ...rest } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RootPropsProvider, { value: { size, variantMap: variantMap[variant], getHref }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationRoot$1, { ref, type: getHref ? "link" : "button", ...rest }) });
});
const PaginationEllipsis = reactExports.forwardRef(function PaginationEllipsis2(props, ref) {
  const { size, variantMap: variantMap2 } = useRootProps();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationEllipsis$1, { ref, ...props, asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { as: "span", variant: variantMap2.ellipsis, size, children: /* @__PURE__ */ jsxRuntimeExports.jsx(HiMiniEllipsisHorizontal, {}) }) });
});
const PaginationItem = reactExports.forwardRef(function PaginationItem2(props, ref) {
  const { page } = usePaginationContext();
  const { size, variantMap: variantMap2, getHref } = useRootProps();
  const current = page === props.value;
  const variant = current ? variantMap2.current : variantMap2.default;
  if (getHref) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(LinkButton, { href: getHref(props.value), variant, size, children: props.value });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationItem$1, { ref, ...props, asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { variant, size, children: props.value }) });
});
const PaginationPrevTrigger = reactExports.forwardRef(function PaginationPrevTrigger2(props, ref) {
  const { size, variantMap: variantMap2, getHref } = useRootProps();
  const { previousPage } = usePaginationContext();
  if (getHref) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(LinkButton, { href: previousPage != null ? getHref(previousPage) : void 0, variant: variantMap2.default, size, children: /* @__PURE__ */ jsxRuntimeExports.jsx(HiChevronLeft, {}) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationPrevTrigger$1, { ref, asChild: true, ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { variant: variantMap2.default, size, children: /* @__PURE__ */ jsxRuntimeExports.jsx(HiChevronLeft, {}) }) });
});
const PaginationNextTrigger = reactExports.forwardRef(function PaginationNextTrigger2(props, ref) {
  const { size, variantMap: variantMap2, getHref } = useRootProps();
  const { nextPage } = usePaginationContext();
  if (getHref) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(LinkButton, { href: nextPage != null ? getHref(nextPage) : void 0, variant: variantMap2.default, size, children: /* @__PURE__ */ jsxRuntimeExports.jsx(HiChevronRight, {}) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationNextTrigger$1, { ref, asChild: true, ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { variant: variantMap2.default, size, children: /* @__PURE__ */ jsxRuntimeExports.jsx(HiChevronRight, {}) }) });
});
const PaginationItems = (props) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationContext, { children: ({ pages }) => pages.map((page, index) => {
    return page.type === "ellipsis" ? /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationEllipsis, { index, ...props }, index) : /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationItem, { type: "page", value: page.value, ...props }, index);
  }) });
};
reactExports.forwardRef(function PaginationPageText2(props, ref) {
  const { format = "compact", ...rest } = props;
  const { page, totalPages, pageRange, count } = usePaginationContext();
  const content = reactExports.useMemo(() => {
    if (format === "short") return `${page} / ${totalPages}`;
    if (format === "compact") return `${page} of ${totalPages}`;
    return `${pageRange.start + 1} - ${pageRange.end} of ${count}`;
  }, [format, page, totalPages, pageRange, count]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { fontWeight: "medium", ref, ...rest, children: content });
});
function DialogBranchesLog() {
  const { socket, configurableRowData, selectedBranches, isDialogSBLogOpen, setIsDialogSBLogOpen } = useApp();
  const { emitLogsSelected } = useSocketEmits();
  const [svnLogs, setSvnLogs] = reactExports.useState([]);
  const closeDialog = reactExports.useCallback(() => {
    setIsDialogSBLogOpen(false);
  }, [isDialogSBLogOpen]);
  reactExports.useEffect(() => {
    if ((configurableRowData == null ? void 0 : configurableRowData.length) < 1 || (selectedBranches == null ? void 0 : selectedBranches.length) < 1) return;
    setSvnLogs([]);
    emitLogsSelected(configurableRowData.filter((branchRow) => selectedBranches[branchRow.id]));
  }, [selectedBranches, configurableRowData]);
  reactExports.useEffect(() => {
    const socketCallback = (data) => {
      console.debug("Received svn-log-result from socket in DialogBranchesLog component in background");
      setSvnLogs((prevData) => [...prevData, ...data.logs]);
    };
    socket == null ? void 0 : socket.on("svn-log-result", socketCallback);
    return () => socket == null ? void 0 : socket.off("svn-log-result", socketCallback);
  }, [socket]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogRoot, { role: "dialog", size: "full", placement: "center", open: isDialogSBLogOpen, onOpenChange: closeDialog, closeOnEscape: true, initialFocusEl: void 0, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogBackdrop, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { fontSize: "lg", fontWeight: "bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Selected Branches: SVN Logs (All Time)" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogBody, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRoot, { size: "sm", variant: "outline", transition: "backgrounds", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableColumnGroup, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "1%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "15%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "15%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "15%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumn, { width: "15%" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Revision" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Date" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Branch" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Author" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableColumnHeader, { children: "Message" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: svnLogs.length > 0 ? svnLogs.map((logRevision) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: logRevision.revision }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: logRevision.date }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: `${logRevision.branchFolder} ${logRevision.branchVersion}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: logRevision.author }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: logRevision.message })
          ] }, logRevision.revision)) : null })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationRoot, { count: svnLogs.length, pageSize: 5, page: 1, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(HStack, { wrap: "wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationPrevTrigger, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationItems, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationNextTrigger, {})
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActionTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { children: "Cancel" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogCloseTrigger, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { colorPalette: "yellow", children: "Idk" })
      ] })
    ] })
  ] });
}
function AlertUpdateTitan() {
  const { toast, RaiseClientNotificaiton } = useNotifications();
  const { open: isAlertOpen, onOpen: onOpenAlert, onClose: onCloseAlert } = useDisclosure();
  const cancelRef = reactExports.useRef();
  const [updateInProgress, setUpdateInProgress] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!window.electron) {
      RaiseClientNotificaiton("Electron context is not available. Updates cannot be checked.", "warning", 5e3);
      return;
    }
    window.electron.on("update-available", () => {
      toast.closeAll();
      onOpenAlert();
    });
    window.electron.on("update-error", (error) => {
      RaiseClientNotificaiton(`An error occurred while checking for updates: ${error}`, "error", 5e3);
      setUpdateInProgress(false);
    });
    return () => {
      window.electron.removeAllListeners("update-available");
      window.electron.removeAllListeners("update-error");
    };
  }, [toast, onOpenAlert]);
  const handleCancel = reactExports.useCallback(() => {
    onCloseAlert();
    RaiseClientNotificaiton("You may update the application later by manually triggering an update check or wait until Titan does this", "info", 5e3);
  }, [onCloseAlert, RaiseClientNotificaiton]);
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
        onCloseAlert();
      });
      window.electron.on("update-not-available", () => {
        RaiseClientNotificaiton("Titan is up to date", "info", 3e3);
        window.electron.removeAllListeners("update-not-available");
        setUpdateInProgress(false);
        onCloseAlert();
      });
    } else {
      RaiseClientNotificaiton("Cannot update Titan in a non-desktop application environment", "error", 5e3);
    }
  }, [updateInProgress, RaiseClientNotificaiton, setUpdateInProgress, onCloseAlert]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DialogRoot$1, { role: "alertdialog", open: isAlertOpen, leastDestructiveRef: cancelRef, onOpenChange: onCloseAlert, motionPreset: "slide-in-bottom", closeOnOverlayClick: !updateInProgress, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent$1, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader$1, { fontSize: "lg", fontWeight: "bold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle$1, { children: "Update Available" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogCloseTrigger$1, { disabled: updateInProgress })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogBody$1, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: updateInProgress ? "Downloading the update. Please wait..." : "A new version of Titan is available. Would you like to download and install the update?" }),
      updateInProgress ? /* @__PURE__ */ jsxRuntimeExports.jsx(Flex, { justify: "center", mt: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "xl", thickness: "4px", speed: "0.65s", color: "yellow.500", ml: 4 }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter$1, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { colorPalette: "red", ref: cancelRef, onClick: handleCancel, disabled: updateInProgress, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button$1, { colorPalette: "yellow", onClick: handleStartUpdate, ml: 3, disabled: updateInProgress, children: "Confirm" })
    ] })
  ] }) });
}
const Logo = "" + new URL("Titan.png", import.meta.url).href;
function HeaderApp() {
  if (!window.electron) return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, {});
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
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(chakra.header, { w: "100%", position: "fixed", bgGradient: "to-r", gradientFrom: "yellow.500", gradientTo: "yellow.400", className: "titanHead notMono", zIndex: 9999999, top: 0, overflow: "none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { justifyContent: "space-between", alignItems: "center", p: 0, position: "static", children: [
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { p: 10, overflowY: "auto", className: "titanBody", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertUpdateTitan, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Flex, { rowGap: 8, flexDirection: "column", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(BranchesProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionBranches, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CommitProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCommit, {}) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogBranchesLog, {})
    ] })
  ] });
}
function Provider(props) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ChakraProvider, { value: defaultSystem, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ColorModeProvider, { ...props }) });
}
ReactDOM.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Provider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AppProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) }) }) })
);
