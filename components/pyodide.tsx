import React from "react";

const PyodideContext = React.createContext({
  loading: true,
  error: null,
  setLoading: (loading: boolean) => {},
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
}

const pyodideWorker = new PyodideWorker();

export const PyodideProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = React.useState(true);

  pyodideWorker.onload = () => {
    setLoading(false);
  };

  return (
    <PyodideContext.Provider value={{ loading, error: null, setLoading }}>
      {children}
    </PyodideContext.Provider>
  );
};

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
