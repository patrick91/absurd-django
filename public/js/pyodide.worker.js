importScripts("https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js");

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();

  let mountDir = "/data";
  pyodide.FS.mkdir(mountDir);
  pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, { root: "." }, mountDir);

  await new Promise((resolve, reject) => {
    pyodide.FS.syncfs(true, (err) => {
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
  self.postMessage({ ready: true, result: null });
});

self.onmessage = async (event) => {
  await pyodideReadyPromise;

  const { id, python, ...context } = event.data;

  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }

  try {
    await self.pyodide.loadPackagesFromImports(python);

    const result = pyodide.runPython(python);

    self.pyodide.FS.syncfs(false, (err) => {
      self.postMessage({ result, id });
    });
  } catch (error) {
    self.postMessage({ error: error.message, id, result: null });
  }
};
