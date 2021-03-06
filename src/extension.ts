'use strict';

import * as vscode from 'vscode';
import axios from 'axios';
import * as _ from 'lodash';
const get = _.get;

let currentEditor: vscode.TextEditor;

export function activate(context: vscode.ExtensionContext) {
  currentEditor = vscode.window.activeTextEditor;

  vscode.window.onDidChangeActiveTextEditor((editor) => (currentEditor = editor));

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'console.log.wrap.nameValue',
      (editor, edit) => handle(Wrap.Down, true, 'nameValue')
    )
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.name', (editor, edit) =>
      handle(Wrap.Down, true, 'name')
    )
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'console.log.wrap.arguments',
      (editor, edit) => handle(Wrap.Down, true, 'arguments')
    )
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'console.log.wrap.get',
      (editor, edit) => handle(Wrap.Down, true, 'get')
    )
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.return', (editor, edit) =>
      handle(Wrap.Down, true, 'return')
    )
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.json', (editor, edit) =>
      handle(Wrap.Down, true, 'json')
    )
  );
}

function handle(target: Wrap, prefix?: boolean, type?: string) {
  new Promise((resolve, reject) => {
    console.log('type', type);
    let sel = currentEditor.selection;
    let len = sel.end.character - sel.start.character;

    let ran =
      len == 0
        ? currentEditor.document.getWordRangeAtPosition(sel.anchor)
        : new vscode.Range(sel.start, sel.end);

    if (ran == undefined) {
      reject('NO_WORD');
    } else {
      let doc = currentEditor.document;
      let lineNumber = ran.start.line;
      let item = doc.getText(ran);

      let idx = doc.lineAt(lineNumber).firstNonWhitespaceCharacterIndex;
      let ind = doc.lineAt(lineNumber).text.substring(0, idx);
      const funcName = getSetting('functionName');
      let wrapData = {
        txt: getSetting('functionName'),
        item: item,
        doc: doc,
        ran: ran,
        idx: idx,
        ind: ind,
        line: lineNumber,
        sel: sel,
        lastLine: doc.lineCount - 1 == lineNumber,
      };
      const semicolon = getSetting('useSemicolon') ? ';' : ''
      if (type === 'nameValue') {
        wrapData.txt = funcName + "('".concat(wrapData.item, "', ", wrapData.item, ')', semicolon);
      } else if (type === 'arguments') {
        wrapData.txt = funcName + "('".concat(wrapData.item, "', ", 'arguments', ')', semicolon);
      } else if (type === 'get') {
        wrapData.txt = "const aaa = get(".concat(wrapData.item, ", '", 'aaa', "', '')", semicolon);
      } else if (type === 'return') {
        wrapData.txt = "return ".concat(wrapData.item, semicolon);
      } else if (type === 'json') {
        wrapData.txt = funcName + "('".concat(wrapData.item, "', JSON.stringify(", wrapData.item, ", null, 2))", semicolon);
      } else {
        console.log(`asfasdf`);
        // axios.get('http://127.0.0.1:3501/fulltext?feed=http%3A%2F%2F127.0.0.1%3A3501%2Fdependent%2FgoogleRss%3Fq%3Dvue%26oq%3Dvue%26aqs%3Dchrome..69i57j69i60l2j69i61l3j69i65l2.1307j0j1%26sourceid%3Dchrome%26ie%3DUTF-8%26num%3D20')
        axios.get('http://127.0.0.1:3501/')
          .then((e) => {
            console.log('e', e);
            const data = get(e, 'data') || '';
            console.log('data', data);
            const items = get(data, 'items') || [];
            console.log('items', items);
            // const name = get(resp, 'name') || '';
            // console.log('name', name);
          })
        wrapData.txt = funcName + "('".concat(wrapData.item, "')", semicolon);
      }
      resolve(wrapData);
    }
  })
    .then((wrap: WrapData) => {
      let nxtLine: vscode.TextLine;
      let nxtLineInd: string;

      if (!wrap.lastLine) {
        nxtLine = wrap.doc.lineAt(wrap.line + 1);
        nxtLineInd = nxtLine.text.substring(0, nxtLine.firstNonWhitespaceCharacterIndex);
      } else {
        nxtLineInd = '';
      }
      currentEditor
        .edit((e) => {
          e.insert(
            new vscode.Position(
              wrap.line,
              wrap.doc.lineAt(wrap.line).range.end.character
            ),
            '\n'.concat(nxtLineInd > wrap.ind ? nxtLineInd : wrap.ind, wrap.txt)
          );
        })
        .then(() => {
          currentEditor.selection = wrap.sel;
        });
    })
    .catch((message) => {
      console.log('vscode-wrap-console REJECTED_PROMISE : ' + message);
    });
}

function getSetting(setting: string) {
  return vscode.workspace.getConfiguration('wrap-console-log-simple')[setting];
}

interface WrapData {
  txt: string;
  item: string;
  sel: vscode.Selection;
  doc: vscode.TextDocument;
  ran: vscode.Range;
  ind: string;
  idx: number;
  line: number;
  lastLine: boolean;
}

enum Wrap {
  Inline,
  Down,
  Up,
}

export function deactivate() {
  return undefined;
}
