importScripts("https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js");

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();

  let mountDir = "/data";
  pyodide.FS.mkdir(mountDir);
  pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, { root: "." }, mountDir);

  await new Promise((resolve, reject) => {
    console.log("syncing fs");
    pyodide.FS.syncfs(true, (err) => {
      console.log("done sync", err);
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  await self.pyodide.loadPackage(["micropip"]);

  await self.pyodide.runPythonAsync(`
    import micropip
    print("installing django")
    await micropip.install('tzdata')
    await micropip.install('django')
  `);
}

let pyodideReadyPromise = loadPyodideAndPackages().then(() => {
  self.postMessage({ ready: true });
});

self.onmessage = async (event) => {
  const my_eval_code = self.pyodide.runPython(`
  from pyodide.code import eval_code
  def my_eval_code(code, ns):
      extra_info = None
      result = eval_code(code, ns)
      return result
  my_eval_code
`);

  function myRunPython(code) {
    const result = pyodide.runPython(code);

    return result;
  }

  // make sure loading is done
  await pyodideReadyPromise;
  // Don't bother yet with this line, suppose our API is built in such a way:
  const { id, python, ...context } = event.data;
  // The worker copies the context in its own "memory" (an object mapping name to values)
  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }

  try {
    await self.pyodide.loadPackagesFromImports(python);
    const results = myRunPython(python);

    self.pyodide.FS.syncfs(false, (err) => {
      console.log("done sync", err);
      self.postMessage({ results, id });
    });
  } catch (error) {
    self.postMessage({ error: error.message, id });
  }
};
