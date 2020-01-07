// @ts-check
import fs from "fs";
import path from "path";

const PLUGIN_NAME = "babel-plugin-module-extension-resolver";

/**
 * options
 * @typedef {Object} Options
 * @property {string[]} srcExtensions
 * @property {string} dstExtension
 * @property {string[]} extensionsToKeep
 */

/** @type {Options} */
const defaultOptions = {
	srcExtensions: [
		".js",
		".cjs",
		".mjs",
		".es",
		".es6",
		".ts",
		".node",
		".json",
	],
	dstExtension: ".js",
	extensionsToKeep: [".json"],
};

/**
 * babel plugin
 * @param {babel} babel babel data
 * @param {Options} options options
 * @returns {babel.PluginObj} plugin object
 */
export default function moduleExtensionResolver(babel, options)
{
	const {types} = babel;
	const normalizedOptions = {
		...defaultOptions,
		...options,
	};

	return {
		name: PLUGIN_NAME,
		visitor: {
			Program: {
				enter: (programPath, state) =>
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
						CallExpression: (declaration) =>
						{
							handleCallExpression(types, declaration, filename, normalizedOptions);
						},
						ImportDeclaration: (declaration) =>
						{
							handleImportDeclaration(types, declaration, filename, normalizedOptions);
						},
						ExportDeclaration: (declaration) =>
						{
							handleExportDeclaration(types, declaration, filename, normalizedOptions);
						},
					}, state);
				},
			},
		},
	};
}

/**
 * CallExpression() handler
 * @param {babel.types} types types
 * @param {babel.NodePath<babel.types.CallExpression>} declaration declaration
 * @param {string} filename filename
 * @param {Options} options options
 * @returns {void}
 */
function handleCallExpression(types, declaration, filename, options)
{
	const callee = declaration.get("callee");
	if(!callee.isIdentifier())
	{
		return;
	}
	if(callee.node.name !== "require")
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
 * @param {babel.types} types types
 * @param {babel.NodePath} declaration declaration
 * @param {string} filename filename
 * @param {Options} options options
 * @returns {void}
 */
function handleImportDeclaration(types, declaration, filename, options)
{
	replaceSource(types, declaration.get("source"), filename, options);
}

/**
 * ExportDeclaration() handler
 * @param {babel.types} types types
 * @param {babel.NodePath} declaration declaration
 * @param {string} filename filename
 * @param {Options} options options
 * @returns {void}
 */
function handleExportDeclaration(types, declaration, filename, options)
{
	replaceSource(types, declaration.get("source"), filename, options);
}

/**
 * replace source file name
 * @param {babel.types} types types
 * @param {babel.NodePath | babel.NodePath[]} source source path
 * @param {string} fileName processing file
 * @param {Options} options options
 * @returns {void}
 */
function replaceSource(types, source, fileName, options)
{
	if(Array.isArray(source))
	{
		return;
	}
	if(!source.isStringLiteral())
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
	{
		const resolvedPath = resolvePathCore(baseDir, sourcePath, options);
		if(resolvedPath !== null)
		{
			return resolvedPath;
		}
	}

	const absolutePath = path.join(baseDir, sourcePath);
	if(isDirectory(absolutePath))
	{
		const resolvedPath = resolvePathCore(baseDir, path.join(sourcePath, "index"), options);
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
 * @param {Options} options options
 * @returns {string | null} resolved path
 */
function resolvePathCore(baseDir, sourcePath, options)
{
	const {srcExtensions, dstExtension, extensionsToKeep} = options;

	const absolutePath = path.join(baseDir, sourcePath);
	if(isFile(absolutePath))
	{
		// already resolved
		return sourcePath;
	}

	for(const extension of srcExtensions)
	{
		const resolvedPath = `${absolutePath}${extension}`;
		if(!isFile(resolvedPath))
		{
			// file not exists
			continue;
		}

		if(extensionsToKeep.includes(extension))
		{
			// keep extension
			return path.relative(baseDir, resolvedPath);
		}
		else
		{
			// use ".js"
			return path.relative(baseDir, `${absolutePath}${dstExtension}`);
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
