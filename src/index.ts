import fs from "fs";
import path from "path";

import * as B from "@babel/core";

const PLUGIN_NAME = "babel-plugin-module-extension-resolver";

// Babel types
type Babel = typeof B;
type BabelTypes = typeof B.types;

interface Options
{
	srcExtensions: string[];
	dstExtension: string;
	extensionsToKeep: string[];
}

const defaultOptions: Options = {
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
 * @param babel babel data
 * @param options options
 * @returns plugin object
 */
export default (babel: Babel, options: Options): B.PluginObj =>
{
	const {types} = babel;
	const normalizedOptions: Options = {
		...defaultOptions,
		...options,
	};

	return {
		name: PLUGIN_NAME,
		visitor: {
			Program: {
				enter: (programPath, state): void =>
				{
					const {filename} = state;
					if(filename === undefined)
					{
						return;
					}

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
};

/**
 * CallExpression() handler; handle "require()" function
 * @param types types
 * @param declaration declaration
 * @param fileName processing file
 * @param options options
 */
function handleCallExpression(types: BabelTypes, declaration: B.NodePath<B.types.CallExpression>, fileName: string, options: Options): void
{
	const callee = declaration.get("callee");
	if(!isRequireOrDynamicImport(callee))
	{
		// do nothing if neither "require()" nor "import()"
		return;
	}

	const args = declaration.get("arguments");
	if(args.length !== 1)
	{
		// do nothing if function doesn't have exactly 1 argument
		return;
	}

	replaceSource(types, args[0], fileName, options);
}

/**
 * ImportDeclaration() handler; handle "import" statement
 * @param types types
 * @param declaration declaration
 * @param fileName processing file
 * @param options options
 */
function handleImportDeclaration(types: BabelTypes, declaration: B.NodePath<B.types.ImportDeclaration>, fileName: string, options: Options): void
{
	const source = declaration.get("source");

	replaceSource(types, source, fileName, options);
}

/**
 * ExportDeclaration() handler; handle "export from" statement
 * @param types types
 * @param declaration declaration
 * @param fileName processing file
 * @param options options
 */
function handleExportDeclaration(types: BabelTypes, declaration: B.NodePath<B.types.ExportDeclaration>, fileName: string, options: Options): void
{
	const source = declaration.get("source");
	if(Array.isArray(source))
	{
		return;
	}

	replaceSource(types, source, fileName, options);
}

/**
 * callee is require() or import()?
 * @param callee callee
 * @returns Yes/No
 */
function isRequireOrDynamicImport<T>(callee: B.NodePath<T>): boolean
{
	if(callee.isImport())
	{
		// dynamic import
		return true;
	}

	if(callee.isIdentifier() && callee.node.name === "require")
	{
		// require()
		return true;
	}

	return false;
}

/**
 * replace source file name
 * @param types types
 * @param source source path
 * @param fileName processing file
 * @param options options
 */
function replaceSource<T>(types: BabelTypes, source: B.NodePath<T>, fileName: string, options: Options): void
{
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
 * @param baseDir base directory
 * @param sourcePath source path
 * @param options options
 * @returns resolved path
 */
function resolvePath(baseDir: string, sourcePath: string, options: Options): string
{
	for(const title of [sourcePath, path.join(sourcePath, "index")])
	{
		const resolvedPath = resolveExtension(baseDir, title, options);
		if(resolvedPath !== null)
		{
			// resolved!
			return resolvedPath;
		}
	}

	// did NOT resolved
	return sourcePath;
}

/**
 * resolve extension
 * @param baseDir base directory
 * @param sourcePath source path
 * @param options options
 * @returns resolved path
 */
function resolveExtension(baseDir: string, sourcePath: string, options: Options): string | null
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
			// use dstExtension
			return path.relative(baseDir, `${absolutePath}${dstExtension}`);
		}
	}

	// did NOT resolved
	return null;
}

/**
 * normalize path
 * @param originalPath path to be normalized
 * @returns normalized path
 */
function normalizePath(originalPath: string): string
{
	let normalizedPath = originalPath;

	// replace "\" with "/"
	if(path.sep === "\\")
	{
		normalizedPath = normalizedPath.split(path.sep).join("/");
	}

	// prepend "./" if not relative format
	if(normalizedPath[0] !== ".")
	{
		normalizedPath = `./${normalizedPath}`;
	}

	return normalizedPath;
}

/**
 * is pathName file?
 * @param pathName pathname to check
 * @returns Yes/No
 */
function isFile(pathName: string): boolean
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
