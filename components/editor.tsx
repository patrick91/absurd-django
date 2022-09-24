import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import React from "react";

export const Editor = ({
  onChange,
  defaultCode,
}: {
  defaultCode: string;
  onChange?: (code: string) => void;
}) => {
  return (
    <CodeMirror
      value={defaultCode}
      height="calc(100vh - 58px)"
      extensions={[python()]}
      onChange={onChange}
    />
  );
};
