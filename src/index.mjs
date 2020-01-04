import fs from "fs";
import path from "path";

/**
 * Babel plugin data
 * @typedef {Object} Babel
 */
/**
 * Babel types
 * @typedef {Object} Types
 */
/**
 * options
 * @typedef {Object} Options
 * @property {ExtensionList} extensions
 * @property {ExtensionMap} map
 */
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
	".js",
	".cjs",
	".mjs",
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
 * @param {Babel} babel babel plugin data
 * @param {Options} options plugin options
 * @returns {Object} plugin information
 */
export default function moduleExtensionResolver(babel, options)
{
	const {types} = babel;
	const normalizedOptions = {
		extensions: DEFAULT_EXTENSIONS,
		map: DEFAULT_MAP,
		...options,
	};

	return {
		name: PLUGIN_NAME,
		visitor: {
			Program: {
				enter(programPath, state)
				{
					// filename = state.file.opts.filename;
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
							handleCallExpression(types, declaration, filename, normalizedOptions);
						},
						ImportDeclaration(declaration)
						{
							handleImportDeclaration(types, declaration, filename, normalizedOptions);
						},
						ExportDeclaration(declaration)
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
 * CallExpression() handler
 * @param {Types} types types
 * @param {NodePath} declaration declaration
 * @param {string} filename filename
 * @param {Options} options options
 * @returns {void}
 */
function handleCallExpression(types, declaration, filename, options)
{
	const callee = declaration.get("callee");
	if(!types.isIdentifier(callee) || callee.node.name !== "require")
	{
		// do nothing if function name is not "require"
		return;
	}
	const args = declaration.get("arguments");
	if(args.length !== 1)
	{
		// do nothing if function doesn't have exactly 1 arguments
		return;
	}

	replaceSource(types, args[0], filename, options);
}

/**
 * ImportDeclaration() handler
 * @param {Types} types types
 * @param {NodePath} declaration declaration
 * @param {string} filename filename
 * @param {Options} options options
 * @returns {void}
 */
function handleImportDeclaration(types, declaration, filename, options)
{
	replaceSource(types, declaration.get("source"), filename, options);
}

/**
 * replace source file name
 * @param {Types} types types
 * @param {NodePath} source source path
 * @param {string} fileName processing file
 * @param {Options} options options
 * @returns {void}
 */
function replaceSource(types, source, fileName, options)
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
	const resolvedPath = resolvePath(baseDir, sourcePath, options);
	const normalizedPath = normalizePath(resolvedPath);

	source.replaceWith(types.stringLiteral(normalizedPath));
}

/**
 * resolve path
 * @param {string} baseDir base directory
 * @param {string} sourcePath source path
 * @param {Options} options options
 * @returns {string} resolved path
 */
function resolvePath(baseDir, sourcePath, options)
{
	const {extensions, map} = options;

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
