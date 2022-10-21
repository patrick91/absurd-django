import { db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { clsx } from "clsx";

const Tree = ({
  data,
  level = 0,
  onSelect,
}: {
  data: any;
  level?: number;
  onSelect: (path: string) => void;
}) => {
  return (
    <ul>
      {data.map((item: any) => {
        const isFolder = !!item.children;

        return (
          <li key={item.name} className="border-t">
            <span
              className="block hover:bg-gray-200"
              onClick={() => {
                if (isFolder) {
                  return;
                }

                onSelect(item.name);
              }}
            >
              <span
                className={clsx("block", {
                  "font-bold": isFolder,
                })}
                style={{
                  paddingLeft: (level + 1) * 5,
                }}
              >
                {item.shortName}
              </span>
            </span>
            {item.children && (
              <Tree
                data={item.children}
                level={level + 1}
                onSelect={onSelect}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
};

export function FileTree({ onSelect }: { onSelect: (path: string) => void }) {
  const filePaths = useLiveQuery(() => db.FILE_DATA.toCollection().keys());
  const modes = useLiveQuery(() =>
    db.FILE_DATA.toArray().then((files) => files.map((file) => file.mode))
  );

  if (!filePaths || !modes) {
    return null;
  }

  const root = { name: "/", shortName: "/", children: [] };
  let current = root;

  let stack = [root];

  filePaths.forEach((path, index) => {
    const mode = modes[index];
    path = path.toString();

    // if the name doesn't start with the current path, pop the stack
    while (!path.startsWith(current.name)) {
      stack.pop();
      current = stack[stack.length - 1];
    }

    let shortName = path
      .replace(/^\/data/, "")
      .slice(current.name.replace(/^\/data/, "").length)
      .replace(/^\//, "");

    // if we are in a directory, push it to the stack
    if (mode === 16895) {
      const node = { name: path, shortName, children: [] };
      current.children.push(node);
      stack.push(node);
      current = node;
    } else {
      // if we are in a file, add it to the current directory
      current.children.push({ name: path, shortName });
    }
  });

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <Tree data={root.children} onSelect={onSelect} />
      </div>
    </div>
  );
}
