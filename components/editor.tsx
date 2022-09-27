import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useRef } from "react";

export const Editor = ({
  onChange,
  defaultCode,
}: {
  defaultCode: string;
  onChange?: (code: string) => void;
}) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      console.log("here is the monaco instance:", monaco);
    }
  }, [monaco]);

  const editorRef = useRef(null);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor; 
  }

  // setInterval(() => {
  // if (editorRef.current) {
  //   console.log(editorRef.current.getValue());
  // }
  // }, 1000)

  return (
    <MonacoEditor
      onChange={(value) => {
        onChange?.(value || "");
      }}
      defaultValue={defaultCode}
      defaultLanguage="python"
      onMount={handleEditorDidMount}
    />
  );
};
