importScripts("https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js");


const CODE_STORAGE_PATH = "/code/code.py";

async function saveFStoIndexedDB() {
  return new Promise((resolve, reject) => {
    pyodide.FS.syncfs(false, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function loadFSFromIndexedDB() {
  return new Promise((resolve, reject) => {
    pyodide.FS.syncfs(true, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function mountDirectories() {
  const dataDir = "/data";
  pyodide.FS.mkdir(dataDir);
  pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, { root: "." }, dataDir);

  const codeDir = "/code";
  pyodide.FS.mkdir(codeDir);
  pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, { root: "." }, codeDir);
}


async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();

  mountDirectories();
  await loadFSFromIndexedDB();

  await self.pyodide.loadPackage(["micropip"]);
  await self.pyodide.runPythonAsync(`
    import micropip
    print("installing django")
    await micropip.install('tzdata')
    await micropip.install('django')
  `);

  try {
    return self.pyodide.FS.readFile(CODE_STORAGE_PATH, { encoding: "utf8" });
  } catch (error) {
    // No existing code is saved
    return null;
  }
  
}

let pyodideReadyPromise = loadPyodideAndPackages().then((savedPythonCode) => {
  console.log(savedPythonCode)
  self.postMessage({ ready: true, savedPythonCode });
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

    self.pyodide.FS.writeFile(CODE_STORAGE_PATH, python);

    await saveFStoIndexedDB();
    self.postMessage({ result, id });
  } catch (error) {
    self.postMessage({ error: error.message, id });
  }
};
