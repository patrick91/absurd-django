import React from "react";

const PyodideContext = React.createContext({
  loading: true,
  error: null,
  setLoading: (loading: boolean) => {},
});

export default class PyodideWorker extends Worker {
  currentId: number;
  callbacks: { [key: number]: (value: any) => void };
  onload: (savedPythonCode?: string) => void = () => {};

  constructor() {
    super("/js/pyodide.worker.js");

    this.currentId = 0;
    this.callbacks = {};

    this.onmessage = (event) => {
      // TODO: We should have event types.

      if (event.data.ready) {
        this.onload(event.data.savedPythonCode);
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
}

const pyodideWorker = new PyodideWorker();

export const PyodideProvider = ({
  children,
  setCode,
}: {
  children: React.ReactNode;
  setCode: (code: string) => void;
}) => {
  const [loading, setLoading] = React.useState(true);

  pyodideWorker.onload = (savedPythonCode?: string) => {
    if (savedPythonCode) {
      setCode(savedPythonCode)
    }
    setLoading(false);
  };

  return (
    <PyodideContext.Provider value={{ loading, error: null, setLoading }}>
      {children}
    </PyodideContext.Provider>
  );
};

// Still missing:
// - currently we save ALL the code, we should save only the user's code...
// - loading spinner on the left at the beginning (don't show code until pyodide is ready)
// - replace code on the left with the saved code on load
// - debounce saving the code, we shouldn't save it as often, it's too slow

export const usePyodide = () => {
  const { loading, error, setLoading } = React.useContext(PyodideContext);

  const runPython = React.useCallback(
    async (code: string) => {
      setLoading(true);

      const data = await (pyodideWorker.runPython(code) as Promise<{
        result: string | null;
        error: string | null;
      }>);

      setLoading(false);

      return data;
    },
    [pyodideWorker]
  );

  return { loading, error, runPython };
};
