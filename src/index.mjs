import fs from "fs";
import path from "path";

/**
 * extension list
 * @typedef {string[]} ExtensionList
 */
/**
 * extension mapping data
 * @typedef {Object<string, string>} ExtensionMap
 */

const PLUGIN_NAME = "babel-plugin-module-extension-resolver";
/** @type {ExtensionList} */
const DEFAULT_EXTENSIONS = [
	".mjs",
	".js",
	".es",
	".es6",
	".ts",
	".node",
	".json",
];
/** @type {ExtensionMap} */
const DEFAULT_MAP = {
	".ts": ".js",
	".es": ".js",
	".es6": ".js",
	".node": ".js",
};

/**
 * babel plugin
 * @param {*} plugin plugin data
 * @param {*} options plugin options
 * @returns {*} plugin information
 */
export default function extensionResolver(plugin, options)
{
	const {types} = plugin;
	const {extensions = DEFAULT_EXTENSIONS, map = DEFAULT_MAP} = options;

	return {
		PLUGIN_NAME,
		visitor: {
			Program: {
				enter(programPath, state)
				{
					const {
						file: {
							opts: {
								filename,
							},
						},
					} = state;

					programPath.traverse({
						CallExpression(declaration)
						{
							const callee = declaration.get("callee");
							if(!types.isIdentifier(callee) || callee.node.name !== "require")
							{
								return;
							}
							const args = declaration.get("arguments");
							if(args.length !== 1)
							{
								return;
							}

							replaceSource(types, args[0], filename, extensions, map);
						},
						ImportDeclaration(declaration)
						{
							replaceSource(types, declaration.get("source"), filename, extensions, map);
						},
					}, state);
				},
			},
		},
	};
}

/**
 * replace source file name
 * @param {*} types types
 * @param {NodePath} source source path
 * @param {string} fileName processing file
 * @param {ExtensionList} extensions extension list
 * @param {ExtensionMap} map extension mapping data
 * @returns {void}
 */
function replaceSource(types, source, fileName, extensions, map)
{
	if(!types.isStringLiteral(source))
	{
		return;
	}

	const sourcePath = source.node.value;
	if(sourcePath[0] !== ".")
	{
		// do nothing if not relative path
		return;
	}

	// resolve and normalize path
	const baseDir = path.dirname(fileName);
	const resolvedPath = resolvePath(baseDir, sourcePath, extensions, map);
	const normalizedPath = normalizePath(resolvedPath);

	source.replaceWith(types.stringLiteral(normalizedPath));
}

/**
 * resolve path
 * @param {string} baseDir base directory
 * @param {string} sourcePath source path
 * @param {ExtensionList} extensions extension list
 * @param {ExtensionMap} map extension mapping data
 * @returns {string} resolved path
 */
function resolvePath(baseDir, sourcePath, extensions, map)
{
	{
		const resolvedPath = resolvePathCore(baseDir, sourcePath, extensions, map);
		if(resolvedPath !== null)
		{
			return resolvedPath;
		}
	}

	const absolutePath = path.join(baseDir, sourcePath);
	if(isDirectory(absolutePath))
	{
		const resolvedPath = resolvePathCore(baseDir, path.join(sourcePath, "index"), extensions, map);
		if(resolvedPath !== null)
		{
			return resolvedPath;
		}
	}

	// did NOT resolved
	return sourcePath;
}

/**
 * resolve path (core function)
 * @param {string} baseDir base directory
 * @param {string} sourcePath source path
 * @param {ExtensionList} extensions extension list
 * @param {ExtensionMap} map extension mapping data
 * @returns {string | null} resolved path
 */
function resolvePathCore(baseDir, sourcePath, extensions, map)
{
	const absolutePath = path.join(baseDir, sourcePath);
	if(isFile(absolutePath))
	{
		// already resolved
		return sourcePath;
	}

	for(const extension of extensions)
	{
		const resolvedPath = `${absolutePath}${extension}`;
		if(!isFile(resolvedPath))
		{
			// file not exists
			continue;
		}

		if(map.hasOwnProperty(extension))
		{
			// map extension
			return path.relative(baseDir, `${absolutePath}${map[extension]}`);
		}
		else
		{
			return path.relative(baseDir, resolvedPath);
		}
	}

	// did NOT resolved
	return null;
}

/**
 * normalize path
 * @param {string} originalPath path to be normalized
 * @returns {string} normalized path
 */
function normalizePath(originalPath)
{
	// replace "\" with "/"
	if(path.sep === "\\")
	{
		originalPath = originalPath.split(path.sep).join("/");
	}

	// prepend "./" if not relative format
	if(originalPath[0] !== ".")
	{
		originalPath = `./${originalPath}`;
	}

	return originalPath;
}

/**
 * is pathName file?
 * @param {string} pathName pathname to check
 * @returns {boolean} Yes/No
 */
function isFile(pathName)
{
	try
	{
		return fs.statSync(pathName).isFile();
	}
	catch(err)
	{
		return false;
	}
}

/**
 * is pathName directory?
 * @param {string} pathName pathname to check
 * @returns {boolean} Yes/No
 */
function isDirectory(pathName)
{
	try
	{
		return fs.statSync(pathName).isDirectory();
	}
	catch(err)
	{
		return false;
	}
}
