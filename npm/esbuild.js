import esbuild from 'esbuild'

const appDir = process.cwd()
const packageDir = appDir

const outPackageDir = `${packageDir}`
const outDir = `${outPackageDir}/dist/src/functions`

const externalPackages = []

const bannerJs = [
  'const __dirname = import.meta.dirname;',
  'const __filename=(await import("node:url")).fileURLToPath(import.meta.url);',
  'import { createRequire as topLevelCreateRequire } from "module";',
  'const require = topLevelCreateRequire(import.meta.url);',
].join('')

await Promise.all([
  esbuild.build({
    entryPoints: [`${packageDir}/src/functions/index.mts`],
    bundle: true,
    sourcemap: true,
    sourcesContent: true,
    minify: false,
    keepNames: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    banner: {
      js: bannerJs,
    },
    external: ['@azure/functions-core', ...externalPackages],
    outfile: `${outDir}/index.mjs`,
    mainFields: ['module', 'main'],
  }),
])

console.log('Code packaging completed')
