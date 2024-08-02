from __future__ import annotations
from typing import Literal

IconTypes = Literal[
    "vsAccount"
    "vsActivateBreakpoints"
    "vsAdd"
    "vsArchive"
    "vsArrowBoth"
    "vsArrowCircleDown"
    "vsArrowCircleLeft"
    "vsArrowCircleRight"
    "vsArrowCircleUp"
    "vsArrowDown"
    "vsArrowLeft"
    "vsArrowRight"
    "vsArrowSmallDown"
    "vsArrowSmallLeft"
    "vsArrowSmallRight"
    "vsArrowSmallUp"
    "vsArrowSwap"
    "vsArrowUp"
    "vsAzureDevops"
    "vsAzure"
    "vsBeakerStop"
    "vsBeaker"
    "vsBellDot"
    "vsBellSlashDot"
    "vsBellSlash"
    "vsBell"
    "vsBlank"
    "vsBold"
    "vsBook"
    "vsBookmark"
    "vsBracketDot"
    "vsBracketError"
    "vsBriefcase"
    "vsBroadcast"
    "vsBrowser"
    "vsBug"
    "vsCalendar"
    "vsCallIncoming"
    "vsCallOutgoing"
    "vsCaseSensitive"
    "vsCheckAll"
    "vsCheck"
    "vsChecklist"
    "vsChevronDown"
    "vsChevronLeft"
    "vsChevronRight"
    "vsChevronUp"
    "vsChip"
    "vsChromeClose"
    "vsChromeMaximize"
    "vsChromeMinimize"
    "vsChromeRestore"
    "vsCircleFilled"
    "vsCircleLargeFilled"
    "vsCircleLarge"
    "vsCircleSlash"
    "vsCircleSmallFilled"
    "vsCircleSmall"
    "vsCircle"
    "vsCircuitBoard"
    "vsClearAll"
    "vsClippy"
    "vsCloseAll"
    "vsClose"
    "vsCloudDownload"
    "vsCloudUpload"
    "vsCloud"
    "vsCodeOss"
    "vsCode"
    "vsCoffee"
    "vsCollapseAll"
    "vsColorMode"
    "vsCombine"
    "vsCommentDiscussion"
    "vsCommentDraft"
    "vsCommentUnresolved"
    "vsComment"
    "vsCompassActive"
    "vsCompassDot"
    "vsCompass"
    "vsCopilot"
    "vsCopy"
    "vsCoverage"
    "vsCreditCard"
    "vsDash"
    "vsDashboard"
    "vsDatabase"
    "vsDebugAll"
    "vsDebugAltSmall"
    "vsDebugAlt"
    "vsDebugBreakpointConditionalUnverified"
    "vsDebugBreakpointConditional"
    "vsDebugBreakpointDataUnverified"
    "vsDebugBreakpointData"
    "vsDebugBreakpointFunctionUnverified"
    "vsDebugBreakpointFunction"
    "vsDebugBreakpointLogUnverified"
    "vsDebugBreakpointLog"
    "vsDebugBreakpointUnsupported"
    "vsDebugConsole"
    "vsDebugContinueSmall"
    "vsDebugContinue"
    "vsDebugCoverage"
    "vsDebugDisconnect"
    "vsDebugLineByLine"
    "vsDebugPause"
    "vsDebugRerun"
    "vsDebugRestartFrame"
    "vsDebugRestart"
    "vsDebugReverseContinue"
    "vsDebugStackframeActive"
    "vsDebugStackframe"
    "vsDebugStart"
    "vsDebugStepBack"
    "vsDebugStepInto"
    "vsDebugStepOut"
    "vsDebugStepOver"
    "vsDebugStop"
    "vsDebug"
    "vsDesktopDownload"
    "vsDeviceCameraVideo"
    "vsDeviceCamera"
    "vsDeviceMobile"
    "vsDiffAdded"
    "vsDiffIgnored"
    "vsDiffModified"
    "vsDiffMultiple"
    "vsDiffRemoved"
    "vsDiffRenamed"
    "vsDiffSingle"
    "vsDiff"
    "vsDiscard"
    "vsEdit"
    "vsEditorLayout"
    "vsEllipsis"
    "vsEmptyWindow"
    "vsErrorSmall"
    "vsError"
    "vsExclude"
    "vsExpandAll"
    "vsExport"
    "vsExtensions"
    "vsEyeClosed"
    "vsEye"
    "vsFeedback"
    "vsFileBinary"
    "vsFileCode"
    "vsFileMedia"
    "vsFilePdf"
    "vsFileSubmodule"
    "vsFileSymlinkDirectory"
    "vsFileSymlinkFile"
    "vsFileZip"
    "vsFile"
    "vsFiles"
    "vsFilterFilled"
    "vsFilter"
    "vsFlame"
    "vsFoldDown"
    "vsFoldUp"
    "vsFold"
    "vsFolderActive"
    "vsFolderLibrary"
    "vsFolderOpened"
    "vsFolder"
    "vsGame"
    "vsGear"
    "vsGift"
    "vsGistSecret"
    "vsGist"
    "vsGitCommit"
    "vsGitCompare"
    "vsGitFetch"
    "vsGitMerge"
    "vsGitPullRequestClosed"
    "vsGitPullRequestCreate"
    "vsGitPullRequestDraft"
    "vsGitPullRequestGoToChanges"
    "vsGitPullRequestNewChanges"
    "vsGitPullRequest"
    "vsGitStashApply"
    "vsGitStashPop"
    "vsGitStash"
    "vsGithubAction"
    "vsGithubAlt"
    "vsGithubInverted"
    "vsGithubProject"
    "vsGithub"
    "vsGlobe"
    "vsGoToFile"
    "vsGoToSearch"
    "vsGrabber"
    "vsGraphLeft"
    "vsGraphLine"
    "vsGraphScatter"
    "vsGraph"
    "vsGripper"
    "vsGroupByRefType"
    "vsHeartFilled"
    "vsHeart"
    "vsHistory"
    "vsHome"
    "vsHorizontalRule"
    "vsHubot"
    "vsInbox"
    "vsIndent"
    "vsInfo"
    "vsInsert"
    "vsInspect"
    "vsIssueDraft"
    "vsIssueReopened"
    "vsIssues"
    "vsItalic"
    "vsJersey"
    "vsJson"
    "vsKebabVertical"
    "vsKey"
    "vsLaw"
    "vsLayersActive"
    "vsLayersDot"
    "vsLayers"
    "vsLayoutActivitybarLeft"
    "vsLayoutActivitybarRight"
    "vsLayoutCentered"
    "vsLayoutMenubar"
    "vsLayoutPanelCenter"
    "vsLayoutPanelJustify"
    "vsLayoutPanelLeft"
    "vsLayoutPanelOff"
    "vsLayoutPanelRight"
    "vsLayoutPanel"
    "vsLayoutSidebarLeftOff"
    "vsLayoutSidebarLeft"
    "vsLayoutSidebarRightOff"
    "vsLayoutSidebarRight"
    "vsLayoutStatusbar"
    "vsLayout"
    "vsLibrary"
    "vsLightbulbAutofix"
    "vsLightbulbSparkle"
    "vsLightbulb"
    "vsLinkExternal"
    "vsLink"
    "vsListFilter"
    "vsListFlat"
    "vsListOrdered"
    "vsListSelection"
    "vsListTree"
    "vsListUnordered"
    "vsLiveShare"
    "vsLoading"
    "vsLocation"
    "vsLockSmall"
    "vsLock"
    "vsMagnet"
    "vsMailRead"
    "vsMail"
    "vsMapFilled"
    "vsMapVerticalFilled"
    "vsMapVertical"
    "vsMap"
    "vsMarkdown"
    "vsMegaphone"
    "vsMention"
    "vsMenu"
    "vsMerge"
    "vsMicFilled"
    "vsMic"
    "vsMilestone"
    "vsMirror"
    "vsMortarBoard"
    "vsMove"
    "vsMultipleWindows"
    "vsMusic"
    "vsMute"
    "vsNewFile"
    "vsNewFolder"
    "vsNewline"
    "vsNoNewline"
    "vsNote"
    "vsNotebookTemplate"
    "vsNotebook"
    "vsOctoface"
    "vsOpenPreview"
    "vsOrganization"
    "vsOutput"
    "vsPackage"
    "vsPaintcan"
    "vsPassFilled"
    "vsPass"
    "vsPercentage"
    "vsPersonAdd"
    "vsPerson"
    "vsPiano"
    "vsPieChart"
    "vsPin"
    "vsPinnedDirty"
    "vsPinned"
    "vsPlayCircle"
    "vsPlay"
    "vsPlug"
    "vsPreserveCase"
    "vsPreview"
    "vsPrimitiveSquare"
    "vsProject"
    "vsPulse"
    "vsQuestion"
    "vsQuote"
    "vsRadioTower"
    "vsReactions"
    "vsRecordKeys"
    "vsRecordSmall"
    "vsRecord"
    "vsRedo"
    "vsReferences"
    "vsRefresh"
    "vsRegex"
    "vsRemoteExplorer"
    "vsRemote"
    "vsRemove"
    "vsReplaceAll"
    "vsReplace"
    "vsReply"
    "vsRepoClone"
    "vsRepoForcePush"
    "vsRepoForked"
    "vsRepoPull"
    "vsRepoPush"
    "vsRepo"
    "vsReport"
    "vsRequestChanges"
    "vsRobot"
    "vsRocket"
    "vsRootFolderOpened"
    "vsRootFolder"
    "vsRss"
    "vsRuby"
    "vsRunAbove"
    "vsRunAllCoverage"
    "vsRunAll"
    "vsRunBelow"
    "vsRunCoverage"
    "vsRunErrors"
    "vsSaveAll"
    "vsSaveAs"
    "vsSave"
    "vsScreenFull"
    "vsScreenNormal"
    "vsSearchFuzzy"
    "vsSearchStop"
    "vsSearch"
    "vsSend"
    "vsServerEnvironment"
    "vsServerProcess"
    "vsServer"
    "vsSettingsGear"
    "vsSettings"
    "vsShare"
    "vsShield"
    "vsSignIn"
    "vsSignOut"
    "vsSmiley"
    "vsSnake"
    "vsSortPrecedence"
    "vsSourceControl"
    "vsSparkleFilled"
    "vsSparkle"
    "vsSplitHorizontal"
    "vsSplitVertical"
    "vsSquirrel"
    "vsStarEmpty"
    "vsStarFull"
    "vsStarHalf"
    "vsStopCircle"
    "vsSurroundWith"
    "vsSymbolArray"
    "vsSymbolBoolean"
    "vsSymbolClass"
    "vsSymbolColor"
    "vsSymbolConstant"
    "vsSymbolEnumMember"
    "vsSymbolEnum"
    "vsSymbolEvent"
    "vsSymbolField"
    "vsSymbolFile"
    "vsSymbolInterface"
    "vsSymbolKey"
    "vsSymbolKeyword"
    "vsSymbolMethod"
    "vsSymbolMisc"
    "vsSymbolNamespace"
    "vsSymbolNumeric"
    "vsSymbolOperator"
    "vsSymbolParameter"
    "vsSymbolProperty"
    "vsSymbolRuler"
    "vsSymbolSnippet"
    "vsSymbolString"
    "vsSymbolStructure"
    "vsSymbolVariable"
    "vsSyncIgnored"
    "vsSync"
    "vsTable"
    "vsTag"
    "vsTarget"
    "vsTasklist"
    "vsTelescope"
    "vsTerminalBash"
    "vsTerminalCmd"
    "vsTerminalDebian"
    "vsTerminalLinux"
    "vsTerminalPowershell"
    "vsTerminalTmux"
    "vsTerminalUbuntu"
    "vsTerminal"
    "vsTextSize"
    "vsThreeBars"
    "vsThumbsdownFilled"
    "vsThumbsdown"
    "vsThumbsupFilled"
    "vsThumbsup"
    "vsTools"
    "vsTrash"
    "vsTriangleDown"
    "vsTriangleLeft"
    "vsTriangleRight"
    "vsTriangleUp"
    "vsTwitter"
    "vsTypeHierarchySub"
    "vsTypeHierarchySuper"
    "vsTypeHierarchy"
    "vsUnfold"
    "vsUngroupByRefType"
    "vsUnlock"
    "vsUnmute"
    "vsUnverified"
    "vsVariableGroup"
    "vsVerifiedFilled"
    "vsVerified"
    "vsVersions"
    "vsVmActive"
    "vsVmConnect"
    "vsVmOutline"
    "vsVmRunning"
    "vsVm"
    "vsVr"
    "vsVscodeInsiders"
    "vsVscode"
    "vsWand"
    "vsWarning"
    "vsWatch"
    "vsWhitespace"
    "vsWholeWord"
    "vsWindow"
    "vsWordWrap"
    "vsWorkspaceTrusted"
    "vsWorkspaceUnknown"
    "vsWorkspaceUntrusted"
    "vsZoomIn"
    "vsZoomOut"
    "dhAddSmall"
    "dhArrowToBottom"
    "dhArrowToTop"
    "dhCheckSquare"
    "dhChevronDownSquare"
    "dhCircleLargeOutlineNotch"
    "dhClock"
    "dhExclamation"
    "dhEyeSlash"
    "dhEye"
    "dhFileCertificate"
    "dhFileCsv"
    "dhFileDownload"
    "dhFilePrint"
    "dhFileSearch"
    "dhFileSpreadsheet"
    "dhFilterFilled"
    "dhFilterSlash"
    "dhFreeze"
    "dhGearFilled"
    "dhGearsFilled"
    "dhGraphLineDown"
    "dhGraphLineUp"
    "dhICursor"
    "dhInput"
    "dhNewCircleLargeFilled"
    "dhNewSquareFilled"
    "dhOrganizationAdd"
    "dhPandas"
    "dhPanels"
    "dhPython"
    "dhRefresh"
    "dhRemoveSquareFilled"
    "dhRunSelection"
    "dhShapes"
    "dhShareFilled"
    "dhShare"
    "dhSortAlphaDown"
    "dhSortAlphaUp"
    "dhSortAmountDown"
    "dhSortDown"
    "dhSortSlash"
    "dhSortUp"
    "dhSort"
    "dhSplitBoth"
    "dhSquareFilled"
    "dhStickyNoteFilled"
    "dhStrikethrough"
    "dhTable"
    "dhTrashUndo"
    "dhTriangleDownSquare"
    "dhTruck"
    "dhUnderline"
    "dhUnlink"
    "dhUserIncognito"
    "dhUser"
    "dhWarningCircleFilled"
    "dhWarningFilled"
]
