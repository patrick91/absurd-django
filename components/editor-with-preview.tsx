import { Editor } from "../components/editor";
import { Loading } from "../components/loading";

// @ts-ignore
import debounce from "lodash.debounce";
import { useState, useMemo, useEffect, useCallback } from "react";
import { PyodideProvider, usePyodide } from "./pyodide";
import { SETUP_CODE } from "../lib/django";
import { useLiveQuery } from "dexie-react-hooks";

// @ts-ignore
import code from "../lib/default_code.py";
import { db } from "../lib/db";

const DEFAULT_CODE = code;

const CodeEditor = ({ onChange }: { onChange: (code: string) => void }) => {
  const [code, setCode] = useState(DEFAULT_CODE);

  const run = useMemo(() => debounce(onChange, 100), [onChange]);

  const handleOnChange = (code: string) => {
    setCode(code);
    run(code);
  };

  return <Editor defaultCode={code} onChange={handleOnChange} />;
};

const Preview = ({
  data,
  url,
  onUrlChange,
  onResult,
}: {
  data: string;
  url: string;
  onUrlChange: (url: string) => void;
  onResult: (result: string) => void;
}) => {
  const { loading, runPython } = usePyodide();

  useEffect(() => {
    const listener = async (event: MessageEvent) => {
      if (event.data.source !== "django-iframe") {
        return;
      }

      if (event.data.type === "submit") {
        const method = event.data.method;
        const eventData = event.data.data;
        const url = event.data.url;

        const data = await runPython(
          `request("${url}".replace("http://localhost:3000", ""), "${method}", form_data="${eventData}")`
        );

        console.info("handling form", data);

        if (data.result) {
          onResult(data.result);
        }
      }
    };

    window.addEventListener("message", listener, false);

    return () => {
      window.removeEventListener("message", listener);
    };
  }, []);

  const html =
    data +
    `
      <script>
      document.addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const queryString = new URLSearchParams(formData).toString()

        window.parent.postMessage({
          source: "django-iframe",
          type: "submit",
          method: e.target.method,
          data: queryString,
          url: e.target.action,
        }, "*");
      })
      </script>
    `;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex p-4 border-b bg-green-200">
        <input
          className="w-full p-2 bg-transparent outline-none"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
        />

        <button className="text-3xl">🔃</button>
      </div>

      <div className="relative flex-1">
        {loading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Loading />
          </div>
        )}
        <iframe srcDoc={html} className="w-full h-full" />
      </div>
    </div>
  );
};

function FileTree() {
  const filePaths = useLiveQuery(() => db.FILE_DATA.toCollection().keys());

  if (!filePaths) {
    return null;
  }

  let paths = filePaths.map((path) => path.toString().replace(/^\/data\//, ""));

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {paths.map((filePath) => (
          <div key={filePath}>
            {filePath}
          </div>
        ))}
      </div>
    </div>
  );
}

export const Inner = () => {
  const { runPython, initializing, error } = usePyodide();

  const [url, setUrl] = useState("http://localhost:3000/");
  const [data, setData] = useState("");

  const navigate = useCallback(
    async (url: string) => {
      const data = await runPython(
        `request("${url}".replace("http://localhost:3000", ""), "GET")`
      );

      if (data.result) {
        handleResult(data.result);
      }
    },
    [runPython]
  );

  const handleResult = useCallback(async (result: string) => {
    const response = JSON.parse(result);

    if (response.statusCode === 302) {
      const destinationUrl =
        "http://localhost:3000" + response.headers.Location;

      setUrl(destinationUrl);

      await navigate(destinationUrl);
    } else {
      setData(response.content);
    }
  }, []);

  const handleCodeChange = useCallback(
    async (code: string) => {
      await runPython(SETUP_CODE);
      await runPython(code);
      await navigate(url);
    },
    [handleResult, runPython, url]
  );

  return (
    <div className="grid grid-cols-2 flex-1">
      <FileTree />

      <div className="overflow-y-scroll border-r">
        <CodeEditor onChange={handleCodeChange} />
      </div>

      {initializing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Loading />
        </div>
      )}

      <div className="relative flex flex-col">
        <Preview
          url={url}
          onUrlChange={setUrl}
          data={data}
          onResult={handleResult}
        />
      </div>

      {error && (
        <div className="absolute left-0 bottom-0 right-0 h-1/2 p-2 bg-yellow-100 overflow-scroll">
          <pre>{error}</pre>
        </div>
      )}
    </div>
  );
};

export const EditorWithPreview = ({}) => {
  return (
    <PyodideProvider>
      <Inner />
    </PyodideProvider>
  );
};
