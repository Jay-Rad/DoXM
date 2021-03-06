﻿import { PositionCommandCompletionWindow, HighlightCompletionWindowItem } from "./CommandCompletion.js";
import * as UI from "./UI.js";
import * as CommandProcessor from "./CommandProcessor.js";
import { Store } from "./Store.js";
import * as DataGrid from "./DataGrid.js";
import * as BrowserSockets from "./BrowserSockets.js";
import { DoXMCommands } from "./Commands/DoXMCommands.js";


export function ApplyInputEventHandlers() {
    keyDownOnWindow();
    keyDownOnInputTextArea();
    inputOnCommandTextArea();
    inputOnFilterTextBox();
    clickToggleAllMachines();
    clickStartRemoteControlButton();

    window.addEventListener("resize", ev => {
        PositionCommandCompletionWindow();
    });
}

function arrowUpOrDownOnTextArea(e: KeyboardEvent) {
    if (e.ctrlKey) {
        if (e.key.toLowerCase() == "arrowdown") {
            UI.ConsoleOutputDiv.parentElement.scrollTop += 30;
        }
        else if (e.key.toLowerCase() == "arrowup") {
            UI.ConsoleOutputDiv.parentElement.scrollTop -= 30;
        }
    }
    else {
        if (!UI.CommandCompletionDiv.classList.contains("hidden")) {
            if (e.key.toLowerCase() == "arrowdown") {
                if (Store.CommandCompletionPosition < UI.CommandCompletionDiv.children.length - 1) {
                    Store.CommandCompletionPosition += 1;
                    HighlightCompletionWindowItem(Store.CommandCompletionPosition);
                    (UI.CommandCompletionDiv.querySelector(".selected") as HTMLElement).onfocus(new FocusEvent(""));
                }
            }
            else if (e.key.toLowerCase() == "arrowup") {
                if (Store.CommandCompletionPosition > 0) {
                    Store.CommandCompletionPosition -= 1;
                    HighlightCompletionWindowItem(Store.CommandCompletionPosition);
                    (UI.CommandCompletionDiv.querySelector(".selected") as HTMLElement).onfocus(new FocusEvent(""));
                }
            }
        }
        else {
            if (e.key.toLowerCase() == "arrowdown") {
                if (Store.InputHistoryPosition < Store.InputHistoryItems.length - 1) {
                    Store.InputHistoryPosition += 1;
                    UI.ConsoleTextArea.value = Store.InputHistoryItems[Store.InputHistoryPosition];
                }
            }
            else if (e.key.toLowerCase() == "arrowup") {
                if (Store.InputHistoryPosition > 0) {
                    Store.InputHistoryPosition -= 1;
                    UI.ConsoleTextArea.value = Store.InputHistoryItems[Store.InputHistoryPosition];
                }
            }
        }
    }
}

function keyDownOnInputTextArea() {
    UI.ConsoleTextArea.addEventListener("keydown", function (e: KeyboardEvent) {
        if (!e.shiftKey) {
            switch (e.key.toLowerCase()) {
                case "enter":
                    e.preventDefault();
                    if (UI.ConsoleTextArea.value.trim().length == 0) {
                        return;
                    }
                    UI.CommandCompletionDiv.classList.add("hidden");
                    UI.CommandInfoDiv.classList.add("hidden");
                    UI.AddConsoleOutput(`<span class="echo-input">${UI.ConsoleTextArea.value}</span>`);
                    if (!BrowserSockets.Connected) {
                        UI.AddConsoleOutput("Not connected.  Reconnecting...");
                        BrowserSockets.Connect();
                        return;
                    }
                    CommandProcessor.ProcessCommand();
                    break;
                case "arrowup":
                case "arrowdown":
                    e.preventDefault();
                    arrowUpOrDownOnTextArea(e);
                    break;
                case "escape":
                    if (!UI.CommandCompletionDiv.classList.contains("hidden")) {
                        e.preventDefault();
                        UI.CommandCompletionDiv.classList.add("hidden");
                        UI.CommandInfoDiv.classList.add("hidden");
                    }
                    else {
                        e.preventDefault();
                        UI.ConsoleTextArea.value = "";
                    }
                    break;
                case "tab":
                    if (!UI.CommandCompletionDiv.classList.contains("hidden")) {
                        e.preventDefault();
                        (UI.CommandCompletionDiv.querySelector(".selected") as HTMLElement).click();
                    }
                    break;
                case "backspace":
                    if (UI.ConsoleTextArea.value.length == 0 && !UI.CommandCompletionDiv.classList.contains("hidden")) {
                        UI.CommandCompletionDiv.classList.add("hidden");
                        UI.CommandInfoDiv.classList.add("hidden");
                    }
                    break;
                default:
                    break;
            }
        }
    })
}

function keyDownOnWindow() {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
        if (!document.activeElement.isEqualNode(UI.ConsoleTextArea) &&
            document.activeElement.tagName.toLowerCase() != "select" &&
            document.activeElement.tagName.toLowerCase() != "input" &&
            !e.altKey &&
            !e.ctrlKey) {
            UI.ConsoleTextArea.focus();
        }
    });
}

function inputOnCommandTextArea() {
    UI.ConsoleTextArea.addEventListener("input", (e: KeyboardEvent) => {
        var commandMode = CommandProcessor.GetCommandModeShortcut();
        if (commandMode) {
            UI.CommandModeSelect.value = commandMode;
            UI.ConsoleTextArea.value = "";
            UI.CommandCompletionDiv.classList.add("hidden");
        }
        else {
            CommandProcessor.EvaluateCurrentCommandText();
        }
        UI.ConsoleOutputDiv.parentElement.scrollTop = UI.ConsoleOutputDiv.parentElement.scrollHeight;
    });
}
function inputOnFilterTextBox() {
    document.querySelector("#gridFilter").addEventListener("input", (e) => {
        var currentText = (e.currentTarget as HTMLInputElement).value.toLowerCase();
        UI.MachineGrid.querySelectorAll("tbody tr").forEach((row: HTMLTableRowElement) => {
            if (row.innerHTML.toLowerCase().indexOf(currentText) == -1) {
                row.classList.add("hidden");
            }
            else {
                row.classList.remove("hidden");
            }
        })
    })
}
function clickToggleAllMachines() {
    document.getElementById("toggleAllMachines").addEventListener("click", function (e) {
        DataGrid.ToggleSelectAll();
    })
}

function clickStartRemoteControlButton() {
    document.getElementById("startRemoteControlButton").addEventListener("click", function (e) {
        var selectedMachines = DataGrid.GetSelectedMachines();
        if (selectedMachines.length == 0) {
            UI.FloatMessage("You must select a machine first.");
        }
        else if (selectedMachines.length > 1) {
            UI.FloatMessage("You must select only one machine to control.");
        }
        else {
            UI.FloatMessage("Starting remote control...");
            DoXMCommands.find(x => x.Name == "RemoteControl").Execute([]);
        }
    })
}