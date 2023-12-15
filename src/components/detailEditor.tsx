import React, { useEffect, useRef } from "react";
import MonacoEditor, { monaco } from "react-monaco-editor";
import { RIGHT_HEADER_HEIGHT } from "../utils/constants";
import { loop } from "../utils";
import { useFlag, useGlobalState, useSelected } from "../utils/store";
import { Group, Rule, TYPE } from "../utils/types";
import { updateGroups, updateRules } from "../utils/storage";

export default function DetailEditor(props: { width: number }) {
  const { type, selected, refresh } = useGlobalState();
  const { isSaved, setIsSaved } = useFlag();
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const currentContent = useRef(selected);
  const format = () => {
    const formater = editor.current!.getAction("editor.action.formatDocument");
    loop(
      () => formater?.isSupported(),
      () => formater?.run(),
      2000
    );
  };

  const handleChange = (value: string, _e: any) => {
    setIsSaved(false);
    currentContent.current = str2obj(value);
  };

  async function handleSave() {
    if (type === TYPE.Group) {
      await updateGroups(currentContent.current as Group);
    } else {
      await updateRules(currentContent.current as Rule);
    }

    await refresh();
  }
  const obj2str = (x: any) => JSON.stringify(x, null, "\t");
  const str2obj = (x: string) => JSON.parse(x);

  useEffect(() => {
    isSaved && handleSave();
  }, [isSaved]);

  return (
    <MonacoEditor
      height={`calc(100% - ${RIGHT_HEADER_HEIGHT + 1}px)`}
      width={props.width}
      language="json"
      theme={"vs-light"}
      value={obj2str(selected)}
      onChange={handleChange}
      editorDidMount={(_editor, _monaco) => {
        editor.current = _editor;
        editor.current.focus();
      }}
      options={{
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
      }}
    />
  );
}
