import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import { useEffect } from "react";

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

  return (
    <MonacoEditor
      onChange={(value) => {
        onChange?.(value || "");
      }}
      defaultValue={defaultCode}
      defaultLanguage="python"
    />
  );
};
