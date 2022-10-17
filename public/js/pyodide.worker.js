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

    import os
    import shutil
    import sys

    os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

    os.chdir("/data")

    # if data is empty

    if not os.listdir("/data"):
        print("creating template")
        from django.core.management import execute_from_command_line

        execute_from_command_line(["manage.py", "startproject", "absurd", "."])

        # "fix" permissions
        for root, dirs, files in os.walk("."):
            for file in files:
                os.chmod(os.path.join(root, file), 0o777)

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'absurd.settings')

    if "data" not in sys.path:
        sys.path.append("/data")
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
    // console.log(result);

    self.pyodide.FS.syncfs(false, (err) => {
      self.postMessage({ result, id });
    });
  } catch (error) {
    console.log(error);
    self.postMessage({ error: error.message, id, result: null });
  }
};
