import React from "react";

const PyodideContext = React.createContext({
  initializing: true,
  loading: false,
  error: null as string | null,
  setLoading: (loading: boolean) => {},
  setError: (error: string | null) => {},
});

export default class PyodideWorker extends Worker {
  currentId: number;
  callbacks: { [key: number]: (value: any) => void };
  onload: () => void = () => {};

  constructor() {
    super("/js/pyodide.worker.js");

    this.currentId = 0;
    this.callbacks = {};

    this.onmessage = (event) => {
      if (event.data.ready) {
        this.onload();
      }

      const { id, result, error } = event.data;

      if (id in this.callbacks) {
        this.callbacks[id]({ result, error });
        delete this.callbacks[id];
      }
    };
  }

  // run the code in the worker
  runPython(code: string) {
    this.currentId = (this.currentId + 1) % Number.MAX_SAFE_INTEGER;
    return new Promise((onSuccess) => {
      this.callbacks[this.currentId] = onSuccess;
      this.postMessage({
        python: code,
        id: this.currentId,
      });
    });
  }

  writeFile(path: string, contents: string) {
    this.currentId = (this.currentId + 1) % Number.MAX_SAFE_INTEGER;
    return new Promise((onSuccess) => {
      this.callbacks[this.currentId] = onSuccess;
      this.postMessage({
        contents,
        path,
        id: this.currentId,
      });
    });
  }
}

const pyodideWorker = new PyodideWorker();

export const PyodideProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = React.useState(false);
  const [initializing, setInitializing] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  pyodideWorker.onload = () => {
    setInitializing(false);
  };

  return (
    <PyodideContext.Provider
      value={{ initializing, loading, error, setLoading, setError }}
    >
      {children}
    </PyodideContext.Provider>
  );
};

export const usePyodide = () => {
  const { loading, error, setError, setLoading, initializing } =
    React.useContext(PyodideContext);

  const runPython = React.useCallback(async (code: string) => {
    setLoading(true);

    const data = await (pyodideWorker.runPython(code) as Promise<{
      result?: string | null;
      error?: string | null;
    }>);

    setError(data.error || null);

    setLoading(false);

    return data;
  }, []);

  const writeFile = React.useCallback(
    async (file: string, contents: string) => {
      await pyodideWorker.writeFile(file, contents);
    },
    []
  );

  return { loading, error, initializing, runPython, writeFile };
};
